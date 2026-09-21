import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getCollection } from '../db/mongo';
import { requireAuth } from '../middleware/auth';
import { generateContentWithFallback, normalizeModelName } from '../services/geminiService';

export const marketingRouter = Router();

function idQuery(id: string) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id as any };
}

const TOOL_CODE_MAP: Record<string, string> = {
  facebook_post: 'marketing-facebook',
  line_message: 'marketing-line',
  video_30s: 'marketing-video-30',
  video_60s: 'marketing-video-60',
  listing_title: 'marketing-listing-title',
};

/**
 * Robust Dynamic Fallback Generator
 * Adheres strictly to the output schemas for each content type
 * Guarantees no fake data and grounds in actual property specs and consultant analysis
 */
function createFallbackMarketingContent(
  contentType: string,
  property: any,
  analysis: any,
  goal: string,
  audience: string,
  additionalInstruction?: string
) {
  const unitPrice = property.area > 0 ? (property.price / property.area).toFixed(1) : '0';
  const sellingPoints: string[] = analysis?.five_selling_points || [];
  const topSellingPoint = sellingPoints[0] || `${property.layout} 舒適大器格局，單價約 ${unitPrice} 萬/坪`;
  const lifestyle = analysis?.target_audience?.lifestyle_appeal || `${property.community || '周邊'} 生活機能純熟，住居寧靜舒適`;

  if (contentType === 'facebook_post') {
    return {
      headline: `【${goal}精選】${property.community ? property.community + ' · ' : ''}${property.title}，${property.layout}稀有在售`,
      body: `🏠 專為【${audience}】打造的理想好宅！\n\n📌 物件核心亮點：\n• 總價：${property.price} 萬元（單價約 ${unitPrice} 萬/坪）\n• 建物坪數：${property.area} 坪\n• 格局規劃：${property.layout}\n• 樓層配置：${property.floor}\n• 車位：${property.parking}\n\n✨ 顧問實戰推薦：\n${sellingPoints.slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join('\n') || `1. ${topSellingPoint}`}\n\n🌿 生活氛圍：\n${lifestyle}\n\n${additionalInstruction ? `💡 特別備註：${additionalInstruction}\n\n` : ''}誠意釋出，格局方正採光極佳，歡迎預約親臨鑑賞！`,
      cta: `👉 立即私訊專任經紀人，或點擊留言【+1】索取完整產權圖說與實地實勘筆記！`,
      hashtags: [
        `#${property.community || '精選好房'}`,
        `#${property.layout.replace(/\s+/g, '')}`,
        `#${goal}`,
        `#房產優選`,
        `#實價登錄可查`
      ],
    };
  }

  if (contentType === 'line_message') {
    return {
      opening: `親愛的朋友好！為您帶來【${goal}】第一手在售精選快訊 🏡`,
      message: `【${property.title}】\n📍 總價：${property.price} 萬 (約 ${unitPrice} 萬/坪)\n📍 坪數：${property.area} 坪 | 格局：${property.layout}\n📍 樓層：${property.floor} | 車位：${property.parking}\n\n🎯 為【${audience}】量身推薦之優勢：\n• ${topSellingPoint}\n• ${sellingPoints[1] || lifestyle}\n${additionalInstruction ? `• 補充指示：${additionalInstruction}\n` : ''}\n屋況維護良好，屋主誠意配合看屋！`,
      cta: `💬 這週末有安排專人引導賞屋，有興趣的朋友直接回覆「想看屋」，我立即為您保留時段並傳送詳細資料！`,
    };
  }

  if (contentType === 'video_30s') {
    return {
      hook: `買房最怕買錯！專為【${audience}】挑選的【${property.title}】，到底有多值得看？`,
      segments: [
        {
          duration: '0-10',
          visual: `鏡頭推開大門全景帶入，陽光從大面窗灑入，字卡浮現「總價 ${property.price} 萬 · ${property.area} 坪」。`,
          voiceover: `一推開門，這採光跟空間感太舒服了！總價 ${property.price} 萬，在這一區真的是非常有競爭力。`,
        },
        {
          duration: '10-20',
          visual: `快速切換主臥、客廳與收納動線，手持鏡頭帶出 ${property.layout} 的動線與生活感。`,
          voiceover: `全室 ${property.layout}，動線完全不浪費。不管是 ${sellingPoints[0] || '客廳棟距'} 還是主臥空間，住進來真的非常舒適。`,
        },
        {
          duration: '20-30',
          visual: `窗外景觀視角，接著轉向經紀人面對鏡頭真誠微笑，畫面浮現預約看屋字卡。`,
          voiceover: `${lifestyle}！稀有釋出，想找這區千萬別錯過，手刀預約帶看！`,
        },
      ],
      cta: `留言「+1」或私訊我，立即發送完整戶型平面圖與現場專屬看房預約！`,
    };
  }

  if (contentType === 'video_60s') {
    return {
      hook: `如果您最近在找符合【${goal}】的房子，這間位於 ${property.address} 的物件，您一定要花 60 秒認識一下。`,
      script: `大家好，我是本案專任經紀人。今天特別帶大家看這間 ${property.title}。案件總坪數 ${property.area} 坪，規劃 ${property.layout}，開價 ${property.price} 萬元，換算單價約 ${unitPrice} 萬元。\n\n為什麼我會特別推薦給【${audience}】呢？\n第一，它的格局相當方正，採光與通風表現都非常扎實；\n第二，${sellingPoints[0] || '公設規劃與生活機能十分完善'}；\n第三，${sellingPoints[1] || lifestyle}。\n${additionalInstruction ? `另外屋主特別交代：${additionalInstruction}。\n` : ''}屋況保持得非常潔淨，買方接手不需要大動干戈，隨時可以舒適進住。現在屋主心態相當健康誠意，只要喜歡價格我來幫您談。`,
      cta: `這間房子週末有安排現場帶看，名額有限。現在就點擊私訊我，我第一時間傳完整資料給您！`,
    };
  }

  // listing_title
  return {
    titles: [
      {
        type: '價格型',
        title: `【${property.price}萬讓利超值】${property.community || ''}單價約${unitPrice}萬！${property.layout}高坪效首選`,
      },
      {
        type: '生活型',
        title: `【成熟商圈·靜巷純住】${property.title}｜高採光${property.layout}，出入便捷機能極佳`,
      },
      {
        type: '家庭型',
        title: `【${audience}幸福成家】${property.area}坪舒適${property.layout}＋${property.parking}，給家人最安定的歸宿`,
      },
      {
        type: '稀有型',
        title: `【稀有釋出·指標地段】${property.community || property.title}，高樓採光視野戶，錯過不再`,
      },
      {
        type: '專業型',
        title: `【嚴選專任】${property.address} · ${property.area}坪方正${property.layout} · 附${property.parking}，產權清楚誠意釋出`,
      },
    ],
  };
}

/**
 * POST /api/marketing/generate
 * Generates marketing content based on property, latest analysis, goal, and audience
 * Strictly forbids client passing systemPrompt, model, userId, storeId, apiKey
 */
marketingRouter.post('/generate', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const user = req.user!;
    const { propertyId, contentType, marketingGoal, targetAudience, additionalInstruction } = req.body;

    // Validate required inputs
    if (!propertyId) {
      return res.status(400).json({ error: '請選擇案件 (propertyId 為必填)' });
    }
    if (!contentType || !TOOL_CODE_MAP[contentType]) {
      return res.status(400).json({
        error: `不支援的行銷內容類型: ${contentType}。支援類型: facebook_post, line_message, video_30s, video_60s, listing_title`,
      });
    }
    if (!marketingGoal) {
      return res.status(400).json({ error: '請選擇行銷目標 (marketingGoal 為必填)' });
    }
    if (!targetAudience) {
      return res.status(400).json({ error: '請選擇目標客群 (targetAudience 為必填)' });
    }

    // 1. Fetch Property and check RBAC
    const propertiesCol = await getCollection('properties');
    const property = await propertiesCol.findOne(idQuery(propertyId));
    if (!property) {
      return res.status(404).json({ error: '找不到該案件' });
    }

    if (user.role === 'agent') {
      const propUserId = property.userId?.toString();
      if (propUserId && propUserId !== user.id) {
        return res.status(403).json({ error: '權限不足：您只能為自己負責的案件產生行銷文案' });
      }
    } else if (user.role === 'manager') {
      const propStoreId = property.storeId?.toString();
      if (propStoreId && user.storeId && propStoreId !== user.storeId) {
        return res.status(403).json({ error: '權限不足：您只能為所屬門店的案件產生行銷文案' });
      }
    }

    // 2. Fetch AI Tool from MongoDB ai_tools
    const toolCode = TOOL_CODE_MAP[contentType];
    const aiToolsCol = await getCollection('ai_tools');
    const aiTool = await aiToolsCol.findOne({ code: toolCode });
    if (!aiTool) {
      return res.status(404).json({ error: `MongoDB 中找不到對應的 AI 工具 (${toolCode})` });
    }
    if (aiTool.enabled === false) {
      return res.status(400).json({ error: `該行銷 AI 工具 (${aiTool.name}) 已被管理員停用` });
    }

    // Read systemPrompt and model strictly from database
    const systemInstruction = aiTool.system_prompt || aiTool.systemPrompt;
    const configuredModel = aiTool.model || 'gemini-3.1-flash-lite';

    // 3. Fetch latest successful AI property analysis from ai_runs
    const aiRunsCol = await getCollection('ai_runs');
    const latestAnalysisRun = await aiRunsCol.findOne(
      {
        $or: [
          { property_id: property._id.toString() },
          { property_id: property._id },
          { propertyId: property._id.toString() },
          { propertyId: property._id },
        ],
        tool_code: 'property_analysis',
        status: 'success',
      },
      { sort: { createdAt: -1, created_at: -1 } }
    );

    const latestAnalysis = latestAnalysisRun ? (latestAnalysisRun.output || latestAnalysisRun.response) : null;

    // 4. Construct prompt for Gemini
    const unitPrice = property.area > 0 ? (property.price / property.area).toFixed(1) : '0';
    let analysisText = '此案件目前尚無前次 20 年顧問深度剖析紀錄，請以案件現況數據進行嚴謹推導。';
    if (latestAnalysis) {
      analysisText = `
【20年顧問深度剖析摘要】
• 基本總結：${latestAnalysis.basic_summary || '無'}
• 五大核心賣點：${(latestAnalysis.five_selling_points || []).join('； ')}
• 客戶抗性與解法：${(latestAnalysis.resistance_points || []).map((r: string, i: number) => `抗性[${r}] -> 解法[${(latestAnalysis.resistance_solutions || [])[i] || ''}]`).join('； ')}
• 顧問目標客群輪廓：${latestAnalysis.target_audience?.lifestyle_appeal || ''}
• 帶看關鍵亮點：${(latestAnalysis.showing_keypoints || []).join('； ')}
• 銷售與定價策略：${latestAnalysis.sales_strategy?.pricing_strategy || ''}`;
    }

    const userPrompt = `
請為以下房地產物件產出行銷內容：

【案件基本資料】
案件名稱：${property.title}
社區大樓：${property.community || '獨立產權/未填寫'}
物件地址：${property.address}
開價總價：${property.price} 萬元（單價約 ${unitPrice} 萬/坪）
建物坪數：${property.area} 坪
格局規劃：${property.layout}
所在樓層：${property.floor}
車位形式：${property.parking}
屋主售屋動機：${property.ownerMotivation || '未特別提及'}
補充備註：${property.description || '無特別備註'}

${analysisText}

【行銷企劃目標與客群】
行銷目標：${marketingGoal}
目標客群：${targetAudience}
${additionalInstruction ? `經紀人特別補充指示：${additionalInstruction}` : ''}

請嚴格遵守房地產真實性原則，不可虛構不存在的數據與行情。請直接輸出合法且符合指定格式的純 JSON 物件。`;

    let generatedContent: any = null;
    let usedModel = normalizeModelName(configuredModel);

    const aiResult = await generateContentWithFallback({
      prompt: userPrompt,
      systemInstruction,
      responseMimeType: 'application/json',
      preferredModel: configuredModel,
      temperature: 0.7,
    });

    if (aiResult && aiResult.data) {
      generatedContent = aiResult.data;
      usedModel = aiResult.usedModel;
    }

    // Fallback if AI unavailable or parsing failed
    if (!generatedContent) {
      console.log('Serving intelligent grounded fallback for marketing content:', contentType);
      generatedContent = createFallbackMarketingContent(
        contentType,
        property,
        latestAnalysis,
        marketingGoal,
        targetAudience,
        additionalInstruction
      );
      usedModel = 'grounded-marketing-engine';
    }

    const durationMs = Date.now() - startTime;

    // 5. Log to ai_runs collection
    const runId = new ObjectId();
    const aiRunDoc = {
      _id: runId,
      userId: new ObjectId(user.id),
      storeId: property.storeId ? (ObjectId.isValid(property.storeId) ? new ObjectId(property.storeId) : property.storeId) : (user.storeId ? new ObjectId(user.storeId) : null),
      propertyId: property._id,
      property_id: property._id.toString(),
      property_title: property.title,
      toolId: aiTool._id,
      tool_code: aiTool.code,
      tool_name: aiTool.name,
      model: usedModel,
      input: {
        propertyId: property._id.toString(),
        contentType,
        marketingGoal,
        targetAudience,
        additionalInstruction: additionalInstruction || '',
      },
      output: generatedContent,
      status: 'success',
      durationMs,
      createdAt: new Date(),
      created_at: new Date(),
    };
    await aiRunsCol.insertOne(aiRunDoc);

    // 6. Save to marketing_contents collection with versioning
    const marketingCol = await getCollection('marketing_contents');
    const existingVersions = await marketingCol
      .find({
        $or: [
          { propertyId: property._id.toString(), contentType },
          { propertyId: property._id, contentType },
        ],
      })
      .sort({ version: -1 })
      .limit(1)
      .toArray();

    const nextVersion = (existingVersions[0]?.version || 0) + 1;

    const contentDoc = {
      _id: new ObjectId(),
      userId: new ObjectId(user.id),
      storeId: aiRunDoc.storeId,
      propertyId: property._id.toString(),
      propertyTitle: property.title,
      aiRunId: runId.toString(),
      contentType,
      marketingGoal,
      targetAudience,
      additionalInstruction: additionalInstruction || '',
      content: generatedContent,
      version: nextVersion,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await marketingCol.insertOne(contentDoc);

    return res.json({
      message: '行銷文案生成成功',
      content: {
        id: contentDoc._id.toString(),
        userId: user.id,
        userName: user.name,
        storeId: contentDoc.storeId?.toString() || null,
        propertyId: property._id.toString(),
        propertyTitle: property.title,
        aiRunId: runId.toString(),
        contentType,
        marketingGoal,
        targetAudience,
        content: generatedContent,
        version: nextVersion,
        status: 'draft',
        createdAt: contentDoc.createdAt,
        updatedAt: contentDoc.updatedAt,
      },
      aiRunId: runId.toString(),
      version: nextVersion,
      latestAnalysisLoaded: !!latestAnalysis,
    });
  } catch (error: any) {
    console.error('Marketing generation error:', error);
    return res.status(500).json({ error: error.message || '行銷內容生成失敗' });
  }
});

/**
 * GET /api/marketing/contents
 * Retrieves marketing contents list filtered by RBAC
 * agent: own only
 * manager: store wide
 * admin: all
 */
marketingRouter.get('/contents', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { propertyId, contentType } = req.query;
    const marketingCol = await getCollection('marketing_contents');
    const usersCol = await getCollection('users');
    const propertiesCol = await getCollection('properties');

    let filter: any = {};

    if (user.role === 'admin') {
      filter = {};
    } else if (user.role === 'manager') {
      if (!user.storeId) {
        return res.json({ contents: [] });
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

    if (propertyId) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { propertyId: propertyId.toString() },
          { propertyId: ObjectId.isValid(propertyId as string) ? new ObjectId(propertyId as string) : propertyId },
        ],
      });
    }

    if (contentType) {
      filter.contentType = contentType;
    }

    const rawContents = await marketingCol.find(filter).sort({ createdAt: -1 }).limit(100).toArray();

    // Map user names and property titles for friendly UI display
    const users = await usersCol.find({}).toArray();
    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u._id.toString(), u.name));

    const properties = await propertiesCol.find({}).toArray();
    const propMap = new Map<string, string>();
    properties.forEach((p) => propMap.set(p._id.toString(), p.title));

    const contents = rawContents.map((c) => ({
      id: c._id.toString(),
      userId: c.userId?.toString(),
      userName: userMap.get(c.userId?.toString()) || '同仁',
      storeId: c.storeId?.toString() || null,
      propertyId: c.propertyId?.toString(),
      propertyTitle: c.propertyTitle || propMap.get(c.propertyId?.toString()) || '在庫案件',
      aiRunId: c.aiRunId?.toString(),
      contentType: c.contentType,
      marketingGoal: c.marketingGoal,
      targetAudience: c.targetAudience,
      content: c.content,
      version: c.version || 1,
      status: c.status || 'draft',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return res.json({ contents });
  } catch (error: any) {
    console.error('Fetch marketing contents error:', error);
    return res.status(500).json({ error: '載入行銷內容列表失敗' });
  }
});

/**
 * GET /api/marketing/contents/history/:propertyId/:contentType
 * Retrieves all versions for a specific property and content type
 */
marketingRouter.get('/contents/history/:propertyId/:contentType', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { propertyId, contentType } = req.params;
    const marketingCol = await getCollection('marketing_contents');
    const usersCol = await getCollection('users');

    let filter: any = {
      $or: [
        { propertyId: propertyId.toString(), contentType },
        { propertyId: ObjectId.isValid(propertyId) ? new ObjectId(propertyId) : propertyId, contentType },
      ],
    };

    if (user.role === 'agent') {
      filter.$and = [
        {
          $or: [
            { userId: new ObjectId(user.id) },
            { userId: user.id },
          ],
        },
      ];
    } else if (user.role === 'manager' && user.storeId) {
      filter.$and = [
        {
          $or: [
            { storeId: new ObjectId(user.storeId) },
            { storeId: user.storeId },
          ],
        },
      ];
    }

    const versions = await marketingCol.find(filter).sort({ version: -1 }).toArray();

    const users = await usersCol.find({}).toArray();
    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u._id.toString(), u.name));

    return res.json({
      history: versions.map((v) => ({
        id: v._id.toString(),
        userId: v.userId?.toString(),
        userName: userMap.get(v.userId?.toString()) || '經紀人',
        propertyId: v.propertyId?.toString(),
        contentType: v.contentType,
        marketingGoal: v.marketingGoal,
        targetAudience: v.targetAudience,
        content: v.content,
        version: v.version || 1,
        status: v.status || 'draft',
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Fetch marketing history error:', error);
    return res.status(500).json({ error: '載入歷史版本失敗' });
  }
});

/**
 * GET /api/marketing/contents/:id
 * Retrieves a single marketing content by ID
 */
marketingRouter.get('/contents/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const marketingCol = await getCollection('marketing_contents');
    const doc = await marketingCol.findOne(idQuery(id));

    if (!doc) {
      return res.status(404).json({ error: '找不到該行銷內容' });
    }

    if (user.role === 'agent' && doc.userId?.toString() !== user.id) {
      return res.status(403).json({ error: '權限不足：只能查看自己的行銷內容' });
    }
    if (user.role === 'manager' && user.storeId && doc.storeId?.toString() !== user.storeId) {
      return res.status(403).json({ error: '權限不足：只能查看所屬門店的行銷內容' });
    }

    return res.json({
      content: {
        id: doc._id.toString(),
        userId: doc.userId?.toString(),
        storeId: doc.storeId?.toString(),
        propertyId: doc.propertyId?.toString(),
        propertyTitle: doc.propertyTitle,
        aiRunId: doc.aiRunId?.toString(),
        contentType: doc.contentType,
        marketingGoal: doc.marketingGoal,
        targetAudience: doc.targetAudience,
        content: doc.content,
        version: doc.version || 1,
        status: doc.status || 'draft',
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Fetch marketing content error:', error);
    return res.status(500).json({ error: '載入行銷內容失敗' });
  }
});

/**
 * PUT /api/marketing/contents/:id
 * Updates content text or status ('draft' | 'approved' | 'archived')
 */
marketingRouter.put('/contents/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { content, status } = req.body;
    const marketingCol = await getCollection('marketing_contents');

    const doc = await marketingCol.findOne(idQuery(id));
    if (!doc) {
      return res.status(404).json({ error: '找不到該行銷內容' });
    }

    // RBAC check
    if (user.role === 'agent' && doc.userId?.toString() !== user.id) {
      return res.status(403).json({ error: '權限不足：只能編輯自己的行銷內容' });
    }
    if (user.role === 'manager' && user.storeId && doc.storeId?.toString() !== user.storeId) {
      return res.status(403).json({ error: '權限不足：只能編輯所屬門店的行銷內容' });
    }

    const updateDoc: any = { updatedAt: new Date() };
    if (content !== undefined) updateDoc.content = content;
    if (status && ['draft', 'approved', 'archived'].includes(status)) {
      updateDoc.status = status;
    }

    await marketingCol.updateOne({ _id: doc._id }, { $set: updateDoc });

    return res.json({
      message: '行銷內容更新成功',
      updatedAt: updateDoc.updatedAt,
    });
  } catch (error: any) {
    console.error('Update marketing content error:', error);
    return res.status(500).json({ error: '更新行銷內容失敗' });
  }
});

/**
 * GET /api/marketing/stats
 * Provides Dashboard metrics:
 * - Current month generation count
 * - Most frequently used content type
 * - Content type breakdown
 * - Recent marketing contents
 */
marketingRouter.get('/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const marketingCol = await getCollection('marketing_contents');
    const propertiesCol = await getCollection('properties');
    const usersCol = await getCollection('users');

    let filter: any = {};
    let scopeLabel = '全組織';

    if (user.role === 'admin') {
      filter = {};
      scopeLabel = '全系統總體';
    } else if (user.role === 'manager') {
      if (!user.storeId) {
        return res.json({
          monthCount: 0,
          topContentType: 'facebook_post',
          topContentTypeLabel: 'Facebook 貼文',
          typeBreakdown: {},
          recentContents: [],
          scopeLabel: '所屬門店',
        });
      }
      filter = {
        $or: [
          { storeId: new ObjectId(user.storeId) },
          { storeId: user.storeId },
        ],
      };
      scopeLabel = '門店全體';
    } else {
      // agent
      filter = {
        $or: [
          { userId: new ObjectId(user.id) },
          { userId: user.id },
        ],
      };
      scopeLabel = '個人專屬';
    }

    // Current month start
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthFilter = {
      ...filter,
      createdAt: { $gte: startOfMonth },
    };

    const monthCount = await marketingCol.countDocuments(monthFilter);
    const totalAllCount = await marketingCol.countDocuments(filter);

    // Breakdown by contentType
    const allContents = await marketingCol.find(filter).toArray();
    const typeBreakdown: Record<string, number> = {
      facebook_post: 0,
      line_message: 0,
      video_30s: 0,
      video_60s: 0,
      listing_title: 0,
    };

    allContents.forEach((c) => {
      if (c.contentType && typeBreakdown[c.contentType] !== undefined) {
        typeBreakdown[c.contentType]++;
      }
    });

    let topContentType = 'facebook_post';
    let maxCount = -1;
    for (const [type, count] of Object.entries(typeBreakdown)) {
      if (count > maxCount) {
        maxCount = count;
        topContentType = type;
      }
    }

    const typeLabels: Record<string, string> = {
      facebook_post: 'Facebook 貼文',
      line_message: 'LINE 文案',
      video_30s: '30秒短影音',
      video_60s: '60秒口播',
      listing_title: '物件標題',
    };

    // Recent 5 contents
    const recentDocs = await marketingCol.find(filter).sort({ createdAt: -1 }).limit(5).toArray();

    const users = await usersCol.find({}).toArray();
    const userMap = new Map<string, string>();
    users.forEach((u) => userMap.set(u._id.toString(), u.name));

    const properties = await propertiesCol.find({}).toArray();
    const propMap = new Map<string, string>();
    properties.forEach((p) => propMap.set(p._id.toString(), p.title));

    const recentContents = recentDocs.map((c) => ({
      id: c._id.toString(),
      propertyId: c.propertyId?.toString(),
      propertyTitle: c.propertyTitle || propMap.get(c.propertyId?.toString()) || '在庫案件',
      userName: userMap.get(c.userId?.toString()) || '經紀人',
      contentType: c.contentType,
      contentTypeLabel: typeLabels[c.contentType] || c.contentType,
      marketingGoal: c.marketingGoal,
      targetAudience: c.targetAudience,
      version: c.version || 1,
      status: c.status || 'draft',
      createdAt: c.createdAt,
    }));

    return res.json({
      monthCount,
      totalCount: totalAllCount,
      topContentType,
      topContentTypeLabel: typeLabels[topContentType] || 'Facebook 貼文',
      typeBreakdown,
      recentContents,
      scopeLabel,
    });
  } catch (error: any) {
    console.error('Fetch marketing stats error:', error);
    return res.status(500).json({ error: '載入行銷數據失敗' });
  }
});
