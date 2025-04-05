/**
 * TruthDetector.ts - 蔬果真實性鑑定模組
 * 
 * 這個模組提供"測謊儀"功能，用於判斷上傳圖片的真實度，
 * 並以幽默方式提供反饋。
 */

export interface TruthAnalysisResult {
  truthScore: number;        // 0-100的真實度分數
  suspiciousFeatures: string[]; // 可疑特徵列表
  adjustedLength: number;    // 調整後的長度
  adjustmentFactor: number;  // 調整因子
  funnyMessage: string;      // 幽默回應
  isSuspicious: boolean;     // 是否可疑
}

// 物件類型定義
export type ObjectType = 'cucumber' | 'banana' | 'other_rod' | null;

// TruthDetector 配置接口
export interface TruthDetectorConfig {
  // 各物體類型平均長度 (公分)
  averageLengths: Record<string, number>;
  
  // 各物體類型長度/粗細比率
  reasonableRatios: Record<string, number>;
  
  // 可疑判定閾值
  suspiciousThresholds: {
    truthScoreThreshold: number;    // 低於此真實度分數判定為可疑
    lengthExceedRatio: number;      // 超過平均長度比例判定為可疑
    otherRodMaxLength: number;      // other_rod 特別可疑的最大長度
  };
  
  // 長度與比率評分權重
  suspicionWeights: {
    lengthWeight: number;    // 長度異常的權重
    ratioWeight: number;     // 比率異常的權重
  };
  
  // 調整因子設定
  adjustmentSettings: {
    maxAdjustment: number;   // 最大調整比例
    minAdjustmentFactor: number; // 最小調整因子
  };
  
  // 用於生成回應的常量
  responses: {
    funnyResponses: string[];
    suspiciousFeatures: string[];
    suspicious: string[];    // 可疑情況的回應
    reasonable: string[];    // 合理情況的回應
    general: string[];       // 一般情況的回應
    unidentified: string[];  // 無法識別物體的回應
  };
  
  // 添加各物體類型的尺寸限制
  dimensionLimits: {
    cucumber: { 
      minLength: number;
      maxLength: number;
      minThickness: number;
      maxThickness: number;
      reasonableMinLength: number;
      reasonableMaxLength: number;
      reasonableMinThickness: number;
      reasonableMaxThickness: number;
    };
    banana: { 
      minLength: number;
      maxLength: number;
      minThickness: number;
      maxThickness: number;
      reasonableMinLength: number;
      reasonableMaxLength: number;
      reasonableMinThickness: number;
      reasonableMaxThickness: number;
    };
    other_rod: { 
      minLength: number;
      maxLength: number;
      minThickness: number;
      maxThickness: number;
      reasonableMinLength: number;
      reasonableMaxLength: number;
      reasonableMinThickness: number;
      reasonableMaxThickness: number;
      maleFeatureMinLength: number;
      maleFeatureMaxLength: number;
      maleFeatureMinThickness: number;
      nonMaleFeatureMaxLength: number;
      nonMaleFeatureMaxThickness: number;
    };
    default: { 
      minLength: number;
      maxLength: number;
      minThickness: number;
      maxThickness: number;
      reasonableMinLength: number;
      reasonableMaxLength: number;
      reasonableMinThickness: number;
      reasonableMaxThickness: number;
    };
  };
}

// 全域配置
const CONFIG: TruthDetectorConfig = {
  averageLengths: {
    cucumber: 17.5, // 小黃瓜平均長度
    banana: 18,     // 香蕉平均長度
    other_rod: 12.5 // other_rod (台灣男性平均)
  },
  
  reasonableRatios: {
    cucumber: 5.5, // 小黃瓜長度/粗細平均比率
    banana: 5,     // 香蕉長度/粗細平均比率
    other_rod: 4.5 // other_rod平均比率
  },
  
  suspiciousThresholds: {
    truthScoreThreshold: 75,
    lengthExceedRatio: 1.5,
    otherRodMaxLength: 20
  },
  
  suspicionWeights: {
    lengthWeight: 0.6,
    ratioWeight: 0.4
  },
  
  adjustmentSettings: {
    maxAdjustment: 0.3,
    minAdjustmentFactor: 0.7
  },
  
  responses: {
    funnyResponses: [
      "這根香蕉看起來像是在「特定角度」拍攝的呢！畫面構圖很巧妙～",
      "哎呀，AI偵測到「特殊的拍攝技巧」，這角度和距離很...有創意！",
      "AI測謊儀發現此照片與標準蔬果比例有些「創造性差異」，您是攝影師嗎？",
      "有趣！測謊儀偵測到此蔬果似乎借助了「光學魔法」顯得特別雄偉！",
      "根據我們的「蕉學資料庫」，這根的尺寸宣稱有點像是被強化過。您是園藝專家？",
      "您這個「獨特視角」拍攝的蔬果，讓AI測謊儀都忍不住發出了疑惑的笑聲！",
      "測謊儀提醒：過度「慷慨」的測量值可能導致女性用戶嚴重失望，建議適度謙虛～",
      "距離真是個奇妙的東西！靠近拍攝總是能讓事物看起來比實際更...壯觀！"
    ],
    
    suspiciousFeatures: [
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
    ],
    suspicious: [
      "這張照片可能經過了「創意處理」...",
      "嗯...這圖片看起來有點可疑呢",
      "哎呀，這不太符合物理定律啊",
      "照片很美，但誠實度有待考驗",
      "這個數據可能有點「藝術加工」成分"
    ],
    reasonable: [
      "這個看起來相當合理！",
      "尺寸看起來很正常",
      "測量結果符合自然界的常見規律",
      "這個數據很誠實",
      "看起來沒有經過特殊處理"
    ],
    general: [
      "我對這個尺寸保持中立態度",
      "科學地說，這個測量結果是有可能的",
      "數據上看，這在可接受範圍內",
      "測量結果已記錄，無特別意見"
    ],
    unidentified: [
      "無法確認物體類型，難以判斷真實性",
      "請確認圖片中含有可識別的目標物體",
      "系統無法識別此物體，測量結果僅供參考",
      "這是...某種未知物體？測量精度有限"
    ]
  },
  
  dimensionLimits: {
    cucumber: { 
      minLength: 0, 
      maxLength: 30, 
      minThickness: 0, 
      maxThickness: 6,
      reasonableMinLength: 15,
      reasonableMaxLength: 22,
      reasonableMinThickness: 2.5,
      reasonableMaxThickness: 4
    },
    banana: { 
      minLength: 0, 
      maxLength: 25, 
      minThickness: 0, 
      maxThickness: 5,
      reasonableMinLength: 15,
      reasonableMaxLength: 20,
      reasonableMinThickness: 3,
      reasonableMaxThickness: 4
    },
    other_rod: { 
      minLength: 0, 
      maxLength: 30, 
      minThickness: 2.5, 
      maxThickness: 5,
      reasonableMinLength: 10,    // 約台灣男性平均的80%
      reasonableMaxLength: 18.75, // 約台灣男性平均的150%
      reasonableMinThickness: 2.5,
      reasonableMaxThickness: 5,
      maleFeatureMinLength: 8,
      maleFeatureMaxLength: 30,
      maleFeatureMinThickness: 2.5,
      nonMaleFeatureMaxLength: 40,
      nonMaleFeatureMaxThickness: 8
    },
    default: { 
      minLength: 0, 
      maxLength: 40, 
      minThickness: 0, 
      maxThickness: 8,
      reasonableMinLength: 0,
      reasonableMaxLength: 40,
      reasonableMinThickness: 0,
      reasonableMaxThickness: 8
    }
  }
};

/**
 * 分析對象真實度
 * @param options 包含對象類型、長度、粗細和是否為男性特徵的選項
 * @returns 分析結果對象
 */
export function analyzeTruth(options: { 
  type: ObjectType; 
  length: number; 
  thickness: number;
  isMaleFeature?: boolean;
}): TruthAnalysisResult {
  const { type, length, thickness, isMaleFeature = false } = options;
  
  if (!type) {
    return {
      truthScore: 75,
      suspiciousFeatures: ['無法識別的物體類型'],
      adjustedLength: length,
      adjustmentFactor: 1,
      funnyMessage: CONFIG.responses.unidentified[Math.floor(Math.random() * CONFIG.responses.unidentified.length)],
      isSuspicious: false
    };
  }

  // 檢查物體長度是否合理
  const averageLength = CONFIG.averageLengths[type] || CONFIG.averageLengths.cucumber;
  const averageRatio = CONFIG.reasonableRatios[type] || CONFIG.reasonableRatios.cucumber;
  
  // 計算實際比率和關鍵指標
  const actualRatio = length / thickness;
  const lengthRatio = length / averageLength;
  const ratioDifference = Math.abs(actualRatio - averageRatio) / averageRatio;
  
  // 計算可疑程度分數
  let suspicionScore = 0;
  
  // 針對other_rod特別處理 - 依據是否為男性特徵採用不同標準
  if (type === 'other_rod') {
    if (isMaleFeature) {
      // 男性特徵的標準
      const { maleFeatureMinLength, maleFeatureMaxLength, maleFeatureMinThickness } = CONFIG.dimensionLimits.other_rod;
      
      // 如果長度超出合理範圍，增加懷疑分數
      if (length > maleFeatureMaxLength) {
        suspicionScore += (length - maleFeatureMaxLength) / maleFeatureMaxLength * CONFIG.suspicionWeights.lengthWeight;
      }
      
      // 如果尺寸不符合男性特徵的特性，增加懷疑分數
      if (length < maleFeatureMinLength || thickness < maleFeatureMinThickness) {
        suspicionScore += 0.3;
      }
    } else {
      // 一般棒狀物的標準
      const { nonMaleFeatureMaxLength, nonMaleFeatureMaxThickness } = CONFIG.dimensionLimits.other_rod;
      
      // 如果長度/粗細與一般物品不符，增加懷疑分數
      if (length > nonMaleFeatureMaxLength || thickness > nonMaleFeatureMaxThickness) {
        suspicionScore += 0.4;
      }
    }
  } else {
    // 針對蔬果類型的標準處理
    
    // 檢查長度超過平均值的程度
    if (lengthRatio > CONFIG.suspiciousThresholds.lengthExceedRatio) {
      suspicionScore += (lengthRatio - 1) * CONFIG.suspicionWeights.lengthWeight;
    }
    
    // 檢查長度/粗細比率的異常程度
    if (ratioDifference > 0.3) {
      suspicionScore += ratioDifference * CONFIG.suspicionWeights.ratioWeight;
    }
  }
  
  // 計算調整因子
  const adjustmentFactor = Math.max(
    CONFIG.adjustmentSettings.minAdjustmentFactor,
    1 - Math.min(suspicionScore, CONFIG.adjustmentSettings.maxAdjustment)
  );
  
  // 計算調整後的長度
  const adjustedLength = length * adjustmentFactor;
  
  // 計算最終真實度分數 - 從0-1轉換為0-100分
  const truthScoreValue = Math.max(0, Math.min(1, 1 - suspicionScore));
  
  // 決定是否標記為可疑
  const isSuspicious = truthScoreValue * 100 < CONFIG.suspiciousThresholds.truthScoreThreshold;
  
  // 生成反饋訊息
  let message = '';
  let suspiciousFeatures: string[] = [];
  
  if (isSuspicious) {
    // 選擇隨機的幽默回應和可疑特徵
    const randomResponse = CONFIG.responses.suspicious[Math.floor(Math.random() * CONFIG.responses.suspicious.length)];
    const funnyResponse = CONFIG.responses.funnyResponses[Math.floor(Math.random() * CONFIG.responses.funnyResponses.length)];
    message = `${randomResponse} ${funnyResponse}`;
    
    // 隨機選擇2-4個可疑特徵
    const featureCount = Math.floor(Math.random() * 3) + 2; // 2到4個
    const selectedFeatures = [...CONFIG.responses.suspiciousFeatures];
    suspiciousFeatures = [];
    
    for (let i = 0; i < featureCount; i++) {
      if (selectedFeatures.length === 0) break;
      const randomIndex = Math.floor(Math.random() * selectedFeatures.length);
      suspiciousFeatures.push(selectedFeatures[randomIndex]);
      selectedFeatures.splice(randomIndex, 1);
    }
  } else {
    message = CONFIG.responses.reasonable[Math.floor(Math.random() * CONFIG.responses.reasonable.length)];
  }
  
  return {
    truthScore: Math.round(truthScoreValue * 100),
    suspiciousFeatures,
    adjustedLength,
    adjustmentFactor,
    funnyMessage: message,
    isSuspicious
  };
}

/**
 * 計算真實性得分
 * @param objectType 物體類型
 * @param length 長度
 * @param thickness 粗細
 * @param issueCount 問題數量
 * @returns 真實性得分 (0-1)
 */
function calculateTruthScore(
  objectType: ObjectType,
  length: number, 
  thickness: number,
  issueCount: number
): number {
  // 基本分數 - 如果尺寸合理則給予較高的初始分數
  const isReasonable = isReasonableDimension(length, thickness, objectType);
  const score = isReasonable ? 0.85 : 0.65;
  
  // 依據問題數量減分
  const finalScore = Math.max(0, score - Math.min(0.5, issueCount * 0.1));
  
  // 確保真實度分數在0-1範圍內
  return Math.max(0, Math.min(1, finalScore));
}

/**
 * 計算最終評分
 * @param baseScore 基礎分數
 * @param freshness 新鮮度
 * @param length 長度
 * @param thickness 粗細
 * @param objectType 物件類型
 * @returns 最終評分
 */
export function calculateFinalScore(
  baseScore: number,
  freshness: number,
  length: number,
  thickness: number,
  objectType: ObjectType
): number {
  // 1. 基礎分數
  let finalScore = baseScore;
  
  // 2. 合理的尺寸應該有獎勵，不合理的尺寸應該降分
  const isReasonableSize = objectType ? isReasonableDimension(length, thickness, objectType) : false;
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

/**
 * 處理尺寸估計
 * @param lengthEstimate 長度估計值
 * @param thicknessEstimate 粗細估計值
 * @param objectType 物件類型
 * @returns 調整後的尺寸
 */
export function adjustDimensions(
  lengthEstimate: number,
  thicknessEstimate: number,
  objectType: ObjectType | null
): { adjustedLength: number; adjustedThickness: number } {
  // 獲取適用的尺寸限制
  const limits = objectType 
    ? CONFIG.dimensionLimits[objectType] 
    : CONFIG.dimensionLimits.default;
  
  let adjustedLength = lengthEstimate;
  let adjustedThickness = thicknessEstimate;

  // 特殊處理 other_rod 類型
  if (objectType === 'other_rod') {
    const otherRodLimits = CONFIG.dimensionLimits.other_rod;
    const taiwanMaleAvgLength = CONFIG.averageLengths.other_rod; // 使用配置中的平均長度
    
    // 判斷是否可能是男性特徵
    const isLikelyMaleBodyPart = 
      adjustedLength >= otherRodLimits.maleFeatureMinLength && 
      adjustedLength <= otherRodLimits.maleFeatureMaxLength && 
      adjustedThickness >= otherRodLimits.maleFeatureMinThickness;
    
    if (isLikelyMaleBodyPart) {
      // 超過台灣平均+50%以上的長度可能不符合現實或誇大
      if (adjustedLength > taiwanMaleAvgLength * 1.5 && adjustedLength <= otherRodLimits.maleFeatureMaxLength) {
        // 對於可能是誇大的長度給予警示 (僅在開發環境輸出)
        if (process.env.NODE_ENV === 'development') {
          console.log('Warning: Detected possible exaggerated dimensions');
        }
      }
      
      // 應用男性特徵的限制
      adjustedLength = Math.max(
        otherRodLimits.minLength, 
        Math.min(otherRodLimits.maxLength, adjustedLength)
      );
      
      adjustedThickness = Math.max(
        otherRodLimits.minThickness, 
        Math.min(otherRodLimits.maxThickness, adjustedThickness)
      );
    } else {
      // 應用非男性特徵的寬鬆限制
      adjustedLength = Math.max(
        otherRodLimits.minLength, 
        Math.min(otherRodLimits.nonMaleFeatureMaxLength, adjustedLength)
      );
      
      adjustedThickness = Math.max(
        limits.minThickness, 
        Math.min(otherRodLimits.nonMaleFeatureMaxThickness, adjustedThickness)
      );
    }
  } else {
    // 標準處理：應用基本限制
    adjustedLength = Math.max(
      limits.minLength, 
      Math.min(limits.maxLength, adjustedLength)
    );
    
    adjustedThickness = Math.max(
      limits.minThickness, 
      Math.min(limits.maxThickness, adjustedThickness)
    );
  }

  // 保留一位小數
  adjustedLength = Math.round(adjustedLength * 10) / 10;
  adjustedThickness = Math.round(adjustedThickness * 10) / 10;

  return { adjustedLength, adjustedThickness };
}

/**
 * 判斷尺寸是否在合理範圍
 * @param length 長度
 * @param thickness 粗細
 * @param type 物件類型
 * @returns 是否在合理範圍內
 */
export function isReasonableDimension(length: number, thickness: number, type: ObjectType): boolean {
  if (!type) return false;
  
  // 從配置中獲取合理尺寸範圍
  const limits = CONFIG.dimensionLimits[type];
  
  // 特殊處理 other_rod 類型
  if (type === 'other_rod') {
    const otherRodLimits = CONFIG.dimensionLimits.other_rod;
    
    // 判斷是否符合男性特徵的尺寸範圍
    const isMaleFeature = length >= otherRodLimits.maleFeatureMinLength && 
                         length <= otherRodLimits.maleFeatureMaxLength && 
                         thickness >= otherRodLimits.maleFeatureMinThickness;
    
    if (isMaleFeature) {
      // 使用合理長度範圍判斷
      const isReasonableLength = length >= otherRodLimits.reasonableMinLength && 
                                length <= otherRodLimits.reasonableMaxLength;
      
      // 考慮合理的厚度範圍
      const isReasonableThickness = thickness >= otherRodLimits.reasonableMinThickness && 
                                   thickness <= otherRodLimits.reasonableMaxThickness;
      
      // 長度和厚度都在合理範圍內
      return isReasonableLength && isReasonableThickness;
    }
    
    // 如果不是男性特徵，使用寬鬆標準
    return length > 0 && thickness > 0;
  }
  
  // 標準物體類型的合理性判斷
  return (length >= limits.reasonableMinLength && length <= limits.reasonableMaxLength) && 
         (thickness >= limits.reasonableMinThickness && thickness <= limits.reasonableMaxThickness);
}

/**
 * 基於真實度分析結果生成建議訊息
 * @param result 真實度分析結果
 * @param objectType 對象類型
 * @param isMaleFeature 是否為男性特徵
 * @returns 建議訊息
 */
export function getSuggestionMessage(
  result: TruthAnalysisResult,
  objectType: ObjectType,
  isMaleFeature?: boolean
): string {
  // 如果檢測到可疑（低真實度）情況
  if (result.isSuspicious) {
    if (objectType === 'other_rod' && isMaleFeature) {
      // 男性特徵的專門提示
      const suggestions = [
        `我們注意到您上傳的照片似乎不太符合自然比例。拍攝男性特徵時，請保持適當距離並使用正確角度，以獲得更準確的測量結果。`,
        `此照片可能因為拍攝角度或距離問題導致測量結果不夠客觀。建議下次拍攝時使用中性背景、自然光線，並保持直角視角以提高準確度。`,
        `您上傳的圖片可能存在透視失真，影響了測量的準確性。拍攝時建議將相機與物體保持垂直，並避免使用廣角鏡頭，這樣測量結果會更可靠。`,
        `我們的測謊系統檢測到此圖片的尺寸可能不太符合現實。請確保下次拍攝時避免任何可能導致視覺誇大的技巧，這樣我們才能提供更準確的評估。`
      ];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
    
    // 真實度低於閾值，給出改進建議
    if (result.truthScore < 50) {
      // 真實度非常低的情況
      return "這張照片的測量精度有顯著問題，可能是因為拍攝角度、距離或圖像處理導致。建議重新拍攝，確保物體平放、相機與物體保持垂直，並使用自然光線。";
    } else {
      // 真實度較低但尚可接受的情況
      const suggestions = [
        "照片有些可疑特徵可能影響測量準確性。建議拍攝時使用均勻光源，並保持相機與物體垂直以減少透視變形。",
        "這張照片的測量結果可能不太準確。試著在自然光下，將物體放在平面上，並從正上方拍攝以獲得更準確的比例。",
        "我們的系統檢測到一些異常比例。拍攝時請避免使用廣角鏡頭，並保持適當距離，以減少視覺扭曲。",
        "測量結果可能受到拍攝技巧的影響。下次可以嘗試放置參考物（如尺子）一同拍攝，這樣可以提高精度。"
      ];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }
  } else {
    // 真實度高的情況
    if (objectType === 'other_rod' && isMaleFeature) {
      // 男性特徵的專門提示
      const positiveSuggestions = [
        "您的照片拍攝角度和距離恰到好處，測量結果非常精確。請繼續保持這種專業的拍攝方式。",
        "這是一張拍攝得非常好的照片，光線均勻、角度適中，使我們能夠提供準確的分析結果。",
        "從照片來看，您已掌握了理想的拍攝技巧，使得測量結果非常可靠。保持這種水準！",
        "您的拍攝技巧值得表揚，照片清晰且比例準確，這對於獲得精確的測量結果至關重要。"
      ];
      return positiveSuggestions[Math.floor(Math.random() * positiveSuggestions.length)];
    }
    
    if (result.truthScore > 90) {
      // 真實度非常高的情況
      return "這張照片拍攝得非常好！光線充足、角度恰當，使我們能夠提供最準確的分析結果。請繼續保持這種拍攝品質。";
    } else {
      // 真實度較高的情況
      const positiveSuggestions = [
        "照片品質不錯，測量結果可信度高。如需更精確的結果，可以考慮在更均勻的光線下重新拍攝。",
        "這是一張拍得不錯的照片，光線和角度都還可以，使我們能夠提供相當準確的分析。",
        "照片拍攝角度和距離都很合適，測量結果值得參考。若要更上一層樓，可嘗試使用自然日光。",
        "您的拍攝技巧很好，照片清晰且比例協調。如果添加一個比例尺參考物，結果會更加精準。"
      ];
      return positiveSuggestions[Math.floor(Math.random() * positiveSuggestions.length)];
    }
  }
} 