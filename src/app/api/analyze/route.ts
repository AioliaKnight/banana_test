import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { analyzeTruth, adjustDimensions, calculateFinalScore, getSuggestionMessage, CONFIG } from '@/components/utils/TruthDetector';
import { AnalysisResult, ObjectType, TruthDetectorConfig } from '@/types';

// =================================
// Interfaces & Types (Local)
// =================================
// (Most types are now imported from @/types)

// Interface for the structure returned by getRandomData
interface RandomDataResult {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
}

// =================================
// Constants & Configuration
// =================================

// Use imported type for CONFIG
const typedConfig: TruthDetectorConfig = CONFIG;

// Gemini Prompt Templates
const promptTemplates = {
  // Basic role and goal setting
  baseRoleAndGoal: `你是一位超級活潑、敢講敢說的女性蔬果測量評論專家，風格像是閨蜜間的私密對話。你對香蕉、小黃瓜和各種棒狀物的尺寸形狀有獨特品味，會根據識別的物體類型調整你的評論風格：

不同物體類型的角色定位：
- 小黃瓜和香蕉：專業蔬果評論家，混合專業知識與幽默風格
- 男性特徵 (Male Feature)：閨蜜間尖酸刻薄的點評專家，標準極高
- 一般棒狀物 (Regular Rod)：幽默風趣的觀察者，帶有適度暗示但不過度露骨`,
  
  // Object type determination guidelines
  objectTypeGuidelines: `
1. **物體類型判斷**：
   - 這是小黃瓜還是香蕉？如果都不是，但是棒狀或條狀物體，請標識為"other_rod"。
   - 如果圖片中有多個主要物體，請將multipleObjects設為true。
   - 如果圖片質量太差（太暗、太模糊等），請將lowQuality設為true。
   - 若無法確定物體類型，objectType應為null。
   
   - 【關鍵步驟】other_rod子類型判斷：
     * other_rod必須進一步細分為以下兩種子類型之一：
       → 男性特徵 (Male Feature)：具有明確的生殖器特徵
       → 一般棒狀物 (Regular Rod)：任何非男性特徵的棒狀物體
     
     * 判斷依據：
       → 男性特徵通常具有：獨特的頭部形狀、不均勻的粗細變化、特定膚色、無硬質表面
       → 一般棒狀物通常具有：均勻的紋理、一致的硬度、可能有人工或製造痕跡
     
     * 標記方式：
       → 如果確定是男性特徵，在commentText開頭添加"[male_feature]"
       → 如果是一般棒狀物，在commentText開頭添加"[regular_rod]"
       → 這些標記將用於選擇適當評論風格，但不會出現在最終回應中
     
     * 重要原則：
       → 當無法確定時，優先標記為[regular_rod]
       → 確保標記放在評論文本的最前面，便於系統識別`,
  
  // Size estimation and style guidelines
  sizeEstimationGuidelines: `
2. **尺寸估計與風格評價**：
   - 用厘米估計物體的長度和粗細/直徑，例如18.5cm長，3.2cm粗
   - 根據物體類型及子類型，採用不同的評價風格：
   
     * 小黃瓜和香蕉 - 專業評價風格：
       → 專注於果實的品質、形狀、尺寸和適用料理方式
       → "這根香蕉有18cm，屬於標準尺寸，形狀彎度也剛好符合黃金比例，切成片後絕對能在水果沙拉裡成為主角"
       → "20cm長的小黃瓜！哇，這是超市精選級別的規格，絕對能做出完美的涼拌小黃瓜"
     
     * other_rod (男性特徵) - 尖酸刻薄評價風格：
       → 對尺寸表現極高期望，直接用挑剔的語氣評論
       → 將測量結果與"前男友們"進行直接比較，態度略帶諷刺
       → "這個尺寸太普通了吧！才17cm長？難怪會被嫌棄～我前男友比這大多了"
       → "這個粗細真的足夠嗎？說實話，這種規格很難讓人印象深刻"
     
     * other_rod (一般棒狀物) - 幽默暗示評價風格：
       → 以幽默方式暗示這可能是某種"特殊用途"的物品
       → 評論尺寸和形狀時使用暗示性但不粗俗的表達
       → "這個形狀很有趣呢！如果用於某些特定場合，這種尺寸應該很受歡迎～"
       → "哎呀～這個長度和彎度的組合，讓人忍不住想像它的使用場景..."  `,
  
  // Scoring system guidelines
  scoringSystemGuidelines: `
3. **評分系統（評分標準）**：
   - 新鮮度得分(0-10分)：評價物體的狀態和品質
   - 總體品質評分(0-10分)：可以有小數點，讓評分更精確
   
   - 針對不同物體類型和子類型的評分標準：
     * 小黃瓜和香蕉 - 專業評分基準：
       → 新鮮度：根據色澤、紋理、光澤度等外觀特徵評分
       → 總體品質：考慮形狀、比例、均勻度等多個因素
       → "新鮮度9分：保存得宜，色澤飽滿，質地剛好"
       → "總體品質7.8分：形狀略微彎曲，但整體屬於市場上品質優良的範圍"
     
     * other_rod (男性特徵) - 帶有評價性的評分：
       → 根據尺寸相對於"期望值"的表現評分
       → <10cm："尺寸過小，功能性令人懷疑，僅適合特定場合使用"
       → 10-15cm："基本標準尺寸，但對經驗豐富者可能略顯不足"
       → 15-20cm："尺寸令人滿意，但仍有提升空間，技巧可彌補"
       → >20cm："規格優異，但實用性需考慮，配合度是關鍵"
     
     * other_rod (一般棒狀物) - 幽默客觀的評分：
       → <10cm："這個尺寸...嗯...小巧玲瓏，適合初學者或特定場合使用"
       → 10-15cm："標準尺寸，使用起來應該相當舒適，各種場合都能應付"
       → 15-20cm："哇～這個尺寸絕對能讓使用者感到滿足，是許多人追求的理想規格"
       → >20cm："天啊！這尺寸太驚人了，雖然看起來很壯觀，但實用性需要考慮使用者的接受度"

   a) **總體品質評分等級** - 適用於所有物體類型：
      - 0-2.9分："不合格級" - 這種等級建議不要購買或使用
      - 3-4.9分："將就級" - 只有在沒有其他選擇時才考慮的選項
      - 5-6.9分："一般般級" - 符合基本標準，但沒有特別出彩之處
      - 7-8.4分："優選級" - 高品質範圍，值得選擇
      - 8.5-9.3分："佳品級" - 值得專程尋找的品質
      - 9.4-10分："頂級級" - 極其罕見的完美品質
   
   b) **新鮮度/品質評分描述** - 根據物體類型調整用詞：
      - 蔬果類：使用新鮮度、成熟度等食品相關詞彙
      - 男性特徵：使用健康度、活力、狀態等相關詞彙
      - 一般棒狀物：使用品質、做工、材質等物品相關詞彙
   
   c) **特殊評價項目** - 可為各類型加分或減分：
      - "比例協調"：長度和粗細的比例恰到好處 +1.0分
      - "形狀優美"：曲線流暢，外觀吸引人 +0.8分
      - "質地優良"：看起來結實飽滿，手感應該很好 +0.5分
      - "不均勻"：形狀不規則，影響整體美觀 -0.5分
      - "過度彎曲"：彎曲角度過大，可能影響使用 -0.7分`,
  
  // Comment style guidelines
  commentStyleGuidelines: `
4. **評論風格指南** - 物體類型和子類型的詳細風格規範：
   
   a) **小黃瓜和香蕉** - 專業幽默評論風格：
      - 專注於果實的品質、形狀、尺寸和適用料理方式
      - 風格類似專業美食評論家，但帶有幽默元素
      - 適度使用誇張和有趣比喻，但不過度暗示
      - 提供專業的烹飪建議和使用方式
      - 例如："這根20cm的黃瓜切片後絕對能成為沙拉的主角！彎度適中，粗細均勻，新鮮度給9分毫不誇張。這種品質的小黃瓜絕對是涼拌、醃漬的絕佳選擇，甚至可以考慮做成精緻的小黃瓜卷。皮色碧綠，質地緊實，是我見過最標準的小黃瓜典範之一。"
   
   b) **男性特徵 (Male Feature)** - 尖酸刻薄高標準評論風格：
      - 以閨蜜間的尖酸刻薄標準直接評價尺寸，強調大小遠低於期望
      - 用挑剔的語氣討論長度和粗細"不足"的問題
      - 加入與"前男友"、"理想標準"的不利比較
      - 提供避免失望的"建議"，如準備替代方案或額外道具
      - 直截了當表達對尺寸的嘲諷和不滿
      - 批評性詞彙："勉強及格"、"太普通了"、"不夠看"、"難以滿足"
      - 例如："天啊～這尺寸也太普通了吧？長度才17cm？我前男友比這個至少大一圈好嗎！如果約會對象只有這個規格，建議準備些輔助道具，否則很難有滿足感～除非他技巧超群或特別持久，否則這種size實在難以令人印象深刻！"
   
   c) **一般棒狀物 (Regular Rod)** - 幽默風趣暗示評論風格：
      - 以幽默的方式評論
      - 使用適度的曖昧表達和俏皮的暗示，但避免過度露骨
      - 讓評論帶有調侃和玩笑的口吻，符合台灣人喜好的幽默感
      - 保持輕鬆愉快的語調，讓用戶會心一笑
      - 常用表達："有趣的形狀"、"特殊用途"、"某些場合"、"讓人遐想"
      - 例如："哎呀～這形狀還真特別！如果是我想的那種物品，尺寸和曲度都很適合...嗯...各種"創意用途"～不過我可能想太多了，畢竟這可能只是個普通物品，對吧？長度和粗細比例很協調，看起來使用起來應該很舒適～"
   
   d) **評論模式結構** - 確保評論包含以下要素：
      - 開場白：表達對物體的初步印象
      - 尺寸點評：具體評論長度和粗細
      - 功能性評價：根據不同物體類型和子類型調整用詞
      - 結語或建議：提供使用建議或幽默結束語
      
   e) **語氣與措辭** - 根據物體類型和子類型調整：
      - 小黃瓜和香蕉：專業、知識性、略帶幽默
      - 男性特徵：直接、挑剔、嘲諷、略帶失望
      - 一般棒狀物：俏皮、暗示性、幽默、帶有好奇`,
  
  // Response format requirements
  responseFormatRequirements: `
5. **回應格式要求** - 必須嚴格遵循此JSON格式：
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

重要提醒：
- 所有數值字段必須是數字而非字符串
- commentText中必須根據物體類型和子類型採用適當的評論風格
- 如果是other_rod類型，必須在commentText開頭加上[male_feature]或[regular_rod]標記
- 確保你的評語風格與物體類型/子類型一致：
  * 小黃瓜/香蕉：專業幽默的水果評論專家
  * male_feature：尖酸刻薄高標準的閨蜜評論
  * regular_rod：幽默風趣帶有適當暗示的評論`
};

// =================================
// Helper Functions - Data Generation & Formatting
// =================================

/**
 * Generates random data for development purposes.
 * Uses dimension limits from the imported CONFIG.
 */
function getRandomData(type: 'cucumber' | 'banana' | 'other_rod'): RandomDataResult {
  // Use dimension limits from the typedConfig (which imports CONFIG and applies the type)
  const limits = typedConfig.dimensionLimits[type] || typedConfig.dimensionLimits.default;
  const { reasonableMinLength, reasonableMaxLength, reasonableMinThickness, reasonableMaxThickness } = limits;

  // Expand score range for more differentiation (0.0-9.5 range)
  const score = Math.floor(Math.random() * 95) / 10;
  
  // Random length based on type using reasonable ranges from CONFIG
  let length;
  if (Math.random() < 0.05) { // 5% chance of getting 0 length (indicates completely non-standard)
    length = 0;
  } else {
    // Generate length within the reasonable range defined in CONFIG
    length = Math.floor(Math.random() * (reasonableMaxLength - reasonableMinLength + 1)) + reasonableMinLength;
  }
  
  // Random thickness based on type using reasonable ranges from CONFIG
  let thickness;
  // Generate thickness within the reasonable range defined in CONFIG
  // Ensure thickness is not 0 unless length is also 0
  if (length === 0) {
    thickness = 0;
  } else {
    const minThick = Math.max(0.1, reasonableMinThickness); // Avoid 0 thickness unless length is 0
    const maxThick = reasonableMaxThickness;
    // Generate thickness ensuring it's within the reasonable range and has one decimal place
    thickness = Math.floor(Math.random() * ((maxThick - minThick) * 10 + 1)) / 10 + minThick;
    thickness = Math.round(thickness * 10) / 10; // Ensure one decimal place
    thickness = Math.max(minThick, Math.min(maxThick, thickness)); // Clamp within reasonable bounds
  }
  
  // Expand freshness score range (0-10), allow 0 for very poor
  const freshness = Math.random() < 0.05 ? 0 : Math.floor(Math.random() * 7) + 4;

  return { type, length, thickness, freshness, score };
}

/**
 * Generates a fallback comment based on provided data.
 * Used for random data or when Gemini fails to generate a comment.
 */
function generateComment(data: Record<string, unknown>): string {
  if (data.type === 'other_rod') {
    // Select different comment sets based on whether it's a male feature
    if (data.isMaleFeature === true) {
      // Male feature comments - harsh, high-standard girlfriend style with strong suggestive hints
      const maleFeatureComments = [
        `哎呀～親愛的，這個規格也太...普通了吧？長度${data.length}cm，粗細${data.thickness}cm，勉強及格而已啦！雖然表面看起來還行，但這種尺寸在閨蜜團裡絕對是會被嘲笑的對象。說真的，我前男友至少比這個粗一圈長三公分，而且技巧也好～如果你的約會對象只有這個水平，建議妳還是提前準備個按摩棒備用哦～`,
        `天啊～這個尺寸算是...特別的嗎？長度${data.length}cm，粗細才${data.thickness}cm？姐妹，我們得談談妳的品味問題了！這種規格頂多就是一夜情的水準，根本無法成為長期伴侶好嗎？除非他技巧特別好或是很有錢，否則我真的很難想像怎麼從這種大小獲得完全的滿足...保險起見，下次約會前先帶個道具在包包裡吧！`,
        `親愛的，我得老實告訴妳，這個尺寸有點...不夠看呢！長度${data.length}cm，粗細${data.thickness}cm，說實話這在我的前男友們中絕對是墊底的～如果他在床上沒有超強的補償技巧或是願意用上各種花樣和玩具，這樣的條件真的很難讓女生爽到！建議妳跟他約會時多觀察他的手指長度和靈活度，那可能比這個更重要哦！`,
        `哈哈哈！妳把這個當寶貝啊？長度才${data.length}cm，粗細${data.thickness}cm的尺寸也好意思拿出來測量？姐妹，我們得提高標準了！在我的評分系統裡，這頂多算個基本配備，除非他前戲特別出色或是能堅持超過30分鐘，否則這種規格很難讓人印象深刻。說真的，要是我碰到這種size，可能會找個藉口提前結束約會～要不要考慮再物色一下？`,
        `噢親愛的～這個尺寸...呃...怎麼說呢？長${data.length}cm，粗${data.thickness}cm，如果這是你男朋友的"裝備"，那麼我隆重地建議你們的性愛清單裡一定要加上各種道具和玩具！因為老實說，光靠這個規格想要征服G點簡直是天方夜譚！除非他有張能說會道的嘴和靈活的手指，否則這種尺寸在閨蜜團的評分系統裡絕對是需要"額外努力"的類型～`
      ];
      return maleFeatureComments[Math.floor(Math.random() * maleFeatureComments.length)];
    } else {
      // General rod-shaped object comments - humorous style with appropriate hints
      const regularRodComments = [
        `哎呀～這不是小黃瓜也不是香蕉呢！這個特別的棒狀物真有趣，長度約${data.length}cm，粗細約${data.thickness}cm。嗯...形狀很獨特，讓人忍不住浮想聯翩～如果這是某種道具，我想它的功能性應該相當不錯！不過親愛的，如果妳想知道水果的品質分析，下次上傳真正的小黃瓜或香蕉會更好哦～`,
        `嘿嘿，看來今天不是來測量水果的嘛！這個有趣的棒狀物長${data.length}cm，粗細${data.thickness}cm，尺寸還挺可觀的！如果這是我想的那種物品，那麼它應該能帶來不少樂趣...但如果只是普通物品，那我的想像力可能太豐富了！想要專業水果評測的話，記得下次上傳真正的水果照片哦～`,
        `喔！這個形狀真是...令人遐想呢～雖然不是我們常分析的水果，但這個棒狀物看起來挺有意思的。長度${data.length}cm，粗細${data.thickness}cm，比例協調。不知道這是用來做什麼的呢？不管用途是什麼，有這種尺寸規格應該很受歡迎吧！如果是想測量真正的水果，下次請上傳小黃瓜或香蕉照片哦～`,
        `親愛的，這可不是我們通常分析的水果類型呢！但必須承認，這個棒狀物體長${data.length}cm，粗${data.thickness}cm的尺寸，在某些「特殊場合」應該會很受歡迎～形狀流暢，粗細適中，看起來使用起來應該很...舒適！不過，為了讓我們專注於水果評測的正業，下次還是上傳真正的蔬果照片比較好哦！`
      ];
      return regularRodComments[Math.floor(Math.random() * regularRodComments.length)];
    }
  }
  
  // Default comments for cucumber/banana
  const comments = [
    `這是一個品質優良的${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}，長度為${data.length}cm，粗細適中${data.thickness}cm。從外觀來看非常新鮮，色澤飽滿，形狀勻稱。`,
    `這個${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}呈現出優秀的品質特徵，長度達到${data.length}cm，粗細均勻為${data.thickness}cm。整體看起來非常健康，結構完美，新鮮度很高。`,
    `分析結果顯示，這個${data.type === 'cucumber' ? '小黃瓜' : '香蕉'}長度為${data.length}cm，粗細為${data.thickness}cm，比例協調。質地看起來非常好，新鮮度評分為${data.freshness}/10，屬於高品質樣本。`
  ];
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// =================================
// Helper Functions - Gemini Interaction
// =================================

/**
 * Gets the optimized prompt text for the Gemini API.
 * Combines various prompt template components.
 */
function getPromptForObjectType(/* objectType: ObjectType | null */): string {
  // Combine base prompt templates
  const basePrompt = [
    promptTemplates.baseRoleAndGoal,
    promptTemplates.objectTypeGuidelines,
    promptTemplates.sizeEstimationGuidelines,
    promptTemplates.scoringSystemGuidelines,
    promptTemplates.commentStyleGuidelines,
    promptTemplates.responseFormatRequirements
  ].join('\n');
  
  // Future optimization: could tailor prompt further based on objectType
  return basePrompt;
}

/**
 * Fetches data with exponential backoff and advanced error handling.
 * @template T
 * @param {() => Promise<T>} fetchFn The function to fetch data.
 * @param {number} [maxAttempts=3] Maximum number of retry attempts.
 * @param {number} [initialDelay=1000] Initial delay in milliseconds.
 * @param {(error: unknown) => boolean} [retryableErrorCheck] Function to check if an error is retryable.
 * @returns {Promise<T>} The result of the fetch function.
 */
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
      // Time execution (for monitoring)
      const startTime = Date.now();
      
      // Attempt the request
      const result = await fetchFn();
      
      // Calculate and log execution time
      const executionTime = Date.now() - startTime;
      if (attempt > 1) {
        console.log(`Request succeeded on attempt ${attempt}/${maxAttempts} after ${executionTime}ms`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if max retries reached
      if (attempt >= maxAttempts) {
        console.error(`All ${maxAttempts} retry attempts failed:`, error);
        break;
      }
      
      // Check if the error is retryable
      if (retryableErrorCheck && !retryableErrorCheck(error)) {
        console.log(`Non-retryable error detected, aborting retries:`, error);
        break;
      }
      
      // Calculate exponential backoff delay with jitter
      const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1) * jitter, 15000); // Cap delay at 15s
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} failed. Retrying after ${Math.round(delay)}ms...`);
      if (error instanceof Error) {
        console.log(`Retry reason: ${error.message}`);
      }
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  
  // All retries failed, throw the last encountered error
  throw lastError;
}

/**
 * Checks if a network error is likely retryable.
 * @param error The error object.
 * @returns {boolean} True if the error seems retryable, false otherwise.
 */
function isRetryableNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  // Check error message keywords
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
    '429', // Too Many Requests
    '500', // Internal Server Error
    '502', // Bad Gateway
    '503', // Service Unavailable
    '504'  // Gateway Timeout
  ];
  
  return retryableErrorKeys.some(key => errorMessage.includes(key));
}

/**
 * Analyzes the image content using the Gemini API.
 * @param {string} imageBase64 Base64 encoded image data.
 * @returns {Promise<AnalysisResult>} The structured analysis result from Gemini.
 */
async function analyzeImageWithGemini(imageBase64: string): Promise<AnalysisResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is missing');
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash", // Using the faster Flash model
      generationConfig: {
        temperature: 0.4,  // Balanced temperature for creativity and consistency
        maxOutputTokens: 800,
        topK: 40,
        topP: 0.95,
      },
      safetySettings: [ // Relaxed safety settings (use with caution)
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    });

    // Set a longer timeout for the API request
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutError = new Error('API request timeout');
      timeoutError.name = 'TimeoutError';
      setTimeout(() => reject(timeoutError), 25000); // Increased to 25 seconds
    });

    // Get the optimized prompt
    const promptText = getPromptForObjectType(/* null */);

    // Prepare image data part
    const imageParts = [ { inlineData: { data: imageBase64, mimeType: "image/jpeg" } } ];

    // Record API request start time (for performance monitoring)
    const requestStartTime = Date.now();

    try {
      // Send request using enhanced exponential backoff retry mechanism
      const geminiResponsePromise = fetchWithRetry(
        async () => {
          try {
            return await model.generateContent([promptText, ...imageParts]);
          } catch (err) {
            // Handle specific API errors (e.g., safety violations)
            if (err instanceof Error && err.message?.includes('safety')) {
              throw new Error('圖片內容可能違反安全政策，請上傳適當的圖片');
            }
            // Other errors will be handled by fetchWithRetry's retryable check
            throw err;
          }
        },
        3,    // Max retry attempts
        2000, // Initial delay increased to 2s
        isRetryableNetworkError // Use retryable error check
      );
      
      // Race the API request against the timeout
      const geminiResponse = await Promise.race([ geminiResponsePromise, timeoutPromise ]);
      
      // Record API response time (for performance monitoring)
      const responseTime = Date.now() - requestStartTime;
      console.log(`Gemini API response time: ${responseTime}ms`);
      
      const responseText = geminiResponse.response.text();
      
      // Check for abnormal response length
      if (!responseText || responseText.length < 10) {
        throw new Error('API返回空響應或無效內容');
      }
      
      // Parse the response
      return parseGeminiResponse(responseText);

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);
      
      // Handle errors gracefully with user-friendly messages
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
    // Return a default AnalysisResult structure on error
    return {
      objectType: null,
      multipleObjects: false,
      lowQuality: false,
      lengthEstimate: 0,
      thicknessEstimate: 0,
      freshnessScore: 0,
      overallScore: 0,
      commentText: "",
      error: error instanceof Error ? error.message : '未知錯誤',
      // Add default values for missing processed fields
      type: null,
      length: 0,
      thickness: 0,
      freshness: 0,
      score: 0,
      comment: ""
    };
  }
}

/**
 * Intelligently parses the Gemini API response text.
 * Attempts to extract JSON and handles various edge cases.
 * @param {string} responseText The raw response text from the API.
 * @returns {AnalysisResult} The parsed structured data.
 */
function parseGeminiResponse(responseText: string): AnalysisResult {
  try {
    // Attempt to extract the JSON part from the text
    let jsonStr = responseText;
    
    // Smart JSON identification - find the most complete JSON part
    if (responseText.includes('{') && responseText.includes('}')) {
      const jsonMatches = responseText.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g) || [];
      
      if (jsonMatches.length > 0) {
        // Choose the longest JSON string (likely the most complete)
        jsonStr = jsonMatches.reduce((longest, current) => 
          current.length > longest.length ? current : longest, "");
      } else {
        // Fallback using standard start/end positions
        const startIndex = responseText.indexOf('{');
        const endIndex = responseText.lastIndexOf('}') + 1;
        if (startIndex >= 0 && endIndex > startIndex) {
          jsonStr = responseText.substring(startIndex, endIndex);
        }
      }
    }
    
    // Enhanced JSON parsing and cleaning
    try {
      // Remove characters that might cause parsing errors
      const cleaned = jsonStr
        .replace(/[\u0000-\u001F]+/g, ' ')  // Control characters
        .replace(/[\r\n]+/g, ' ')           // Newlines
        .replace(/,\s*}/g, '}')             // Trailing commas before }
        .replace(/,\s*]/g, ']')             // Trailing commas before ]
        .replace(/,\s*,/g, ',')             // Duplicate commas
        .replace(/:null,/g, ': null,')      // Fix potential null value issues
        .replace(/"\s*:\s*"/g, '": "')      // Formatting fixes
        .replace(/\\+"/g, '\\"');           // Escape quote fixes
      
      const parsedResponse = JSON.parse(cleaned);
      
      // Check for male feature marker and remove it
      let isMaleFeature = false;
      let rodSubtype: 'male_feature' | 'regular_rod' | undefined = undefined;
      let commentText = parsedResponse.commentText || "";
      
      // Detect and remove markers
      if (commentText.startsWith('[male_feature]')) {
        isMaleFeature = true;
        rodSubtype = 'male_feature';
        commentText = commentText.substring('[male_feature]'.length).trim();
      } else if (commentText.startsWith('[regular_rod]')) {
        isMaleFeature = false;
        rodSubtype = 'regular_rod';
        commentText = commentText.substring('[regular_rod]'.length).trim();
      }
      
      // Ensure all properties exist and have correct types
      const objectTypeResult: ObjectType = ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) 
          ? parsedResponse.objectType : null;

      return {
        objectType: objectTypeResult,
        rodSubtype: objectTypeResult === 'other_rod' ? rodSubtype : undefined,
        multipleObjects: Boolean(parsedResponse.multipleObjects),
        lowQuality: Boolean(parsedResponse.lowQuality),
        lengthEstimate: parseFloat(parsedResponse.lengthEstimate) || 0,
        thicknessEstimate: parseFloat(parsedResponse.thicknessEstimate) || 0,
        freshnessScore: parseFloat(parsedResponse.freshnessScore) || 0,
        overallScore: parseFloat(parsedResponse.overallScore) || 0,
        commentText: commentText || "分析未能生成完整評語。",
        isMaleFeature: objectTypeResult === 'other_rod' ? isMaleFeature : undefined,
        // Add default values for missing processed fields
        type: objectTypeResult, // Use parsed type if valid
        length: 0, // Processed values are calculated later
        thickness: 0,
        freshness: 0,
        score: 0,
        comment: commentText || "分析未能生成完整評語。" // Use raw comment initially
      };
    } catch (firstError) {
      // If cleaned JSON parsing fails, try parsing the original string
      console.error('Cleaned JSON parsing failed:', firstError);
      try {
        const parsedResponse = JSON.parse(jsonStr);
        
        // Duplicate logic for marker detection (in case original parsing works)
        let isMaleFeature = false;
        let rodSubtype: 'male_feature' | 'regular_rod' | undefined = undefined;
        let commentText = parsedResponse.commentText || "";
        if (commentText.startsWith('[male_feature]')) {
          isMaleFeature = true; rodSubtype = 'male_feature'; commentText = commentText.substring('[male_feature]'.length).trim();
        } else if (commentText.startsWith('[regular_rod]')) {
          isMaleFeature = false; rodSubtype = 'regular_rod'; commentText = commentText.substring('[regular_rod]'.length).trim();
        }
        const objectTypeResult: ObjectType = ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) ? parsedResponse.objectType : null;
        
        return {
          objectType: objectTypeResult,
          rodSubtype: objectTypeResult === 'other_rod' ? rodSubtype : undefined,
          multipleObjects: Boolean(parsedResponse.multipleObjects),
          lowQuality: Boolean(parsedResponse.lowQuality),
          lengthEstimate: parseFloat(parsedResponse.lengthEstimate) || 0,
          thicknessEstimate: parseFloat(parsedResponse.thicknessEstimate) || 0,
          freshnessScore: parseFloat(parsedResponse.freshnessScore) || 0,
          overallScore: parseFloat(parsedResponse.overallScore) || 0,
          commentText: commentText || "分析未能生成完整評語。",
          isMaleFeature: objectTypeResult === 'other_rod' ? isMaleFeature : undefined,
          type: objectTypeResult, 
          length: 0, thickness: 0, freshness: 0, score: 0,
          comment: commentText || "分析未能生成完整評語。"
        };
      } catch (secondError) {
        // All JSON parsing attempts failed, try extracting fallback info
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
 * Extracts key information from the response text as a fallback.
 * Used when JSON parsing fails completely.
 * @param {string} responseText The raw API response text.
 * @returns {AnalysisResult} Basic information extracted from the text.
 */
function extractFallbackInfo(responseText: string): AnalysisResult {
  // Initialize result with defaults
  const extractedInfo: AnalysisResult = {
    objectType: null as ObjectType,
    rodSubtype: undefined as 'male_feature' | 'regular_rod' | undefined,
    multipleObjects: false,
    lowQuality: false,
    lengthEstimate: 0,
    thicknessEstimate: 0,
    freshnessScore: 5, // Default average
    overallScore: 5,   // Default average
    commentText: "AI無法正確分析此圖片，請嘗試上傳更清晰的照片或換一個角度。",
    isMaleFeature: undefined as boolean | undefined,
    error: 'JSON解析錯誤，無法提取完整分析結果',
    // Add default values for processed fields
    type: null, // Initialize as null, will be set below if possible
    length: 0,
    thickness: 0,
    freshness: 5, // Use default
    score: 5,     // Use default
    comment: "AI無法正確分析此圖片，請嘗試上傳更清晰的照片或換一個角度。" // Use default comment
  };
  
  // Smart object type identification
  if (responseText.toLowerCase().includes('cucumber') || responseText.toLowerCase().includes('小黃瓜')) {
    extractedInfo.objectType = 'cucumber'; extractedInfo.type = 'cucumber';
  } else if (responseText.toLowerCase().includes('banana') || responseText.includes('香蕉')) {
    extractedInfo.objectType = 'banana'; extractedInfo.type = 'banana';
  } else if (responseText.toLowerCase().includes('other_rod') || responseText.toLowerCase().includes('棒狀') || responseText.toLowerCase().includes('條狀')) {
    extractedInfo.objectType = 'other_rod'; extractedInfo.type = 'other_rod';
    
    // Detect if it's a male feature
    const maleKeywords = ['陰莖', '生殖器', '男性特徵', 'penis', 'male organ', '[male_feature]'];
    const isLikelyMale = maleKeywords.some(keyword => responseText.toLowerCase().includes(keyword.toLowerCase()));
    if (isLikelyMale) {
      extractedInfo.isMaleFeature = true; extractedInfo.rodSubtype = 'male_feature';
    } else {
      extractedInfo.isMaleFeature = false; extractedInfo.rodSubtype = 'regular_rod';
    }
  }
  
  // Attempt to extract length estimate
  const lengthMatch = responseText.match(/(\d+(?:\.\d+)?)(?:\s*)?(?:cm|厘米|公分)(?:\s*)?(?:長|length)/i);
  if (lengthMatch && lengthMatch[1]) {
    extractedInfo.lengthEstimate = parseFloat(lengthMatch[1]);
    extractedInfo.length = extractedInfo.lengthEstimate; // Use estimate as initial processed value
  }
  
  // Attempt to extract thickness estimate
  const thicknessMatch = responseText.match(/(?:粗細|thickness|diameter|直徑)(?:\s*)?(?:為|是|:|：)?(?:\s*)?(\d+(?:\.\d+)?)(?:\s*)?(?:cm|厘米|公分)/i);
  if (thicknessMatch && thicknessMatch[1]) {
    extractedInfo.thicknessEstimate = parseFloat(thicknessMatch[1]);
    extractedInfo.thickness = extractedInfo.thicknessEstimate; // Use estimate as initial processed value
  }
  
  // Generate appropriate comment content if object type was identified
  if (extractedInfo.objectType) {
    // Generate comment based on extracted/default values
    const generatedComment = generateComment({
      type: extractedInfo.objectType,
      length: extractedInfo.length, // Use the processed length
      thickness: extractedInfo.thickness, // Use the processed thickness
      freshness: extractedInfo.freshness, // Use the processed freshness
      score: extractedInfo.score, // Use the processed score
      isMaleFeature: extractedInfo.isMaleFeature
    });
    extractedInfo.commentText = generatedComment; // Update raw comment text
    extractedInfo.comment = generatedComment;     // Update final comment
  }
  
  return extractedInfo;
}

// =================================
// Main Processing Logic
// =================================

/**
 * Process the analysis results from the API or random data
 * Performs various calculations on the data and prepares it for the client
 */
export function processAnalysisResults(
  data: Record<string, unknown>,
  imagePath: string | null = null
): AnalysisResult {
  // Process the subtype information from the comment text
  let subtype: 'male_feature' | 'regular_rod' | null = null;
  let commentText = data.commentText || '';
  
  // Extract the subtype tag and remove it from the comment
  if (data.objectType === 'other_rod' && commentText) {
    const maleFeaturePrefix = '[male_feature]';
    const regularRodPrefix = '[regular_rod]';
    
    if (commentText.startsWith(maleFeaturePrefix)) {
      subtype = 'male_feature';
      commentText = commentText.replace(maleFeaturePrefix, '').trim();
    } else if (commentText.startsWith(regularRodPrefix)) {
      subtype = 'regular_rod';
      commentText = commentText.replace(regularRodPrefix, '').trim();
    }
  }
  
  // Create dimensions object, ensuring values are numbers (not strings)
  const dimensions = adjustDimensions({
    length: typeof data.lengthEstimate === 'number' ? data.lengthEstimate : 0,
    thickness: typeof data.thicknessEstimate === 'number' ? data.thicknessEstimate : 0
  }, data.objectType as ObjectType);
  
  // Calculate final score
  const finalScore = calculateFinalScore({
    freshnessScore: typeof data.freshnessScore === 'number' ? data.freshnessScore : 0,
    overallScore: typeof data.overallScore === 'number' ? data.overallScore : 0,
    dimensions,
    objectType: data.objectType as ObjectType
  });
  
  // Get truthfulness analysis
  const truthfulness = analyzeTruth(dimensions, data.objectType as ObjectType, subtype, finalScore.credibilityScore);
  
  // Get suggestion message
  const suggestion = getSuggestionMessage(
    dimensions, 
    data.objectType as ObjectType, 
    subtype, 
    truthfulness.percentile
  );
  
  // Determine share image path based on object type and subtypes
  let shareImagePath = imagePath;
  if (data.objectType === 'other_rod' && (subtype === 'male_feature' || truthfulness.isMaleFeature)) {
    // For male features, use a default image for sharing instead of the uploaded one
    shareImagePath = '/result.jpg';
  }
  
  // Return results with all processed data
  return {
    multipleObjects: data.multipleObjects || false,
    lowQuality: data.lowQuality || false,
    objectType: data.objectType as ObjectType,
    subtype,
    dimensions,
    scores: {
      freshness: typeof data.freshnessScore === 'number' ? data.freshnessScore : 0,
      overall: typeof data.overallScore === 'number' ? data.overallScore : 0,
      final: finalScore.score
    },
    comments: {
      main: commentText,
      suggestion
    },
    credibilityScore: finalScore.credibilityScore,
    truth: truthfulness,
    imagePath,
    shareImagePath
  };
}

// =================================
// API Route Handler (POST)
// =================================

// Feature flag (could be moved to env vars)
// const enableTruthDetectionFeature = true; 

export async function POST(req: NextRequest) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  try {
    // --- Request Validation ---
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null; // Use File type
    const tempImagePath = formData.get('tempImagePath') as string || ''; // Temp path from client
    const enableTruthDetection = formData.get('enableTruthDetection') === 'true'; // Check if feature enabled by client

    if (!imageFile) {
      return NextResponse.json( { error: { code: 'MISSING_IMAGE', message: '請上傳圖片檔案' } }, { status: 400, headers } );
    }

    // Check file size (e.g., 10 MB limit)
    const maxSizeInBytes = 10 * 1024 * 1024; 
    if (imageFile.size > maxSizeInBytes) {
      return NextResponse.json( { error: { code: 'IMAGE_TOO_LARGE', message: '圖片檔案大小超過限制 (最大10MB)' } }, { status: 400, headers } );
    }

    // Check file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(imageFile.type)) {
      return NextResponse.json( { error: { code: 'INVALID_FILE_TYPE', message: '請上傳有效的圖片檔案 (JPEG, PNG, GIF, WEBP)' } }, { status: 400, headers } );
    }

    // --- Image Processing & Gemini Analysis ---
    const imageBytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(imageBytes);
    const base64Image = buffer.toString('base64');

    // Analyze image with Gemini (includes parsing and basic validation)
    const initialAnalysisResult: AnalysisResult = await analyzeImageWithGemini(base64Image);
    
    // Add the temporary image path provided by the client
    initialAnalysisResult.originalImagePath = tempImagePath;

    // --- Handle Gemini Analysis Errors & Basic Validation ---
    if (initialAnalysisResult.error) {
      return NextResponse.json( { error: { code: 'API_ERROR', message: initialAnalysisResult.error } }, { status: 500, headers } );
    }
    if (initialAnalysisResult.multipleObjects) {
      return NextResponse.json( { error: { code: 'MULTIPLE_OBJECTS', message: '圖片中包含多個物體，請上傳一個小黃瓜或香蕉的清晰照片' } }, { status: 400, headers } );
    }
    if (initialAnalysisResult.lowQuality) {
      return NextResponse.json( { error: { code: 'LOW_QUALITY', message: '圖片質量不佳，請上傳更清晰的照片' } }, { status: 400, headers } );
    }
    if (!initialAnalysisResult.objectType) {
      return NextResponse.json( { error: { code: 'INVALID_OBJECT', message: '無法辨識有效的小黃瓜或香蕉，請確認上傳的圖片' } }, { status: 400, headers } );
    }
    
    // --- Prepare Data (Random or Real) ---
    let data: AnalysisResult;
    // Unused variable removed
    // let useRandomData = false;

    // Use random data in development if flag is set
    if (process.env.NODE_ENV === 'development' && process.env.USE_RANDOM_DATA === 'true') {
      // useRandomData = true; // This variable was unused
      const randomData = getRandomData(initialAnalysisResult.objectType as 'cucumber' | 'banana' | 'other_rod');
      data = {
        ...initialAnalysisResult, // Start with initial result structure
        objectType: randomData.type,
        lengthEstimate: randomData.length, // Use random estimates
        thicknessEstimate: randomData.thickness,
        freshnessScore: randomData.freshness,
        overallScore: randomData.score,
        commentText: "", // Will be generated below
        // Use random values for processed fields directly
        type: randomData.type,
        length: randomData.length,
        thickness: randomData.thickness,
        freshness: randomData.freshness,
        score: randomData.score,
        comment: "", // Will be generated below
        originalImagePath: tempImagePath // Keep original path
      };
    } else {
      // Use real data from Gemini analysis
      const { adjustedLength, adjustedThickness } = adjustDimensions(
        initialAnalysisResult.lengthEstimate,
        initialAnalysisResult.thicknessEstimate,
        initialAnalysisResult.objectType
      );
      const freshness = Math.max(0, Math.min(10, Math.round(initialAnalysisResult.freshnessScore)));
      const calculatedScore = Math.max(0.0, Math.min(9.5, initialAnalysisResult.overallScore)); // Clamp score
      const finalScore = calculateFinalScore( calculatedScore, freshness, adjustedLength, adjustedThickness, initialAnalysisResult.objectType );
      
      data = {
        ...initialAnalysisResult, // Start with initial analysis result
        // Overwrite/add processed fields
        type: initialAnalysisResult.objectType,
        length: Math.round(adjustedLength * 10) / 10, // Round to one decimal
        thickness: Math.round(adjustedThickness * 10) / 10,
        freshness: freshness,
        score: finalScore,
        comment: initialAnalysisResult.commentText || "" // Use Gemini comment initially
      };
    }

    // Generate fallback comment if needed
    if (!data.comment || data.comment.trim() === "") {
      const fallbackComment = generateComment(data);
      data.comment = fallbackComment;
      // Also update commentText if it was empty, consistency for fallback case
      if (!data.commentText || data.commentText.trim() === "") {
          data.commentText = fallbackComment;
      }
    }

    // --- Final Processing (Truth Analysis) ---
    // Process results further (adds truth analysis and share image path)
    const truthAnalysisResult = await processAnalysisResults(data);
    
    // --- Construct Final Response ---
    // Create the final result object sent to the client
    const finalClientResult: AnalysisResult = {
      // Include all processed fields from `data`
      objectType: data.objectType,
      multipleObjects: data.multipleObjects,
      lowQuality: data.lowQuality,
      lengthEstimate: data.lengthEstimate,
      thicknessEstimate: data.thicknessEstimate,
      freshnessScore: data.freshnessScore,
      overallScore: data.overallScore,
      commentText: data.commentText,
      isMaleFeature: data.isMaleFeature,
      rodSubtype: data.rodSubtype,
      type: data.type,
      length: data.length,
      thickness: data.thickness,
      freshness: data.freshness,
      score: data.score,
      comment: data.comment,
      originalImagePath: data.originalImagePath,
      
      // Add truth analysis info if enabled
      truthAnalysis: enableTruthDetection ? {
        truthScore: truthAnalysisResult.truthScore,
        isSuspicious: truthAnalysisResult.isSuspicious,
        suspiciousFeatures: truthAnalysisResult.suspiciousFeatures,
        adjustedLength: truthAnalysisResult.adjustedLength,
        adjustmentFactor: truthAnalysisResult.adjustmentFactor,
        funnyMessage: truthAnalysisResult.funnyMessage,
        suggestionMessage: truthAnalysisResult.suggestionMessage
      } : undefined,
      
      // Add the final share image path
      shareImagePath: truthAnalysisResult.shareImagePath
    };

    // Return the final analysis result
    return NextResponse.json(finalClientResult, { status: 200, headers });

  } catch (error: unknown) {
    console.error('API Route Analysis error:', error);
    // Handle unexpected errors during request processing
    const errorMessage = error instanceof Error ? error.message : '未知伺服器錯誤';
    const errorCode = error instanceof Error && error.name === 'TimeoutError' ? 'TIMEOUT_ERROR' : 'GENERAL_ERROR';
    
    return NextResponse.json(
      { error: { code: errorCode, message: `伺服器處理過程中發生錯誤: ${errorMessage}` } },
      { status: 500, headers }
    );
  }
} 