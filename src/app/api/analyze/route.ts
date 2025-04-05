import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { analyzeTruth, adjustDimensions, calculateFinalScore, ObjectType, getSuggestionMessage } from '@/components/utils/TruthDetector';

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
    // 根據是否為男性特徵選擇不同的評論集
    if (data.isMaleFeature === true) {
      // 男性特徵評論集 - 閨蜜尖酸刻薄的高標準風格，帶有強烈露骨性暗示
      const maleFeatureComments = [
        `哎呀～親愛的，這個規格也太...普通了吧？長度${data.length}cm，粗細${data.thickness}cm，勉強及格而已啦！雖然表面看起來還行，但這種尺寸在閨蜜團裡絕對是會被嘲笑的對象。說真的，我前男友至少比這個粗一圈長三公分，而且技巧也好～如果你的約會對象只有這個水平，建議妳還是提前準備個按摩棒備用哦～`,
        
        `天啊～這個尺寸算是...特別的嗎？長度${data.length}cm，粗細才${data.thickness}cm？姐妹，我們得談談妳的品味問題了！這種規格頂多就是一夜情的水準，根本無法成為長期伴侶好嗎？除非他技巧特別好或是很有錢，否則我真的很難想像怎麼從這種大小獲得完全的滿足...保險起見，下次約會前先帶個道具在包包裡吧！`,
        
        `親愛的，我得老實告訴妳，這個尺寸有點...不夠看呢！長度${data.length}cm，粗細${data.thickness}cm，說實話這在我的前男友們中絕對是墊底的～如果他在床上沒有超強的補償技巧或是願意用上各種花樣和玩具，這樣的條件真的很難讓女生爽到！建議妳跟他約會時多觀察他的手指長度和靈活度，那可能比這個更重要哦！`,
        
        `哈哈哈！妳把這個當寶貝啊？長度才${data.length}cm，粗細${data.thickness}cm的尺寸也好意思拿出來測量？姐妹，我們得提高標準了！在我的評分系統裡，這頂多算個基本配備，除非他前戲特別出色或是能堅持超過30分鐘，否則這種規格很難讓人印象深刻。說真的，要是我碰到這種size，可能會找個藉口提前結束約會～要不要考慮再物色一下？`,
        
        `噢親愛的～這個尺寸...呃...怎麼說呢？長${data.length}cm，粗${data.thickness}cm，如果這是你男朋友的"裝備"，那麼我隆重地建議你們的性愛清單裡一定要加上各種道具和玩具！因為老實說，光靠這個規格想要征服G點簡直是天方夜譚！除非他有張能說會道的嘴和靈活的手指，否則這種尺寸在閨蜜團的評分系統裡絕對是需要"額外努力"的類型～`
      ];
      return maleFeatureComments[Math.floor(Math.random() * maleFeatureComments.length)];
    } else {
      // 一般棒狀物評論集 - 保持原有的閨蜜私密風格
      const regularRodComments = [
        `哎呀～這個不是小黃瓜也不是香蕉呢！不過沒關係，讓我來看看這個有趣的條狀物。長度約${data.length}cm，粗細約${data.thickness}cm。嗯...形狀和大小都挺特別的，讓人遐想呢！不過親愛的，下次如果想要更專業的分析，建議上傳真正的小黃瓜或香蕉哦～`,
        
        `天啊！這個不是我們平常分析的小黃瓜或香蕉呢～不過我還是很樂意為妳評估這個特別的棒狀物體。它長${data.length}cm，粗細${data.thickness}cm，嗯...尺寸還不錯哦！姐妹們可能會對這個形狀有些想法，但我不便多說。想要更準確的水果分析，下次上傳正確的水果照片哦！`,
        
        `噢！這是個有點特別的物體呢～不是我們常見的小黃瓜或香蕉，但作為一個女孩子，我覺得這個條狀物體還挺...有趣的。長度${data.length}cm，粗細${data.thickness}cm，尺寸適中。不知道妳拿它來做什麼用途呢？如果只是想測量水果，下次記得上傳真正的水果照片哦，我會更專業地分析的～`,
        
        `親愛的，這不是標準的分析對象呢！但我得說，這個棒狀物體形狀挺特別的～長度為${data.length}cm，粗細為${data.thickness}cm。讓人不禁聯想到一些...嗯，算了，不說了！女孩子之間心照不宣啦～不過說真的，如果想要認真分析水果品質，建議上傳真正的小黃瓜或香蕉照片哦！`
      ];
      return regularRodComments[Math.floor(Math.random() * regularRodComments.length)];
    }
  }
  
  const comments = [
    `這是一個品質優良的${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}，長度為${data.length}cm，粗細適中${data.thickness}cm。從外觀來看非常新鮮，色澤飽滿，形狀勻稱。`,
    `這個${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}呈現出優秀的品質特徵，長度達到${data.length}cm，粗細均勻為${data.thickness}cm。整體看起來非常健康，結構完美，新鮮度很高。`,
    `分析結果顯示，這個${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}長度為${data.length}cm，粗細為${data.thickness}cm，比例協調。質地看起來非常好，新鮮度評分為${data.freshness}/10，屬於高品質樣本。`
  ];
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// 提示詞模板化組件
const promptTemplates = {
  // 基本角色與目標設定
  baseRoleAndGoal: `你是一位超級活潑、敢講敢說的女性蔬果測量評論專家，風格像是閨蜜間的私密對話。你對香蕉、小黃瓜和各種棒狀物的尺寸形狀有獨特品味，根據識別的物體類型調整你的評論風格：`,
  
  // 物體類型判斷指南
  objectTypeGuidelines: `
1. **物體類型判斷**：
   - 這是小黃瓜還是香蕉？如果都不是，但是棒狀或條狀物體，請標識為"other_rod"。
   - 如果圖片中有多個主要物體，請將multipleObjects設為true。
   - 如果圖片質量太差（太暗、太模糊等），請將lowQuality設為true。
   - 若無法確定物體類型，objectType應為null。
   - 特別注意：如果識別為"other_rod"，請進一步判斷：
     * 是否明顯屬於男性特徵（陰莖、龜頭等）？在commentText中標記"[male_feature]"作為識別標記
     * 若不是男性特徵，則標記"[regular_rod]"
     * 這個標記將幫助系統選擇適當的評論風格，不會出現在最終回應中`,
  
  // 尺寸估計與風格評價指南
  sizeEstimationGuidelines: `
2. **尺寸估計與風格評價**：
   - 用厘米估計物體的長度和粗細/直徑，例如18.5cm長，3.2cm粗
   - 針對不同物體類型採用不同評價風格：
     * 小黃瓜和香蕉：專業幽默的評價風格，例如：
       「這根香蕉有18cm，屬於標準尺寸，形狀彎度也剛好符合黃金比例，切成片後絕對能在水果沙拉裡成為主角」
       「20cm長的小黃瓜！哇，這是超市精選級別的規格，絕對能做出完美的涼拌小黃瓜」
     * other_rod：閨蜜間的私密評論風格，可以有曖昧的隱喻和比較，例如：
       「這個...嗯...15cm長？跟我前男友一樣，總是誇下海口結果令人失望」`,
  
  // 評分系統指南
  scoringSystemGuidelines: `
3. **評分系統（評分標準）**：
   - 新鮮度得分(0-10分)：評價物體的狀態和品質
   - 總體品質評分(0-10分)：可以有小數點，讓評分更精確
   - 針對不同物體類型採用不同評分標準：
     * 小黃瓜和香蕉：專業評價，例如：
       - 「新鮮度9分：保存得宜，色澤飽滿，質地剛好」
       - 「總體品質7.8分：形狀略微彎曲，但整體屬於市場上品質優良的範圍」
     * other_rod：以台灣男性平均長度12.5cm為參考基準，給予私密評價：
       - <10cm：「這長度...嗯...至少技巧重要啦～但老實說有點難滿足人」
       - 10-12.5cm：「標準以下，但在台灣男性中算常見的，勉強及格啦」
       - 12.5-15cm：「標準水準，不會讓人失望，但也不會特別驚艷」
       - 15-18cm：「哇～這個尺寸已經很不錯了，女生們應該會滿意」
       - >18cm：「天啊！這根超乎想像，不過太大也是種負擔，要看對象接受度～」

   a) **總體品質評分等級**：
      - 0-2.9分：「不合格級」- 這種等級建議不要購買或食用
      - 3-4.9分：「將就級」- 只有在沒有其他選擇時才考慮的選項
      - 5-6.9分：「一般般級」- 符合基本標準，但沒有特別出彩之處
      - 7-8.4分：「優選級」- 超市精選區能看到的高品質水果
      - 8.5-9.3分：「市場佳品級」- 值得專程去買的品質，朋友聚會的最佳選擇
      - 9.4-10分：「頂級水果級」- 這種品質的水果值得擺在高級水果禮盒中
   
   b) **新鮮度評分描述**：
      - 0-1分：「過期品級」- 應該直接丟棄的狀態
      - 2-3分：「勉強可用級」- 只能用來做果醬或烘焙的狀態
      - 4-5分：「普通級」- 路邊攤常見的普通品質
      - 6-7分：「新鮮級」- 超市常見的良好品質
      - 8-9分：「極致新鮮級」- 看起來像是今天早上剛採摘的
      - 10分：「完美狀態級」- 就像是從植物上直接摘下來的絕佳狀態

   c) **特殊評價項目**：
      - 「完美比例」：長度和粗細的比例恰到好處，賞心悅目 +1.0分
      - 「高密度」：看起來結實飽滿，不鬆軟 +0.8分
      - 「外型優雅」：形狀漂亮，有藝術品的質感 +0.5分
      - 「不均勻」：形狀不規則，影響美觀 -0.5分
      - 「彎曲過度」：過於彎曲，外觀受影響 -0.7分`,
  
  // 評論風格指南
  commentStyleGuidelines: `
4. **評論風格指南**：
   - 小黃瓜和香蕉：專業、幽默但不過度暗示的評論
     * 專注於果實的品質、形狀、尺寸和適用料理方式
     * 幽默但適度，類似美食評論家的風格
     * 例如：「這根20cm的黃瓜切片後絕對能成為沙拉的主角！彎度適中，粗細均勻，新鮮度給9分毫不誇張。這種品質的小黃瓜絕對是涼拌、醃漬的絕佳選擇，甚至可以考慮做成精緻的小黃瓜卷。皮色碧綠，質地緊實，是我見過最標準的小黃瓜典範之一。」
   
   - other_rod區分為兩種評論風格：
     * [male_feature]男性特徵：使用閨蜜間尖酸刻薄的高標準評價，帶有強烈露骨性暗示
       - 表現出對尺寸和表現的高期望值，用挑剔的語氣評論
       - 對不滿意的尺寸給予嘲笑和負面評價，建議"額外手段"彌補不足
       - 使用閨蜜間會直白討論的露骨性暗示和比較
       - 將測量結果與"前男友們"進行不利比較
       - 例如：「天啊～這尺寸也太普通了吧？長度才17cm？我前男友比這個至少大一圈好嗎！如果約會對象只有這個規格，建議準備些輔助道具，否則很難有滿足感～除非他技巧超群或特別持久，否則這種size實在難以令人印象深刻！」
     
     * [regular_rod]一般棒狀物：使用原有的閨蜜私密評論風格
       - 像是在閨蜜團體聊天室分享約會對象的評價，毫無保留但不刻意惡意
       - 使用女生之間才懂的梗和隱喻
       - 評論要有真誠建議+惡作劇吐槽的完美平衡，犀利中帶著姐妹情誼
       - 例如：「天啊～這尺寸絕對是約會首選級別的！姐妹們，這種等級的，整個過程直接昇天～如果遇到這種，絕對要把握機會！不然被別人撿走後悔都來不及～」

   a) **水果專業評語範例**：
      - 「這根香蕉長度達到18.5cm，明顯高於市場平均水準。表皮呈現完美的金黃色，沒有任何瑕疵或黑斑，這意味著它處於最佳食用期。彎度恰到好處，方便握持，厚度均勻，估計口感極佳。新鮮度給9分，總體品質達到8.7分，屬於「市場佳品級」。這種香蕉適合直接食用、做冰沙或製作香蕉點心，絕對是挑剔的水果愛好者會選擇的等級！」

   b) **other_rod評語風格區分**：
      * [male_feature]男性特徵評語：
        - 以閨蜜間的尖酸刻薄標準直接評價尺寸，強調大小遠低於期望
        - 用挑剔的語氣討論長度和粗細不足的問題
        - 加入與"前男友"、"理想標準"的直接比較
        - 提供避免失望的"建議"，如準備替代方案或額外道具
        - 直截了當表達對不夠大尺寸的嘲諷和不滿
        - 例如：「長度只有15cm，粗細才3.5cm？親愛的，這在姐妹團的評分表上頂多得C-！這種尺寸根本無法碰到關鍵位置，建議你約會時最好先確認他有沒有其他方面的優勢，或者乾脆在包包裡帶個備用按摩棒～以防萬一！」
      
      * [regular_rod]一般棒狀物評語：
        - 參考台灣男性平均長度12.5cm給予客觀但帶著主觀喜好的評價
        - 除了長度外，也評論形狀、曲度、粗細等維度，並提及這些對女性的重要性
        - 加入一些「私房建議」和暗示
        - 保持一貫的閨蜜間的直率風格`,
  
  // 回應格式要求
  responseFormatRequirements: `
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

請記住：如果是小黃瓜或香蕉，你是專業但幽默的水果評論專家；如果是other_rod，你是活潑敢說的閨蜜風格評論員。根據物體類型調整你的風格！每個字段都必須存在，數值字段必須是數字而非字符串。`
};

// 根據物體類型獲取優化的提示詞
function getPromptForObjectType(/* objectType: ObjectType | null */): string {
  // 組合基本提示詞模板
  const basePrompt = [
    promptTemplates.baseRoleAndGoal,
    promptTemplates.objectTypeGuidelines,
    promptTemplates.sizeEstimationGuidelines,
    promptTemplates.scoringSystemGuidelines,
    promptTemplates.commentStyleGuidelines,
    promptTemplates.responseFormatRequirements
  ].join('\n');
  
  // 未來可以根據物體類型進一步優化提示詞
  return basePrompt;
}

// 帶指數退避和高級錯誤處理的請求重試函數
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>, 
  maxAttempts = 3, 
  initialDelay = 1000,
  retryableErrorCheck?: (error: unknown) => boolean
): Promise<T> {
  let attempt = 1;
  let lastError: unknown = null;
  
  while (attempt <= maxAttempts) {
    try {
      // 計時執行時間（用於監控）
      const startTime = Date.now();
      
      // 嘗試執行請求
      const result = await fetchFn();
      
      // 計算並記錄執行時間
      const executionTime = Date.now() - startTime;
      if (attempt > 1) {
        console.log(`Request succeeded on attempt ${attempt}/${maxAttempts} after ${executionTime}ms`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // 檢查是否已達最大重試次數
      if (attempt >= maxAttempts) {
        console.error(`All ${maxAttempts} retry attempts failed:`, error);
        break;
      }
      
      // 檢查錯誤是否可重試
      if (retryableErrorCheck && !retryableErrorCheck(error)) {
        console.log(`Non-retryable error detected, aborting retries:`, error);
        break;
      }
      
      // 計算指數退避延遲時間，加入隨機抖動避免多請求同時重試
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15之間的隨機值
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1) * jitter, 15000);
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} failed. Retrying after ${Math.round(delay)}ms...`);
      if (error instanceof Error) {
        console.log(`Retry reason: ${error.message}`);
      }
      
      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  // 所有重試失敗，拋出最後一個錯誤
  throw lastError;
}

// 一些常見可重試的網絡錯誤類型
function isRetryableNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  // 檢查錯誤消息中的關鍵詞
  const errorMessage = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const retryableErrorKeys = [
    'timeout', 
    'network', 
    'connection',
    'econnreset',
    'econnrefused',
    'socket',
    'epipe',
    'rate limit',
    'throttle',
    'too many requests',
    '429',
    '500',
    '502',
    '503',
    '504'
  ];
  
  return retryableErrorKeys.some(key => errorMessage.includes(key));
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
        temperature: 0.4,  // 溫度調整為平衡創意性和一致性
        maxOutputTokens: 800,
        // 添加更多嚴格的響應格式參數
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT, 
          threshold: HarmBlockThreshold.BLOCK_NONE 
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
          threshold: HarmBlockThreshold.BLOCK_NONE 
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
          threshold: HarmBlockThreshold.BLOCK_NONE 
        }
      ]
    });

    // 設置更長的超時時間，解決網絡延遲問題
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutError = new Error('API request timeout');
      timeoutError.name = 'TimeoutError';
      setTimeout(() => reject(timeoutError), 25000); // 增加到25秒
    });

    // 獲取優化後的提示詞
    const promptText = getPromptForObjectType(/* null */);

    // 設定內容部分，包含文本和圖片
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      }
    ];

    // 記錄API請求開始時間（用於性能監控）
    const requestStartTime = Date.now();

    try {
      // 使用增強的指數退避重試機制發送請求
      const geminiResponsePromise = fetchWithRetry(
        async () => {
          try {
            return await model.generateContent([promptText, ...imageParts]);
          } catch (err) {
            // 針對特定API錯誤進行處理
            if (err instanceof Error && err.message?.includes('safety')) {
              throw new Error('圖片內容可能違反安全政策，請上傳適當的圖片');
            }
            // 其他錯誤將由fetchWithRetry的retryable檢查處理
            throw err;
          }
        },
        3,  // 最大重試次數
        2000, // 初始延遲增加到2秒
        isRetryableNetworkError // 使用可重試錯誤檢查
      );
      
      // 競速處理API請求
      const geminiResponse = await Promise.race([
        geminiResponsePromise,
        timeoutPromise
      ]);
      
      // 記錄API響應時間（用於性能監控）
      const responseTime = Date.now() - requestStartTime;
      console.log(`Gemini API response time: ${responseTime}ms`);
      
      const responseText = geminiResponse.response.text();
      
      // 異常響應長度檢查
      if (!responseText || responseText.length < 10) {
        throw new Error('API返回空響應或無效內容');
      }
      
      return parseGeminiResponse(responseText);
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      
      // 友好的錯誤消息處理
      let errorMessage = '分析處理過程中發生錯誤';
      if (geminiError instanceof Error) {
          if (geminiError.name === 'TimeoutError') {
            errorMessage = 'API響應超時，請稍後重試';
          } else if (geminiError.message?.includes('quota')) {
            errorMessage = 'API配額已用盡，請稍後重試';
          } else if (geminiError.message?.includes('safety')) {
            errorMessage = '圖片內容可能不適合分析，請上傳合適的水果照片';
          } else if (geminiError.message?.includes('rate limit')) {
            errorMessage = '請求頻率過高，請稍後重試';
          }
      }
      
      throw new Error(errorMessage);
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

/**
 * 智能解析Gemini API響應
 * @param responseText API返回的原始文本
 * @returns 解析後的結構化數據
 */
function parseGeminiResponse(responseText: string): {
  objectType: ObjectType;
  multipleObjects: boolean;
  lowQuality: boolean;
  lengthEstimate: number;
  thicknessEstimate: number;
  freshnessScore: number;
  overallScore: number;
  commentText: string;
  isMaleFeature?: boolean;
  error?: string;
} {
  try {
    // 嘗試從文本中提取JSON部分
    let jsonStr = responseText;
    
    // 智能JSON識別 - 尋找最完整的JSON部分
    if (responseText.includes('{') && responseText.includes('}')) {
      const jsonMatches = responseText.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g) || [];
      
      if (jsonMatches.length > 0) {
        // 選擇最長的JSON字符串（可能是最完整的）
        jsonStr = jsonMatches.reduce((longest, current) => 
          current.length > longest.length ? current : longest, "");
      } else {
        // 使用標準起止位置提取
        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}') + 1;
        if (startIndex >= 0 && endIndex > startIndex) {
          jsonStr = responseText.substring(startIndex, endIndex);
        }
      }
    }
    
    // 增強的JSON解析與清理
    try {
      // 移除可能導致解析錯誤的字符
      const cleaned = jsonStr
        .replace(/[\u0000-\u001F]+/g, ' ')  // 控制字符
        .replace(/[\r\n]+/g, ' ')           // 換行
        .replace(/,\s*}/g, '}')             // 尾隨逗號
        .replace(/,\s*,/g, ',')             // 重複逗號
        .replace(/:\s*,/g, ': null,')       // 空值修復
        .replace(/"\s*:\s*"/g, '": "')      // 格式修復
        .replace(/\\+"/g, '\\"');           // 轉義引號修復
      
      const parsedResponse = JSON.parse(cleaned);
      
      // 檢查是否包含男性特徵標記並移除標記
      let isMaleFeature = false;
      let commentText = parsedResponse.commentText || "";
      
      // 檢測和移除標記
      if (commentText.includes('[male_feature]')) {
        isMaleFeature = true;
        commentText = commentText.replace('[male_feature]', '').trim();
      } else if (commentText.includes('[regular_rod]')) {
        isMaleFeature = false;
        commentText = commentText.replace('[regular_rod]', '').trim();
      }
      
      // 確保所有屬性都存在並有正確類型
      return {
        objectType: ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) 
          ? parsedResponse.objectType : null,
        multipleObjects: Boolean(parsedResponse.multipleObjects),
        lowQuality: Boolean(parsedResponse.lowQuality),
        lengthEstimate: parseFloat(parsedResponse.lengthEstimate) || 0,
        thicknessEstimate: parseFloat(parsedResponse.thicknessEstimate) || 0,
        freshnessScore: parseFloat(parsedResponse.freshnessScore) || 0,
        overallScore: parseFloat(parsedResponse.overallScore) || 0,
        commentText: commentText || "分析未能生成完整評語。",
        isMaleFeature: parsedResponse.objectType === 'other_rod' ? isMaleFeature : undefined
      };
    } catch (/* firstError */ error) {
      // 如果清理後仍無法解析，嘗試直接解析原始響應
      console.error('Cleaned JSON parsing failed:', error);
      try {
        const parsedResponse = JSON.parse(jsonStr);
        
        // 檢查是否包含男性特徵標記並移除標記
        let isMaleFeature = false;
        let commentText = parsedResponse.commentText || "";
        
        // 檢測和移除標記
        if (commentText.includes('[male_feature]')) {
          isMaleFeature = true;
          commentText = commentText.replace('[male_feature]', '').trim();
        } else if (commentText.includes('[regular_rod]')) {
          isMaleFeature = false;
          commentText = commentText.replace('[regular_rod]', '').trim();
        }
        
        return {
          objectType: ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) 
            ? parsedResponse.objectType : null,
          multipleObjects: Boolean(parsedResponse.multipleObjects),
          lowQuality: Boolean(parsedResponse.lowQuality),
          lengthEstimate: parseFloat(parsedResponse.lengthEstimate) || 0,
          thicknessEstimate: parseFloat(parsedResponse.thicknessEstimate) || 0,
          freshnessScore: parseFloat(parsedResponse.freshnessScore) || 0,
          overallScore: parseFloat(parsedResponse.overallScore) || 0,
          commentText: commentText || "分析未能生成完整評語。",
          isMaleFeature: parsedResponse.objectType === 'other_rod' ? isMaleFeature : undefined
        };
      } catch (secondError) {
        // 所有JSON解析嘗試失敗，嘗試提取關鍵信息
        console.error('All JSON parsing attempts failed:', secondError);
        console.log('Raw response:', responseText);
        return extractFallbackInfo(responseText);
      }
    }
  } catch (error) {
    console.error('Error in response parsing:', error);
    return extractFallbackInfo(responseText);
  }
}

/**
 * 從文本中提取關鍵信息作為備用
 * @param responseText API返回的原始文本
 * @returns 提取出的基本信息
 */
function extractFallbackInfo(responseText: string): {
  objectType: ObjectType;
  multipleObjects: boolean;
  lowQuality: boolean;
  lengthEstimate: number;
  thicknessEstimate: number;
  freshnessScore: number;
  overallScore: number;
  commentText: string;
  isMaleFeature?: boolean;
  error: string;
} {
  // 初始化結果
  const extractedInfo = {
    objectType: null as ObjectType,
    multipleObjects: false,
    lowQuality: false,
    lengthEstimate: 0,
    thicknessEstimate: 0,
    freshnessScore: 5, // 默認平均值
    overallScore: 5,   // 默認平均值
    commentText: "AI無法正確分析此圖片，請嘗試上傳更清晰的照片或換一個角度。",
    isMaleFeature: undefined as boolean | undefined,
    error: 'JSON解析錯誤，無法提取完整分析結果'
  };
  
  // 智能物體類型識別
  if (responseText.toLowerCase().includes('cucumber') || 
      responseText.toLowerCase().includes('小黃瓜')) {
    extractedInfo.objectType = 'cucumber';
  } else if (responseText.toLowerCase().includes('banana') || 
             responseText.toLowerCase().includes('香蕉')) {
    extractedInfo.objectType = 'banana';
  } else if (responseText.toLowerCase().includes('other_rod') || 
             responseText.toLowerCase().includes('棒狀物')) {
    extractedInfo.objectType = 'other_rod';
    
    // 嘗試判斷是否為男性特徵
    const maleFeatureKeywords = ['陰莖', '生殖器', '男性特徵', '男性器官', 'penis', 'male organ', '龜頭'];
    extractedInfo.isMaleFeature = maleFeatureKeywords.some(keyword => 
      responseText.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  // 提取可能的長度信息
  const lengthMatch = responseText.match(/長度[^\d]*(\d+\.?\d*)/i) || 
                      responseText.match(/length[^\d]*(\d+\.?\d*)/i);
  if (lengthMatch && lengthMatch[1]) {
    extractedInfo.lengthEstimate = parseFloat(lengthMatch[1]);
  }
  
  // 提取可能的粗細信息
  const thicknessMatch = responseText.match(/粗細[^\d]*(\d+\.?\d*)/i) || 
                         responseText.match(/thickness[^\d]*(\d+\.?\d*)/i);
  if (thicknessMatch && thicknessMatch[1]) {
    extractedInfo.thicknessEstimate = parseFloat(thicknessMatch[1]);
  }
  
  // 提取評論文本（選擇最長的句子作為評論）
  const sentences = responseText.split(/[.!?。！？]/);
  if (sentences.length > 0) {
    // 選擇最長的有意義句子
    const meaningfulSentences = sentences
      .map(s => s.trim())
      .filter(s => s.length > 15); // 過濾過短的句子
    
    if (meaningfulSentences.length > 0) {
      const longestSentence = meaningfulSentences.reduce((longest, current) => 
        current.length > longest.length ? current : longest, "");
      extractedInfo.commentText = longestSentence;
    }
  }
  
  // 檢測圖像質量問題
  if (responseText.toLowerCase().includes('模糊') || 
      responseText.toLowerCase().includes('不清晰') ||
      responseText.toLowerCase().includes('blur') ||
      responseText.toLowerCase().includes('unclear')) {
    extractedInfo.lowQuality = true;
  }
  
  // 檢測多物體問題
  if (responseText.toLowerCase().includes('多個') || 
      responseText.toLowerCase().includes('幾個') ||
      responseText.toLowerCase().includes('multiple') ||
      responseText.toLowerCase().includes('several')) {
    extractedInfo.multipleObjects = true;
  }
  
  return extractedInfo;
}

// 處理真實度檢測，整合TruthDetector模組
async function detectTruthfulness(data: any) {
  if (!data) {
    return {
      isSuspicious: false,
      truthScore: 75,
      adjustedLength: 0,
      adjustmentFactor: 1,
      suspiciousFeatures: [],
      funnyMessage: "我們無法確定此圖像的真實性。"
    };
  }

  try {
    // Get the image type and dimensions for truth analysis
    const { type, length, thickness, isMaleFeature } = data;
    
    if (!type || !length || !thickness) {
      return {
        isSuspicious: false,
        truthScore: 75,
        adjustedLength: 0,
        adjustmentFactor: 1,
        suspiciousFeatures: [],
        funnyMessage: "無法分析此圖像的真實性，缺少必要資訊。"
      };
    }
    
    // Use our TruthDetector to analyze the truthfulness of the image
    const truthAnalysis = analyzeTruth({ 
      type, 
      length: Number(length), 
      thickness: Number(thickness),
      isMaleFeature: Boolean(isMaleFeature)
    });
    
    return truthAnalysis;
  } catch (error) {
    console.error("Error in truth detection:", error);
    return {
      isSuspicious: false,
      truthScore: 75,
      adjustedLength: 0,
      adjustmentFactor: 1,
      suspiciousFeatures: [],
      funnyMessage: "分析真實性時發生錯誤。"
    };
  }
}

// 處理分析結果並生成最終響應
async function processAnalysisResults(geminiResults: any, imageBase64?: string): Promise<NextResponse> {
  // 默認初始資料
  const defaultData = {
    type: 'unknown',
    length: 0,
    thickness: 0,
    quality: 0,
    freshness: 0,
    comment: '無法識別圖片內容。請確保圖片包含小黃瓜或香蕉，並且圖片清晰可見。',
    color: '',
    imageData: imageBase64 || '',
    truthfulness: {
      score: 75,
      suspicious: false,
      suspiciousFeatures: [],
      message: '無法分析此圖像的真實性。'
    },
    processTime: new Date().toISOString(),
    suggestion: '請上傳更清晰的圖片，確保物體完整可見。'
  };
  
  try {
    // 如果沒有有效的分析結果，使用默認響應
    if (!geminiResults) {
      return NextResponse.json(defaultData, { status: 200 });
    }

    // 使用結果或默認值構建響應
    const data = geminiResults;
    
    // 檢測真實度（如果啟用）
    const truthAnalysis = await detectTruthfulness(data);
    
    // 生成使用建議
    const suggestion = getSuggestionMessage(
      truthAnalysis,
      data.type as ObjectType,
      data.isMaleFeature
    );
    
    // 整合所有數據到最終響應
    const finalResponse = {
      ...defaultData,
      ...data,
      imageData: imageBase64 || '',
      truthfulness: {
        score: truthAnalysis?.truthScore || 75,
        suspicious: truthAnalysis?.isSuspicious || false,
        suspiciousFeatures: truthAnalysis?.suspiciousFeatures || [],
        message: truthAnalysis?.funnyMessage || '無法分析此圖像的真實性。'
      },
      processTime: new Date().toISOString(),
      suggestion
    };
    
    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error) {
    console.error('Error processing results:', error);
    return NextResponse.json({
      ...defaultData,
      comment: '處理分析結果時出錯。'
    }, { status: 500 });
  }
}

// 啟用或禁用真實度檢測
const enableTruthDetection = true;

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
        { error: { code: 'MISSING_IMAGE', message: '請上傳圖片檔案' } },
        { status: 400, headers }
      );
    }

    // 檢查檔案大小限制 (10 MB)
    const maxSizeInBytes = 10 * 1024 * 1024; 
    if (imageFile.size > maxSizeInBytes) {
      return NextResponse.json(
        { error: { code: 'IMAGE_TOO_LARGE', message: '圖片檔案大小超過限制 (最大10MB)' } },
        { status: 400, headers }
      );
    }

    // 檢查檔案類型
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: { code: 'INVALID_FILE_TYPE', message: '請上傳有效的圖片檔案 (JPEG, PNG, GIF, WEBP)' } },
        { status: 400, headers }
      );
    }

    // 轉換圖片為 base64 格式
    const imageBytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(imageBytes);
    const base64Image = buffer.toString('base64');

    // 獲取是否啟用真實度檢測
    const enableTruthDetection = formData.get('enableTruthDetection') === 'true';

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
    
    // 開發環境下的模擬數據生成
    let data: AnalysisResult;
    let useRandomData = false;

    if (process.env.NODE_ENV === 'development' && process.env.USE_RANDOM_DATA === 'true') {
      useRandomData = true;
      data = { ...getRandomData(analysisResult.objectType as 'cucumber' | 'banana' | 'other_rod'), comment: "" };
    } else {
      // 使用真實AI分析數據
      // 限制分數在0.0-9.5之間
      const calculatedScore = Math.max(0.0, Math.min(9.5, analysisResult.overallScore));
      
      // 新鮮度評分限制在0-10的整數範圍
      const freshness = Math.max(0, Math.min(10, Math.round(analysisResult.freshnessScore)));
      
      // 處理尺寸估計，確保所有類型的物體都被正確限制
      const { adjustedLength, adjustedThickness } = adjustDimensions(
        analysisResult.lengthEstimate,
        analysisResult.thicknessEstimate,
        analysisResult.objectType
      );
      
      // 最終評分計算 - 考慮不同因素的加權
      const finalScore = calculateFinalScore(
        calculatedScore,
        freshness,
        adjustedLength,
        adjustedThickness,
        analysisResult.objectType
      );
      
      data = {
        type: analysisResult.objectType,
        length: Math.round(adjustedLength * 10) / 10, // 保留一位小數
        thickness: Math.round(adjustedThickness * 10) / 10,
        freshness: freshness,
        score: finalScore,
        comment: analysisResult.commentText || ""
      };
    }

    // 合併數據，確保有評語
    if (!data.comment || data.comment.trim() === "") {
      data.comment = useRandomData ? generateComment(data) : analysisResult.commentText || generateComment(data);
    }

    // 添加真實度分析
    const truthAnalysis = await detectTruthfulness(data);
    
    // 創建最終結果
    const result: AnalysisResult = {
      ...data,
      truthAnalysis: enableTruthDetection ? truthAnalysis : undefined
    };

    // 返回最終分析結果
    return NextResponse.json(result, { status: 200, headers });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    // 更詳細的錯誤處理
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    const errorCode = error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT_ERROR' : 'GENERAL_ERROR';
    
    return NextResponse.json(
      { error: { code: errorCode, message: `分析過程中發生錯誤: ${errorMessage}` } },
      { status: 500, headers }
    );
  }
} 