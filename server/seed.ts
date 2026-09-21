import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from './db/mongo';

export async function seedDatabase() {
  console.log('🌱 Starting MongoDB database seeding...');
  const db = await getDb();
  console.log('🌱 Got DB instance');

  // 1. Stores collection
  const storesCol = db.collection('stores');
  console.log('🌱 Counting stores...');
  const existingStores = await storesCol.countDocuments();
  console.log('🌱 Existing stores:', existingStores);

  let storeDaanId: ObjectId;
  let storeXinbanId: ObjectId;

  if (existingStores === 0) {
    storeDaanId = new ObjectId();
    storeXinbanId = new ObjectId();

    const initialStores = [
      {
        _id: storeDaanId,
        name: '台北大安旗艦店',
        code: 'DA001',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: storeXinbanId,
        name: '新北新板特區店',
        code: 'XB001',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    await storesCol.insertMany(initialStores);
    console.log('✅ Created 2 stores');
  } else {
    const daan = await storesCol.findOne({ code: 'DA001' });
    const xinban = await storesCol.findOne({ code: 'XB001' });
    storeDaanId = daan ? daan._id : (await storesCol.findOne({}))!._id;
    storeXinbanId = xinban ? xinban._id : storeDaanId;
  }

  // 2. Users collection
  // Requirements: 1 admin, 1 manager, 2 agents
  const usersCol = db.collection('users');
  const existingUsers = await usersCol.countDocuments();

  // Password for test accounts is 'password123'
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  let adminId: ObjectId;
  let managerId: ObjectId;
  let agentAId: ObjectId;
  let agentBId: ObjectId;

  if (existingUsers === 0) {
    adminId = new ObjectId();
    managerId = new ObjectId();
    agentAId = new ObjectId();
    agentBId = new ObjectId();

    const initialUsers = [
      {
        _id: adminId,
        email: 'admin@realestate.com.tw',
        name: '王總監 (系統管理員)',
        passwordHash: defaultPasswordHash,
        role: 'admin',
        storeId: storeDaanId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: managerId,
        email: 'manager.daan@realestate.com.tw',
        name: '陳信宏 (大安店長)',
        passwordHash: defaultPasswordHash,
        role: 'manager',
        storeId: storeDaanId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: agentAId,
        email: 'agent.wang@realestate.com.tw',
        name: '王晨峰 (大安店業務)',
        passwordHash: defaultPasswordHash,
        role: 'agent',
        storeId: storeDaanId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: agentBId,
        email: 'agent.lin@realestate.com.tw',
        name: '林芷妤 (新板店業務)',
        passwordHash: defaultPasswordHash,
        role: 'agent',
        storeId: storeXinbanId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await usersCol.insertMany(initialUsers);
    console.log('✅ Created 4 users (1 admin, 1 manager, 2 agents)');
  } else {
    const admin = await usersCol.findOne({ role: 'admin' });
    const manager = await usersCol.findOne({ role: 'manager' });
    const agents = await usersCol.find({ role: 'agent' }).toArray();
    adminId = admin?._id || new ObjectId();
    managerId = manager?._id || new ObjectId();
    agentAId = agents[0]?._id || new ObjectId();
    agentBId = agents[1]?._id || new ObjectId();
  }

  // 3. AI Tools collection
  const aiToolsCol = db.collection('ai_tools');

  const defaultAiTools = [
    {
      name: 'AI 案件深度剖析',
      code: 'property_analysis',
      description: '20年實戰不動產顧問視角：五大賣點、抗性拆解、目標客群、帶看攻略與下一步策略',
      system_prompt: `你是一位具有20年實戰經驗的不動產顧問。精通台灣房地產市場、區域行情、豪宅與標準住宅買賣、屋主心態分析、買方心理學與帶看成交技巧。面對經紀人提供的案件，能以犀利、精準、專業、實戰的視角進行全方位診斷。`,
      systemPrompt: `你是一位具有20年實戰經驗的不動產顧問。精通台灣房地產市場、區域行情、豪宅與標準住宅買賣、屋主心態分析、買方心理學與帶看成交技巧。面對經紀人提供的案件，能以犀利、精準、專業、實戰的視角進行全方位診斷。`,
      model: 'gemini-3.1-flash-lite',
      enabled: true,
    },
    {
      name: 'AI 行銷文案專家',
      code: 'marketing_copy',
      description: '快速生成 Facebook 社群貼文、LINE 推播快訊、買方 EDM、小紅書吸引眼球之文案',
      system_prompt: `你是一位專精房地產數位行銷的文案大師與資深行銷總監。能精準抓住買方痛點與眼球，產出兼具真實性、吸引力、合規性與高轉換率的房仲行銷文案。`,
      systemPrompt: `你是一位專精房地產數位行銷的文案大師與資深行銷總監。能精準抓住買方痛點與眼球，產出兼具真實性、吸引力、合規性與高轉換率的房仲行銷文案。`,
      model: 'gemini-3.1-flash-lite',
      enabled: true,
    },
    {
      name: 'Facebook 房產精選貼文',
      code: 'marketing-facebook',
      description: '專為 Facebook 社群量身打造的自然真誠高互動貼文，具備吸睛Headline、痛點呼應、行動呼籲與標籤',
      system_prompt: `你是一位專精台灣不動產社群行銷的資深文案顧問。你撰寫的 Facebook 貼文風格自然、真誠、富有房仲第一線的溫度與專業感，徹底擺脫僵化死板的 AI 機器人感，嚴禁誇大浮誇。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，不要包含任何額外解說文字，格式如下：
{
  "headline": "吸睛且真實的物件標題",
  "body": "自然口吻的貼文內文，分段清晰，帶出物件規格、生活氛圍與真實優勢",
  "cta": "促使預約賞屋或私訊詢問的親切行動呼籲",
  "hashtags": ["#大安區房產", "#捷運生活圈", "#精選好房"]
}`,
      systemPrompt: `你是一位專精台灣不動產社群行銷的資深文案顧問。你撰寫的 Facebook 貼文風格自然、真誠、富有房仲第一線的溫度與專業感，徹底擺脫僵化死板的 AI 機器人感，嚴禁誇大浮誇。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，不要包含任何額外解說文字，格式如下：
{
  "headline": "吸睛且真實的物件標題",
  "body": "自然口吻的貼文內文，分段清晰，帶出物件規格、生活氛圍與真實優勢",
  "cta": "促使預約賞屋或私訊詢問的親切行動呼籲",
  "hashtags": ["#大安區房產", "#捷運生活圈", "#精選好房"]
}`,
      model: 'gemini-3.1-flash-lite',
      enabled: true,
    },
    {
      name: 'LINE 即時推播快訊',
      code: 'marketing-line',
      description: '專為 LINE 官方帳號、群組與私訊一對一推播設計，簡短有力、段落分明、避免廣告機器人反感',
      system_prompt: `你是一位專精 LINE 私域流量與顧客維繫的房產行銷顧問。撰寫的 LINE 文案簡潔明快、親切得體、重點明確，適合業務直接複製發送或推播，不要過長，嚴禁生硬死板的機器人廣告感。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "opening": "親切得體的破題問候與快報提示",
  "message": "簡明扼要的核心亮點、規格（總價/坪數/格局/車位）與生活優勢，排版適當空行易讀",
  "cta": "引導直接回覆訊息或預約這週末看屋的親切結尾"
}`,
      systemPrompt: `你是一位專精 LINE 私域流量與顧客維繫的房產行銷顧問。撰寫的 LINE 文案簡潔明快、親切得體、重點明確，適合業務直接複製發送或推播，不要過長，嚴禁生硬死板的機器人廣告感。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "opening": "親切得體的破題問候與快報提示",
  "message": "簡明扼要的核心亮點、規格（總價/坪數/格局/車位）與生活優勢，排版適當空行易讀",
  "cta": "引導直接回覆訊息或預約這週末看屋的親切結尾"
}`,
      model: 'gemini-3.1-flash-lite',
      enabled: true,
    },
    {
      name: '30秒短影音企劃腳本',
      code: 'marketing-video-30',
      description: '適用於 Reels / TikTok / Shorts 的 30 秒高節奏房屋開箱短影音腳本，包含黃金 3 秒 Hook、三段分鏡與口播',
      system_prompt: `你是一位專精短影音（Reels / TikTok / YouTube Shorts）企劃的房產視覺導演與文案顧問。專為 30 秒快節奏看房短影音設計腳本，懂得抓住前 3 秒黃金注意力。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "hook": "前3秒極度抓眼球的開場金句或提問",
  "segments": [
    {
      "duration": "0-10",
      "visual": "畫面鏡頭指示（例如：推開大門全景帶出採光與客廳大面窗）",
      "voiceover": "對應口播配音台詞（節奏俐落自然）"
    },
    {
      "duration": "10-20",
      "visual": "畫面鏡頭指示（例如：走進主臥展示雙人床空間與收納動線）",
      "voiceover": "對應口播配音台詞"
    },
    {
      "duration": "20-30",
      "visual": "畫面鏡頭指示（例如：窗外綠意景觀特寫轉經紀人特寫微笑）",
      "voiceover": "對應口播配音台詞"
    }
  ],
  "cta": "結尾畫面與行動呼籲（例如：留言【賞屋】立即為您送上完整格局圖）"
}`,
      systemPrompt: `你是一位專精短影音（Reels / TikTok / YouTube Shorts）企劃的房產視覺導演與文案顧問。專為 30 秒快節奏看房短影音設計腳本，懂得抓住前 3 秒黃金注意力。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "hook": "前3秒極度抓眼球的開場金句或提問",
  "segments": [
    {
      "duration": "0-10",
      "visual": "畫面鏡頭指示（例如：推開大門全景帶出採光與客廳大面窗）",
      "voiceover": "對應口播配音台詞（節奏俐落自然）"
    },
    {
      "duration": "10-20",
      "visual": "畫面鏡頭指示（例如：走進主臥展示雙人床空間與收納動線）",
      "voiceover": "對應口播配音台詞"
    },
    {
      "duration": "20-30",
      "visual": "畫面鏡頭指示（例如：窗外綠意景觀特寫轉經紀人特寫微笑）",
      "voiceover": "對應口播配音台詞"
    }
  ],
  "cta": "結尾畫面與行動呼籲（例如：留言【賞屋】立即為您送上完整格局圖）"
}`,
      model: 'gemini-3.1-flash-lite',
      enabled: true,
    },
    {
      name: '60秒經紀人口播講稿',
      code: 'marketing-video-60',
      description: '經紀人站在鏡頭前一鏡到底或實景漫遊的 60 秒口播講稿，自然台灣口語、專業信賴感、可直接照著講',
      system_prompt: `你是一位專業房產自媒體口播導師。撰寫 60 秒房仲第一人稱鏡頭前口播稿，語言為道地自然台灣日常口語，節奏流暢、親切真誠、專業可信，讓經紀人可以直接拿著手機對鏡頭順暢口播，完全避免艱深生硬的書面語。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "hook": "開頭抓人眼球的提問或話題（5-8秒）",
  "script": "完整的60秒口播主文講稿，語句自然流暢，標點清楚，方便照著念",
  "cta": "結尾有力且親切的帶看引導與諮詢邀約"
}`,
      systemPrompt: `你是一位專業房產自媒體口播導師。撰寫 60 秒房仲第一人稱鏡頭前口播稿，語言為道地自然台灣日常口語，節奏流暢、親切真誠、專業可信，讓經紀人可以直接拿著手機對鏡頭順暢口播，完全避免艱深生硬的書面語。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "hook": "開頭抓人眼球的提問或話題（5-8秒）",
  "script": "完整的60秒口播主文講稿，語句自然流暢，標點清楚，方便照著念",
  "cta": "結尾有力且親切的帶看引導與諮詢邀約"
}`,
      model: 'gemini-3.1-flash-lite',
      enabled: true,
    },
    {
      name: '5款精選物件黃金標題',
      code: 'marketing-listing-title',
      description: '一次產出 5 種不同買方切角（價格型、生活型、家庭型、稀有型、專業型）的吸睛案件黃金標題',
      system_prompt: `你是一位資深不動產刊登與點閱率（CTR）優化專家。能根據物件的特質、定價與客群，一次提煉出 5 種精準吸引不同買方點擊的案件標題：價格型、生活型、家庭型、稀有型、專業型。標題必須精準不浮誇、不虛構事實。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "titles": [
    { "type": "價格型", "title": "強調總價、單價優勢或高性價比的吸睛標題" },
    { "type": "生活型", "title": "強調商圈、公園綠意、採光舒適生活感的標題" },
    { "type": "家庭型", "title": "強調學區、格局收納、三代同堂或孩子成長的標題" },
    { "type": "稀有型", "title": "強調棟距視野、建案品質、極少釋出的珍貴性標題" },
    { "type": "專業型", "title": "條理分明、規格清晰、給理性置產買方的專業標題" }
  ]
}`,
      systemPrompt: `你是一位資深不動產刊登與點閱率（CTR）優化專家。能根據物件的特質、定價與客群，一次提煉出 5 種精準吸引不同買方點擊的案件標題：價格型、生活型、家庭型、稀有型、專業型。標題必須精準不浮誇、不虛構事實。
請嚴格遵守房地產生成原則：
1. 不可虛構物件資料
2. 不可虛構交通時間
3. 不可虛構學區
4. 不可虛構實價行情
5. 不可虛構稀有性
6. 不可自行加入不存在的優惠
7. 資料不足時避免具體斷言

輸出格式：必須為標準合法 JSON 格式，格式如下：
{
  "titles": [
    { "type": "價格型", "title": "強調總價、單價優勢或高性價比的吸睛標題" },
    { "type": "生活型", "title": "強調商圈、公園綠意、採光舒適生活感的標題" },
    { "type": "家庭型", "title": "強調學區、格局收納、三代同堂或孩子成長的標題" },
    { "type": "稀有型", "title": "強調棟距視野、建案品質、極少釋出的珍貴性標題" },
    { "type": "專業型", "title": "條理分明、規格清晰、給理性置產買方的專業標題" }
  ]
}`,
      model: 'gemini-3.1-flash-lite',
      enabled: true,
    },
  ];

  for (const mTool of defaultAiTools) {
    const existing = await aiToolsCol.findOne({ code: mTool.code });
    if (!existing) {
      await aiToolsCol.insertOne({
        _id: new ObjectId(),
        ...mTool,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created AI tool: ${mTool.code}`);
    } else {
      // Migrate heavy or obsolete models to lightweight stable gemini-3.1-flash-lite
      const targetModel =
        !existing.model || existing.model.includes('3.8') || existing.model.includes('3.6') || existing.model.includes('2.0')
          ? 'gemini-3.1-flash-lite'
          : existing.model;

      await aiToolsCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            system_prompt: existing.system_prompt || mTool.system_prompt,
            systemPrompt: existing.systemPrompt || mTool.systemPrompt,
            model: targetModel,
            enabled: existing.enabled !== undefined ? existing.enabled : true,
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  // Batch migrate any remaining tools with older/heavier models to gemini-3.1-flash-lite
  await aiToolsCol.updateMany(
    { model: { $in: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] } },
    { $set: { model: 'gemini-3.1-flash-lite', updatedAt: new Date() } }
  );

  // 4. Properties collection
  // Agent A owns Daan property (store: Daan)
  // Agent B owns Xinban property (store: Xinban)
  const propertiesCol = db.collection('properties');
  const existingProps = await propertiesCol.countDocuments();
  if (existingProps === 0) {
    const initialProperties = [
      {
        _id: new ObjectId(),
        userId: agentAId,
        storeId: storeDaanId,
        title: '大安森林公園旁・首泰景觀高樓四房',
        community: '首泰信義',
        address: '台北市大安區信義路三段 147 號',
        price: 6880,
        area: 68.5,
        building_age: 7,
        layout: '4房2廳3衛2陽台',
        floor: '12F / 18F',
        parking: 'B2 坡道平面車位 x 2',
        description: '面大安森林公園永久綠意樹海，雙主臥規劃，頂級進口廚具衛浴。捷運大安森林公園站步行僅3分鐘。',
        owner_reason: '屋主因全家遷居海外經商，誠意讓售非投機客。價格只要符合行情即可乾脆簽約。',
        createdAt: new Date(Date.now() - 5 * 86400000),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        userId: agentAId,
        storeId: storeDaanId,
        title: '和平東路師大文教區・靜巷採光三房電梯大樓',
        community: '師大極品',
        address: '台北市大安區和平東路一段 188 巷',
        price: 3980,
        area: 42.6,
        building_age: 12,
        layout: '3房2廳2衛',
        floor: '6F / 10F',
        parking: '坡道機械車位',
        description: '名校師大學區精華地段，戶數單純，住戶素質極高。邊間三面採光，通風絕佳。',
        owner_reason: '長輩退休養生欲置換郊區電梯別墅，惜售尋找愛屋有緣人。',
        createdAt: new Date(Date.now() - 3 * 86400000),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        userId: agentBId,
        storeId: storeXinbanId,
        title: '新板特區水岸首排・板橋大遠百旁景觀捷運豪邸',
        community: '橋峰',
        address: '新北市板橋區中山路一段 161 號',
        price: 3680,
        area: 52.8,
        building_age: 11,
        layout: '3房2廳2衛',
        floor: '18F / 29F',
        parking: 'B3 坡道平面車位',
        description: '新板特區核心地段，四鐵共構步行5分鐘。採光極佳高樓遠眺觀音山水岸夕陽，鋼骨SRC抗震制震宅。',
        owner_reason: '屋主子女已大學畢業離巢，夫妻打算換屋至林口大坪數退休，心態平和。',
        createdAt: new Date(Date.now() - 7 * 86400000),
        updatedAt: new Date(),
      },
    ];

    await propertiesCol.insertMany(initialProperties);
    console.log('✅ Created initial properties for Agent A (大安) and Agent B (新板)');
  }

  // 5. AI Runs collection
  const aiRunsCol = db.collection('ai_runs');
  const existingRuns = await aiRunsCol.countDocuments();
  if (existingRuns === 0) {
    const daanProp = await propertiesCol.findOne({ userId: agentAId });
    if (daanProp) {
      await aiRunsCol.insertOne({
        _id: new ObjectId(),
        userId: agentAId,
        storeId: storeDaanId,
        property_id: daanProp._id.toString(),
        property_title: daanProp.title,
        tool_code: 'property_analysis',
        tool_name: 'AI 案件深度剖析',
        model: 'gemini-3.1-flash-lite',
        input: {
          property_id: daanProp._id.toString(),
          title: daanProp.title,
          price: daanProp.price,
        },
        output: {
          basic_summary: {
            unit_price_ping: '約 100.4 萬/坪',
            summary_highlights: [
              '首泰信義社區，台北市大安區信義路三段 147 號',
              '總價 6880 萬元，權狀坪數 68.5 坪，屋齡約 7 年',
            ],
            market_positioning: '高資產置產、自住換屋及注重私密保值性之頂級客群標的',
          },
        },
        status: 'success',
        createdAt: new Date(Date.now() - 2 * 86400000),
      });
      console.log('✅ Created initial AI runs');
    }
  }

  console.log('🎉 Seeding completed successfully!');
}
