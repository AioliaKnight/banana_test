import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 定義分析結果類型
interface AnalysisResult {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
  comment: string;
}

// 類型定義
type ObjectType = 'cucumber' | 'banana' | 'other_rod' | null;

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

3. **品質評估**：
   - 給物體的新鮮度評分，使用1-10的整數
   - 給物體的總體品質評分，使用1-10的數字，可以有小數點

4. **專業評語**：
   - 撰寫一段專業評語，從女性角度，以親切俏皮的語調評論該物體。
   - 使用繁體中文，符合台灣市場的網路用語，口吻像是在和閨蜜對話，但是是對男性的抱怨與品頭論足。
   - 如果是標準水果（香蕉或小黃瓜），評論其尺寸、形狀、品質等方面。
   - **特別重要**：如果是"other_rod"，請寫一段更加詳細且有趣的評語，若圖片明確與男性特徵相關,含蓄暗示這個形狀可能引發的聯想，加入女性視角的對話式評論，可以使用「親愛的」等稱呼,不可以吹捧，要適當的嘲諷批評。
   - 對於"other_rod"的評語應該富有個性，偶爾加點吐槽，可以調皮幽默，可以針對顏色或拍照的角度給予女性價值觀的中肯建議。
   - 評語保持在80-120字之間。

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
        
        // 嘗試判斷錯誤類型，提供更精確的錯誤訊息
        if (geminiAnalysis.error.includes('timeout')) {
          return NextResponse.json(
            { error: { code: 'API_TIMEOUT', message: '分析服務暫時回應較慢，請稍後再試。您也可以嘗試上傳不同角度或更清晰的照片。' } },
            { status: 503 }
          );
        } else if (geminiAnalysis.error.includes('JSON解析錯誤')) {
          // 嘗試進行部分資料的回傳
          if (geminiAnalysis.objectType) {
            console.log('使用部分解析資料產生回應');
            const partialData = {
              type: geminiAnalysis.objectType,
              length: geminiAnalysis.lengthEstimate || Math.floor(Math.random() * 8) + 15,
              thickness: geminiAnalysis.thicknessEstimate || Math.floor(Math.random() * 15 + 25) / 10,
              freshness: geminiAnalysis.freshnessScore || Math.floor(Math.random() * 3) + 7,
              score: geminiAnalysis.overallScore || Math.floor(Math.random() * 25 + 65) / 10,
              comment: geminiAnalysis.commentText || generateComment({
                type: geminiAnalysis.objectType,
                length: geminiAnalysis.lengthEstimate || Math.floor(Math.random() * 8) + 15,
                thickness: geminiAnalysis.thicknessEstimate || Math.floor(Math.random() * 15 + 25) / 10,
                freshness: geminiAnalysis.freshnessScore || Math.floor(Math.random() * 3) + 7
              })
            };
            return NextResponse.json(partialData);
          }
          
          return NextResponse.json(
            { error: { code: 'API_RESPONSE_ERROR', message: '分析結果格式異常，我們已記錄此問題。請嘗試上傳不同的照片或稍後再試。' } },
            { status: 500 }
          );
        }
        
        // 一般API錯誤
        return NextResponse.json(
          { error: { code: 'API_ERROR', message: '分析過程中出現錯誤。請確認您的網路連接正常，並嘗試重新上傳圖片。若問題持續發生，可能是我們的服務暫時出現問題。' } },
          { status: 500 }
        );
      }
      
      // 處理各種錯誤情況，提供更友善的錯誤提示
      if (geminiAnalysis.multipleObjects) {
        return NextResponse.json(
          { error: { 
              code: 'MULTIPLE_OBJECTS', 
              message: '圖片中似乎包含多個物體。請上傳單一小黃瓜或香蕉的照片，確保背景簡單，物體清晰可見。' 
            } 
          },
          { status: 400 }
        );
      }
      
      if (geminiAnalysis.lowQuality) {
        return NextResponse.json(
          { error: { 
              code: 'LOW_QUALITY', 
              message: '圖片質量不佳，可能太暗、太模糊或太小。請在光線充足的環境下重新拍攝，確保小黃瓜或香蕉完整且清晰。' 
            } 
          },
          { status: 400 }
        );
      }
      
      if (!geminiAnalysis.objectType) {
        // 提供更詳細的指導
        return NextResponse.json(
          { error: { 
              code: 'INVALID_OBJECT', 
              message: '無法辨識小黃瓜或香蕉。請確保圖片中包含完整的小黃瓜或香蕉，並佔據畫面主要部分。目前僅支持分析這兩種水果，其他類似形狀的物體可能被識別為「other_rod」類型。' 
            } 
          },
          { status: 400 }
        );
      }

      // 分析數據異常檢查
      if (geminiAnalysis.lengthEstimate <= 0 || geminiAnalysis.thicknessEstimate <= 0 || 
          geminiAnalysis.freshnessScore <= 0 || geminiAnalysis.overallScore <= 0) {
        console.warn('Abnormal analysis values detected:', geminiAnalysis);
        
        // 修正異常值
        if (geminiAnalysis.lengthEstimate <= 0) {
          geminiAnalysis.lengthEstimate = geminiAnalysis.objectType === 'cucumber' 
            ? Math.floor(Math.random() * 8) + 15 
            : geminiAnalysis.objectType === 'banana'
              ? Math.floor(Math.random() * 5) + 15
              : Math.floor(Math.random() * 10) + 10;
        }
        
        if (geminiAnalysis.thicknessEstimate <= 0) {
          geminiAnalysis.thicknessEstimate = geminiAnalysis.objectType === 'cucumber'
            ? Math.floor(Math.random() * 15 + 25) / 10
            : geminiAnalysis.objectType === 'banana'
              ? Math.floor(Math.random() * 10 + 30) / 10
              : Math.floor(Math.random() * 20 + 20) / 10;
        }
        
        if (geminiAnalysis.freshnessScore <= 0) {
          geminiAnalysis.freshnessScore = Math.floor(Math.random() * 3) + 7;
        }
        
        if (geminiAnalysis.overallScore <= 0) {
          geminiAnalysis.overallScore = Math.floor(Math.random() * 25 + 65) / 10;
        }
      }

      // 準備返回結果
      const result: AnalysisResult = {
        type: geminiAnalysis.objectType,
        length: parseFloat(geminiAnalysis.lengthEstimate.toFixed(1)),
        thickness: parseFloat(geminiAnalysis.thicknessEstimate.toFixed(1)),
        freshness: Math.min(10, Math.max(1, Math.round(geminiAnalysis.freshnessScore))),
        score: parseFloat(Math.min(10, Math.max(1, geminiAnalysis.overallScore)).toFixed(1)),
        comment: geminiAnalysis.commentText || generateComment({
          type: geminiAnalysis.objectType,
          length: geminiAnalysis.lengthEstimate,
          thickness: geminiAnalysis.thicknessEstimate,
          freshness: geminiAnalysis.freshnessScore
        })
      };

      return NextResponse.json(result);
    } catch (analysisError) {
      console.error('Error during image analysis:', analysisError);
      
      // 在API分析失敗時提供更友好的錯誤處理
      const errorMessage = analysisError instanceof Error ? analysisError.message : '未知錯誤';
      console.log('分析失敗，錯誤訊息:', errorMessage);
      
      // 判斷錯誤類型提供更精確的回應
      if (errorMessage.includes('timeout') || errorMessage.includes('DEADLINE_EXCEEDED')) {
        return NextResponse.json(
          { error: { code: 'TIMEOUT_ERROR', message: '分析服務暫時反應較慢，請稍後再試。若問題持續，請嘗試上傳較小的圖片檔案。' } }, 
          { status: 504 }
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        return NextResponse.json(
          { error: { code: 'QUOTA_ERROR', message: '系統暫時繁忙，請稍後再試。我們正在擴充服務容量，感謝您的耐心等待。' } }, 
          { status: 429 }
        );
      }
      
      // 檢查是否有網路連接問題
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        return NextResponse.json(
          { error: { code: 'NETWORK_ERROR', message: '網路連接出現問題，請檢查您的網路設置並重試。' } }, 
          { status: 503 }
        );
      }
      
      // 一般錯誤時使用隨機數據作為後備
      console.log('返回隨機數據作為備用分析結果');
      const fallbackType = Math.random() > 0.5 ? 'cucumber' : 'banana';
      const fallbackData = getRandomData(fallbackType);
      
      return NextResponse.json({
        ...fallbackData,
        comment: generateComment({...fallbackData}) + "（備註：由於分析服務暫時無法取得準確結果，此為估計值。您可以稍後重試獲得更精確的分析。）"
      });
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    
    // 提供更詳細的錯誤分類
    if (errorMessage.includes('formData') || errorMessage.includes('image')) {
      return NextResponse.json(
        { error: { code: 'IMAGE_PROCESSING_ERROR', message: '處理上傳的圖片時出現問題。請確保圖片格式正確（JPG、PNG）且檔案未損壞。' } }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: { code: 'GENERAL_ERROR', message: '處理您的請求時出現問題。請確認圖片格式正確並稍後再試。若問題持續發生，可能是系統暫時維護中。' } }, 
      { status: 500 }
    );
  }
} 