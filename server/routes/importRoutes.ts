import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { importService } from '../services/importService';

export const importRouter = Router();

const ERROR_MESSAGE_MAP: Record<string, string> = {
  INVALID_URL: '網址格式不正確，僅支援 HTTP 與 HTTPS 協定',
  BLOCKED_URL: '安全防護阻擋：禁止存取內部網路、私有 IP、localhost 或雲端中繼資料端點',
  FETCH_TIMEOUT: '目標網站連線超時，伺服器可能無回應或網路不穩定',
  FETCH_FAILED: '網站抓取失敗，目標伺服器可能拒絕連線、網址無效或需登入權限',
  UNSUPPORTED_CONTENT: '不支援的檔案格式，系統僅支援一般 HTML 網頁',
  DYNAMIC_CONTENT_REQUIRED: '該網站為純動態 JavaScript 渲染或具備嚴格人機驗證，目前無法直接解析靜態內容',
  CONTENT_TOO_LARGE: '網頁內容超過單次讀取上限 (4MB)',
  EXTRACTION_FAILED: 'AI 案件萃取失敗，未能在該網頁中識別出完整的房屋物件資料',
  IMPORT_NOT_FOUND: '找不到指定的匯入任務紀錄',
  PERMISSION_DENIED: '權限不足，無法存取或操作此匯入紀錄',
  INVALID_DATA: '案件確認資料未填寫完整（案件名稱、地址、總價與坪數為必填）',
};

/**
 * POST /api/imports/website
 * Initiates website scraping and AI structured extraction.
 */
importRouter.post('/website', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        errorCode: 'INVALID_URL',
        error: ERROR_MESSAGE_MAP.INVALID_URL,
      });
    }

    const result = await importService.startWebsiteImport(user, url);
    return res.status(200).json(result);
  } catch (error: any) {
    const code = error.code || 'FETCH_FAILED';
    const friendlyMessage = ERROR_MESSAGE_MAP[code] || error.message || '網站匯入失敗';
    const statusCode = code === 'INVALID_URL' || code === 'BLOCKED_URL' ? 400 : 500;

    return res.status(statusCode).json({
      errorCode: code,
      error: friendlyMessage,
      importId: error.importId || null,
    });
  }
});

/**
 * GET /api/imports/:id
 * Retrieves an import record with preview and confirmation data.
 */
importRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const record = await importService.getImportById(id, user);
    return res.json({ import: record });
  } catch (error: any) {
    const code = error.code || 'IMPORT_NOT_FOUND';
    const friendlyMessage = ERROR_MESSAGE_MAP[code] || error.message || '讀取匯入紀錄失敗';
    const statusCode = code === 'PERMISSION_DENIED' ? 403 : code === 'IMPORT_NOT_FOUND' ? 404 : 500;

    return res.status(statusCode).json({
      errorCode: code,
      error: friendlyMessage,
    });
  }
});

/**
 * POST /api/imports/:id/confirm
 * Confirms previewed data and inserts new property into properties collection.
 * userId and storeId are derived strictly from session!
 */
importRouter.post('/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { confirmedData } = req.body;

    if (!confirmedData || typeof confirmedData !== 'object') {
      return res.status(400).json({
        errorCode: 'INVALID_DATA',
        error: '請提供確認後的案件資料',
      });
    }

    const result = await importService.confirmImport(id, user, confirmedData);
    return res.status(201).json(result);
  } catch (error: any) {
    const code = error.code || 'INVALID_DATA';
    const friendlyMessage = ERROR_MESSAGE_MAP[code] || error.message || '案件建立失敗';
    const statusCode = code === 'PERMISSION_DENIED' ? 403 : code === 'IMPORT_NOT_FOUND' ? 404 : 400;

    return res.status(statusCode).json({
      errorCode: code,
      error: friendlyMessage,
    });
  }
});

/**
 * GET /api/imports
 * Retrieves import history for authenticated user (subject to RBAC).
 */
importRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const list = await importService.getImportHistory(user);
    return res.json({ imports: list });
  } catch (error: any) {
    console.error('Fetch import history error:', error);
    return res.status(500).json({
      errorCode: 'FETCH_FAILED',
      error: '讀取匯入歷史失敗',
    });
  }
});
