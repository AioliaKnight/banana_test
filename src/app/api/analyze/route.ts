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
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
      }
    });

    // 設置超時處理
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API request timeout')), 15000);
    });

    // 準備提示詞
    const promptText = `你是專業的蔬果分析師。請分析這張圖片中的物體，專注於以下幾點：

1. **物體類型判斷**：
   - 這是小黃瓜還是香蕉？如果都不是，但是棒狀物體，請標識為"other_rod"。
   - 如果圖片中有多個主要物體，請將multipleObjects設為true。
   - 如果圖片質量太差（太暗、太模糊等），請將lowQuality設為true。
   - 若無法確定物體類型，objectType應為null。

2. **尺寸估計**：
   - 估計物體的長度（厘米），使用數字，例如18.5
   - 估計物體的粗細/直徑（厘米），使用數字，例如3.2
   - 如果物體品質極差或根本不符合標準，可以評為0厘米

3. **品質評估與評分標準**：
   - 給物體的新鮮度評分，使用0-10的整數，0表示完全不新鮮或變質
   - 給物體的總體品質評分，使用0-10的數字，可以有小數點，0表示完全不合格

   評分標準細則：
   a) 總體品質評分(overallScore)：
      - 0-2.9分：品質極差，完全不合格，幾乎沒有使用價值
      - 3-4.9分：品質較差，形狀有明顯問題，色澤不佳，市場價值較低
      - 5-6.9分：品質一般，基本達到市場標準，屬於普通蔬果
      - 7-8.4分：品質良好，外觀和大小優於平均水平
      - 8.5-10分：品質卓越，只有少數完美樣本應得此分數
   
   b) 新鮮度評分(freshnessScore)：
      - 0分：已經腐爛變質，完全不能食用
      - 1-3分：即將變質，不建議食用
      - 4-5分：較舊但仍可食用
      - 6-7分：尚新鮮，屬於超市常見水平
      - 8-10分：非常新鮮，剛摘採或配送

   c) 評分注意事項：
      - 大多數樣本應在4-7分區間，符合正態分布
      - 即使外觀良好的樣本也會有小瑕疵，請考慮這些因素
      - 不同瑕疵影響不同方面的評分：彎曲影響形狀評分，顏色異常影響新鮮度
      - 過分完美的形狀可能反而不自然，要考慮真實蔬果的自然變化
      - 品質極差或不合格的樣本應勇於給出0-3分的低分

   d) 比較基準：
      - 標準小黃瓜：通常長15-20cm，直徑2.5-4cm，表面平滑有光澤，微彎是正常的
      - 優質香蕉：通常長15-20cm，中等彎曲度，顏色均勻黃，無大面積黑斑
      - 台灣男性特徵：若判斷為other_rod且疑似男性特徵，以台灣男性平均長度12.5cm為參考值
      - 超過30cm的男性特徵在台灣地區極為罕見（除非是特例），遇此情況應謹慎評分

4. **專業評語**：
   - 撰寫一段專業評語，從女性角度，以親切俏皮的語調評論該物體。
   - 使用繁體中文，符合台灣的網路用語，口吻像是在和閨蜜對話，但是對男性的抱怨與品頭論足。
   - 評語內容應詳盡豐富，包含物體的外觀、品質、形狀、尺寸等多方面分析。
   - 如果是標準水果（香蕉或小黃瓜），評論其尺寸、形狀、品質等方面，並添加更多生動細節和比喻。
   - **特別重要**：如果是"other_rod"，請寫一段更加詳細且有趣的評語，若圖片明確與男性特徵相關,加入女性對男性視角的對話式評論，可以使用「親愛的」等稱呼,不可以一昧吹捧，也要有趣的嘲諷批評。
   - 如果是疑似男性特徵，可參考台灣男性平均長度12.5cm作為評論基準，超過或低於平均值過多都可以適當評論，女性多數較喜歡15cm以上的
   - 對於"other_rod"的評語應該富有個性，加點吐槽，可以調皮幽默，可以針對任何給予女性價值觀的中肯建議。
   - 評語保持在150-250字之間，確保內容豐富有趣，能夠吸引讀者。
   - 評語應該反映評分結果，不要出現評分低但評語過於正面的矛盾情況。
   - 如果給出低分（0-3分），評語應該直接指出問題並提供詼諧的批評

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

請確保返回的JSON格式正確且可解析。每個字段都必須存在，數值字段必須是數字而非字符串。請勿虛高評分，應反映真實水平。對於特例應謹慎評分，尤其是台灣地區男性特徵相關評估。`;

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

    // 開發環境下的模擬數據生成
    let data: AnalysisResult;
    let useRandomData = false;

    if (process.env.NODE_ENV === 'development' && process.env.USE_RANDOM_DATA === 'true') {
      useRandomData = true;
      data = { ...getRandomData(analysisResult.objectType), comment: "" };
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

    // 返回最終分析結果
    return NextResponse.json(data, { status: 200, headers });
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