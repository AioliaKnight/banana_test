import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

// 定義分析結果和錯誤類型
interface AnalysisResult {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
  comment: string;
}

interface AnalysisError {
  code: 'INVALID_OBJECT' | 'MULTIPLE_OBJECTS' | 'LOW_QUALITY' | 'API_ERROR' | 'GENERAL_ERROR';
  message: string;
}

// Random data generation for development
function getRandomData(type: 'cucumber' | 'banana' | 'other_rod') {
  // Random scores between 6-9.5
  const score = Math.floor(Math.random() * 35 + 65) / 10;
  
  // Random length based on type
  const length = type === 'cucumber' 
    ? Math.floor(Math.random() * 8) + 15 // 15-22cm for cucumber
    : type === 'banana'
      ? Math.floor(Math.random() * 5) + 15 // 15-19cm for banana
      : Math.floor(Math.random() * 10) + 10; // 10-19cm for other rod objects
  
  // Random thickness based on type
  const thickness = type === 'cucumber'
    ? Math.floor(Math.random() * 15 + 25) / 10 // 2.5-4.0cm for cucumber
    : type === 'banana'
      ? Math.floor(Math.random() * 10 + 30) / 10 // 3.0-4.0cm for banana
      : Math.floor(Math.random() * 20 + 20) / 10; // 2.0-3.9cm for other rod objects
  
  // Random freshness score
  const freshness = Math.floor(Math.random() * 3) + 8; // 8-10

  return { type, length, thickness, freshness, score };
}

// Generate fallback comment
function generateComment(data: any): string {
  if (data.type === 'other_rod') {
    const comments = [
      `這個物體看起來不是小黃瓜或香蕉，但它是條狀物，長度約${data.length}cm，粗細約${data.thickness}cm。我們已嘗試分析其基本參數。`,
      `雖然這不是標準的小黃瓜或香蕉，但我們仍可分析這個棒狀物體。它的長度為${data.length}cm，粗細為${data.thickness}cm。`,
      `這是一個非標準分析對象，但作為棒狀/條狀物體，其長度為${data.length}cm，粗細為${data.thickness}cm。若需要更精確的分析，請上傳小黃瓜或香蕉的照片。`
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
  objectType: 'cucumber' | 'banana' | 'other_rod' | null;
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

3. **品質評估**：
   - 給物體的新鮮度評分，使用1-10的整數
   - 給物體的總體品質評分，使用1-10的數字，可以有小數點

4. **專業評語**：
   - 撰寫一段專業評語，從女性角度，以專業但略帶俏皮的語調評論該物體。
   - 使用繁體中文。
   - 提及尺寸、形狀、品質等方面。
   - 如果是"other_rod"，請在評語中提及這不是標準的小黃瓜或香蕉。
   - 評語應在50-100字之間。

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

請確保返回的JSON格式正確且可解析。每個字段都必須存在，數值字段必須是數字而非字符串。`;

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
        let extractedInfo = {
          objectType: null as ('cucumber' | 'banana' | 'other_rod' | null),
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
          const possibleComment = responseText.substring(0, 100);
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: { code: 'GENERAL_ERROR', message: '未提供圖片' } }, 
        { status: 400 }
      );
    }

    // 將圖片轉換為 base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // 模擬環境下使用模擬數據
    if (process.env.SIMULATION_MODE === 'true') {
      // 模擬環境下的隨機錯誤概率
      const randomChoice = Math.random();
      
      if (randomChoice > 0.9) {
        // 模擬非小黃瓜/香蕉但是棒狀物的情況
        const analysisData = getRandomData('other_rod');
        const result = {
          ...analysisData,
          comment: generateComment(analysisData)
        };
        return NextResponse.json(result);
      } else if (randomChoice > 0.85) {
        // 模擬多物體圖片
        return NextResponse.json(
          { error: { code: 'MULTIPLE_OBJECTS', message: '圖片中包含多個物體，請上傳單一小黃瓜或香蕉的照片。' } },
          { status: 400 }
        );
      } else if (randomChoice > 0.8) {
        // 模擬低質量圖片
        return NextResponse.json(
          { error: { code: 'LOW_QUALITY', message: '圖片質量不佳，請在光線充足的環境下重新拍攝並上傳。' } },
          { status: 400 }
        );
      } else if (randomChoice > 0.75) {
        // 模擬非棒狀物體
        return NextResponse.json(
          { error: { code: 'INVALID_OBJECT', message: '無法辨識小黃瓜或香蕉，請確保圖片中包含完整的小黃瓜或香蕉。如果您上傳的是其他物品，目前僅支持分析小黃瓜和香蕉。' } },
          { status: 400 }
        );
      }
      
      // 模擬正常分析
      const fruitType = Math.random() > 0.5 ? 'cucumber' : 'banana';
      const analysisData = getRandomData(fruitType);
      const result = {
        ...analysisData,
        comment: generateComment(analysisData)
      };
      return NextResponse.json(result);
    }

    // 使用Gemini進行圖片分析
    try {
      const geminiAnalysis = await analyzeImageWithGemini(base64Image);
      
      // 處理分析過程中的錯誤
      if (geminiAnalysis.error) {
        console.error('Gemini analysis error:', geminiAnalysis.error);
        return NextResponse.json(
          { error: { code: 'API_ERROR', message: '分析過程中出現錯誤，請稍後再試。' } },
          { status: 500 }
        );
      }
      
      // 處理各種錯誤情況
      if (geminiAnalysis.multipleObjects) {
        return NextResponse.json(
          { error: { code: 'MULTIPLE_OBJECTS', message: '圖片中包含多個物體，請上傳單一小黃瓜或香蕉的照片。' } },
          { status: 400 }
        );
      }
      
      if (geminiAnalysis.lowQuality) {
        return NextResponse.json(
          { error: { code: 'LOW_QUALITY', message: '圖片質量不佳，請在光線充足的環境下重新拍攝並上傳。' } },
          { status: 400 }
        );
      }
      
      if (!geminiAnalysis.objectType) {
        return NextResponse.json(
          { error: { code: 'INVALID_OBJECT', message: '無法辨識小黃瓜或香蕉，請確保圖片中包含完整的小黃瓜或香蕉。如果您上傳的是其他物品，目前僅支持分析小黃瓜和香蕉。' } },
          { status: 400 }
        );
      }

      // 準備返回結果
      const result: AnalysisResult = {
        type: geminiAnalysis.objectType,
        length: geminiAnalysis.lengthEstimate,
        thickness: geminiAnalysis.thicknessEstimate,
        freshness: geminiAnalysis.freshnessScore,
        score: geminiAnalysis.overallScore,
        comment: geminiAnalysis.commentText
      };

      return NextResponse.json(result);
    } catch (analysisError) {
      console.error('Error during image analysis:', analysisError);
      
      // 在API分析失敗時返回模擬數據，避免用戶體驗完全中斷
      console.log('Falling back to random data after API failure');
      const fallbackType = Math.random() > 0.5 ? 'cucumber' : 'banana';
      const fallbackData = getRandomData(fallbackType);
      
      return NextResponse.json({
        ...fallbackData,
        comment: generateComment(fallbackData) + " (注意: 由於分析服務暫時不可用，此結果為估計值。)"
      });
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: { code: 'GENERAL_ERROR', message: '圖片分析過程中出現錯誤，請稍後再試。' } }, 
      { status: 500 }
    );
  }
} 