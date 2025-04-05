/**
 * TruthDetector.ts - 蔬果真實性鑑定模組
 * 
 * 這個模組提供"測謊儀"功能，用於判斷上傳圖片的真實度，
 * 並以幽默方式提供反饋。
 */

// 常量定義
export const SUSPICIOUS_FEATURES = {
  LENGTH_TOO_LONG: "長度過長，超出正常範圍",
  LENGTH_TOO_SHORT: "長度過短，不符合典型尺寸",
  TOO_THICK: "粗細超出正常物品範圍",
  TOO_THIN: "粗細過細，不符合典型比例",
  ABNORMAL_RATIO: "長度與粗細比例異常",
};

// 可疑時的有趣回應
export const SUSPICIOUS_RESPONSES = [
  "這尺寸...恐怕只存在於你的想像中。",
  "哈哈！真有創意的「測量方式」！",
  "這數字比我前男友的謊言還要誇張...",
  "嗯～我有理由相信這是經過「藝術加工」的數據。",
  "這照片是不是用了那種「增大濾鏡」啊？",
  "看來有人很懂得如何「取景」嘛～"
];

// 真實時的有趣回應
export const REASONABLE_RESPONSES = [
  "看起來是真實的測量結果，值得信賴！",
  "這數據相當合理，應該是實際尺寸無誤。",
  "嗯，這個尺寸很符合現實，沒有誇大。",
  "數據看起來很真實，不像是吹噓的結果。",
  "我相信這是誠實測量的結果。"
];

// 添加更多台灣男性相關統計數據常量
export const TAIWAN_MALE_STATS = {
  AVG_LENGTH: 12.5,       // 台灣男性平均長度(cm)
  MEDIAN_LENGTH: 12.2,    // 台灣男性中位數長度(cm)
  STD_DEVIATION: 1.5,     // 標準差(cm)
  PERCENTILE_5: 10.0,     // 第5百分位長度(cm)
  PERCENTILE_25: 11.4,    // 第25百分位長度(cm)
  PERCENTILE_75: 13.6,    // 第75百分位長度(cm)
  PERCENTILE_90: 14.5,    // 第90百分位長度(cm)
  PERCENTILE_95: 15.0,    // 第95百分位長度(cm)
  PERCENTILE_99: 16.5,    // 第99百分位長度(cm)
  GLOBAL_AVG: 13.1,        // 全球平均長度(cm)
  ASIAN_AVG: 12.6,         // 亞洲平均長度(cm)
  REASONABLE_MIN: 10.0,    // 合理下限(cm)
  REASONABLE_MAX: 18.75,   // 合理上限(cm)
};

// 定義真實性分析結果接口
export interface TruthAnalysisResult {
  truthScore: number;        // 真實度評分 0-100
  isSuspicious: boolean;     // 是否可疑
  suspiciousFeatures: string[]; // 可疑特徵列表
  funnyMessage: string;      // 幽默回應訊息
  suggestionMessage?: string; // 建議訊息
  adjustedLength?: number;   // 調整後的長度
  adjustmentFactor?: number; // 調整因子
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
    other_rod: TAIWAN_MALE_STATS.AVG_LENGTH // 使用台灣男性平均常量
  },
  
  reasonableRatios: {
    cucumber: 5.5, // 小黃瓜長度/粗細平均比率
    banana: 5,     // 香蕉長度/粗細平均比率
    other_rod: 4.5 // other_rod平均比率
  },
  
  suspiciousThresholds: {
    truthScoreThreshold: 75,
    lengthExceedRatio: 1.5,
    otherRodMaxLength: TAIWAN_MALE_STATS.REASONABLE_MAX
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
      reasonableMinLength: TAIWAN_MALE_STATS.REASONABLE_MIN,    // 使用統計常量
      reasonableMaxLength: TAIWAN_MALE_STATS.REASONABLE_MAX,    // 使用統計常量
      reasonableMinThickness: 2.5,
      reasonableMaxThickness: 5,
      maleFeatureMinLength: TAIWAN_MALE_STATS.REASONABLE_MIN,   // 使用統計常量
      maleFeatureMaxLength: TAIWAN_MALE_STATS.REASONABLE_MAX,   // 使用統計常量
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
 * 分析真實度並提供相關信息
 * @param objectType 物體類型
 * @param length 長度
 * @param thickness 粗細
 * @param rodSubtype 棒狀物子類型
 * @returns 分析結果
 */
export function analyzeTruth(
  objectType: ObjectType,
  length: number,
  thickness: number,
  rodSubtype?: 'male_feature' | 'regular_rod'
): TruthAnalysisResult {
  // 判斷是否為男性特徵
  const isMaleFeature = objectType === 'other_rod' && 
                         (rodSubtype === 'male_feature');
  
  // 確保物體類型有效
  const validObjectType = (objectType && ['cucumber', 'banana', 'other_rod'].includes(objectType)) 
    ? objectType 
    : 'cucumber'; // 預設為黃瓜
  
  // 檢查是否有長度和粗細數據
  if (!length || !thickness) {
    return {
      truthScore: 75,
      isSuspicious: false,
      suspiciousFeatures: [],
      funnyMessage: "無法確定真偽，缺少完整尺寸信息...",
      suggestionMessage: undefined,
      adjustedLength: length,
      adjustmentFactor: 1
    };
  }

  // 初始化可疑特徵列表
  const suspiciousFeatures: string[] = [];
  
  // 可疑特徵判斷條件
  let suspicionScore = 0;
  let truthScore = 100; // 從100分開始，越可疑越低
  
  // 對於男性特徵，使用新的評估方法
  if (isMaleFeature) {
    // 使用統計學方法直接計算可信度分數
    truthScore = calculateMaleCredibilityScore(length);
    
    // 獲取百分位描述
    const percentileDesc = getMalePercentileDescription(length);
    
    // 根據百分位添加相應的特徵描述
    if (length > TAIWAN_MALE_STATS.PERCENTILE_99) {
      suspiciousFeatures.push("尺寸超過99%台灣男性，極其罕見");
      suspicionScore += 50;
    } else if (length > TAIWAN_MALE_STATS.PERCENTILE_95) {
      suspiciousFeatures.push("尺寸超過95%台灣男性，相當罕見");
      suspicionScore += 30;
    } else if (length > TAIWAN_MALE_STATS.PERCENTILE_90) {
      suspiciousFeatures.push("尺寸超過90%台灣男性，少見");
      suspicionScore += 15;
    } else if (length < TAIWAN_MALE_STATS.REASONABLE_MIN) {
      suspiciousFeatures.push("尺寸低於一般統計下限，可能測量不準確");
      suspicionScore += 20;
    }
    
    // 計算粗細是否合理
    if (thickness > 4.5) {
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THICK);
      suspicionScore += 30;
    } else if (thickness < 2.5) {
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THIN);
      suspicionScore += 20;
    }
    
    // 計算長寬比是否合理
    const lengthToThicknessRatio = length / thickness;
    if (lengthToThicknessRatio > 5.0 || lengthToThicknessRatio < 2.5) {
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.ABNORMAL_RATIO);
      suspicionScore += 25;
    }
  } else {
    // 非男性特徵的一般物品評估邏輯
    // 根據物體類型計算平均值和比例
    const avgLengths = {
      cucumber: 15, // 黃瓜平均15cm
      banana: 18,   // 香蕉平均18cm
      other_rod: 20 // 一般棒狀物20cm
    };
    
    const avgThickness = {
      cucumber: 3.5, // 黃瓜平均直徑3.5cm
      banana: 3.8,   // 香蕉平均直徑3.8cm
      other_rod: 4.0 // 一般棒狀物4cm
    };
    
    // 計算長度是否可疑
    const avgLength = avgLengths[validObjectType];
    const lengthRatio = length / avgLength;
    
    if (lengthRatio > 1.5) {
      suspicionScore += 25;
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.LENGTH_TOO_LONG);
      truthScore -= 20;
    } else if (lengthRatio < 0.6) {
      suspicionScore += 10;
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.LENGTH_TOO_SHORT);
      truthScore -= 8;
    }
    
    // 計算粗細是否可疑
    const avgThick = avgThickness[validObjectType];
    const thicknessRatio = thickness / avgThick;
    
    if (thicknessRatio > 1.6) {
      suspicionScore += 30;
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THICK);
      truthScore -= 25;
    } else if (thicknessRatio < 0.6) {
      suspicionScore += 15;
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THIN);
      truthScore -= 12;
    }
    
    // 計算長寬比是否合理
    const lengthToThicknessRatio = length / thickness;
    const idealRatios = {
      cucumber: 4.5, // 理想的黃瓜長寬比
      banana: 5.0,   // 理想的香蕉長寬比
      other_rod: 5.0 // 一般棒狀物長寬比
    };
    
    const idealRatio = idealRatios[validObjectType];
    const ratioDeviation = Math.abs(lengthToThicknessRatio - idealRatio) / idealRatio;
    
    if (ratioDeviation > 0.5) {
      suspicionScore += 20;
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.ABNORMAL_RATIO);
      truthScore -= 15;
    }
  }
  
  // 防止真實度分數超出範圍
  truthScore = Math.max(0, Math.min(100, truthScore));
  
  // 判斷是否可疑 (對於男性特徵，使用統計學標準；對於其他物品，使用一般標準)
  const isSuspicious = isMaleFeature 
    ? (truthScore < 60) 
    : (suspicionScore >= 30);
  
  // 計算調整因子
  const adjustmentFactor = Math.max(0.7, 1 - (suspicionScore / 100));
  
  // 計算調整後的長度
  const adjustedLength = length * adjustmentFactor;
  
  // 根據是否為男性特徵選擇特定回應
  let funnyMessage = "";
  if (isMaleFeature) {
    if (isSuspicious) {
      // 根據違反統計學分布的程度選擇不同的回應
      if (length > TAIWAN_MALE_STATS.REASONABLE_MAX) {
        funnyMessage = "統計學表示：這種尺寸是千萬分之一的機率，比中樂透還難！";
      } else if (length > TAIWAN_MALE_STATS.PERCENTILE_99) {
        funnyMessage = `這尺寸聲稱超過了99%的台灣男性，統計學上的可能性極低...`;
      } else if (length > TAIWAN_MALE_STATS.PERCENTILE_95) {
        funnyMessage = `聲稱的數據位於前5%，非常罕見，可能有測量誤差。`;
      } else if (length < TAIWAN_MALE_STATS.REASONABLE_MIN) {
        funnyMessage = "測量值似乎偏小，可能測量方式有誤。正確測量應從恥骨開始到頂端。";
      } else {
        // 一般可疑回應
        const responses = SUSPICIOUS_RESPONSES;
        funnyMessage = responses[Math.floor(Math.random() * responses.length)];
      }
    } else {
      // 真實度高的男性特徵回應
      if (length > TAIWAN_MALE_STATS.PERCENTILE_75 && length <= TAIWAN_MALE_STATS.PERCENTILE_90) {
        funnyMessage = `數據顯示這個尺寸高於大多數台灣男性，但仍在統計學可信範圍內。`;
      } else if (length >= TAIWAN_MALE_STATS.PERCENTILE_25 && length <= TAIWAN_MALE_STATS.PERCENTILE_75) {
        funnyMessage = `這個尺寸非常接近台灣男性平均值${TAIWAN_MALE_STATS.AVG_LENGTH}cm，數據看起來很誠實。`;
      } else {
        funnyMessage = "尺寸在台灣男性常見範圍內，數據可信度高。";
      }
    }
  } else {
    // 非男性特徵的一般回應
    const funnyResponses = isSuspicious ? SUSPICIOUS_RESPONSES : REASONABLE_RESPONSES;
    const randomIndex = Math.floor(Math.random() * funnyResponses.length);
    funnyMessage = funnyResponses[randomIndex];
  }
  
  // 計算建議訊息
  const suggestionMessage = getSuggestionMessage(truthScore, objectType, rodSubtype, length);
  
  return {
    truthScore,
    isSuspicious,
    suspiciousFeatures,
    funnyMessage,
    suggestionMessage,
    adjustedLength,
    adjustmentFactor
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
 * 獲取根據真實度分數提供的建議信息
 * @param truthScore 真實度分數 (0-100)
 * @param objectType 物體類型
 * @param rodSubtype 棒狀物子類型 (可選)
 * @param lengthValue 長度值 (可選)
 * @returns 建議信息
 */
export function getSuggestionMessage(
  truthScore: number, 
  objectType: ObjectType, 
  rodSubtype?: 'male_feature' | 'regular_rod',
  lengthValue?: number
): string {
  // 獲取台灣男性平均長度及其統計數據
  const taiwanMaleStats = TAIWAN_MALE_STATS;
  const isMaleFeature = rodSubtype === 'male_feature';
  
  // 基於長度獲取百分位描述（如果提供了長度值）
  let percentileDescription = '';
  if (lengthValue && isMaleFeature) {
    percentileDescription = getMalePercentileDescription(lengthValue);
  }
  
  if (truthScore >= 80) {
    if (objectType === 'other_rod' && isMaleFeature && lengthValue) {
      return `測量結果非常可信。您的長度為 ${lengthValue} 公分，${percentileDescription}。台灣男性平均長度為 ${taiwanMaleStats.AVG_LENGTH} 公分（中位數 ${taiwanMaleStats.MEDIAN_LENGTH} 公分）。`;
    }
    return "測量結果非常可信，尺寸數據符合自然規律。";
  } else if (truthScore >= 60) {
    if (objectType === 'other_rod' && isMaleFeature && lengthValue) {
      return `測量結果基本可信，但可能有輕微偏差。您的長度為 ${lengthValue} 公分，${percentileDescription}。台灣男性平均長度為 ${taiwanMaleStats.AVG_LENGTH} 公分，標準差為 ${taiwanMaleStats.STD_DEVIATION} 公分。`;
    }
    return "測量結果基本可信，但可能有輕微偏差。建議嘗試從不同角度測量以獲得更準確結果。";
  } else if (truthScore >= 40) {
    if (objectType === 'other_rod' && isMaleFeature && lengthValue) {
      const difference = Math.abs(lengthValue - taiwanMaleStats.AVG_LENGTH);
      return `測量結果可疑，與平均值相差 ${difference.toFixed(1)} 公分。台灣男性平均長度為 ${taiwanMaleStats.AVG_LENGTH} 公分，您的數據位於 ${percentileDescription}。建議重新測量，保持直角拍攝並避免使用廣角鏡頭。`;
    }
    return "測量結果有些可疑。建議重新測量，確保拍攝角度直觀且沒有透視變形。";
  } else {
    if (objectType === 'other_rod' && isMaleFeature && lengthValue) {
      if (lengthValue > taiwanMaleStats.AVG_LENGTH * 1.5) {
        return `測量結果極不可信。您聲稱的長度 ${lengthValue} 公分遠超過台灣男性平均長度 ${taiwanMaleStats.AVG_LENGTH} 公分，甚至超過了 ${taiwanMaleStats.PERCENTILE_99} 公分的99百分位值。請避免使用誇張拍攝手法。`;
      } else if (lengthValue < taiwanMaleStats.REASONABLE_MIN) {
        return `測量結果可能不準確。您聲稱的長度 ${lengthValue} 公分明顯低於台灣男性平均範圍。請確保完整測量物體，且未被裁剪。`;
      } else {
        return `測量結果不可信。台灣男性平均長度為 ${taiwanMaleStats.AVG_LENGTH} 公分，95%的台灣男性在 ${taiwanMaleStats.PERCENTILE_5} 至 ${taiwanMaleStats.PERCENTILE_95} 公分之間。建議使用更科學的測量方法。`;
      }
    }
    return "測量結果極不可信。請確保拍攝角度正確，避免透視變形以及過度裁剪。";
  }
}

/**
 * 使用高斯分佈計算男性特徵可信度分數
 * @param length 長度值（公分）
 * @returns 可信度分數 (0-100)
 */
function calculateMaleCredibilityScore(length: number): number {
  const mean = TAIWAN_MALE_STATS.AVG_LENGTH;
  const stdDev = TAIWAN_MALE_STATS.STD_DEVIATION;
  
  // 計算與平均值的標準差距離
  const zScore = Math.abs(length - mean) / stdDev;
  
  // 基於標準差距離計算可信度分數
  // 距離平均值越遠，分數越低
  let score = 100;
  
  if (zScore <= 1) {
    // 在1個標準差內 - 保持高分數 (80-100)
    score = 100 - (zScore * 20);
  } else if (zScore <= 2) {
    // 在1-2個標準差之間 (60-80)
    score = 80 - ((zScore - 1) * 20);
  } else if (zScore <= 3) {
    // 在2-3個標準差之間 (30-60)
    score = 60 - ((zScore - 2) * 30);
  } else if (zScore <= 4) {
    // 在3-4個標準差之間 (10-30)
    score = 30 - ((zScore - 3) * 20);
  } else {
    // 超過4個標準差 - 極低分數
    score = 10;
  }
  
  // 額外條件調整
  // 如果長度明顯大於平均，分數降低更多
  if (length > mean * 1.5) {
    score -= 20;
  }
  // 如果長度超過99百分位，大幅降低分數
  if (length > TAIWAN_MALE_STATS.PERCENTILE_99) {
    score -= 30;
  }
  // 如果長度小於5百分位，適度降低分數
  if (length < TAIWAN_MALE_STATS.PERCENTILE_5) {
    score -= 10;
  }
  
  // 確保分數在0-100之間
  return Math.max(0, Math.min(100, score));
}

/**
 * 獲取基於男性長度的百分位描述
 * @param length 長度值（公分）
 * @returns 百分位描述字串
 */
function getMalePercentileDescription(length: number): string {
  if (length > TAIWAN_MALE_STATS.PERCENTILE_99) {
    return `處於台灣男性99%以上的罕見範圍`;
  } else if (length > TAIWAN_MALE_STATS.PERCENTILE_95) {
    return `處於台灣男性前5%的範圍`;
  } else if (length > TAIWAN_MALE_STATS.PERCENTILE_90) {
    return `處於台灣男性前10%的範圍`;
  } else if (length > TAIWAN_MALE_STATS.PERCENTILE_75) {
    return `高於台灣男性平均水平`;
  } else if (length >= TAIWAN_MALE_STATS.PERCENTILE_25) {
    return `處於台灣男性平均水平範圍內`;
  } else if (length >= TAIWAN_MALE_STATS.PERCENTILE_5) {
    return `低於台灣男性平均水平`;
  } else {
    return `顯著低於台灣男性平均水平`;
  }
} 