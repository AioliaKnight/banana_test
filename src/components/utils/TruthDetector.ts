/**
 * TruthDetector.ts - 蔬果真實性鑑定模組
 * 
 * 這個模組提供"測謊儀"功能，用於判斷上傳圖片的真實度，
 * 並以幽默方式提供反饋。
 */

// =================================
// Imports
// =================================
import { ObjectType, TruthAnalysisResult } from '@/types';

// =================================
// Constants
// =================================

// Suspicious Feature Descriptions
export const SUSPICIOUS_FEATURES = {
  LENGTH_TOO_LONG: "長度過長，超出正常範圍",
  LENGTH_TOO_SHORT: "長度過短，不符合典型尺寸",
  TOO_THICK: "粗細超出正常物品範圍",
  TOO_THIN: "粗細過細，不符合典型比例",
  ABNORMAL_RATIO: "長度與粗細比例異常",
};

// Humorous Responses for Suspicious Results
export const SUSPICIOUS_RESPONSES = [
  "這尺寸...恐怕只存在於你的想像中。",
  "哈哈！真有創意的「測量方式」！",
  "這數字比我前男友的謊言還要誇張...",
  "嗯～我有理由相信這是經過「藝術加工」的數據。",
  "這照片是不是用了那種「增大濾鏡」啊？",
  "看來有人很懂得如何「取景」嘛～"
];

// Humorous Responses for Reasonable Results
export const REASONABLE_RESPONSES = [
  "看起來是真實的測量結果，值得信賴！",
  "這數據相當合理，應該是實際尺寸無誤。",
  "嗯，這個尺寸很符合現實，沒有誇大。",
  "數據看起來很真實，不像是吹噓的結果。",
  "我相信這是誠實測量的結果。"
];

// Statistical Data (Taiwan Male Averages - used for comparison)
export const TAIWAN_MALE_STATS = {
  AVG_LENGTH: 12.5,       // Average length (cm)
  MEDIAN_LENGTH: 12.2,    // Median length (cm)
  STD_DEVIATION: 1.5,     // Standard Deviation (cm)
  PERCENTILE_5: 10.0,     // 5th Percentile length (cm)
  PERCENTILE_25: 11.4,    // 25th Percentile length (cm)
  PERCENTILE_75: 13.6,    // 75th Percentile length (cm)
  PERCENTILE_90: 14.5,    // 90th Percentile length (cm)
  PERCENTILE_95: 15.0,    // 95th Percentile length (cm)
  PERCENTILE_99: 16.5,    // 99th Percentile length (cm)
  GLOBAL_AVG: 13.1,        // Global average length (cm)
  ASIAN_AVG: 12.6,         // Asian average length (cm)
  REASONABLE_MIN: 3.0,     // Reasonable lower limit (cm) - 降低最小閾值
  REASONABLE_MAX: 30.0,    // Reasonable upper limit (cm) - 降低最大閾值
};

// =================================
// Interfaces & Types (Local)
// =================================

// Configuration Interface for TruthDetector settings
export interface TruthDetectorConfig {
  averageLengths: Record<string, number>;
  reasonableRatios: Record<string, number>;
  suspiciousThresholds: {
    truthScoreThreshold: number;
    lengthExceedRatio: number;
    otherRodMaxLength: number;
  };
  suspicionWeights: {
    lengthWeight: number;
    ratioWeight: number;
  };
  adjustmentSettings: {
    maxAdjustment: number;
    minAdjustmentFactor: number;
  };
  responses: {
    funnyResponses: string[];
    suspiciousFeatures: string[];
    suspicious: string[];
    reasonable: string[];
    general: string[];
    unidentified: string[];
  };
  dimensionLimits: {
    cucumber: { 
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
    };
    banana: { 
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
    };
    other_rod: { 
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
      maleFeatureMinLength: number; maleFeatureMaxLength: number; maleFeatureMinThickness: number;
      nonMaleFeatureMaxLength: number; nonMaleFeatureMaxThickness: number;
    };
    default: { 
      minLength: number; maxLength: number; minThickness: number; maxThickness: number;
      reasonableMinLength: number; reasonableMaxLength: number; reasonableMinThickness: number; reasonableMaxThickness: number;
    };
  };
}

// =================================
// Global Configuration Object
// =================================

// Export the config so it can be used elsewhere (e.g., for random data generation)
export const CONFIG: TruthDetectorConfig = {
  averageLengths: {
    cucumber: 15.0, // Average cucumber length (降低)
    banana: 15.0,   // Average banana length (降低)
    other_rod: TAIWAN_MALE_STATS.AVG_LENGTH // Use Taiwan male average constant
  },
  reasonableRatios: {
    cucumber: 5.5, // Average cucumber length/thickness ratio
    banana: 5,     // Average banana length/thickness ratio
    other_rod: 4.5 // Average other_rod ratio
  },
  suspiciousThresholds: {
    truthScoreThreshold: 70, // 降低門檻值，使系統更容易懷疑高估值
    lengthExceedRatio: 1.3,  // 降低超出比例，使系統更容易偵測到過長情況
    otherRodMaxLength: TAIWAN_MALE_STATS.REASONABLE_MAX
  },
  suspicionWeights: {
    lengthWeight: 0.7, // 增加長度權重
    ratioWeight: 0.4
  },
  adjustmentSettings: {
    maxAdjustment: 0.35, // 增加調整範圍
    minAdjustmentFactor: 0.65 // 降低最小調整因子，允許更大幅度的調整
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
      "不自然的透視效果", "可疑的光線角度", "異常的比例關係", "與參考物尺寸不協調",
      "拍攝距離過近", "可能使用了廣角鏡", "影像有輕微扭曲", "邊緣有平滑處理痕跡",
      "光影與尺寸不成比例", "疑似進行了「戰略性裁剪」"
    ],
    suspicious: [
      "這張照片可能經過了「創意處理」...", "嗯...這圖片看起來有點可疑呢",
      "哎呀，這不太符合物理定律啊", "照片很美，但誠實度有待考驗",
      "這個數據可能有點「藝術加工」成分"
    ],
    reasonable: [
      "這個看起來相當合理！", "尺寸看起來很正常",
      "測量結果符合自然界的常見規律", "這個數據很誠實",
      "看起來沒有經過特殊處理"
    ],
    general: [
      "我對這個尺寸保持中立態度", "科學地說，這個測量結果是有可能的",
      "數據上看，這在可接受範圍內", "測量結果已記錄，無特別意見"
    ],
    unidentified: [
      "無法確認物體類型，難以判斷真實性", "請確認圖片中含有可識別的目標物體",
      "系統無法識別此物體，測量結果僅供參考", "這是...某種未知物體？測量精度有限"
    ]
  },
  dimensionLimits: {
    cucumber: { 
      minLength: 0, maxLength: 50, minThickness: 0, maxThickness: 8,
      reasonableMinLength: 8, reasonableMaxLength: 30, reasonableMinThickness: 1.5, reasonableMaxThickness: 5
    },
    banana: { 
      minLength: 0, maxLength: 45, minThickness: 0, maxThickness: 7,
      reasonableMinLength: 8, reasonableMaxLength: 25, reasonableMinThickness: 2, reasonableMaxThickness: 5
    },
    other_rod: { 
      minLength: 0, maxLength: 200, minThickness: 0, maxThickness: 100,
      reasonableMinLength: 5, reasonableMaxLength: 100, reasonableMinThickness: 1, reasonableMaxThickness: 20,
      maleFeatureMinLength: TAIWAN_MALE_STATS.REASONABLE_MIN, 
      maleFeatureMaxLength: TAIWAN_MALE_STATS.REASONABLE_MAX,
      maleFeatureMinThickness: 2.5,
      nonMaleFeatureMaxLength: 100, 
      nonMaleFeatureMaxThickness: 20
    },
    default: { 
      minLength: 0, maxLength: 100, minThickness: 0, maxThickness: 20,
      reasonableMinLength: 0, reasonableMaxLength: 100, reasonableMinThickness: 0, reasonableMaxThickness: 20
    }
  }
};

// =================================
// Helper Functions
// =================================

/**
 * Checks if the given dimensions are within the reasonable range for the object type.
 * @param {number} length
 * @param {number} thickness
 * @param {ObjectType} type
 * @returns {boolean} True if dimensions are reasonable, false otherwise.
 */
export function isReasonableDimension(length: number, thickness: number, type: ObjectType): boolean {
  if (!type) return false;
  
  // Get reasonable limits from config
  const limits = CONFIG.dimensionLimits[type];
  
  // Special handling for 'other_rod' type
  if (type === 'other_rod') {
    const otherRodLimits = CONFIG.dimensionLimits.other_rod;
    
    // Check if it likely matches male feature dimension range
    const isMaleFeature = length >= otherRodLimits.maleFeatureMinLength && 
                         length <= otherRodLimits.maleFeatureMaxLength && 
                         thickness >= otherRodLimits.maleFeatureMinThickness;
    
    if (isMaleFeature) {
      // 對男性特徵使用嚴格標準
      const isReasonableLength = length >= otherRodLimits.maleFeatureMinLength && length <= otherRodLimits.maleFeatureMaxLength;
      const isReasonableThickness = thickness >= otherRodLimits.maleFeatureMinThickness && thickness <= otherRodLimits.reasonableMaxThickness;
      return isReasonableLength && isReasonableThickness;
    }
    
    // 對非男性特徵使用更寬鬆的標準
    return length > 0 && length <= otherRodLimits.nonMaleFeatureMaxLength && 
           thickness > 0 && thickness <= otherRodLimits.nonMaleFeatureMaxThickness;
  }
  
  // 對小黃瓜/香蕉使用更寬鬆的標準
  return (length > 0 && length <= limits.maxLength) && 
         (thickness > 0 && thickness <= limits.maxThickness);
}

/**
 * Calculates the credibility score specifically for male features using Gaussian distribution.
 * @param {number} length Length value (cm).
 * @returns {number} Credibility score (0-100).
 */
function calculateMaleCredibilityScore(length: number): number {
  const mean = TAIWAN_MALE_STATS.AVG_LENGTH;
  const stdDev = TAIWAN_MALE_STATS.STD_DEVIATION;
  
  // Calculate Z-score (distance from mean in standard deviations)
  const zScore = Math.abs(length - mean) / stdDev;
  
  // Calculate score based on Z-score (further from mean = lower score)
  let score = 100;
  if (zScore <= 1) { // Within 1 SD
    score = 100 - (zScore * 20);
  } else if (zScore <= 2) { // Between 1-2 SD
    score = 80 - ((zScore - 1) * 20);
  } else if (zScore <= 3) { // Between 2-3 SD
    score = 60 - ((zScore - 2) * 30);
  } else if (zScore <= 4) { // Between 3-4 SD
    score = 30 - ((zScore - 3) * 20);
  } else { // Beyond 4 SD
    score = 10;
  }
  
  // Additional adjustments based on thresholds
  if (length > mean * 1.5) score -= 20; // Significantly larger than mean
  if (length > TAIWAN_MALE_STATS.PERCENTILE_99) score -= 30; // Above 99th percentile
  if (length < TAIWAN_MALE_STATS.PERCENTILE_5) score -= 10; // Below 5th percentile
  
  // Ensure score is within 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Gets a descriptive string based on male length percentile.
 * @param {number} length Length value (cm).
 * @returns {string} Percentile description.
 */
function getMalePercentileDescription(length: number): string {
  const stats = TAIWAN_MALE_STATS;
  if (length > stats.PERCENTILE_99) return `處於台灣男性99%以上的罕見範圍`;
  if (length > stats.PERCENTILE_95) return `處於台灣男性前5%的範圍`;
  if (length > stats.PERCENTILE_90) return `處於台灣男性前10%的範圍`;
  if (length > stats.PERCENTILE_75) return `高於台灣男性平均水平`;
  if (length >= stats.PERCENTILE_25) return `處於台灣男性平均水平範圍內`;
  if (length >= stats.PERCENTILE_5) return `低於台灣男性平均水平`;
  return `顯著低於台灣男性平均水平`;
}

// =================================
// Exported Core Logic Functions
// =================================

/**
 * Analyzes the truthfulness of the provided dimensions and object type.
 * @param {ObjectType} objectType
 * @param {number} length
 * @param {number} thickness
 * @param {'male_feature' | 'regular_rod'} [rodSubtype]
 * @returns {TruthAnalysisResult} The analysis result including score, suspicion, and messages.
 */
export function analyzeTruth(
  objectType: ObjectType,
  length: number,
  thickness: number,
  rodSubtype?: 'male_feature' | 'regular_rod'
): TruthAnalysisResult {
  const isMaleFeature = objectType === 'other_rod' && rodSubtype === 'male_feature';
  const validObjectType = (objectType && ['cucumber', 'banana', 'other_rod'].includes(objectType)) ? objectType : 'cucumber'; // Default if invalid

  if (!length || !thickness || length <= 0 || thickness <= 0) {
    return {
      truthScore: 75, isSuspicious: false, suspiciousFeatures: [],
      funnyMessage: "無法確定真偽，缺少有效尺寸信息...",
      suggestionMessage: "請提供有效的長度和寬度進行分析。",
      adjustedLength: length, adjustmentFactor: 1
    };
  }

  const suspiciousFeatures: string[] = [];
  let suspicionScore = 0; // Used for adjustment factor
  let truthScore = 100; // Final score reflecting credibility

  if (isMaleFeature) {
    // 保持男性特徵的嚴格標準
    truthScore = calculateMaleCredibilityScore(length);

    if (length > TAIWAN_MALE_STATS.PERCENTILE_95) {
      suspiciousFeatures.push("尺寸超過95%台灣男性，極其罕見"); suspicionScore += 60;
    } else if (length > TAIWAN_MALE_STATS.PERCENTILE_90) {
      suspiciousFeatures.push("尺寸超過90%台灣男性，相當罕見"); suspicionScore += 40;
    } else if (length > TAIWAN_MALE_STATS.PERCENTILE_75) {
      suspiciousFeatures.push("尺寸超過75%台灣男性，少見"); suspicionScore += 20;
    } else if (length < TAIWAN_MALE_STATS.REASONABLE_MIN) {
      suspiciousFeatures.push("尺寸低於一般統計下限，可能測量不準確"); suspicionScore += 20;
    }

    // Check thickness reasonableness for male features
    if (thickness > 5.0) { // Use a slightly higher max threshold for thickness suspicion
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THICK); suspicionScore += 30;
    } else if (thickness < 2.5) {
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THIN); suspicionScore += 20;
    }

    // Check length-to-thickness ratio
    const lengthToThicknessRatio = length / thickness;
    if (lengthToThicknessRatio > 6.0 || lengthToThicknessRatio < 3.0) { // Wider reasonable ratio for male features
      suspiciousFeatures.push(SUSPICIOUS_FEATURES.ABNORMAL_RATIO); suspicionScore += 25;
    }

  } else {
    // 對非男性特徵使用更寬鬆的標準
    const avgLength = CONFIG.averageLengths[validObjectType] || CONFIG.averageLengths.cucumber;
    const avgThickness = (validObjectType === 'cucumber' ? 3.0 : validObjectType === 'banana' ? 3.2 : 3.5);
    const idealRatio = CONFIG.reasonableRatios[validObjectType] || CONFIG.reasonableRatios.cucumber;

    // 放寬非男性特徵的長度檢查標準
    const lengthRatio = length / avgLength;
    if (lengthRatio > 2.0) { suspicionScore += 15; suspiciousFeatures.push(SUSPICIOUS_FEATURES.LENGTH_TOO_LONG); truthScore -= 15; } // 提高閾值，減少懷疑分數
    else if (lengthRatio < 0.4) { suspicionScore += 10; suspiciousFeatures.push(SUSPICIOUS_FEATURES.LENGTH_TOO_SHORT); truthScore -= 5; } // 降低閾值，減少懷疑分數

    // 放寬非男性特徵的厚度檢查標準
    const thicknessRatio = thickness / avgThickness;
    if (thicknessRatio > 2.5) { suspicionScore += 15; suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THICK); truthScore -= 15; } // 提高閾值，減少懷疑分數
    else if (thicknessRatio < 0.3) { suspicionScore += 10; suspiciousFeatures.push(SUSPICIOUS_FEATURES.TOO_THIN); truthScore -= 5; } // 降低閾值，減少懷疑分數

    // 放寬比例檢查
    const lengthToThicknessRatio = length / thickness;
    const ratioDeviation = Math.abs(lengthToThicknessRatio - idealRatio) / idealRatio;
    if (ratioDeviation > 0.8) { suspicionScore += 15; suspiciousFeatures.push(SUSPICIOUS_FEATURES.ABNORMAL_RATIO); truthScore -= 10; } // 提高閾值，減少懷疑分數
  }

  truthScore = Math.max(0, Math.min(100, truthScore));
  // 對非男性特徵使用更寬鬆的懷疑標準
  const isSuspicious = isMaleFeature ? (truthScore < 60) : (suspicionScore >= 50); // 提高非男性特徵的懷疑門檻

  // 對非男性特徵使用更溫和的調整因子
  const adjustmentFactor = isMaleFeature 
    ? Math.max(CONFIG.adjustmentSettings.minAdjustmentFactor, 1 - (suspicionScore / 120)) 
    : Math.max(0.75, 1 - (suspicionScore / 200)); // 非男性特徵使用更溫和的調整
  
  const adjustedLength = Math.round((length * adjustmentFactor) * 10) / 10;

  let funnyMessage = "";
  if (isMaleFeature) {
    if (isSuspicious) {
      if (length > TAIWAN_MALE_STATS.REASONABLE_MAX * 1.1) { funnyMessage = "統計學表示：這種尺寸是千萬分之一的機率，比中樂透還難！"; }
      else if (length > TAIWAN_MALE_STATS.PERCENTILE_99) { funnyMessage = `這尺寸聲稱超過了99%的台灣男性，統計學上的可能性極低...`; }
      else if (length > TAIWAN_MALE_STATS.PERCENTILE_95) { funnyMessage = `聲稱的數據位於前5%，非常罕見，可能有測量誤差。`; }
      else if (length < TAIWAN_MALE_STATS.REASONABLE_MIN) { funnyMessage = "測量值似乎偏小，可能測量方式有誤。正確測量應從恥骨開始到頂端。"; }
      else { funnyMessage = SUSPICIOUS_RESPONSES[Math.floor(Math.random() * SUSPICIOUS_RESPONSES.length)]; }
    } else {
      if (length > TAIWAN_MALE_STATS.PERCENTILE_90) { funnyMessage = `數據顯示這個尺寸高於絕大多數台灣男性，但仍在統計學可信範圍內。恭喜！`; } 
      else if (length > TAIWAN_MALE_STATS.PERCENTILE_75) { funnyMessage = `數據顯示這個尺寸高於多數台灣男性(${getMalePercentileDescription(length)})，屬於優良範圍。`; }
      else if (length >= TAIWAN_MALE_STATS.PERCENTILE_25) { funnyMessage = `這個尺寸非常接近台灣男性平均值${TAIWAN_MALE_STATS.AVG_LENGTH}cm，數據看起來很誠實(${getMalePercentileDescription(length)})。`; }
      else { funnyMessage = `尺寸在台灣男性常見範圍內(${getMalePercentileDescription(length)})，數據可信度高。`; }
    }
  } else {
    // 更有趣的非男性特徵評論
    if (isSuspicious) {
      const funnyResponses = [
        `這${objectType === 'cucumber' ? '小黃瓜' : objectType === 'banana' ? '香蕉' : '物品'}看起來是在「特殊視角」下拍攝的呢～你的攝影技巧真是讓人嘆為觀止！`,
        `哎呀！這${objectType === 'cucumber' ? '小黃瓜' : objectType === 'banana' ? '香蕉' : '棒狀物'}的尺寸讓AI都忍不住笑出聲～是不是用了什麼神奇的縮放濾鏡？`,
        `哇塞，這測量結果比我前任對他自己的評價還要誇張，厲害了！`,
        `這個尺寸聲明有點像政治人物的承諾，聽起來很棒但實際上...嗯...你懂的～`,
        `這張照片的角度選得真巧妙，是那種「讓人想像空間更大」的藝術效果吧？`,
        `這${objectType === 'cucumber' ? '小黃瓜' : objectType === 'banana' ? '香蕉' : '物品'}可能是用了那種「讓東西看起來特別驚人」的特效相機拍的吧？`
      ];
      funnyMessage = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
    } else {
      const truthfulResponses = [
        `這${objectType === 'cucumber' ? '小黃瓜' : objectType === 'banana' ? '香蕉' : '棒狀物'}的尺寸相當真實可信！如實呈現，不誇張，這種誠實真是令人欣賞～`,
        `這測量結果看起來非常合理！就像是一個不說謊的好朋友，值得信賴！`,
        `數據顯示這是一個標準的${objectType === 'cucumber' ? '小黃瓜' : objectType === 'banana' ? '香蕉' : '棒狀物'}尺寸，很健康自然的比例～`,
        `這個尺寸數據就像是剛出爐的統計報告，準確又可靠！`,
        `哇！難得看到如此誠實的測量結果！這種不浮誇的態度值得鼓勵～`,
      ];
      funnyMessage = truthfulResponses[Math.floor(Math.random() * truthfulResponses.length)];
    }
  }

  const suggestionMessage = getSuggestionMessage(truthScore, objectType, rodSubtype, length);

  return {
    truthScore: Math.round(truthScore),
    isSuspicious,
    suspiciousFeatures,
    funnyMessage,
    suggestionMessage,
    adjustedLength: isSuspicious ? adjustedLength : length,
    adjustmentFactor: isSuspicious ? adjustmentFactor : 1
  };
}

/**
 * Calculates the final display score based on various factors.
 * @param {number} baseScore Score from Gemini (0-10).
 * @param {number} freshness Freshness score (0-10).
 * @param {number} length Adjusted length (cm).
 * @param {number} thickness Adjusted thickness (cm).
 * @param {ObjectType} objectType
 * @returns {number} Final score (0.0-9.5).
 */
export function calculateFinalScore(
  baseScore: number,
  freshness: number,
  length: number,
  thickness: number,
  objectType: ObjectType
): number {
  let finalScore = Math.max(0, Math.min(9.0, baseScore * 0.9)); // 降低基本分數 10%

  // Factor in dimension reasonableness
  const reasonable = isReasonableDimension(length, thickness, objectType);
  finalScore += reasonable ? 0.2 : -0.5; // 降低合理長度獎勵，增加不合理長度懲罰

  // Factor in freshness
  const freshnessImpact = (freshness - 6) * 0.06; // 降低新鮮度影響
  finalScore += freshnessImpact;

  // Specific adjustments for 'other_rod' (male feature focus)
  if (objectType === 'other_rod') {
    const stats = TAIWAN_MALE_STATS;
    if (length > 0) {
      if (length >= stats.PERCENTILE_25 && length <= stats.PERCENTILE_75) finalScore += 0.1; // 降低均值範圍獎勵
      else if (length > stats.PERCENTILE_75 && length <= stats.PERCENTILE_90) finalScore += 0.05; // 降低較高範圍獎勵
      else if (length < stats.PERCENTILE_25 && length >= stats.PERCENTILE_5) finalScore -= 0.15; // 增加低於均值懲罰
      else if (length < stats.PERCENTILE_5 || length > stats.PERCENTILE_90) finalScore -= 0.5; // 增加極端值懲罰
    }
  }

  // Ensure score stays within 0.0-9.0 range (降低最高分為9.0)
  return parseFloat((Math.max(0.0, Math.min(9.0, finalScore))).toFixed(1));
}

/**
 * Adjusts the estimated dimensions based on object type and predefined limits.
 * @param {number} lengthEstimate
 * @param {number} thicknessEstimate
 * @param {ObjectType | null} objectType
 * @returns {{ adjustedLength: number; adjustedThickness: number }} Adjusted dimensions.
 */
export function adjustDimensions(
  lengthEstimate: number,
  thicknessEstimate: number,
  objectType: ObjectType | null
): { adjustedLength: number; adjustedThickness: number } {
  const limits = objectType ? CONFIG.dimensionLimits[objectType] : CONFIG.dimensionLimits.default;
  
  // 區分男性特徵與非男性特徵的調整邏輯
  const isMaleFeature = objectType === 'other_rod' && 
                       lengthEstimate >= CONFIG.dimensionLimits.other_rod.maleFeatureMinLength && 
                       lengthEstimate <= CONFIG.dimensionLimits.other_rod.maleFeatureMaxLength &&
                       thicknessEstimate >= CONFIG.dimensionLimits.other_rod.maleFeatureMinThickness;
  
  // 對男性特徵保持原有的下調邏輯
  let adjLength = isMaleFeature ? Math.max(lengthEstimate * 0.9, 5) : lengthEstimate;
  let adjThickness = isMaleFeature ? thicknessEstimate * 0.95 : thicknessEstimate;

  if (objectType === 'other_rod') {
    if (isMaleFeature) {
      // 對男性特徵使用嚴格限制
      const rodLimits = CONFIG.dimensionLimits.other_rod;
      adjLength = Math.max(rodLimits.maleFeatureMinLength, Math.min(rodLimits.maleFeatureMaxLength, adjLength)); 
      adjThickness = Math.max(rodLimits.maleFeatureMinThickness, Math.min(rodLimits.reasonableMaxThickness, adjThickness));
    } else {
      // 對非男性特徵使用寬鬆限制
      const rodLimits = CONFIG.dimensionLimits.other_rod;
      adjLength = Math.max(rodLimits.minLength, Math.min(rodLimits.nonMaleFeatureMaxLength, adjLength));
      adjThickness = Math.max(rodLimits.minThickness, Math.min(rodLimits.nonMaleFeatureMaxThickness, adjThickness));
    }
  } else {
    // 對小黃瓜/香蕉使用寬鬆限制
    adjLength = Math.max(limits.minLength, Math.min(limits.maxLength, adjLength));
    adjThickness = Math.max(limits.minThickness, Math.min(limits.maxThickness, adjThickness));
  }

  // 小數點位數調整
  const adjustedLength = Math.round(adjLength * 10) / 10;
  const adjustedThickness = Math.round(adjThickness * 10) / 10;

  return { adjustedLength, adjustedThickness };
}

/**
 * Generates a suggestion message based on truth score and object type.
 * @param {number} truthScore (0-100)
 * @param {ObjectType} objectType
 * @param {'male_feature' | 'regular_rod'} [rodSubtype]
 * @param {number} [lengthValue]
 * @returns {string} Suggestion message.
 */
export function getSuggestionMessage(
  truthScore: number, 
  objectType: ObjectType, 
  rodSubtype?: 'male_feature' | 'regular_rod',
  lengthValue?: number
): string {
  const isMaleFeature = objectType === 'other_rod' && rodSubtype === 'male_feature';
  const stats = TAIWAN_MALE_STATS;
  
  // 只有當為男性特徵時才使用percentileDesc
  const percentileDesc = (lengthValue && isMaleFeature) ? getMalePercentileDescription(lengthValue) : '';

  // 男性特徵使用原有邏輯
  if (isMaleFeature) {
    if (truthScore >= 85) {
      return `測量結果非常可信。您的長度 ${lengthValue}cm ${percentileDesc}。台灣男性平均約 ${stats.AVG_LENGTH}cm。`;
    } else if (truthScore >= 65) {
      return `測量結果基本可信。您的長度 ${lengthValue}cm ${percentileDesc}。台灣男性平均約 ${stats.AVG_LENGTH}cm，標準差 ${stats.STD_DEVIATION}cm。`;
    } else if (truthScore >= 40) {
      return `測量結果可疑。您測得 ${lengthValue}cm (${percentileDesc})，與平均 ${stats.AVG_LENGTH}cm 相差較大。建議重新測量，保持直角拍攝，避免使用廣角。`;
    } else {
      if (lengthValue) {
        if (lengthValue > stats.PERCENTILE_99) return `測量結果極不可信。您測得 ${lengthValue}cm 遠超台灣男性99%水平 (${stats.PERCENTILE_99}cm)。請勿使用誇張拍攝手法。`;
        if (lengthValue < stats.REASONABLE_MIN) return `測量結果可能不準確。您測得 ${lengthValue}cm 低於常見範圍下限。請確保完整測量物體。`;
        return `測量結果不可信。台灣男性95%介於 ${stats.PERCENTILE_5}cm 至 ${stats.PERCENTILE_95}cm (${percentileDesc})。建議使用標準測量方法。`;
      }
      return "測量結果極不可信。請確保拍攝角度正確，避免透視及裁剪。";
    }
  } 
  
  // 非男性特徵使用幽默文案
  else {
    const itemName = objectType === 'cucumber' ? '小黃瓜' : objectType === 'banana' ? '香蕉' : '棒狀物';
    
    if (truthScore >= 85) {
      return `測量結果非常可信！這${itemName}看起來很標準，如果它去選美，肯定能得獎～`;
    } else if (truthScore >= 65) {
      return `測量結果基本可信。不過下次拍照時可以試試從正面角度拍攝，讓${itemName}展現最佳狀態！`;
    } else if (truthScore >= 40) {
      return `測量結果有點可疑...這個角度讓${itemName}看起來特別「有存在感」！建議換個角度重拍，別讓透視效果搞怪～`;
    } else {
      return `測量結果極不可信！這個${itemName}是去了特效健身房嗎？下次請別用廣角鏡頭近距離拍攝，這會讓物體看起來特別雄偉～`;
    }
  }
} 


/* 
  Original commented out type definitions:

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
*/ 