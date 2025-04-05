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
 * 分析圖像真實性
 * @param objectType 物體類型
 * @param measuredLength 測量長度
 * @param measuredThickness 測量粗細
 * @returns 真實性分析結果
 */
export function analyzeTruth(
  objectType: ObjectType | null,
  measuredLength: number,
  measuredThickness: number,
): TruthAnalysisResult {
  if (!objectType) {
    return {
      truthScore: 0.5,
      suspiciousFeatures: ['無法識別物體類型'],
      adjustedLength: measuredLength,
      adjustmentFactor: 1,
      funnyMessage: CONFIG.responses.unidentified[Math.floor(Math.random() * CONFIG.responses.unidentified.length)],
      isSuspicious: true
    };
  }

  // 根據物體類型調整尺寸
  const { adjustedLength, adjustedThickness } = adjustDimensions(
    measuredLength,
    measuredThickness,
    objectType
  );

  // 計算長寬比
  const ratio = adjustedThickness > 0 ? adjustedLength / adjustedThickness : 0;

  // 初始化可疑特徵列表
  const suspiciousFeatures: string[] = [];
  
  // 獲取物體類型的參考標準
  const isReasonable = isReasonableDimension(adjustedLength, adjustedThickness, objectType);
  
  // 計算調整系數
  let adjustmentFactor = 1.0;
  
  // 特殊處理other_rod類型
  if (objectType === 'other_rod') {
    // 從配置中獲取限制和參考值
    const limits = CONFIG.dimensionLimits.other_rod;
    const avgLength = CONFIG.averageLengths.other_rod;
    
    // 判斷是否可能是男性特徵
    const isLikelyMaleBodyPart = 
      adjustedLength >= limits.maleFeatureMinLength && 
      adjustedLength <= limits.maleFeatureMaxLength && 
      adjustedThickness >= limits.maleFeatureMinThickness;
      
    if (isLikelyMaleBodyPart) {
      // 檢查尺寸是否合理
      const lengthRatio = adjustedLength / avgLength;
      
      // 計算長度的合理性得分（0-1之間，1為最合理）
      // 基於距離平均值的遠近
      // const lengthReasonableScore = 1 - Math.min(1, Math.abs(lengthRatio - 1) / 0.5);
      
      // 長度明顯超過平均太多
      if (lengthRatio > 1.5) {
        suspiciousFeatures.push('長度可能誇大');
        
        // 調整系數基於超出程度
        const excessRatio = (lengthRatio - 1.5) / 0.5; // 每超出0.5個比例單位，增加一個調整單位
        adjustmentFactor = Math.max(0.7, 1 - excessRatio * 0.1);
      }
      
      // 長度明顯小於平均太多
      if (lengthRatio < 0.7) {
        suspiciousFeatures.push('長度可能縮小');
        
        // 調整系數基於縮小程度
        const shrinkRatio = (0.7 - lengthRatio) / 0.3; // 每縮小0.3個比例單位，增加一個調整單位
        adjustmentFactor = Math.min(1.3, 1 + shrinkRatio * 0.1);
      }
      
      // 檢查長寬比是否合理
      if (ratio < 3) {
        suspiciousFeatures.push('粗細比例不太合理');
      } else if (ratio > 7) {
        suspiciousFeatures.push('過於細長');
      }
      
      // 檢查長度有沒有超出物理極限
      if (adjustedLength > 25) {
        suspiciousFeatures.push('長度超出常見範圍');
        
        // 調整系數進一步降低
        adjustmentFactor *= 0.8;
      }
    }
  } else if (objectType === 'cucumber') {
    // 小黃瓜特有的判斷邏輯
    const limits = CONFIG.dimensionLimits.cucumber;
    
    // 檢查長度與合理範圍的關係
    if (adjustedLength < limits.reasonableMinLength) {
      suspiciousFeatures.push('小黃瓜長度過短');
    } else if (adjustedLength > limits.reasonableMaxLength) {
      suspiciousFeatures.push('小黃瓜長度過長');
    }
    
    // 檢查粗細與合理範圍的關係
    if (adjustedThickness < limits.reasonableMinThickness) {
      suspiciousFeatures.push('小黃瓜過細');
    } else if (adjustedThickness > limits.reasonableMaxThickness) {
      suspiciousFeatures.push('小黃瓜過粗');
    }
    
    // 檢查長寬比
    if (ratio < 4) {
      suspiciousFeatures.push('小黃瓜比例不協調');
    } else if (ratio > 10) {
      suspiciousFeatures.push('小黃瓜過於細長');
    }
  } else if (objectType === 'banana') {
    // 香蕉特有的判斷邏輯
    const limits = CONFIG.dimensionLimits.banana;
    
    // 檢查長度與合理範圍的關係
    if (adjustedLength < limits.reasonableMinLength) {
      suspiciousFeatures.push('香蕉長度過短');
    } else if (adjustedLength > limits.reasonableMaxLength) {
      suspiciousFeatures.push('香蕉長度過長');
    }
    
    // 檢查粗細與合理範圍的關係
    if (adjustedThickness < limits.reasonableMinThickness) {
      suspiciousFeatures.push('香蕉過細');
    } else if (adjustedThickness > limits.reasonableMaxThickness) {
      suspiciousFeatures.push('香蕉過粗');
    }
    
    // 檢查長寬比
    if (ratio < 3.5) {
      suspiciousFeatures.push('香蕉比例不協調');
    } else if (ratio > 8) {
      suspiciousFeatures.push('香蕉過於細長');
    }
  }
  
  // 通用檢查：圖像裁剪、角度、尺寸誇大
  
  // 檢查尺寸是否極端（極大或極小）
  if (adjustedLength < 5) {
    suspiciousFeatures.push('物體過小');
  } else if (adjustedLength > CONFIG.dimensionLimits[objectType].maxLength * 0.9) {
    suspiciousFeatures.push('物體接近或超出測量範圍上限');
  }
  
  // 拍攝角度問題（從長寬比判斷）
  if (ratio < 2 && objectType !== 'other_rod') {
    suspiciousFeatures.push('可能拍攝角度不佳');
  }
  
  // 特殊處理：空白特徵列表時添加一個默認項
  if (suspiciousFeatures.length === 0) {
    if (!isReasonable) {
      suspiciousFeatures.push('尺寸不在理想範圍內');
    } else {
      suspiciousFeatures.push('看起來合理');
    }
  }

  // 計算真實性得分，範圍 0-1
  const truthScoreValue = calculateTruthScore(objectType, adjustedLength, adjustedThickness, suspiciousFeatures.length);
  
  // 將0-1範圍分數轉換為0-100範圍
  const truthScore100 = Math.round(truthScoreValue * 100);
  
  // 定義這張圖是否值得懷疑（真實度低於閾值或有太多可疑特徵）
  const isSuspicious = truthScore100 < 65 || suspiciousFeatures.length > 2;
  
  // 根據懷疑程度選擇不同的反饋訊息
  const messageCategory = isSuspicious ? "suspicious" : "reasonable";
  const messages = CONFIG.responses[messageCategory] || CONFIG.responses.general;
  const funnyMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    truthScore: truthScore100, // 返回0-100範圍分數
    suspiciousFeatures,
    adjustedLength,
    adjustmentFactor,
    funnyMessage,
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
 * 根據真實性分析結果獲取建議訊息
 * @param truthAnalysis 真實性分析結果
 * @param objectType 物體類型
 * @returns 建議訊息
 */
export function getSuggestionMessage(
  truthAnalysis: TruthAnalysisResult,
  objectType: ObjectType | null
): string {
  const { isSuspicious, truthScore, suspiciousFeatures } = truthAnalysis;
  
  if (!objectType) {
    return "請確保圖像中有清晰可見的目標物體，並嘗試從不同角度拍攝。";
  }
  
  // 根據真實度和物體類型選擇適當建議
  if (truthScore < 40) {
    return "這張圖片可能不適合精確測量。建議在良好光線下，從側面直接拍攝物體，確保整個物體都在畫面中，並放置一些參考物（如硬幣或尺）提高準確度。";
  } 
  
  if (isSuspicious) {
    // 檢查特定的可疑特徵，提供針對性建議
    if (suspiciousFeatures.some(f => f.includes('角度') || f.includes('拍攝'))) {
      return "拍攝角度可能影響測量結果。建議從物體的側面直接拍攝，保持相機與物體平行，避免使用廣角或變焦功能。";
    }
    
    if (suspiciousFeatures.some(f => f.includes('比例') || f.includes('粗細'))) {
      return "物體的比例看起來不太自然。建議使用自然光線，拍攝整個物體，並避免使用可能扭曲比例的濾鏡或特效。";
    }
    
    if (suspiciousFeatures.some(f => f.includes('長度'))) {
      if (objectType === 'cucumber') {
        return "小黃瓜的長度測量結果不在典型範圍內。為了獲得更準確的測量，請確保拍攝整個小黃瓜，並使用常見物體（如尺、硬幣）作為比例參考。";
      } else if (objectType === 'banana') {
        return "香蕉的長度測量結果不在典型範圍內。請嘗試拍攝完整的香蕉，避免彎曲或截斷導致的測量誤差。";
      } else {
        return "測量結果似乎不在典型範圍內。請確保拍攝完整物體，並避免使用可能扭曲比例的相機設置。";
      }
    }
    
    // 默認可疑情況建議
    return "為獲得更準確的測量結果，建議在明亮自然光線下拍攝，避免使用特效或濾鏡，並保持物體完整可見。";
  }
  
  // 對於準確度尚可的測量
  if (truthScore >= 60 && truthScore < 80) {
    if (objectType === 'cucumber') {
      return "這次測量結果看起來合理。小黃瓜的測量通常在15-22公分之間較為準確，您可以使用直尺作為參考進一步提高準確度。";
    } else if (objectType === 'banana') {
      return "測量結果在合理範圍內。香蕉的型態因品種不同而異，放置一個參考物體（如錢幣）有助於校準系統的測量準確度。";
    } else {
      return "測量結果在合理範圍內。若需更精確的數據，可使用固定距離拍攝，並添加已知大小的參考物體在畫面中。";
    }
  }
  
  // 高準確度測量的鼓勵訊息
  return "您的測量看起來非常準確！清晰的圖像和良好的拍攝角度有助於獲得這樣精確的結果。";
} 