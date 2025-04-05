import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { analyzeTruth, isReasonableDimension, adjustDimensions, ObjectType } from '@/components/utils/TruthDetector';

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
    const promptText = `你是一位超級活潑、敢講敢說的女性蔬果測量評論專家，風格像是閨蜜間的私密對話。你對香蕉、小黃瓜和各種棒狀物的尺寸形狀有獨特品味，根據識別的物體類型調整你的評論風格：

1. **物體類型判斷**：
   - 這是小黃瓜還是香蕉？如果都不是，但是棒狀或條狀物體，請標識為"other_rod"。
   - 如果圖片中有多個主要物體，請將multipleObjects設為true。
   - 如果圖片質量太差（太暗、太模糊等），請將lowQuality設為true。
   - 若無法確定物體類型，objectType應為null。

2. **尺寸估計與風格評價**：
   - 用厘米估計物體的長度和粗細/直徑，例如18.5cm長，3.2cm粗
   - 針對不同物體類型採用不同評價風格：
     * 小黃瓜和香蕉：專業幽默的評價風格，例如：
       「這根香蕉有18cm，屬於標準尺寸，形狀彎度也剛好符合黃金比例，切成片後絕對能在水果沙拉裡成為主角」
       「20cm長的小黃瓜！哇，這是超市精選級別的規格，絕對能做出完美的涼拌小黃瓜」
     * other_rod：閨蜜間的私密評論風格，可以有曖昧的隱喻和比較，例如：
       「這個...嗯...15cm長？跟我前男友一樣，總是誇下海口結果令人失望」

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
      - 「彎曲過度」：過於彎曲，外觀受影響 -0.7分

4. **評論風格指南**：
   - 小黃瓜和香蕉：專業、幽默但不過度暗示的評論
     * 專注於果實的品質、形狀、尺寸和適用料理方式
     * 幽默但適度，類似美食評論家的風格
     * 例如：「這根20cm的黃瓜切片後絕對能成為沙拉的主角！彎度適中，粗細均勻，新鮮度給9分毫不誇張。這種品質的小黃瓜絕對是涼拌、醃漬的絕佳選擇，甚至可以考慮做成精緻的小黃瓜卷。皮色碧綠，質地緊實，是我見過最標準的小黃瓜典範之一。」
   
   - other_rod：維持閨蜜間的私密評論風格
     * 像是在閨蜜團體聊天室分享約會對象的評價，毫無保留但不刻意惡意
     * 使用女生之間才懂的梗和隱喻，例如「這根」「那話兒」「小兄弟」等含蓄表達
     * 評論要有真誠建議+惡作劇吐槽的完美平衡，犀利中帶著姐妹情誼
     * 例如：「天啊～這尺寸絕對是約會首選級別的！姐妹們，這種等級的，整個過程直接昇天～如果遇到這種，絕對要把握機會！不然被別人撿走後悔都來不及～」

   a) **水果專業評語範例**：
      - 「這根香蕉長度達到18.5cm，明顯高於市場平均水準。表皮呈現完美的金黃色，沒有任何瑕疵或黑斑，這意味著它處於最佳食用期。彎度恰到好處，方便握持，厚度均勻，估計口感極佳。新鮮度給9分，總體品質達到8.7分，屬於「市場佳品級」。這種香蕉適合直接食用、做冰沙或製作香蕉點心，絕對是挑剔的水果愛好者會選擇的等級！」

   b) **other_rod閨蜜私密評語**：
      - 如果是other_rod，維持現有的閨蜜私密對話風格：
      - 參考台灣男性平均長度12.5cm給予客觀但帶著主觀喜好的評價
      - 除了長度外，也評論形狀、曲度、粗細等維度，並提及這些對女性的重要性
      - 用含蓄曖昧但明白人都懂的方式表達
      - 加入一些「私房建議」

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

請記住：如果是小黃瓜或香蕉，你是專業但幽默的水果評論專家；如果是other_rod，你是活潑敢說的閨蜜風格評論員。根據物體類型調整你的風格！每個字段都必須存在，數值字段必須是數字而非字符串。`;

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

// 處理真實度檢測，整合TruthDetector模組
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
  
  // 使用TruthDetector模組的analyzeTruth函數
  if (objectType && ['cucumber', 'banana', 'other_rod'].includes(objectType)) {
    return analyzeTruth(
      objectType as 'cucumber' | 'banana' | 'other_rod',
      measuredLength,
      measuredThickness
    );
  }
  
  // 對於無法識別的類型，提供默認值
  return {
    isSuspicious: false,
    truthScore: 80,
    adjustedLength: measuredLength,
    adjustmentFactor: 1,
    suspiciousFeatures: [],
    funnyMessage: "無法確定對象類型，無法進行真實度分析。"
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
    const truthAnalysis = detectTruthfulness(
      data.type, 
      data.length, 
      data.thickness, 
      enableTruthDetection
    );
    
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

// 計算最終評分的新輔助函數
function calculateFinalScore(
  baseScore: number,
  freshness: number,
  length: number,
  thickness: number,
  objectType: ObjectType
): number {
  // 1. 基礎分數
  let finalScore = baseScore;
  
  // 2. 合理的尺寸應該有獎勵，不合理的尺寸應該降分
  const isReasonableSize = isReasonableDimension(length, thickness, objectType);
  finalScore += isReasonableSize ? 0.2 : -0.5;
  
  // 3. 新鮮度對總分有影響
  const freshnessImpact = (freshness - 5) * 0.1; // 新鮮度每高於5分加0.1分，低於則減分
  finalScore += freshnessImpact;
  
  // 4. 對於other_rod類型，如果是男性特徵，根據台灣平均長度進行評分調整
  if (objectType === 'other_rod') {
    const taiwanMaleAvgLength = 12.5; // 台灣男性平均長度（參考值）
    if (length > 0) {
      // 計算與平均值的差異，作為評分調整依據
      const lengthDiffRatio = length / taiwanMaleAvgLength;
      
      // 接近平均值±20%的給予正面評價
      if (lengthDiffRatio >= 0.8 && lengthDiffRatio <= 1.2) {
        finalScore += 0.3; // 符合正常範圍加分
      }
      // 過小或過大都有輕微減分
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
  return parseFloat((Math.max(0.0, Math.min(9.5, finalScore))).toFixed(1));
} 