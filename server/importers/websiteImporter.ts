import * as cheerio from 'cheerio';
import { generateContentWithFallback } from '../services/geminiService';
import { validateSafeUrl } from '../utils/urlSecurity';

export interface ExtractedPropertySchema {
  title: string;
  community: string;
  address: string;
  price: number | null;
  area: number | null;
  mainArea: number | null;
  landArea: number | null;
  buildingAge: number | null;
  layout: string;
  floor: string;
  totalFloors: string;
  parking: string;
  propertyType: string;
  orientation: string;
  managementFee: number | null;
  description: string;
  sourceUrl: string;
  sourceSite: string;
  images: string[];
  confidence: {
    title: number;
    price: number;
    address: number;
    area: number;
  };
  needsVerification: string[];
}

export interface WebsiteScrapeResult {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  rawMetadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    sourceSite?: string;
    hasJsonLd?: boolean;
    contentLength?: number;
  };
  extractedData?: ExtractedPropertySchema;
}

const MAX_RESPONSE_SIZE = 4 * 1024 * 1024; // 4MB
const REQUEST_TIMEOUT_MS = 12000; // 12 seconds
const MAX_REDIRECTS = 5;

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 (compatible; TaiwanRealEstateBot/1.0; +https://realestate.com.tw)';

/**
 * Safely fetches an HTML page following redirects with SSRF re-verification on each step.
 */
async function fetchSafeHtml(initialUrl: string): Promise<{ html: string; finalUrl: string }> {
  let currentUrl = initialUrl;
  let redirectsCount = 0;

  while (redirectsCount <= MAX_REDIRECTS) {
    const secCheck = await validateSafeUrl(currentUrl);
    if (!secCheck.safe) {
      const err: any = new Error(secCheck.errorMessage || '安全防護阻擋：目標網址不合法');
      err.code = secCheck.errorCode || 'BLOCKED_URL';
      throw err;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': BROWSER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
        },
        redirect: 'manual', // handle manually to verify SSRF on each hop
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr: any = new Error('目標網站連線逾時，可能伺服器無回應');
        timeoutErr.code = 'FETCH_TIMEOUT';
        throw timeoutErr;
      }
      const fetchErr: any = new Error(`無法連線至目標網站：${err.message || '網路錯誤'}`);
      fetchErr.code = 'FETCH_FAILED';
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle redirects
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      redirectsCount++;
      if (redirectsCount > MAX_REDIRECTS) {
        const redirErr: any = new Error('重新導向次數過多 (Redirect Limit Exceeded)');
        redirErr.code = 'FETCH_FAILED';
        throw redirErr;
      }
      const location = response.headers.get('location');
      if (!location) {
        const redirErr: any = new Error('重新導向遺失目標位址 (Missing Location header)');
        redirErr.code = 'FETCH_FAILED';
        throw redirErr;
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    // HTTP status check
    if (response.status === 401 || response.status === 403) {
      const authErr: any = new Error('目標網站需要登入權限或存取受限，請提供公開網址');
      authErr.code = 'FETCH_FAILED';
      throw authErr;
    }
    if (response.status === 429) {
      const rateErr: any = new Error('目標網站已觸發頻率限制 (Rate Limited)，請稍後再試');
      rateErr.code = 'FETCH_FAILED';
      throw rateErr;
    }
    if (!response.ok) {
      const statusErr: any = new Error(`目標網站回應錯誤 HTTP ${response.status}`);
      statusErr.code = 'FETCH_FAILED';
      throw statusErr;
    }

    // Content-Type validation
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      const typeErr: any = new Error(`不支援的檔案格式 (${contentType})，僅支援一般網頁 HTML`);
      typeErr.code = 'UNSUPPORTED_CONTENT';
      throw typeErr;
    }

    // Size check
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      const sizeErr: any = new Error('網頁內容超過單次大小上限 (4MB)');
      sizeErr.code = 'CONTENT_TOO_LARGE';
      throw sizeErr;
    }

    const htmlText = await response.text();
    if (htmlText.length > MAX_RESPONSE_SIZE) {
      const sizeErr: any = new Error('網頁內容超過單次大小上限 (4MB)');
      sizeErr.code = 'CONTENT_TOO_LARGE';
      throw sizeErr;
    }

    return { html: htmlText, finalUrl: currentUrl };
  }

  throw new Error('無法完成網頁抓取');
}

/**
 * Extracts and cleans HTML with cheerio, extracting JSON-LD, metadata, and structured main text.
 */
function cleanAndExtractHtml(html: string, pageUrl: string) {
  const $ = cheerio.load(html);

  // 1. Extract JSON-LD scripts before removing scripts
  const jsonLdBlocks: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const rawText = $(el).html();
      if (rawText) {
        const parsed = JSON.parse(rawText.trim());
        jsonLdBlocks.push(parsed);
      }
    } catch {
      // ignore JSON parse errors in invalid JSON-LD blocks
    }
  });

  // 2. Extract OpenGraph and standard meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || '';
  const ogDescription =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    '';
  const ogImage =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    '';
  const pageTitle = $('title').text().trim() || ogTitle;

  // 3. Extract candidate property images
  const candidateImages: string[] = [];
  if (ogImage) {
    candidateImages.push(new URL(ogImage, pageUrl).toString());
  }

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original');
    if (src && !src.startsWith('data:') && !src.endsWith('.svg')) {
      const alt = ($(el).attr('alt') || '').toLowerCase();
      // Exclude logos, icons, avatars, tracking pixels
      if (
        !alt.includes('logo') &&
        !alt.includes('icon') &&
        !alt.includes('avatar') &&
        !src.includes('logo') &&
        !src.includes('icon') &&
        !src.includes('badge') &&
        !src.includes('tracker')
      ) {
        try {
          const abs = new URL(src, pageUrl).toString();
          if (!candidateImages.includes(abs)) {
            candidateImages.push(abs);
          }
        } catch {
          // invalid url ignored
        }
      }
    }
  });

  // 4. Remove noisy DOM elements (scripts, styles, navigations, footers, etc.)
  $(
    'script, style, noscript, iframe, nav, footer, header:not(article header), svg, form, [role="banner"], [role="navigation"], .footer, .header, .ad, .ads, .advertisement, .cookie-banner, .social-share'
  ).remove();

  // 5. Extract structured text from tables, definitions, headings, and paragraphs
  const structuredChunks: string[] = [];

  // Headings
  $('h1, h2, h3').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (t) structuredChunks.push(`### ${t}`);
  });

  // Tables
  $('table').each((_, tableEl) => {
    const rows: string[] = [];
    $(tableEl)
      .find('tr')
      .each((_, trEl) => {
        const cells: string[] = [];
        $(trEl)
          .find('th, td')
          .each((_, cellEl) => {
            const cellText = $(cellEl).text().replace(/\s+/g, ' ').trim();
            if (cellText) cells.push(cellText);
          });
        if (cells.length > 0) {
          rows.push(cells.join(' | '));
        }
      });
    if (rows.length > 0) {
      structuredChunks.push('【表格資料】\n' + rows.join('\n'));
    }
  });

  // Definition lists (DL / DT / DD)
  $('dl').each((_, dlEl) => {
    const items: string[] = [];
    $(dlEl)
      .find('dt')
      .each((_, dtEl) => {
        const dt = $(dtEl).text().replace(/\s+/g, ' ').trim();
        const dd = $(dtEl).next('dd').text().replace(/\s+/g, ' ').trim();
        if (dt || dd) {
          items.push(`${dt}: ${dd}`);
        }
      });
    if (items.length > 0) {
      structuredChunks.push('【屬性列表】\n' + items.join('\n'));
    }
  });

  // List items and paragraphs
  $('article, main, .content, .detail, .house-info, .property-detail, body')
    .first()
    .find('p, li, .item, .spec-item')
    .each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text && text.length > 3 && text.length < 500) {
        structuredChunks.push(text);
      }
    });

  // Clean raw body text
  const cleanedBodyText = $('body').text().replace(/\s+/g, ' ').trim();

  // Check if content is effectively empty or pure SPA shell
  const isMinimalContent = cleanedBodyText.length < 80;

  return {
    pageTitle,
    ogTitle,
    ogDescription,
    ogImage,
    candidateImages: candidateImages.slice(0, 10),
    jsonLdBlocks,
    structuredText: structuredChunks.slice(0, 50).join('\n\n'),
    cleanedBodyText: cleanedBodyText.slice(0, 6000),
    isMinimalContent,
  };
}

/**
 * Deterministic Taiwan Real Estate Heuristic Extractor.
 * Parses JSON-LD and standard Taiwan real estate expressions (總價/萬, 權狀/坪, 格局, 樓層, 地址, 社區).
 * Used as primary parser or robust fallback.
 */
function extractWithHeuristics(
  extracted: ReturnType<typeof cleanAndExtractHtml>,
  sourceUrl: string,
  sourceSite: string
): ExtractedPropertySchema {
  const allText = `${extracted.pageTitle} ${extracted.ogDescription} ${extracted.structuredText} ${extracted.cleanedBodyText}`;

  let title = extracted.pageTitle || extracted.ogTitle || '';
  // Clean generic site postfixes like "- 591房屋交易", "| 永慶房仲網", "好房網"
  title = title.replace(/\s*[-|_|–]\s*(591|永慶|信義|中信|住商|東森|好房網|樂屋網|台灣房屋|house).*$/i, '').trim();

  let community = '';
  let address = '';
  let price: number | null = null;
  let area: number | null = null;
  let mainArea: number | null = null;
  let landArea: number | null = null;
  let buildingAge: number | null = null;
  let layout = '';
  let floor = '';
  let totalFloors = '';
  let parking = '';
  let propertyType = '';
  let orientation = '';
  let managementFee: number | null = null;
  let description = extracted.ogDescription || '';

  // 1. Parse JSON-LD if available
  if (extracted.jsonLdBlocks.length > 0) {
    for (const block of extracted.jsonLdBlocks) {
      const items = Array.isArray(block) ? block : block['@graph'] ? block['@graph'] : [block];
      for (const item of items) {
        if (item.name && !title) title = item.name;
        if (item.description && !description) description = item.description;
        if (item.offers && item.offers.price) {
          const p = Number(item.offers.price);
          if (!isNaN(p)) {
            // If in NTD dollars like 28000000 -> convert to 2800 萬
            price = p > 100000 ? Math.round(p / 10000) : p;
          }
        }
        if (item.address) {
          if (typeof item.address === 'string') {
            address = item.address;
          } else if (typeof item.address === 'object') {
            address = `${item.address.addressRegion || ''}${item.address.addressLocality || ''}${item.address.streetAddress || ''}`.trim();
          }
        }
        if (item.floorSize) {
          const s = parseFloat(item.floorSize.value || item.floorSize);
          if (!isNaN(s)) area = s;
        }
      }
    }
  }

  // 2. Extract Price (總價 xxx 萬 / xxx 萬元)
  if (price === null) {
    const priceMatch =
      allText.match(/(?:總價|售價|開價|價格)[\s:：]*([0-9,]+(?:\.[0-9]+)?)\s*萬/i) ||
      allText.match(/([0-9,]+(?:\.[0-9]+)?)\s*萬(?:元)?/i);
    if (priceMatch) {
      const val = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val < 500000) {
        price = val;
      }
    }
  }

  // 3. Extract Area (總坪數 / 權狀坪數 / 建坪 / xx.xx 坪)
  if (area === null) {
    const areaMatch =
      allText.match(/(?:權狀坪數|建坪|登記建坪|總坪數|建坪坪數)[\s:：]*([0-9]+(?:\.[0-9]+)?)\s*坪/i) ||
      allText.match(/([0-9]+(?:\.[0-9]+)?)\s*坪/i);
    if (areaMatch) {
      const val = parseFloat(areaMatch[1]);
      if (!isNaN(val) && val > 0 && val < 5000) {
        area = val;
      }
    }
  }

  // Main area
  const mainAreaMatch = allText.match(/(?:主建物|室內|主建坪數)[\s:：]*([0-9]+(?:\.[0-9]+)?)\s*坪/i);
  if (mainAreaMatch) {
    const val = parseFloat(mainAreaMatch[1]);
    if (!isNaN(val)) mainArea = val;
  }

  // Land area
  const landAreaMatch = allText.match(/(?:土地坪數|地坪)[\s:：]*([0-9]+(?:\.[0-9]+)?)\s*坪/i);
  if (landAreaMatch) {
    const val = parseFloat(landAreaMatch[1]);
    if (!isNaN(val)) landArea = val;
  }

  // 4. Extract Address (台灣標準市區路段)
  if (!address) {
    const addrMatch = allText.match(
      /(?:台北市|新北市|桃園市|台中市|台南市|高雄市|基隆市|新竹市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義市|嘉義縣|屏東縣|宜蘭縣|花蓮縣|台東縣|澎湖縣|金門縣)[^\s,，。;"'<>]{3,28}(?:路|街|巷|段|弄|號|道)/
    );
    if (addrMatch) {
      address = addrMatch[0].trim();
    }
  }

  // 5. Extract Community
  const commMatch =
    allText.match(/(?:社區名稱|建案名稱|所屬社區|社區)[\s:：]*([^\s,，。;"'<>]{2,15})/i) ||
    title.match(/【([^】]+)】/);
  if (commMatch) {
    community = commMatch[1].trim();
  }

  // 6. Extract Layout (格局: x房x廳x衛)
  const layoutMatch = allText.match(/([1-9一二三四五六七八九]\s*房\s*[0-9一二三四]?\s*廳\s*[0-9一二三四]?\s*衛(?:[0-9一二三四]?\s*陽台)?)/);
  if (layoutMatch) {
    layout = layoutMatch[1].replace(/\s+/g, '');
  }

  // 7. Building Age (屋齡: xx 年)
  const ageMatch = allText.match(/(?:屋齡|建築年齡)[\s:：]*([0-9]+(?:\.[0-9]+)?)\s*年/i);
  if (ageMatch) {
    const val = parseFloat(ageMatch[1]);
    if (!isNaN(val)) buildingAge = val;
  } else if (allText.includes('預售屋') || allText.includes('預售')) {
    buildingAge = 0;
  }

  // 8. Floor & Total Floors (樓層: x樓 / 共y樓)
  const floorMatch = allText.match(/(?:所在樓層|樓層)[\s:：]*([0-9B~～\-\/]+)\s*樓/i) || allText.match(/([0-9]+)\s*F\s*\/\s*([0-9]+)\s*F/i);
  if (floorMatch) {
    floor = `${floorMatch[1]}樓`;
  }
  const totalFloorMatch = allText.match(/(?:總樓高|總樓層|地上)[\s:：]*([0-9]+)\s*樓/i);
  if (totalFloorMatch) {
    totalFloors = `${totalFloorMatch[1]}樓`;
  }

  // 9. Parking
  if (allText.includes('平面車位') || allText.includes('坡道平面')) {
    parking = '坡道平面車位';
  } else if (allText.includes('機械車位') || allText.includes('坡道機械')) {
    parking = '坡道機械車位';
  } else if (allText.includes('無車位') || allText.includes('無')) {
    parking = '無';
  } else {
    const parkMatch = allText.match(/車位[\s:：]*([^\s,，。;"'<>]{2,10})/);
    if (parkMatch) parking = parkMatch[1].trim();
  }

  // 10. Property Type
  if (allText.includes('大樓') || allText.includes('電梯大樓')) {
    propertyType = '電梯大樓';
  } else if (allText.includes('華廈')) {
    propertyType = '電梯華廈';
  } else if (allText.includes('公寓')) {
    propertyType = '公寓';
  } else if (allText.includes('透天') || allText.includes('別墅')) {
    propertyType = '透天別墅';
  }

  // 11. Management fee
  const feeMatch = allText.match(/管理費[\s:：]*([0-9,]+)\s*(?:元|元\/月|\/月)/i);
  if (feeMatch) {
    const feeVal = parseInt(feeMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(feeVal)) managementFee = feeVal;
  }

  // Calculate field confidence
  const confidence = {
    title: title ? 90 : 30,
    price: price !== null ? 85 : 0,
    address: address ? 80 : 0,
    area: area !== null ? 85 : 0,
  };

  const needsVerification: string[] = [];
  if (!price || confidence.price < 70) needsVerification.push('price');
  if (!address || confidence.address < 70) needsVerification.push('address');
  if (!area || confidence.area < 70) needsVerification.push('area');
  if (!layout) needsVerification.push('layout');
  if (buildingAge === null) needsVerification.push('buildingAge');
  if (!parking) needsVerification.push('parking');

  return {
    title: title || '未命名案件',
    community,
    address: address || '',
    price,
    area,
    mainArea,
    landArea,
    buildingAge,
    layout,
    floor,
    totalFloors,
    parking,
    propertyType,
    orientation,
    managementFee,
    description: description.slice(0, 1000),
    sourceUrl,
    sourceSite,
    images: extracted.candidateImages,
    confidence,
    needsVerification,
  };
}

/**
 * Uses Gemini Structured Extraction to parse cleaned text into the target schema.
 */
async function extractWithGemini(
  cleanedData: ReturnType<typeof cleanAndExtractHtml>,
  sourceUrl: string,
  sourceSite: string
): Promise<ExtractedPropertySchema | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const extractionPrompt = `你是一位專業的台灣不動產資料萃取專家。
請從以下提供的網頁清理後內容與結構化資訊中，精準擷取不動產案件資料，並以純 JSON 格式輸出。

嚴格規則：
1. 不可虛構不存在的資料。
2. 找不到的欄位請回傳 null 或空字串 ""。
3. 不可自行推算或猜測未知價格 (price 單位為台灣新台幣「萬元」，例如總價 2,880 萬則填入 2880；若只有完整元例如 28800000 請換算為 2880)。
4. 不可自行猜測完整地址 (address 必須為真實出現之路段/行政區)。
5. 區分原始資料與推論，若資料不確定，請將該欄位英文名稱加入 needsVerification 陣列 (例如 ["price", "address"])。
6. 對重要欄位 (title, price, address, area) 給予 0~100 的 confidence 評分。

目標 JSON Schema：
{
  "title": "案件名稱 (string)",
  "community": "社區或建案名稱 (string)",
  "address": "地址 (string)",
  "price": 總價數字_萬元 (number | null),
  "area": 權狀總坪數 (number | null),
  "mainArea": 主建物坪數 (number | null),
  "landArea": 土地坪數 (number | null),
  "buildingAge": 屋齡年數 (number | null),
  "layout": "格局 (例如 3房2廳2衛) (string)",
  "floor": "所在樓層 (例如 8樓) (string)",
  "totalFloors": "總樓層 (例如 15樓) (string)",
  "parking": "車位狀況 (例如 坡道平面、無) (string)",
  "propertyType": "物件類型 (例如 電梯大樓、公寓、透天別墅) (string)",
  "orientation": "朝向 (例如 朝南、座北朝南) (string)",
  "managementFee": 每月管理費元數 (number | null),
  "description": "物件特色說明 (string)",
  "sourceUrl": "${sourceUrl}",
  "sourceSite": "${sourceSite}",
  "images": [候選圖片網址字串陣列],
  "confidence": {
    "title": 0-100,
    "price": 0-100,
    "address": 0-100,
    "area": 0-100
  },
  "needsVerification": ["欄位名稱陣列"]
}

網頁來源資訊：
來源網址: ${sourceUrl}
來源網站: ${sourceSite}
網頁標題: ${cleanedData.pageTitle}
Meta 說明: ${cleanedData.ogDescription}
已擷取圖片: ${JSON.stringify(cleanedData.candidateImages)}
JSON-LD 區塊: ${JSON.stringify(cleanedData.jsonLdBlocks).slice(0, 2000)}

網頁主體內容萃取：
${cleanedData.structuredText}

內文摘要：
${cleanedData.cleanedBodyText.slice(0, 3000)}
`;

    const aiResult = await generateContentWithFallback({
      prompt: extractionPrompt,
      responseMimeType: 'application/json',
      temperature: 0.2,
    });

    if (aiResult && aiResult.data && typeof aiResult.data === 'object') {
      const parsed = aiResult.data;
      return {
        title: parsed.title || cleanedData.pageTitle || '未命名案件',
        community: parsed.community || '',
        address: parsed.address || '',
        price: typeof parsed.price === 'number' ? parsed.price : null,
        area: typeof parsed.area === 'number' ? parsed.area : null,
        mainArea: typeof parsed.mainArea === 'number' ? parsed.mainArea : null,
        landArea: typeof parsed.landArea === 'number' ? parsed.landArea : null,
        buildingAge: typeof parsed.buildingAge === 'number' ? parsed.buildingAge : null,
        layout: parsed.layout || '',
        floor: parsed.floor || '',
        totalFloors: parsed.totalFloors || '',
        parking: parsed.parking || '',
        propertyType: parsed.propertyType || '',
        orientation: parsed.orientation || '',
        managementFee: typeof parsed.managementFee === 'number' ? parsed.managementFee : null,
        description: parsed.description || cleanedData.ogDescription || '',
        sourceUrl,
        sourceSite,
        images: Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images : cleanedData.candidateImages,
        confidence: {
          title: parsed.confidence?.title ?? 80,
          price: parsed.confidence?.price ?? (parsed.price ? 85 : 0),
          address: parsed.confidence?.address ?? (parsed.address ? 80 : 0),
          area: parsed.confidence?.area ?? (parsed.area ? 80 : 0),
        },
        needsVerification: Array.isArray(parsed.needsVerification) ? parsed.needsVerification : [],
      };
    }

    return null;
  } catch (err: any) {
    console.log('[WebsiteImporter] Gemini extraction deferred to heuristic engine:', err?.message || err);
    return null;
  }
}

/**
 * Main Scraper & Extractor Entry Point
 */
export async function scrapeAndExtractWebsite(targetUrl: string): Promise<WebsiteScrapeResult> {
  try {
    // 1. Fetch safe HTML
    const { html, finalUrl } = await fetchSafeHtml(targetUrl);

    const parsedUrl = new URL(finalUrl);
    const sourceSite = parsedUrl.hostname.replace(/^www\./, '');

    // 2. Clean HTML with cheerio
    const cleaned = cleanAndExtractHtml(html, finalUrl);

    // 3. Dynamic content required check
    if (cleaned.isMinimalContent && cleaned.candidateImages.length === 0 && cleaned.jsonLdBlocks.length === 0) {
      return {
        success: false,
        errorCode: 'DYNAMIC_CONTENT_REQUIRED',
        errorMessage: '該網站為純動態 JavaScript 渲染、或需登入/驗證碼防護，目前無法抓取其靜態內容',
      };
    }

    // 4. Try Gemini Structured Extraction first
    let finalExtracted: ExtractedPropertySchema | null = await extractWithGemini(
      cleaned,
      finalUrl,
      sourceSite
    );

    // 5. Fallback to robust deterministic heuristic parser if Gemini is unavailable or didn't return valid schema
    if (!finalExtracted) {
      finalExtracted = extractWithHeuristics(cleaned, finalUrl, sourceSite);
    }

    // Double check if completely empty
    if (!finalExtracted.title && !finalExtracted.address && !finalExtracted.price) {
      return {
        success: false,
        errorCode: 'EXTRACTION_FAILED',
        errorMessage: '未能從該網頁中擷取到有效之房地產案件資料，請確認網址是否為特定房屋詳情頁',
      };
    }

    return {
      success: true,
      rawMetadata: {
        title: cleaned.pageTitle,
        description: cleaned.ogDescription,
        ogImage: cleaned.ogImage,
        sourceSite,
        hasJsonLd: cleaned.jsonLdBlocks.length > 0,
        contentLength: html.length,
      },
      extractedData: finalExtracted,
    };
  } catch (error: any) {
    return {
      success: false,
      errorCode: error.code || 'FETCH_FAILED',
      errorMessage: error.message || '網站讀取失敗',
    };
  }
}
