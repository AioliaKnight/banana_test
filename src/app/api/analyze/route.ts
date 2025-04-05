import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 類型定義
type ObjectType = 'cucumber' | 'banana' | 'other_rod' | null;

// 分析結果類型
type AnalysisResult = {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
  comment: string;
  truthAnalysis?: {
    truthScore: number;
    suspiciousFeatures: string[];
    adjustedLength: number;
    adjustmentFactor: number;
    funnyMessage: string;
    isSuspicious: boolean;
  };
};

// Random data generation for development
function getRandomData(type: 'cucumber' | 'banana' | 'other_rod') {
  // 擴大評分範圍，使分數更有差異化 (0.0-9.5範圍)
  const score = Math.floor(Math.random() * 95) / 10;
  
  // Random length based on type with possibility of 0 for very bad samples
  let length;
  if (Math.random() < 0.05) { // 5%機率獲得0長度（表示完全不符合標準）
    length = 0;
  } else {
    length = type === 'cucumber' 
      ? Math.floor(Math.random() * 8) + 15 // 15-22cm for cucumber
      : type === 'banana'
        ? Math.floor(Math.random() * 5) + 15 // 15-19cm for banana
        : Math.floor(Math.random() * 10) + 10; // 10-19cm for other rod objects
  }
  
  // Random thickness based on type
  const thickness = type === 'cucumber'
    ? Math.floor(Math.random() * 15 + 25) / 10 // 2.5-4.0cm for cucumber
    : type === 'banana'
      ? Math.floor(Math.random() * 10 + 30) / 10 // 3.0-4.0cm for banana
      : Math.floor(Math.random() * 20 + 20) / 10; // 2.0-3.9cm for other rod objects
  
  // 擴大新鮮度評分範圍 (0-10)，允許0分表示極差
  const freshness = Math.random() < 0.05 ? 0 : Math.floor(Math.random() * 7) + 4;

  return { type, length, thickness, freshness, score };
}

// Generate fallback comment
function generateComment(data: Record<string, unknown>): string {
  if (data.type === 'other_rod') {
    const comments = [
      `哎呀～這個不是小黃瓜也不是香蕉呢！不過沒關係，讓我來看看這個有趣的條狀物。長度約${data.length}cm，粗細約${data.thickness}cm。嗯...形狀和大小都挺特別的，讓人遐想呢！不過親愛的，下次如果想要更專業的分析，建議上傳真正的小黃瓜或香蕉哦～`,
      
      `天啊！這個不是我們平常分析的小黃瓜或香蕉呢～不過我還是很樂意為妳評估這個特別的棒狀物體。它長${data.length}cm，粗細${data.thickness}cm，嗯...尺寸還不錯哦！姐妹們可能會對這個形狀有些想法，但我不便多說。想要更準確的水果分析，下次上傳正確的水果照片哦！`,
      
      `噢！這是個有點特別的物體呢～不是我們常見的小黃瓜或香蕉，但作為一個女孩子，我覺得這個條狀物體還挺...有趣的。長度${data.length}cm，粗細${data.thickness}cm，尺寸適中。不知道妳拿它來做什麼用途呢？如果只是想測量水果，下次記得上傳真正的水果照片哦，我會更專業地分析的～`,
      
      `親愛的，這不是標準的分析對象呢！但我得說，這個棒狀物體形狀挺特別的～長度為${data.length}cm，粗細為${data.thickness}cm。讓人不禁聯想到一些...嗯，算了，不說了！女孩子之間心照不宣啦～不過說真的，如果想要認真分析水果品質，建議上傳真正的小黃瓜或香蕉照片哦！`
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }
  
  const comments = [
    `這是一個品質優良的${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}，長度為${data.length}cm，粗細適中${data.thickness}cm。從外觀來看非常新鮮，色澤飽滿，形狀勻稱。`,
    `這個${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}呈現出優秀的品質特徵，長度達到${data.length}cm，粗細均勻為${data.thickness}cm。整體看起來非常健康，結構完美，新鮮度很高。`,
    `分析結果顯示，這個${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}長度為${data.length}cm，粗細為${data.thickness}cm，比例協調。質地看起來非常好，新鮮度評分為${data.freshness}/10，屬於高品質樣本。`
  ];
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// 利用Gemini圖片分析能力直接檢測圖片內容
async function analyzeImageWithGemini(imageBase64: string): Promise<{
  objectType: ObjectType;
  multipleObjects: boolean;
  lowQuality: boolean;
  lengthEstimate: number;
  thicknessEstimate: number;
  freshnessScore: number;
  overallScore: number;
  commentText: string;
  error?: string;
}> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is missing');
    }

    // 初始化Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.4,  // 調高溫度增加創意性
        maxOutputTokens: 800,
      }
    });

    // 設置超時處理
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout')), 15000);
    });

    // 準備提示詞
    const promptText = `你是一位超級活潑、敢講敢說又專業的蔬果測量評論專家，擁有獨特的性格和風格。你對香蕉、小黃瓜和各種棒狀物的尺寸形狀有獨特品味，評論風格辛辣毒舌但又不失幽默。現在，請你像綜藝節目主持人一樣，分析這張圖片中的物體：

1. **物體類型判斷**：
   - 這是小黃瓜還是香蕉？如果都不是，但是棒狀或條狀物體，請標識為"other_rod"。
   - 如果圖片中有多個主要物體，請將multipleObjects設為true。
   - 如果圖片質量太差（太暗、太模糊等），請將lowQuality設為true。
   - 若無法確定物體類型，objectType應為null。

2. **尺寸估計與比喻**：
   - 用厘米估計物體的長度和粗細/直徑，例如18.5cm長，3.2cm粗
   - 為了增加趣味性，請想一個有趣的生活物品來比喻這個尺寸，例如：
     * 「這根香蕉長得像iPhone 15一樣長」
     * 「這小黃瓜的粗細就像一個台灣滷蛋」
     * 「這個尺寸，嗯...跟一支沐浴乳差不多粗細，應該能好好抓在手上」

3. **超級評分系統（評分標準）**：
   - 新鮮度得分(0-10分)：從「已經臭酸掉」(0分)到「剛從仙境採摘」(10分)
   - 總體品質評分(0-10分)：可以有小數點，讓評分更精確
   - 每個分數都應該配上一個逗趣的評語，例如：
     * 7.5分：「這位香蕉兄弟有點彎，但女生都說彎的比較會磨啊～」
     * 3.2分：「我看這小黃瓜有點軟趴趴的，是不是天氣太熱了，需要加強鍛鍊」
     * 9.1分：「哇塞～這根絕對是蔬果界的天菜等級！讓人忍不住想多摸幾下」

   a) **總體品質評分等級（加入趣味等級名稱）**：
      - 0-2.9分：「災難級」- 連黃瓜公主看了都想哭，這簡直是蔬果界的悲劇
      - 3-4.9分：「路人級」- 勉強能見人，但絕對不會讓妳有想炫耀的衝動
      - 5-6.9分：「普通級」- 很OK，但放在一堆裡面絕對不會特別被挑走
      - 7-8.4分：「優質級」- 市場上少見的好貨色，一眼就能認出是精品
      - 8.5-9.3分：「天菜級」- 讓人忍不住多看兩眼，值得拍照發IG炫耀的尤物
      - 9.4-10分：「傳說級」- 蔬果界的天選之子，全台灣可能只有1%能達到
   
   b) **新鮮度評分的風格化描述**：
      - 0-1分：「讓人想報警」- 已完全變質，感覺能聞到螢幕外的臭味
      - 2-3分：「急診室等級」- 食用後可能需要洗胃，不要輕易嘗試
      - 4-5分：「將就型選手」- 有點老舊但還能將就，適合煮熟後食用
      - 6-7分：「日常實用款」- 達到超市標準水平，可以安心食用
      - 8-9分：「明星等級」- 非常新鮮，值得VIP客戶選購
      - 10分：「仙境採摘」- 宛如剛剛從仙境採摘下來，達到食神級標準

   c) **特殊加分項（增加趣味性）**：
      - 「顏值加分」：外觀特別漂亮完美無瑕的+0.5分
      - 「曲線加分」：擁有恰到好處彎度的香蕉+0.3分
      - 「肌肉線條」：小黃瓜表面紋路分明+0.2分
      - 「粗細均勻」：全長粗細一致不忽粗忽細+0.4分
      - 「王者風範」：特別挺拔且形狀端正的+0.5分

   d) **特別減分項（增加趣味性）**：
      - 「萎靡不振」：蔬果看起來無精打采的-0.5分
      - 「彎曲過度」：彎到讓人懷疑人生的-0.3分
      - 「粗細失衡」：頭粗尾巴細（或相反）的-0.4分
      - 「不修邊幅」：外觀粗糙不精緻的-0.2分
      - 「身材過度苗條」：太細長不夠結實的-0.3分

4. **超級專業+超級搞笑評語**：
   - 創造自己獨特的評論風格和口吻，可以是毒舌評論家、資深鑑定師等任何角色
   - 用台灣流行語、網路用語撰寫幽默評語，讓人忍不住想分享
   - 口吻像是一位專業但不正經的評論家，敢說、敢評論、敢開玩笑
   - 長度：香蕉和小黃瓜的評語150-200字之間；other_rod類型的評語要更詳細，200-250字
   - 風格：想像你是綜藝節目主持人評論來賓，誇張、戲劇化但又不失專業
   - 加入時下流行的網路用語如「OMG」、「瘋掉」、「直接社死」、「太可了吧」等
   - 創造一個特色鮮明的句式或口頭禪，增加評論的辨識度和趣味性

   a) **標準水果評語範例**：
      - 「天哪～這根香蕉有著8.7分的驚人曲線美，我評測過上千根都沒見過這麼完美的彎度，就像是上天特意設計給女生的愛心禮物！長度剛剛好18.3cm，粗細均勻，拿在手上一定超有感。獲得『天菜級』認證，姐妹們看到這種等級請立刻買單，否則下秒就會被別人搶走！」

   b) **other_rod特別評語風格**：
      - 如果是other_rod，評語要更加活潑生動，並加入更多暗示和玩笑
      - 以「小親親」「親愛的」等稱呼開頭，讓人有遐想空間
      - 大膽使用各種隱喻和雙關語，例如「握感絕佳」「讓人忍不住想多看幾眼」等
      - 加入一些「專業」建議，如「可以考慮為它買個特製套套」「保養得宜可以使用更久」等

你必須精確按照以下JSON格式回答：
{
  "objectType": "cucumber"或"banana"或"other_rod"或null,
  "multipleObjects": true或false,
  "lowQuality": true或false,
  "lengthEstimate": 數字,
  "thicknessEstimate": 數字,
  "freshnessScore": 數字,
  "overallScore": 數字,
  "commentText": "專業評語文本"
}

請記住：你是一位有獨特風格的蔬果評論專家！創造自己的風格和稱呼，不要拘泥於固定格式。請讓評語既專業又讓人忍不住笑出來，你的目標是讓用戶想把評語截圖分享給朋友！每個字段都必須存在，數值字段必須是數字而非字符串。`;

    // 設定內容部分，包含文本和圖片
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ];

    try {
      // 競速處理API請求
      const geminiResponse = await Promise.race([
        model.generateContent([promptText, ...imageParts]),
        timeoutPromise
      ]);
      
      const responseText = geminiResponse.response.text();
      
      try {
        // 嘗試從文本中提取JSON部分
        let jsonStr = responseText;
        
        // 如果回應包含多餘內容，嘗試找出並提取JSON部分
        if (responseText.includes('{') && responseText.includes('}')) {
          const startIndex = responseText.indexOf('{');
          const endIndex = responseText.lastIndexOf('}') + 1;
          if (startIndex >= 0 && endIndex > startIndex) {
            jsonStr = responseText.substring(startIndex, endIndex);
          }
        }
        
        // 解析JSON回應
        const parsedResponse = JSON.parse(jsonStr);
        
        // 確保需要的所有屬性都存在，並轉換類型確保符合預期
        return {
          objectType: parsedResponse.objectType || null,
          multipleObjects: Boolean(parsedResponse.multipleObjects),
          lowQuality: Boolean(parsedResponse.lowQuality),
          lengthEstimate: Number(parsedResponse.lengthEstimate) || 0,
          thicknessEstimate: Number(parsedResponse.thicknessEstimate) || 0,
          freshnessScore: Number(parsedResponse.freshnessScore) || 0,
          overallScore: Number(parsedResponse.overallScore) || 0,
          commentText: parsedResponse.commentText || "分析未能生成完整評語。"
        };
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.log('Raw response:', responseText);
        // 嘗試手動提取部分信息
        const extractedInfo = {
          objectType: null as ObjectType,
          multipleObjects: false,
          lowQuality: false,
          lengthEstimate: 0,
          thicknessEstimate: 0,
          freshnessScore: 0,
          overallScore: 0,
          commentText: ""
        };
        
        // 嘗試從文本中提取關鍵信息
        if (responseText.toLowerCase().includes('cucumber') || responseText.toLowerCase().includes('小黃瓜')) {
          extractedInfo.objectType = 'cucumber';
        } else if (responseText.toLowerCase().includes('banana') || responseText.toLowerCase().includes('香蕉')) {
          extractedInfo.objectType = 'banana';
        } else if (responseText.toLowerCase().includes('other_rod') || responseText.toLowerCase().includes('棒狀物')) {
          extractedInfo.objectType = 'other_rod';
        }
        
        // 嘗試提取評語
        if (responseText.length > 30) {
          extractedInfo.commentText = "AI評語解析錯誤，無法提供完整分析。";
        }
        
        // 如果無法解析，回傳部分信息並標記解析錯誤
        console.log('Extracted partial info:', extractedInfo);
        return {
          ...extractedInfo,
          error: 'JSON解析錯誤，API返回的格式不符合預期'
        };
      }
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      throw geminiError;
    }
  } catch (error) {
    console.error('Error in Gemini analysis:', error);
    return {
      objectType: null,
      multipleObjects: false,
      lowQuality: false,
      lengthEstimate: 0,
      thicknessEstimate: 0,
      freshnessScore: 0,
      overallScore: 0,
      commentText: "",
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}

// 將此函數整合到現有的分析流程中
function detectTruthfulness(
  objectType: ObjectType, 
  measuredLength: number,
  measuredThickness: number,
  enableDetection: boolean = true
): {
  isSuspicious: boolean;
  truthScore: number;
  adjustedLength: number;
  adjustmentFactor: number;
  suspiciousFeatures: string[];
  funnyMessage: string;
} {
  // 如果不啟用檢測，返回默認值（高真實度）
  if (!enableDetection) {
    return {
      isSuspicious: false,
      truthScore: 95,
      adjustedLength: measuredLength,
      adjustmentFactor: 1,
      suspiciousFeatures: [],
      funnyMessage: "照片真實度檢測已關閉。"
    };
  }
  
  // 幽默回應庫
  const funnyResponses = [
    "這根蔬果看起來像是在「特定角度」拍攝的呢！畫面構圖很巧妙～",
    "哎呀，AI偵測到「特殊的拍攝技巧」，這角度和距離很...有創意！",
    "AI測謊儀發現此照片與標準蔬果比例有些「創造性差異」，您是攝影師嗎？",
    "有趣！測謊儀偵測到此蔬果似乎借助了「光學魔法」顯得特別雄偉！",
    "根據我們的「蕉學資料庫」，這根的尺寸宣稱有點像是被強化過。您是園藝專家？",
    "您這個「獨特視角」拍攝的蔬果，讓AI測謊儀都忍不住發出了疑惑的笑聲！",
    "測謊儀提醒：過度「慷慨」的測量值可能導致女性用戶嚴重失望，建議適度謙虛～",
    "距離真是個奇妙的東西！靠近拍攝總是能讓事物看起來比實際更...壯觀！"
  ];
  
  // 可疑特徵列表
  const suspiciousFeatures = [
    "不自然的透視效果",
    "可疑的光線角度",
    "異常的比例關係",
    "與參考物尺寸不協調",
    "拍攝距離過近",
    "可能使用了廣角鏡",
    "影像有輕微扭曲",
    "邊緣有平滑處理痕跡",
    "光影與尺寸不成比例",
    "疑似進行了「戰略性裁剪」"
  ];
  
  // 根據對象類型決定平均尺寸範圍
  const averageLength = objectType === 'cucumber' 
    ? 17.5 // 小黃瓜平均長度
    : objectType === 'banana' 
      ? 18 // 香蕉平均長度
      : 12.5; // other_rod (台灣男性平均)
      
  // 計算合理的長度/粗細比率
  const reasonableRatio = objectType === 'cucumber' 
    ? 5.5 // 小黃瓜長度/粗細平均比率
    : objectType === 'banana' 
      ? 5 // 香蕉長度/粗細平均比率
      : 4.5; // other_rod平均比率
  
  const actualRatio = measuredLength / measuredThickness;
  
  // 可疑因素1：長度明顯超過平均值
  const lengthSuspicion = measuredLength > (averageLength * 1.3) ? 
    (measuredLength - averageLength * 1.3) / (averageLength * 0.7) * 100 : 0;
  
  // 可疑因素2：長度/粗細比率異常
  const ratioSuspicion = Math.abs(actualRatio - reasonableRatio) / reasonableRatio * 100;
  
  // 隨機添加一些浮動，使結果更自然
  const randomFactor = (Math.random() * 20) - 10; // -10到10之間的隨機數
  
  // 綜合可疑度計算
  let totalSuspicion = (lengthSuspicion * 0.6) + (ratioSuspicion * 0.4) + randomFactor;
  totalSuspicion = Math.min(Math.max(totalSuspicion, 0), 100); // 確保在0-100範圍內
  
  // 真實度得分 (越高越真實)
  const truthScore = Math.max(0, Math.min(100, 100 - totalSuspicion));
  
  // 是否判定為可疑
  const isSuspicious = truthScore < 75 || 
                      (objectType === 'other_rod' && measuredLength > 20) ||
                      (measuredLength > averageLength * 1.5);
  
  // 選擇幽默回應
  const funnyMessage = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
  
  // 選擇可疑特徵
  const selectedSuspiciousFeatures: string[] = [];
  if (isSuspicious) {
    // 隨機選擇2-4個可疑特徵
    const numFeatures = Math.floor(Math.random() * 3) + 2;
    const shuffledFeatures = [...suspiciousFeatures].sort(() => 0.5 - Math.random());
    selectedSuspiciousFeatures.push(...shuffledFeatures.slice(0, numFeatures));
  }
  
  // 計算調整因子 (真實度越低，調整幅度越大)
  const maxAdjustment = 0.3; // 最大調整30%
  const adjustmentFactor = isSuspicious ? 
    Math.max(0.7, 1 - (maxAdjustment * (1 - truthScore / 100))) : 1;
  
  // 計算調整後的長度
  const adjustedLength = Math.round(measuredLength * adjustmentFactor * 10) / 10;
  
  return {
    isSuspicious,
    truthScore: Math.round(truthScore),
    adjustedLength,
    adjustmentFactor,
    suspiciousFeatures: selectedSuspiciousFeatures,
    funnyMessage
  };
}

// 主要處理函數
export async function POST(req: NextRequest) {
  // 設置跨域頭
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 處理預檢請求
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  try {
    // 解析上傳的圖片
    const formData = await req.formData();
    const imageFile = formData.get('image') as unknown as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: { code: 'GENERAL_ERROR', message: '請上傳圖片檔案' } },
        { status: 400, headers }
      );
    }

    // 檢查檔案大小限制 (10 MB)
    const maxSizeInBytes = 10 * 1024 * 1024; 
    if (imageFile.size > maxSizeInBytes) {
      return NextResponse.json(
        { error: { code: 'GENERAL_ERROR', message: '圖片檔案大小超過限制 (最大10MB)' } },
        { status: 400, headers }
      );
    }

    // 轉換圖片為 base64 格式
    const imageBytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(imageBytes);
    const base64Image = buffer.toString('base64');

    // 使用Gemini進行圖片分析
    const analysisResult = await analyzeImageWithGemini(base64Image);

    // 檢查是否存在明確的錯誤
    if (analysisResult.error) {
      return NextResponse.json(
        { error: { code: 'API_ERROR', message: analysisResult.error } },
        { status: 500, headers }
      );
    }

    // 圖片中存在多個物體
    if (analysisResult.multipleObjects) {
      return NextResponse.json(
        { error: { code: 'MULTIPLE_OBJECTS', message: '圖片中包含多個物體，請上傳一個小黃瓜或香蕉的清晰照片' } },
        { status: 400, headers }
      );
    }

    // 圖片質量過低 
    if (analysisResult.lowQuality) {
      return NextResponse.json(
        { error: { code: 'LOW_QUALITY', message: '圖片質量不佳，請上傳更清晰的照片' } },
        { status: 400, headers }
      );
    }

    // 未能識別有效物體
    if (!analysisResult.objectType) {
      return NextResponse.json(
        { error: { code: 'INVALID_OBJECT', message: '無法辨識有效的小黃瓜或香蕉，請確認上傳的圖片' } },
        { status: 400, headers }
      );
    }

    // 獲取是否啟用真實度檢測
    const enableTruthDetection = formData.get('enableTruthDetection') === 'true';
    
    // 開發環境下的模擬數據生成
    let data: AnalysisResult;
    let useRandomData = false;

    if (process.env.NODE_ENV === 'development' && process.env.USE_RANDOM_DATA === 'true') {
      useRandomData = true;
      data = { ...getRandomData(analysisResult.objectType as 'cucumber' | 'banana' | 'other_rod'), comment: "" };
    } else {
      // 使用真實AI分析數據，但是確保分數在合理範圍內
      // 限制分數在0.0-9.5之間
      const calculatedScore = Math.max(0.0, Math.min(9.5, analysisResult.overallScore));
      
      // 新鮮度評分限制在0-10的整數範圍
      const freshness = Math.max(0, Math.min(10, Math.round(analysisResult.freshnessScore)));
      
      // 根據物體類型調整長度和粗細估計的合理性
      let adjustedLength = analysisResult.lengthEstimate;
      let adjustedThickness = analysisResult.thicknessEstimate;

      // 小黃瓜長度通常在10-30cm之間
      if (analysisResult.objectType === 'cucumber') {
        adjustedLength = Math.max(0, Math.min(30, adjustedLength));
        adjustedThickness = Math.max(0, Math.min(6, adjustedThickness)); 
      } 
      // 香蕉長度通常在10-25cm之間
      else if (analysisResult.objectType === 'banana') {
        adjustedLength = Math.max(0, Math.min(25, adjustedLength));
        adjustedThickness = Math.max(0, Math.min(5, adjustedThickness));
      }
      // 其他棒狀物體 - 可能涉及男性特徵時的特殊處理
      else {
        // 台灣男性平均水平參考標準（可能有誇張）
        const taiwanMaleAvgLength = 12.5; // 台灣男性平均長度（參考值）
        const isLikelyMaleBodyPart = 
          adjustedLength >= 8 && 
          adjustedLength <= 30 && 
          adjustedThickness >= 2.5;
        
        // 如果可能是男性特徵，則使用台灣平均值相關的評分邏輯
        if (isLikelyMaleBodyPart) {
          // 超過台灣平均+50%以上的長度可能不符合現實或誇大
          if (adjustedLength > taiwanMaleAvgLength * 1.5 && adjustedLength <= 30) {
            // 對於可能是誇大的長度給予警示或評分調整
            console.log('Warning: Detected possible exaggerated dimensions');
          }
          // 非常超出常態的長度，可能是誇大或其他物體
          else if (adjustedLength > 30) {
            adjustedLength = 30; // 限制最大長度
          }
        } else {
          // 如果不像人體特徵，則使用較寬鬆的範圍限制
          adjustedLength = Math.max(0, Math.min(40, adjustedLength));
          adjustedThickness = Math.max(0, Math.min(8, adjustedThickness));
        }
      }
      
      // 最終評分計算 - 考慮不同因素的加權
      // 1. 基礎分數
      let finalScore = calculatedScore;
      
      // 2. 合理的尺寸應該有獎勵，不合理的尺寸應該降分
      const isReasonableSize = isReasonableDimension(adjustedLength, adjustedThickness, analysisResult.objectType);
      finalScore += isReasonableSize ? 0.2 : -0.5;
      
      // 3. 新鮮度對總分有影響
      const freshnessImpact = (freshness - 5) * 0.1; // 新鮮度每高於5分加0.1分，低於則減分
      finalScore += freshnessImpact;
      
      // 4. 對於other_rod類型，如果是男性特徵，根據台灣平均長度進行評分調整
      if (analysisResult.objectType === 'other_rod') {
        const taiwanMaleAvgLength = 12.5; // 台灣男性平均長度（參考值）
        if (adjustedLength > 0) {
          // 計算與平均值的差異，作為評分調整依據
          const lengthDiffRatio = adjustedLength / taiwanMaleAvgLength;
          
          // 接近平均值±20%的給予正面評價
          if (lengthDiffRatio >= 0.8 && lengthDiffRatio <= 1.2) {
            finalScore += 0.3; // 符合正常範圍加分
          }
          // 過小或稍大都有輕微減分
          else if (lengthDiffRatio < 0.8 || lengthDiffRatio > 1.5) {
            finalScore -= 0.2; // 不太符合台灣平均水平輕微減分
          }
          // 特別大的（但不是誇張的）給予特別評價
          else if (lengthDiffRatio > 1.2 && lengthDiffRatio <= 1.5) {
            finalScore += 0.1; // 稍微高於平均但不誇張
          }
        }
      }
      
      // 確保最終分數在0.0-9.5的範圍內
      finalScore = parseFloat((Math.max(0.0, Math.min(9.5, finalScore))).toFixed(1));
      
      data = {
        type: analysisResult.objectType,
        length: Math.round(adjustedLength * 10) / 10, // 保留一位小數
        thickness: Math.round(adjustedThickness * 10) / 10,
        freshness: freshness,
        score: finalScore,
        comment: analysisResult.commentText
      };
    }

    // 合併數據，確保有評語
    if (useRandomData) {
      data = {
        ...data,
        comment: analysisResult.commentText || generateComment(data)
      };
    }

    // 添加真實度分析
    const truthAnalysis = detectTruthfulness(
      data.type, 
      data.length, 
      data.thickness, 
      enableTruthDetection
    );
    
    // 創建最終結果
    const result: AnalysisResult = {
      ...data,
      comment: data.comment,
      truthAnalysis: enableTruthDetection ? truthAnalysis : undefined
    };

    // 返回最終分析結果
    return NextResponse.json(result, { status: 200, headers });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: { code: 'GENERAL_ERROR', message: '分析過程中發生錯誤: ' + ((error instanceof Error) ? error.message : '未知錯誤') } },
      { status: 500, headers }
    );
  }
}

// 判斷尺寸是否在合理範圍
function isReasonableDimension(length: number, thickness: number, type: ObjectType): boolean {
  if (type === 'cucumber') {
    // 小黃瓜理想尺寸約15-22cm長，2.5-4cm粗
    return (length >= 15 && length <= 22) && (thickness >= 2.5 && thickness <= 4);
  } 
  else if (type === 'banana') {
    // 香蕉理想尺寸約15-20cm長，3-4cm粗
    return (length >= 15 && length <= 20) && (thickness >= 3 && thickness <= 4);
  }
  // other_rod的合理性評估
  else if (type === 'other_rod') {
    // 判斷是否符合男性特徵的尺寸範圍
    const isMaleFeature = length >= 8 && length <= 30 && thickness >= 2.5;
    
    if (isMaleFeature) {
      // 台灣男性平均長度參考值
      const taiwanMaleAvgLength = 12.5;
      
      // 正常範圍: 平均值的80%-150%之間
      const minReasonableLength = taiwanMaleAvgLength * 0.8;  // 約10cm
      const maxReasonableLength = taiwanMaleAvgLength * 1.5;  // 約18.75cm
      
      // 考慮合理的厚度範圍
      const isReasonableThickness = thickness >= 2.5 && thickness <= 5;
      
      // 長度在合理範圍內，且厚度也合理
      return (length >= minReasonableLength && length <= maxReasonableLength) && isReasonableThickness;
    }
    
    // 如果不是男性特徵，使用寬鬆標準
    return length > 0 && thickness > 0;
  }
  
  // 未識別類型
  return false;
} 