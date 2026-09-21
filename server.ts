import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { Type } from '@google/genai';
import { authRouter } from './server/routes/authRoutes';
import { storeRouter } from './server/routes/storeRoutes';
import { userRouter } from './server/routes/userRoutes';
import { propertyRouter } from './server/routes/propertyRoutes';
import { aiRouter } from './server/routes/aiRunRoutes';
import { importRouter } from './server/routes/importRoutes';
import { marketingRouter } from './server/routes/marketingRoutes';
import { requireAuth } from './server/middleware/auth';
import { getCollection } from './server/db/mongo';
import { seedDatabase } from './server/seed';
import { ObjectId } from 'mongodb';
import { generateContentWithFallback, getGenAI } from './server/services/geminiService';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/stores', storeRouter);
app.use('/api/users', userRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/ai', aiRouter);
app.use('/api/imports', importRouter);
app.use('/api/marketing', marketingRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

/**
 * Fallback Consultant Engine: 20-Year Real Estate Veteran Heuristic Generator
 * Used when Gemini API encounters temporary 503 high demand spikes or network limits.
 */
function createDynamicPropertyAnalysis(property: any) {
  const unitPrice = property.area > 0 ? (property.price / property.area).toFixed(1) : '0';
  const isLuxury = property.price >= 4500 || Number(unitPrice) >= 90;
  const isPreSale = !property.building_age || property.building_age === 0;

  return {
    basic_summary: {
      unit_price_ping: `約 ${unitPrice} 萬/坪`,
      summary_highlights: [
        `${property.community ? property.community + '社區，' : ''}${property.address}`,
        `總價 ${property.price} 萬元，權狀坪數 ${property.area} 坪，${isPreSale ? '預售/全新成屋' : `屋齡約 ${property.building_age} 年`}`,
        `格局規劃 ${property.layout || '標準格局'}，樓層座落 ${property.floor || '適中樓層'}，配備 ${property.parking || '專屬車位'}`,
      ],
      market_positioning: isLuxury
        ? '高資產置產、自住換屋及注重私密保值性之頂級客群標的'
        : '生活機能成熟商圈剛性首換與優質小家庭之保值型優質宅',
    },
    five_selling_points: [
      `【黃金地段與生活圈】座落於 ${property.address}，周邊日常機能成熟充沛，交通通勤路網極具優勢。`,
      `【開闊採光流暢格局】${property.layout || '方正採光格局'}，空間無虛坪浪費，動線分明，${property.floor ? '樓層為 ' + property.floor + ' 採光視野優' : '居住開揚感高'}。`,
      `【車位配比與轉手性】配置 ${property.parking || '坡道平面車位'}，免除繁華都會找車位困擾，提升未來中古屋市場流動性。`,
      `【現況屋況優勢】${property.description || '全室維持良好維護水準，通風對流通透，即刻成家免大幅翻修費用。'}`,
      `【屋主售屋動機誠意明確】${property.owner_reason ? `屋主動機為「${property.owner_reason}」，心態理性誠售` : '屋主心態誠懇平和，只要買方出價合理，極具斡旋成效彈性'}。`,
    ],
    resistance_points: [
      `【自備款與總價門檻】開價 ${property.price} 萬在目前央行成數管制下，買方需備足約 2-3 成自備款，首購族群可能有資金調度壓力。`,
      `【單價比較心理】折算單價約 ${unitPrice} 萬/坪，買方通常會調閱近半年實價登錄低點進行心理抗衡與試探。`,
      `【屋況或屋齡顧慮】${property.building_age ? `屋齡 ${property.building_age} 年，部分買方會挑剔水電管線更換或室內風格裝修折讓。` : '新案公設比或管理費水準需事先對買方建立合理預期。'}`,
    ],
    resistance_solutions: [
      '【資金抗性解方】事先協調配合之主要行庫房貸主管，提供買方 8 成低利貸款試算與寬限期方案，直接打消資金疑慮。',
      '【行情抗性解方】精準製作「同路段近半年同質性產品成交比較表」，凸顯本戶在採光、樓層與平面車位上的綜合性價比。',
      '【屋況抗性解方】帶看時主動出示驗屋現況與社區管委會維護紀錄，並提供室內 3D 輕裝潢佈置預算建議，轉換抗性為議價優勢。',
    ],
    target_audience: {
      buyer_profiles: [
        '注重孩童就學機能與全家居住品質之在地雙薪換屋家庭',
        '鄰近商圈、科技園區或金融業之專業主管與高所得白領',
        '原住周邊無電梯老舊公寓、欲提早為退休生活規劃電梯美廈之在地長輩資產族',
      ],
      lifestyle_appeal: '出門即可享有成熟商圈與便利大眾運輸，返家即享靜謐寬闊的採光天地，完美兼顧事業節奏與家庭溫馨時光。',
    },
    showing_keypoints: [
      '【黃金帶看時機】建議安排於上午 10:00~12:00 或午後 14:00~16:00 日照充沛時段，親身體驗自然採光與窗外通透景致。',
      '【導引參觀動線】先從客廳大面景觀窗建立開闊好感，再引導參觀主臥室之私密尺度與收納動線，最後停留於大廳公設加深質感印記。',
      '【關鍵感官體驗】進門時關閉大門與氣密窗，讓買方親自體會都會靜巷的隔音水準，並強調社區物業嚴謹管理細節。',
    ],
    sales_strategy: {
      pricing_strategy: `建議開價 ${property.price} 萬保有約 3%~5% 之合理談判防守空間，經紀人應先向屋主鎖定實拿底價防線，以利快速促成斡旋轉定。`,
      negotiation_tips: `善用屋主明確動機「${property.owner_reason || '誠意換屋籌措資金'}」，若遇優質誠意買方已備妥斡旋金，建議立即以見面談鎖定成交機會。`,
      marketing_channels: [
        '第一時間清查店內既有配對買方名單，挑選 5 組高意願準買方進行 VIP 首波電話預約',
        '產出高畫質開箱貼文與短影音，投放至房仲粉絲專頁與區域買屋社團',
        '於房仲公會聯賣系統開啟同行合作，最大化全城帶看流通量',
      ],
    },
    next_action_steps: [
      '1. 【產權確認】立即向地政調閱最新第一類建物與土地謄本，確認產權無設定他項爭議。',
      '2. 【行情實證】印製近半年周邊半徑 500 公尺同質性成交案例 3 筆，製作行情對比護照。',
      '3. 【VIP 客戶邀約】於 24 小時內通知精選庫存買方名單，安排週六週日專場帶看時段。',
      '4. 【行銷發酵】運用本系統生成之 FB 貼文與 LINE 推播文案，同步推播至個人品牌社群。',
    ],
  };
}

/**
 * Fallback Marketing Copy Engine
 */
function createDynamicMarketingCopy(property: any, tone: string = '專業誠懇吸睛') {
  const unitPrice = property.area > 0 ? (property.price / property.area).toFixed(1) : '0';

  return {
    headline: `【稀有釋出】${property.title}｜${property.community ? property.community + '・' : ''}絕佳生活圈`,
    facebook_post: `🔥【優質專任・搶手美邸】${property.title} ✨\n\n📍 地點：${property.address}\n💰 總價：${property.price} 萬元（每坪單價約 ${unitPrice} 萬/坪）\n📐 坪數：${property.area} 坪 ｜ 格局：${property.layout || '標準格局'}\n🏢 樓層：${property.floor || '優質樓層'} ｜ 車位：${property.parking || '專屬車位'}\n\n🌟 案件精選焦點：\n1️⃣ ${property.description || '高樓層明亮採光，格局方正無多餘浪費空間'}\n2️⃣ 地段生活機能優越，散步即可抵達成熟商圈與交通節點\n3️⃣ 屋主動機誠意明確（${property.owner_reason || '換屋誠售'}），出價好談！\n\n📲 搶先預約看屋，請直接私訊小編或留言「想了解」立即為您送上產權資料與賞屋導覽！`,
    line_push: `🏠【好房快報・誠售首選】\n${property.title}\n總價：${property.price} 萬｜${property.area} 坪｜${property.layout}\n車位：${property.parking}\n✨ 屋主換屋誠意出售，價格符合行情！手刀回覆本訊息安排本週末首批賞屋！`,
    instagram_xiaohongshu: `✨ 今日心動好宅巡禮 ✨\n📍 ${property.community || property.address}\n\n陽光灑落的午後，這才是理想生活的模樣。\n總價 ${property.price} 萬｜${property.area} 坪方正美學空間🌿\n屋主心態超級好，適合懂生活品味的你！\n\n私訊【預約】搶先看房～\n#買房紀錄 #看屋日常 #裝潢靈感 #生活美學 #房產精選`,
    buyer_edm: `敬愛的 VIP 貴賓您好：\n\n我是您的專屬不動產顧問。為您推薦本週剛釋出之稀有優質物件【${property.title}】。\n\n本戶位於 ${property.address}，總價 ${property.price} 萬元，室內規劃為 ${property.layout || '舒適格局'}，附 ${property.parking || '專屬車位'}。\n目前屋主因【${property.owner_reason || '資產配置規劃'}】釋出，開價極具誠意。若您希望掌握完整實價對比與第一手謄本資訊，歡迎隨時撥打專線，我將竭誠為您安排第一順位隱私導覽。\n\n敬祝 順心安康`,
    hashtags: ['#不動產推薦', '#精選好房', '#賞屋預約', '#換屋首選', '#台灣房產', '#房仲日常'],
  };
}

async function logAiRun(
  user?: any,
  property?: any,
  toolCode?: string,
  toolName?: string,
  inputData?: any,
  outputData?: any,
  modelName: string = 'gemini-3.1-flash-lite'
) {
  if (!user || !user.id) return;
  try {
    const col = await getCollection('ai_runs');
    await col.insertOne({
      _id: new ObjectId(),
      userId: ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id,
      storeId: user.storeId && ObjectId.isValid(user.storeId) ? new ObjectId(user.storeId) : user.storeId,
      property_id: property?._id?.toString() || property?.id?.toString() || '',
      property_title: property?.title || '',
      tool_code: toolCode || 'property_analysis',
      tool_name: toolName || 'AI 案件深度剖析',
      model: modelName,
      input: inputData || {},
      output: outputData || {},
      status: 'success',
      createdAt: new Date(),
    });
  } catch (err: any) {
    console.warn('AI run logging error:', err?.message);
  }
}

/**
 * 1. AI 案件深度剖析 Endpoint
 * Persona: 20年實戰經驗的不動產顧問
 * 8 Output Sections
 */
app.post(['/api/ai/property-analysis', '/api/property-analysis'], requireAuth, async (req, res) => {
  const { property } = req.body;
  if (!property) {
    return res.status(400).json({ error: '缺少案件資料' });
  }

  const unitPrice = property.area > 0 ? (property.price / property.area).toFixed(1) : '0';

  const systemInstruction = `你是一位具有20年實戰經驗的不動產顧問。精通台灣房地產市場、區域行情、豪宅與標準住宅買賣、屋主心態分析、買方心理學與帶看成交技巧。面對經紀人提供的案件，能以犀利、精準、專業、實戰的視角進行全方位診斷。
請依照房仲經紀人提供的案件資訊進行深度剖析，並輸出結構化 JSON，必須完整涵蓋以下 8 個部分：
1. 基本資料整理 (basic_summary: 含 unit_price_ping 每坪單價, summary_highlights 重點列表, market_positioning 市場定位)
2. 五大賣點 (five_selling_points: 5條犀利賣點，包含具體標題與說服文字)
3. 案件抗性 (resistance_points: 3條買方可能會猶豫或嫌棄的真實抗性)
4. 抗性解決方式 (resistance_solutions: 針對上述抗性的3條實戰化解話術與解決方案)
5. 目標客群 (target_audience: buyer_profiles 客群輪廓列表, lifestyle_appeal 生活型態訴求)
6. 帶看重點 (showing_keypoints: 3條包含最佳帶看時間、動線導引與細節展示)
7. 銷售策略 (sales_strategy: pricing_strategy 定價策略, negotiation_tips 談判心理攻防, marketing_channels 行銷管道)
8. 下一步行動建議 (next_action_steps: 4條經紀人可立刻採取的具體實務步驟)
語言：繁體中文 (台灣房地產專業用語，如：坪數、車位、公設比、管委會、實價登錄、斡旋、謄本、換屋、首購)。`;

  const userPrompt = `請為以下案件進行 20 年顧問級實戰深度剖析：
案件名稱：${property.title}
社區名稱：${property.community || '無或透天獨立'}
地址：${property.address}
售價：${property.price} 萬元 (單價約 ${unitPrice} 萬/坪)
坪數：${property.area} 坪
屋齡：${property.building_age || 0} 年
格局：${property.layout}
樓層：${property.floor}
車位：${property.parking}
現況描述：${property.description || '無特殊備註'}
屋主售屋動機/心態：${property.owner_reason || '屋主誠意出售'}

請以標準 JSON 格式返回分析結果。`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      basic_summary: {
        type: Type.OBJECT,
        properties: {
          unit_price_ping: { type: Type.STRING },
          summary_highlights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          market_positioning: { type: Type.STRING },
        },
        required: ['unit_price_ping', 'summary_highlights', 'market_positioning'],
      },
      five_selling_points: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      resistance_points: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      resistance_solutions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      target_audience: {
        type: Type.OBJECT,
        properties: {
          buyer_profiles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          lifestyle_appeal: { type: Type.STRING },
        },
        required: ['buyer_profiles', 'lifestyle_appeal'],
      },
      showing_keypoints: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      sales_strategy: {
        type: Type.OBJECT,
        properties: {
          pricing_strategy: { type: Type.STRING },
          negotiation_tips: { type: Type.STRING },
          marketing_channels: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['pricing_strategy', 'negotiation_tips', 'marketing_channels'],
      },
      next_action_steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: [
      'basic_summary',
      'five_selling_points',
      'resistance_points',
      'resistance_solutions',
      'target_audience',
      'showing_keypoints',
      'sales_strategy',
      'next_action_steps',
    ],
  };

  const aiResult = await generateContentWithFallback({
    prompt: userPrompt,
    systemInstruction,
    responseSchema,
    responseMimeType: 'application/json',
    preferredModel: 'gemini-3.1-flash-lite',
    temperature: 0.7,
  });

  if (aiResult && aiResult.data && aiResult.data.five_selling_points) {
    await logAiRun(req.user, property, 'property_analysis', 'AI 案件深度剖析', property, aiResult.data, aiResult.usedModel);
    return res.json({ analysis: aiResult.data });
  }

  // Graceful fallback to dynamic 20-year consultant engine
  console.log('Serving dynamic 20-year consultant real estate analysis');
  const fallbackAnalysis = createDynamicPropertyAnalysis(property);
  await logAiRun(req.user, property, 'property_analysis', 'AI 案件深度剖析', property, fallbackAnalysis, 'grounded-consultant-engine');
  return res.json({ analysis: fallbackAnalysis });
});

/**
 * 2. AI 行銷文案 Endpoint
 */
app.post(['/api/ai/marketing-copy', '/api/marketing-copy'], requireAuth, async (req, res) => {
  const { property, tone = '專業誠懇' } = req.body;
  if (!property) {
    return res.status(400).json({ error: '缺少案件資料' });
  }

  const unitPrice = property.area > 0 ? (property.price / property.area).toFixed(1) : '0';

  const systemInstruction = `你是一位專精房地產數位行銷的文案大師與資深行銷總監。能精準抓住買方痛點與眼球，產出兼具真實性、吸引力、合規性與高轉換率的房仲行銷文案。風格設定：${tone}。繁體中文輸出。`;

  const userPrompt = `請為以下案件撰寫多通路行銷文案：
案件標題：${property.title}
社區：${property.community || '獨立'}
地址：${property.address}
總價：${property.price} 萬 (單價約 ${unitPrice} 萬/坪)
坪數：${property.area} 坪
格局：${property.layout}
樓層：${property.floor}
車位：${property.parking}
特色說明：${property.description}
屋主動機：${property.owner_reason}

請生成 JSON 格式：
1. headline (吸引人的大標題)
2. facebook_post (Facebook/社群詳細吸睛貼文，含表情符號與排版)
3. line_push (LINE 官方帳號/一對一推播短訊，簡潔有力)
4. instagram_xiaohongshu (IG / 小紅書視覺感打卡文案)
5. buyer_edm (給 VIP 買方正式專業的邀請賞屋信件)
6. hashtags (5-8個熱門相關標籤)`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING },
      facebook_post: { type: Type.STRING },
      line_push: { type: Type.STRING },
      instagram_xiaohongshu: { type: Type.STRING },
      buyer_edm: { type: Type.STRING },
      hashtags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: ['headline', 'facebook_post', 'line_push', 'instagram_xiaohongshu', 'buyer_edm', 'hashtags'],
  };

  const aiResult = await generateContentWithFallback({
    prompt: userPrompt,
    systemInstruction,
    responseSchema,
    responseMimeType: 'application/json',
    preferredModel: 'gemini-3.1-flash-lite',
    temperature: 0.7,
  });

  if (aiResult && aiResult.data && aiResult.data.headline) {
    await logAiRun(req.user, property, 'marketing_copy', 'AI 行銷文案專家', { property, tone }, aiResult.data, aiResult.usedModel);
    return res.json({ marketing: aiResult.data });
  }

  // Graceful fallback to dynamic marketing generator
  console.log('Serving dynamic marketing copy');
  const fallbackMarketing = createDynamicMarketingCopy(property, tone);
  await logAiRun(req.user, property, 'marketing_copy', 'AI 行銷文案專家', { property, tone }, fallbackMarketing, 'grounded-marketing-engine');
  return res.json({ marketing: fallbackMarketing });
});

// Vite middleware or production static serving
async function startServer() {
  // Ensure database collections and test accounts are seeded
  try {
    await seedDatabase();
  } catch (err: any) {
    console.warn('⚠️ Seeding database error:', err?.message || err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`房仲 AI 工作平台 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
