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

// 用於生成隨機結果的常量
const FUNNY_RESPONSES = [
  "這根香蕉看起來像是在「特定角度」拍攝的呢！畫面構圖很巧妙～",
  "哎呀，AI偵測到「特殊的拍攝技巧」，這角度和距離很...有創意！",
  "AI測謊儀發現此照片與標準蔬果比例有些「創造性差異」，您是攝影師嗎？",
  "有趣！測謊儀偵測到此蔬果似乎借助了「光學魔法」顯得特別雄偉！",
  "根據我們的「蕉學資料庫」，這根的尺寸宣稱有點像是被強化過。您是園藝專家？",
  "您這個「獨特視角」拍攝的蔬果，讓AI測謊儀都忍不住發出了疑惑的笑聲！",
  "測謊儀提醒：過度「慷慨」的測量值可能導致女性用戶嚴重失望，建議適度謙虛～",
  "距離真是個奇妙的東西！靠近拍攝總是能讓事物看起來比實際更...壯觀！"
];

const SUSPICIOUS_FEATURES = [
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
];

/**
 * 分析圖片真實度
 * @param objectType 對象類型 ('cucumber' | 'banana' | 'other_rod')
 * @param measuredLength 測量到的長度
 * @param measuredThickness 測量到的粗細
 * @returns 真實度分析結果
 */
export function analyzeTruth(
  objectType: 'cucumber' | 'banana' | 'other_rod',
  measuredLength: number,
  measuredThickness: number
): TruthAnalysisResult {
  // 根據對象類型決定平均尺寸範圍
  const averageLength = objectType === 'cucumber' 
    ? 17.5 // 小黃瓜平均長度
    : objectType === 'banana' 
      ? 18 // 香蕉平均長度
      : 12.5; // other_rod (台灣男性平均)
      
  // 計算合理的長度/粗細比率
  const reasonableRatio = objectType === 'cucumber' 
    ? 5.5 // 小黃瓜長度/粗細平均比率
    : objectType === 'banana' 
      ? 5 // 香蕉長度/粗細平均比率
      : 4.5; // other_rod平均比率
  
  const actualRatio = measuredLength / measuredThickness;
  
  // 可疑因素1：長度明顯超過平均值
  const lengthSuspicion = measuredLength > (averageLength * 1.3) ? 
    (measuredLength - averageLength * 1.3) / (averageLength * 0.7) * 100 : 0;
  
  // 可疑因素2：長度/粗細比率異常
  const ratioSuspicion = Math.abs(actualRatio - reasonableRatio) / reasonableRatio * 100;
  
  // 綜合可疑度計算
  let totalSuspicion = (lengthSuspicion * 0.6) + (ratioSuspicion * 0.4);
  totalSuspicion = Math.min(totalSuspicion, 100);
  
  // 真實度得分 (越高越真實)
  const truthScore = Math.max(0, Math.min(100, 100 - totalSuspicion));
  
  // 是否判定為可疑
  const isSuspicious = truthScore < 75 || 
                      (objectType === 'other_rod' && measuredLength > 20) ||
                      (measuredLength > averageLength * 1.5);
  
  // 選擇幽默回應
  const funnyMessage = FUNNY_RESPONSES[Math.floor(Math.random() * FUNNY_RESPONSES.length)];
  
  // 選擇可疑特徵
  const suspiciousFeatures: string[] = [];
  if (isSuspicious) {
    // 隨機選擇2-4個可疑特徵
    const numFeatures = Math.floor(Math.random() * 3) + 2;
    const shuffledFeatures = [...SUSPICIOUS_FEATURES].sort(() => 0.5 - Math.random());
    suspiciousFeatures.push(...shuffledFeatures.slice(0, numFeatures));
  }
  
  // 計算調整因子 (真實度越低，調整幅度越大)
  const maxAdjustment = 0.3; // 最大調整30%
  const adjustmentFactor = isSuspicious ? 
    Math.max(0.7, 1 - (maxAdjustment * (1 - truthScore / 100))) : 1;
  
  // 計算調整後的長度
  const adjustedLength = Math.round(measuredLength * adjustmentFactor * 10) / 10;
  
  return {
    truthScore: Math.round(truthScore),
    suspiciousFeatures,
    adjustedLength,
    adjustmentFactor,
    funnyMessage,
    isSuspicious
  };
}

/**
 * 獲取建議訊息
 * @param result 真實度分析結果
 * @param objectType 對象類型
 * @returns 對用戶的建議訊息
 */
export function getSuggestionMessage(
  result: TruthAnalysisResult, 
  objectType: 'cucumber' | 'banana' | 'other_rod'
): string {
  if (!result.isSuspicious) {
    return "恭喜！您的照片通過了真實性測試，測量結果非常可信。";
  }
  
  const objectName = objectType === 'cucumber' ? '黃瓜' : 
                      objectType === 'banana' ? '香蕉' : '物體';
  
  if (result.truthScore < 50) {
    return `您的${objectName}照片存在明顯的「戰略性拍攝」痕跡。下次試著從正常距離直接拍攝，將獲得更準確的測量結果。`;
  } else {
    return `您的${objectName}照片可能因拍攝角度和距離而顯得比實際更大。建議使用自然光線，保持適當距離拍攝以獲得更準確的測量。`;
  }
} 