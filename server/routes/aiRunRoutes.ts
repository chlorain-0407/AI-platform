import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo';
import { requireAuth, requireRole } from '../middleware/auth';

export const aiRouter = Router();

/**
 * GET /api/ai/tools
 * Retrieves available AI tools
 */
aiRouter.get('/tools', requireAuth, async (req: Request, res: Response) => {
  try {
    const aiToolsCol = await getCollection('ai_tools');
    const tools = await aiToolsCol.find({}).sort({ createdAt: 1 }).toArray();

    return res.json({
      tools: tools.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        code: t.code,
        description: t.description,
        model: t.model || 'gemini-3.1-flash-lite',
        system_prompt: t.system_prompt || t.systemPrompt || '',
        enabled: t.enabled !== false,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Fetch AI tools error:', error);
    return res.status(500).json({ error: '載入 AI 工具失敗' });
  }
});

/**
 * PUT /api/ai/tools/:id
 * Admin only: update AI tool settings (system prompt, model, enabled)
 */
aiRouter.put('/tools/:id', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, system_prompt, model, enabled } = req.body;
    const aiToolsCol = await getCollection('ai_tools');

    let tool: any = null;
    if (ObjectId.isValid(id)) {
      tool = await aiToolsCol.findOne({ _id: new ObjectId(id) });
    }
    if (!tool) {
      tool = await aiToolsCol.findOne({ _id: id as any });
    }

    if (!tool) {
      return res.status(404).json({ error: '找不到該 AI 工具' });
    }

    const updateDoc: any = { updatedAt: new Date() };
    if (name !== undefined) updateDoc.name = name;
    if (description !== undefined) updateDoc.description = description;
    if (system_prompt !== undefined) updateDoc.system_prompt = system_prompt;
    if (model !== undefined) updateDoc.model = model;
    if (enabled !== undefined) updateDoc.enabled = enabled;

    await aiToolsCol.updateOne({ _id: tool._id }, { $set: updateDoc });

    return res.json({ message: 'AI 工具設定更新成功' });
  } catch (error: any) {
    console.error('Update AI tool error:', error);
    return res.status(500).json({ error: '更新 AI 工具失敗' });
  }
});

/**
 * GET /api/ai/runs
 * Retrieves AI runs according to role:
 * agent: only their own runs
 * manager: runs within their store
 * admin: all runs across the organization
 */
aiRouter.get('/runs', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const aiRunsCol = await getCollection('ai_runs');
    const usersCol = await getCollection('users');

    let filter: any = {};

    if (user.role === 'admin') {
      filter = {};
    } else if (user.role === 'manager') {
      if (!user.storeId) {
        return res.json({ runs: [] });
      }
      filter = {
        $or: [
          { storeId: new ObjectId(user.storeId) },
          { storeId: user.storeId },
        ],
      };
    } else {
      // agent
      filter = {
        $or: [
          { userId: new ObjectId(user.id) },
          { userId: user.id },
        ],
      };
    }

    const rawRuns = await aiRunsCol.find(filter).sort({ createdAt: -1 }).limit(100).toArray();

    // Map user names
    const users = await usersCol.find({}).toArray();
    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u._id.toString(), u.name));

    const formattedRuns = rawRuns.map((r) => {
      let parsedOutput = r.output || r.output_result || {};
      if (typeof parsedOutput === 'string') {
        try {
          parsedOutput = JSON.parse(parsedOutput);
        } catch {
          parsedOutput = { rawText: parsedOutput };
        }
      }

      let parsedInput = r.input || r.input_params || {};
      if (typeof parsedInput === 'string') {
        try {
          parsedInput = JSON.parse(parsedInput);
        } catch {
          parsedInput = {};
        }
      }

      return {
        id: r._id.toString(),
        userId: r.userId ? r.userId.toString() : '',
        user_id: r.userId ? r.userId.toString() : '',
        userName: r.userId ? userMap.get(r.userId.toString()) || '專屬顧問' : '',
        storeId: r.storeId ? r.storeId.toString() : '',
        property_id: r.property_id || '',
        property_title: r.property_title || '',
        tool_code: r.tool_code || 'property_analysis',
        tool_name: r.tool_name || 'AI 案件深度剖析',
        model: r.model || 'gemini-flash-latest',
        input: parsedInput,
        input_params: parsedInput,
        output: parsedOutput,
        output_result: parsedOutput,
        status: r.status || 'success',
        created_at: r.createdAt || r.created_at || new Date().toISOString(),
        createdAt: r.createdAt || r.created_at || new Date().toISOString(),
      };
    });

    return res.json({ runs: formattedRuns });
  } catch (error: any) {
    console.error('Fetch AI runs error:', error);
    return res.status(500).json({ error: '載入 AI 使用紀錄失敗' });
  }
});

/**
 * POST /api/ai/runs
 * Logs an AI run
 */
aiRouter.post('/runs', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { property_id, property_title, tool_code, tool_name, model, input, output, status } =
      req.body;

    const aiRunsCol = await getCollection('ai_runs');

    const newDoc = {
      _id: new ObjectId(),
      userId: ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id,
      storeId: user.storeId && ObjectId.isValid(user.storeId) ? new ObjectId(user.storeId) : user.storeId,
      property_id: property_id || '',
      property_title: property_title || '',
      tool_code: tool_code || 'property_analysis',
      tool_name: tool_name || 'AI 案件深度剖析',
      model: model || 'gemini-3.1-flash-lite',
      input: input || {},
      output: output || {},
      status: status || 'success',
      createdAt: new Date(),
    };

    await aiRunsCol.insertOne(newDoc);

    return res.status(201).json({
      message: 'AI 產出紀錄已儲存',
      run: {
        id: newDoc._id.toString(),
        ...newDoc,
      },
    });
  } catch (error: any) {
    console.error('Log AI run error:', error);
    return res.status(500).json({ error: '儲存 AI 紀錄失敗' });
  }
});
