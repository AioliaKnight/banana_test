import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { analyzeTruth, adjustDimensions, calculateFinalScore, getSuggestionMessage, CONFIG } from '@/components/utils/TruthDetector';
import { AnalysisResult, ObjectType, TruthAnalysisResult as SharedTruthAnalysisResult } from '@/types';

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

// Gemini Prompt Templates
const promptTemplates = {
  // 優化提示詞，更符合台灣年輕女性語言風格
  optimizedPrompt: `你是一位台灣年輕女性，專精蔬果評論與棒狀物尺寸分析專家。你要分析上傳圖片中物體的長度、粗細與外觀品質，並給予幽默、有趣、貼近網路語言的評論。請根據圖片內容提供以下資訊：

1. **物體類型判斷**：
- 判斷物體類型為：
  - "cucumber"：小黃瓜
  - "banana"：香蕉
  - "other_rod"：其他棒狀物體
- 如果是其他棒狀物體，請進一步判斷是否為男性特徵：
  - \`isMaleFeature = 1\`：具有男性陰莖特徵
  - \`isMaleFeature = 0\`：無特殊男性特徵
- 如圖片中有多個物體，請標記 \`multipleObjects = true\`
- 若圖片模糊或遮蔽影響辨識，請標記 \`lowQuality = true\`

2. **尺寸評估與品質打分**：
- 根據圖片內容提供以下預估值（單位：cm）：
  - \`lengthEstimate\`: 長度
  - \`thicknessEstimate\`: 粗細／直徑
- 如果是男性特徵，請嚴格以台灣平均尺寸為基準（平均12.2cm, 範圍1~30cm），避免過度誇張
- \`freshnessScore\`：0~10分，外觀與色澤新鮮度評比
- \`overallScore\`：0~10分，綜合打分

3. **創意評論產出**：
- 根據物體類型，使用以下語氣風格撰寫150-250字的評論：
  A. **小黃瓜／香蕉** → 專業+搞笑混搭，像「一本正經講幹話」，適合發 Dcard：
  B. **男性特徵** → 用「女性閨蜜」視角，語氣可以毒舌：
  C. **一般棒狀物** → 要有趣、迷因感：
- 評論語氣要符合台灣女性使用 IG / Dcard / 小紅書的風格，結合時事、迷因、生活感觀察。

4. **請用JSON格式輸出**：

\`\`\`json
{
  "objectType": "cucumber" | "banana" | "other_rod" | null,
  "isMaleFeature": 1 | 0,
  "multipleObjects": true | false,
  "lowQuality": true | false,
  "lengthEstimate": 數字,
  "thicknessEstimate": 數字,
  "freshnessScore": 數字,
  "overallScore": 數字,
  "commentText": "文字，若為男性特徵加前綴[male_feature]，其他棒狀物加[regular_rod]"
}
\`\`\`
`
};

// =================================
// Helper Functions - Data Generation & Formatting
// =================================

/**
 * Generates random data for development purposes.
 * Uses dimension limits from the imported CONFIG.
 */
function getRandomData(type: 'cucumber' | 'banana' | 'other_rod'): RandomDataResult {
  // Use dimension limits from the imported CONFIG
  const limits = CONFIG.dimensionLimits[type] || CONFIG.dimensionLimits.default;
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
 */
function getPromptForObjectType(): string {
  return promptTemplates.optimizedPrompt;
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
        temperature: 0.2,  // 降低溫度，提高準確性
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
    const promptText = getPromptForObjectType();

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
      
      // 簡化並統一 male_feature 判斷邏輯
      let isMaleFeature: boolean | undefined = undefined;
      let commentText = parsedResponse.commentText || "";
      
      // 檢查 isMaleFeature 數值並轉換為布林值
      if (parsedResponse.objectType === 'other_rod') {
        if (parsedResponse.isMaleFeature === 1) {
          isMaleFeature = true;
        } else if (parsedResponse.isMaleFeature === 0) {
          isMaleFeature = false;
        }
        
        // 備用：標記檢查
        if (isMaleFeature === undefined) {
          if (commentText.startsWith('[male_feature]')) {
            isMaleFeature = true;
            commentText = commentText.substring('[male_feature]'.length).trim();
          } else if (commentText.startsWith('[regular_rod]')) {
            isMaleFeature = false;
            commentText = commentText.substring('[regular_rod]'.length).trim();
          }
        }
      }
      
      // 確保評論中的標記被移除
      if (commentText.startsWith('[male_feature]')) {
        commentText = commentText.substring('[male_feature]'.length).trim();
      } else if (commentText.startsWith('[regular_rod]')) {
        commentText = commentText.substring('[regular_rod]'.length).trim();
      }
      
      // Ensure all properties exist and have correct types
      const objectTypeResult: ObjectType = ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) 
          ? parsedResponse.objectType : null;

      return {
        objectType: objectTypeResult,
        rodSubtype: objectTypeResult === 'other_rod' ? (isMaleFeature ? 'male_feature' : 'regular_rod') : undefined,
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
        
        // 簡化並統一 male_feature 判斷邏輯
        let isMaleFeature: boolean | undefined = undefined;
        let commentText = parsedResponse.commentText || "";
        
        // 檢查 isMaleFeature 數值並轉換為布林值
        if (parsedResponse.objectType === 'other_rod') {
          if (parsedResponse.isMaleFeature === 1) {
            isMaleFeature = true;
          } else if (parsedResponse.isMaleFeature === 0) {
            isMaleFeature = false;
          }
          
          // 備用：標記檢查
          if (isMaleFeature === undefined) {
            if (commentText.startsWith('[male_feature]')) {
              isMaleFeature = true;
              commentText = commentText.substring('[male_feature]'.length).trim();
            } else if (commentText.startsWith('[regular_rod]')) {
              isMaleFeature = false;
              commentText = commentText.substring('[regular_rod]'.length).trim();
            }
          }
        }
        
        // 確保評論中的標記被移除
        if (commentText.startsWith('[male_feature]')) {
          commentText = commentText.substring('[male_feature]'.length).trim();
        } else if (commentText.startsWith('[regular_rod]')) {
          commentText = commentText.substring('[regular_rod]'.length).trim();
        }
        
        const objectTypeResult: ObjectType = ['cucumber', 'banana', 'other_rod'].includes(parsedResponse.objectType) ? parsedResponse.objectType : null;
        
        return {
          objectType: objectTypeResult,
          rodSubtype: objectTypeResult === 'other_rod' ? (isMaleFeature ? 'male_feature' : 'regular_rod') : undefined,
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
    
    // 統一 isMaleFeature 判斷邏輯
    // 先尋找明確的 isMaleFeature 數值
    const isMaleFeatureMatch = responseText.match(/isMaleFeature['"]?\s*[:=]\s*(\d+)/i);
    if (isMaleFeatureMatch && isMaleFeatureMatch[1]) {
      // 轉換為布林值: 1 -> true, 0 -> false
      extractedInfo.isMaleFeature = isMaleFeatureMatch[1] === '1';
      extractedInfo.rodSubtype = extractedInfo.isMaleFeature ? 'male_feature' : 'regular_rod';
    } else {
      // 備用：關鍵詞判斷
      const maleKeywords = ['陰莖', '生殖器', '男性特徵', 'penis', 'male organ', '[male_feature]'];
      const isLikelyMale = maleKeywords.some(keyword => responseText.toLowerCase().includes(keyword.toLowerCase()));
      extractedInfo.isMaleFeature = isLikelyMale;
      extractedInfo.rodSubtype = isLikelyMale ? 'male_feature' : 'regular_rod';
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
 * Processes the raw analysis results, adding truthfulness analysis and share image path.
 * @param {AnalysisResult} analysisResults The basic analysis results from Gemini (or fallback).
 * @returns {Promise<AnalysisResult & SharedTruthAnalysisResult>} The fully processed analysis result.
 */
async function processAnalysisResults(analysisResults: AnalysisResult): Promise<AnalysisResult & SharedTruthAnalysisResult> {
  // 檢查是否為 Blob URL 的通用函數
  const isBlobUrl = (url: string) => url && typeof url === 'string' && url.startsWith('blob:');
  
  try {
    // Define default truth analysis structure and share image path for error cases
    const defaultTruthAnalysis: SharedTruthAnalysisResult = {
        truthScore: 75, isSuspicious: false, suspiciousFeatures: [],
        funnyMessage: "無法進行真實性分析，請嘗試上傳更清晰的照片。",
        suggestionMessage: "請確保照片清晰且只包含一個物體。"
        // adjustedLength and adjustmentFactor are optional
    };
    
    // 設置默認分享圖片路徑，不使用 Blob URL
    const defaultShareImagePath = (analysisResults.originalImagePath && !isBlobUrl(analysisResults.originalImagePath)) 
        ? analysisResults.originalImagePath 
        : "/uploads/default.jpg";

    // If there's an error in the initial analysis, return immediately with defaults
    if (analysisResults.error) {
      return {
        ...analysisResults,
        ...defaultTruthAnalysis,
        shareImagePath: defaultShareImagePath
      } as AnalysisResult & SharedTruthAnalysisResult;
    }
    
    // --- Perform Truth Analysis & Determine Share Image --- 
    
    // Extract necessary fields
    const { objectType, lengthEstimate, thicknessEstimate, rodSubtype, isMaleFeature, originalImagePath } = analysisResults;

    // 1. Analyze truthfulness using the utility function
    const truthAnalysisCore = analyzeTruth( objectType, lengthEstimate, thicknessEstimate, rodSubtype );

    // 2. Generate suggestion message based on truth score
    const suggestionMessage = getSuggestionMessage( truthAnalysisCore.truthScore, objectType, rodSubtype, lengthEstimate );
    
    // 3. Determine the appropriate share image path
    let shareImagePath = "/uploads/default.jpg"; // 預設使用服務器上的默認圖片
    
    // 對於男性特徵，始終使用默認圖片
    if (objectType === 'other_rod' && (rodSubtype === 'male_feature' || isMaleFeature === true)) {
      shareImagePath = "/result.jpg"; // 使用預設男性特徵圖片
    } 
    // 對於其他類型，如果原始圖片路徑不是 Blob URL，則使用原始圖片
    else if (originalImagePath && !isBlobUrl(originalImagePath)) {
      shareImagePath = originalImagePath;
    }
    // 其他情況使用默認圖片路徑 (/uploads/default.jpg)
    
    // --- Construct Final Result ---

    // Construct the final truthAnalysis object, adding the suggestion message
    const finalTruthAnalysis: SharedTruthAnalysisResult = {
        ...truthAnalysisCore,
        suggestionMessage: suggestionMessage || "無法生成建議信息。" // Add fallback for suggestion
    };

    // Ensure a funny message exists
    if (!finalTruthAnalysis.funnyMessage) {
      finalTruthAnalysis.funnyMessage = "分析完成，但無法產生幽默評論。";
    }

    // Combine base results, truth analysis results, and share image path
    return {
        ...analysisResults,
        ...finalTruthAnalysis,
        shareImagePath: shareImagePath
    } as AnalysisResult & SharedTruthAnalysisResult;

  } catch (error) {
    console.error("處理分析結果時出錯:", error);
    // Use predefined defaults in case of error during this processing step
    const defaultTruthAnalysisOnError: SharedTruthAnalysisResult = {
        truthScore: 75, isSuspicious: false, suspiciousFeatures: [],
        funnyMessage: "處理結果時發生錯誤，無法提供完整分析。",
        suggestionMessage: "請稍後再試或嘗試上傳其他照片。"
    };
    
    // 設置錯誤情況下的默認分享圖片路徑，不使用 Blob URL
    const defaultShareImagePathOnError = (analysisResults.originalImagePath && !isBlobUrl(analysisResults.originalImagePath)) 
        ? analysisResults.originalImagePath 
        : "/uploads/default.jpg";
    
    return {
      ...analysisResults,
      ...defaultTruthAnalysisOnError,
      shareImagePath: defaultShareImagePathOnError
    } as AnalysisResult & SharedTruthAnalysisResult;
  }
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
    
    // Use random data in development if flag is set
    if (process.env.NODE_ENV === 'development' && process.env.USE_RANDOM_DATA === 'true') {
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