import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { analyzeTruth, adjustDimensions, calculateFinalScore, ObjectType, getSuggestionMessage, TruthAnalysisResult } from '@/components/utils/TruthDetector';

// 定義API分析結果接口
interface AnalysisResult {
  objectType: 'cucumber' | 'banana' | 'other_rod';
  rodSubtype?: 'male_feature' | 'regular_rod';
  multipleObjects: boolean;
  lowQuality: boolean;
  lengthEstimate: number;
  thicknessEstimate: number;
  freshnessScore: number;
  overallScore: number;
  commentText: string;
  isMaleFeature?: boolean;
  error?: string;
  type?: 'cucumber' | 'banana' | 'other_rod';
  comment?: string;
  length?: number;
  thickness?: number;
  freshness?: number;
  score?: number;
  truthAnalysis?: TruthAnalysisResult;
  originalImagePath?: string; // 用户上传的原始图片路径
  shareImagePath?: string;    // 用于分享的图片路径
  [key: string]: unknown;     // 添加索引签名，使其兼容 Record<string, unknown>
}

// 开发环境下使用的模拟数据对象
interface RandomDataResult {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
}

// Random data generation for development
function getRandomData(type: 'cucumber' | 'banana' | 'other_rod'): RandomDataResult {
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
      // 一般棒狀物評論集 - 幽默風趣且帶有適當暗示的風格
      const regularRodComments = [
        `哎呀～這不是小黃瓜也不是香蕉呢！這個特別的棒狀物真有趣，長度約${data.length}cm，粗細約${data.thickness}cm。嗯...形狀很獨特，讓人忍不住浮想聯翩～如果這是某種道具，我想它的功能性應該相當不錯！不過親愛的，如果妳想知道水果的品質分析，下次上傳真正的小黃瓜或香蕉會更好哦～`,
        
        `嘿嘿，看來今天不是來測量水果的嘛！這個有趣的棒狀物長${data.length}cm，粗細${data.thickness}cm，尺寸還挺可觀的！如果這是我想的那種物品，那麼它應該能帶來不少樂趣...但如果只是普通物品，那我的想像力可能太豐富了！想要專業水果評測的話，記得下次上傳真正的水果照片哦～`,
        
        `喔！這個形狀真是...令人遐想呢～雖然不是我們常分析的水果，但這個棒狀物看起來挺有意思的。長度${data.length}cm，粗細${data.thickness}cm，比例協調。不知道這是用來做什麼的呢？不管用途是什麼，有這種尺寸規格應該很受歡迎吧！如果是想測量真正的水果，下次請上傳小黃瓜或香蕉照片哦～`,
        
        `親愛的，這可不是我們通常分析的水果類型呢！但必須承認，這個棒狀物體長${data.length}cm，粗${data.thickness}cm的尺寸，在某些「特殊場合」應該會很受歡迎～形狀流暢，粗細適中，看起來使用起來應該很...舒適！不過，為了讓我們專注於水果評測的正業，下次還是上傳真正的蔬果照片比較好哦！`
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
  baseRoleAndGoal: `你是一位超級活潑、敢講敢說的女性蔬果測量評論專家，風格像是閨蜜間的私密對話。你對香蕉、小黃瓜和各種棒狀物的尺寸形狀有獨特品味，會根據識別的物體類型調整你的評論風格：

不同物體類型的角色定位：
- 小黃瓜和香蕉：專業蔬果評論家，混合專業知識與幽默風格
- 男性特徵 (Male Feature)：閨蜜間尖酸刻薄的點評專家，標準極高
- 一般棒狀物 (Regular Rod)：幽默風趣的觀察者，帶有適度暗示但不過度露骨`,
  
  // 物體類型判斷指南
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
  
  // 尺寸估計與風格評價指南
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
  
  // 評分系統指南
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
  
  // 評論風格指南
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
  
  // 回應格式要求
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
  rodSubtype?: 'male_feature' | 'regular_rod';  // 明確的 other_rod 子類型
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
      let rodSubtype: 'male_feature' | 'regular_rod' | undefined = undefined;
      let commentText = parsedResponse.commentText || "";
      
      // 檢測和移除標記
      if (commentText.includes('[male_feature]')) {
        isMaleFeature = true;
        rodSubtype = 'male_feature';
        commentText = commentText.replace('[male_feature]', '').trim();
      } else if (commentText.includes('[regular_rod]')) {
        isMaleFeature = false;
        rodSubtype = 'regular_rod';
        commentText = commentText.replace('[regular_rod]', '').trim();
      }
      
      // 確保所有屬性都存在並有正確類型
      return {
        objectType: ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) 
          ? parsedResponse.objectType : null,
        rodSubtype: parsedResponse.objectType === 'other_rod' ? rodSubtype : undefined,
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
        let rodSubtype: 'male_feature' | 'regular_rod' | undefined = undefined;
        let commentText = parsedResponse.commentText || "";
        
        // 檢測和移除標記
        if (commentText.includes('[male_feature]')) {
          isMaleFeature = true;
          rodSubtype = 'male_feature';
          commentText = commentText.replace('[male_feature]', '').trim();
        } else if (commentText.includes('[regular_rod]')) {
          isMaleFeature = false;
          rodSubtype = 'regular_rod';
          commentText = commentText.replace('[regular_rod]', '').trim();
        }
        
        return {
          objectType: ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) 
            ? parsedResponse.objectType : null,
          rodSubtype: parsedResponse.objectType === 'other_rod' ? rodSubtype : undefined,
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
  rodSubtype?: 'male_feature' | 'regular_rod';
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
    rodSubtype: undefined as 'male_feature' | 'regular_rod' | undefined,
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
             responseText.toLowerCase().includes('棒狀') || 
             responseText.toLowerCase().includes('條狀')) {
    extractedInfo.objectType = 'other_rod';
    
    // 檢測是否為男性特徵
    const maleKeywords = ['陰莖', '生殖器', '男性特徵', 'penis', 'male organ', '[male_feature]'];
    const isLikelyMale = maleKeywords.some(keyword => 
      responseText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isLikelyMale) {
      extractedInfo.isMaleFeature = true;
      extractedInfo.rodSubtype = 'male_feature';
    } else {
      extractedInfo.isMaleFeature = false;
      extractedInfo.rodSubtype = 'regular_rod';
    }
  }
  
  // 嘗試提取長度估計
  const lengthMatch = responseText.match(/(\d+(?:\.\d+)?)(?:\s*)?(?:cm|厘米|公分)(?:\s*)?(?:長|length)/i);
  if (lengthMatch && lengthMatch[1]) {
    extractedInfo.lengthEstimate = parseFloat(lengthMatch[1]);
  }
  
  // 嘗試提取粗細估計
  const thicknessMatch = responseText.match(/(?:粗細|thickness|diameter|直徑)(?:\s*)?(?:為|是|:|：)?(?:\s*)?(\d+(?:\.\d+)?)(?:\s*)?(?:cm|厘米|公分)/i);
  if (thicknessMatch && thicknessMatch[1]) {
    extractedInfo.thicknessEstimate = parseFloat(thicknessMatch[1]);
  }
  
  // 生成適當的評論內容
  if (extractedInfo.objectType) {
    extractedInfo.commentText = generateComment({
      type: extractedInfo.objectType,
      length: extractedInfo.lengthEstimate,
      thickness: extractedInfo.thicknessEstimate,
      freshness: extractedInfo.freshnessScore,
      isMaleFeature: extractedInfo.isMaleFeature
    });
  }
  
  return extractedInfo;
}

/**
 * 判斷分析結果的真實性并添加共享圖片路徑
 * @param analysisResults 分析結果
 * @returns 附加真實性信息的分析結果
 */
export function detectTruthfulness(analysisResults: AnalysisResult): AnalysisResult & TruthAnalysisResult {
  try {
    // 如果已經有真實性評分，則直接返回
    if ('truthScore' in analysisResults) {
      return analysisResults as AnalysisResult & TruthAnalysisResult;
    }

    // 獲取物體類型、長度和粗細信息
    const { objectType, lengthEstimate, thicknessEstimate, rodSubtype } = analysisResults;

    // 分析真實性並提供反饋
    const truthAnalysis = analyzeTruth(
      objectType, 
      lengthEstimate, 
      thicknessEstimate,
      rodSubtype
    );

    // 添加建議信息
    const suggestedMessage = getSuggestionMessage(
      truthAnalysis.truthScore, 
      objectType, 
      rodSubtype
    );

    // 判斷分享圖片路徑
    // 如果是男性特徵，使用預設圖片；否則使用用戶上傳的原圖
    let shareImagePath = analysisResults.originalImagePath || "";
    if (objectType === 'other_rod' && 
        (rodSubtype === 'male_feature' || analysisResults.isMaleFeature === true)) {
      shareImagePath = "/result.jpg";
    }

    // 合併分析結果和真實性分析結果
    return {
      ...analysisResults,
      ...truthAnalysis,
      suggestionMessage: suggestedMessage,
      shareImagePath: shareImagePath
    };
  } catch (error) {
    console.error("真實性分析過程中出錯:", error);
    
    // 發生錯誤時提供默認值
    return {
      ...analysisResults,
      truthScore: 75, // 默認中等真實度 (0-100範圍)
      isSuspicious: false,
      suspiciousFeatures: [],
      funnyMessage: "無法確定真偽，請謹慎相信這個尺寸...",
      suggestionMessage: "建議再提供一張不同角度的照片，以便更準確判斷。",
      shareImagePath: analysisResults.originalImagePath || "/uploads/default.jpg"
    };
  }
}

/**
 * 處理分析結果，結合真實性檢測等
 * @param analysisResults 基本分析結果
 * @returns 完整處理後的結果
 */
export async function processAnalysisResults(analysisResults: AnalysisResult): Promise<AnalysisResult & TruthAnalysisResult> {
  try {
    // 如果有錯誤，直接返回
    if (analysisResults.error) {
      return {
        ...analysisResults,
        truthScore: 75,
        isSuspicious: false,
        suspiciousFeatures: [],
        funnyMessage: "無法進行真實性分析，請嘗試上傳更清晰的照片。",
        suggestionMessage: "請確保照片清晰且只包含一個物體。",
        shareImagePath: analysisResults.originalImagePath || "/uploads/default.jpg"
      } as AnalysisResult & TruthAnalysisResult;
    }

    // 進行真實性檢測
    const resultsWithTruth = detectTruthfulness(analysisResults);

    // 確保結果包含 funnyMessage
    if (!resultsWithTruth.funnyMessage) {
      resultsWithTruth.funnyMessage = "分析完成，但無法產生幽默評論。";
    }

    // 添加建議信息
    if (!resultsWithTruth.suggestionMessage) {
      // 從 TruthDetector 導入的 getSuggestionMessage 函數
      const suggestion = getSuggestionMessage(
        resultsWithTruth.truthScore,
        analysisResults.objectType,
        analysisResults.rodSubtype,
        analysisResults.lengthEstimate
      );
      resultsWithTruth.suggestionMessage = suggestion;
    }

    return resultsWithTruth;
  } catch (error) {
    console.error("處理分析結果時出錯:", error);
    return {
      ...analysisResults,
      truthScore: 75,
      isSuspicious: false,
      suspiciousFeatures: [],
      funnyMessage: "處理結果時發生錯誤，無法提供完整分析。",
      suggestionMessage: "請稍後再試或嘗試上傳其他照片。",
      shareImagePath: analysisResults.originalImagePath || "/uploads/default.jpg"
    } as AnalysisResult & TruthAnalysisResult;
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
    
    // 可能包含临时图片URL或路径的表单字段
    const tempImagePath = formData.get('tempImagePath') as string || '';

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
    const analysisResult: {
      objectType: ObjectType;
      rodSubtype?: 'male_feature' | 'regular_rod';
      multipleObjects: boolean;
      lowQuality: boolean;
      lengthEstimate: number;
      thicknessEstimate: number;
      freshnessScore: number;
      overallScore: number;
      commentText: string;
      isMaleFeature?: boolean;
      error?: string;
      originalImagePath?: string;
      [key: string]: unknown;
    } = await analyzeImageWithGemini(base64Image);
    
    // 添加原始图片路径
    analysisResult.originalImagePath = tempImagePath;

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
      const randomData = getRandomData(analysisResult.objectType as 'cucumber' | 'banana' | 'other_rod');
      
      data = {
        objectType: randomData.type,
        multipleObjects: false,
        lowQuality: false,
        lengthEstimate: randomData.length,
        thicknessEstimate: randomData.thickness,
        freshnessScore: randomData.freshness,
        overallScore: randomData.score,
        commentText: "",
        type: randomData.type,
        length: randomData.length,
        thickness: randomData.thickness,
        freshness: randomData.freshness,
        score: randomData.score,
        comment: "",
        originalImagePath: tempImagePath
      };
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
        objectType: analysisResult.objectType,
        multipleObjects: analysisResult.multipleObjects,
        lowQuality: analysisResult.lowQuality,
        lengthEstimate: analysisResult.lengthEstimate, 
        thicknessEstimate: analysisResult.thicknessEstimate,
        freshnessScore: analysisResult.freshnessScore,
        overallScore: analysisResult.overallScore,
        commentText: analysisResult.commentText,
        isMaleFeature: analysisResult.isMaleFeature,
        rodSubtype: analysisResult.rodSubtype,
        type: analysisResult.objectType,
        length: Math.round(adjustedLength * 10) / 10, // 保留一位小數
        thickness: Math.round(adjustedThickness * 10) / 10,
        freshness: freshness,
        score: finalScore,
        comment: analysisResult.commentText || "",
        originalImagePath: tempImagePath
      };
    }

    // 合併數據，確保有評語
    if (!data.comment || data.comment.trim() === "") {
      data.comment = useRandomData ? generateComment(data) : analysisResult.commentText || generateComment(data);
    }

    // 添加真實度分析
    const truthAnalysis = await processAnalysisResults(data);
    
    // 創建最終結果
    const result: AnalysisResult = {
      ...data,
      truthAnalysis: enableTruthDetection ? truthAnalysis : undefined,
      shareImagePath: truthAnalysis.shareImagePath
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