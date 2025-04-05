import { motion } from 'framer-motion';
import { TruthAnalysisResult } from './TruthDetector';
import { FiAward, FiAlertTriangle, FiInfo } from 'react-icons/fi';

interface TruthfulnessIndicatorProps {
  truthAnalysis: TruthAnalysisResult;
  objectType: 'cucumber' | 'banana' | 'other_rod';
  originalLength: number;
}

export default function TruthfulnessIndicator({
  truthAnalysis,
  objectType,
  originalLength
}: TruthfulnessIndicatorProps) {
  // 根據分數變化顏色和圖示
  const getTruthColor = () => {
    if (truthAnalysis.truthScore >= 90) return "text-green-600";
    if (truthAnalysis.truthScore >= 75) return "text-blue-600";
    if (truthAnalysis.truthScore >= 50) return "text-yellow-600";
    return "text-amber-600";
  };
  
  const getTruthBgColor = () => {
    if (truthAnalysis.truthScore >= 90) return "bg-green-50";
    if (truthAnalysis.truthScore >= 75) return "bg-blue-50";
    if (truthAnalysis.truthScore >= 50) return "bg-yellow-50";
    return "bg-amber-50";
  };
  
  const getBorderColor = () => {
    if (truthAnalysis.truthScore >= 90) return "border-green-100";
    if (truthAnalysis.truthScore >= 75) return "border-blue-100";
    if (truthAnalysis.truthScore >= 50) return "border-yellow-100";
    return "border-amber-100";
  };
  
  const getIcon = () => {
    if (truthAnalysis.truthScore >= 75) return <FiAward className="w-5 h-5" />;
    if (truthAnalysis.truthScore >= 50) return <FiInfo className="w-5 h-5" />;
    return <FiAlertTriangle className="w-5 h-5" />;
  };
  
  // 獲取標題
  const getTitle = () => {
    if (truthAnalysis.truthScore >= 90) return "✓ 極高真實度";
    if (truthAnalysis.truthScore >= 75) return "✓ 高真實度";
    if (truthAnalysis.truthScore >= 50) return "⚠️ 存在可疑跡象";
    return "⚠️ 高度可疑照片";
  };
  
  // 格式化調整後的長度顯示
  const getLengthAdjustment = () => {
    if (!truthAnalysis.isSuspicious) return null;
    
    const difference = originalLength - truthAnalysis.adjustedLength;
    const percentChange = Math.round((difference / originalLength) * 100);
    
    return (
      <div className="mt-2 text-sm">
        <span className="font-medium">測謊調整:</span> {originalLength}cm → 
        <span className="font-medium"> {truthAnalysis.adjustedLength}cm </span>
        <span className="text-xs text-slate-500">
          ({percentChange > 0 ? "-" : "+"}{Math.abs(percentChange)}%)
        </span>
      </div>
    );
  };
  
  // 可疑特徵顯示
  const getSuspiciousFeatures = () => {
    if (!truthAnalysis.isSuspicious || truthAnalysis.suspiciousFeatures.length === 0) return null;
    
    return (
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium">偵測到的可疑特徵:</p>
        <div className="flex flex-wrap gap-1">
          {truthAnalysis.suspiciousFeatures.map((feature, index) => (
            <span 
              key={index} 
              className="px-2 py-0.5 text-xs rounded-full bg-white/50 border border-current"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={`mt-6 p-3 rounded-lg border ${getBorderColor()} ${getTruthBgColor()}`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 p-2 rounded-full ${getTruthBgColor()} ${getTruthColor()} mr-3`}>
          {getIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${getTruthColor()}`}>{getTitle()}</h4>
            <div className="flex items-center">
              <div className={`text-sm font-semibold ${getTruthColor()}`}>
                {truthAnalysis.truthScore}/100
              </div>
              <div className="ml-2 h-2 w-16 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current"
                  style={{ width: `${truthAnalysis.truthScore}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <p className="text-sm mt-1">{truthAnalysis.funnyMessage}</p>
          
          {getLengthAdjustment()}
          {getSuspiciousFeatures()}
          
          {truthAnalysis.isSuspicious && (
            <div className="mt-3 text-xs p-2 rounded bg-white/50">
              <p className="font-medium">AI測謊儀小提示:</p>
              <p className="mt-1">
                若要拍出更「真實」的蔬果照片，建議使用自然光線，適當距離，並避免使用廣角鏡頭或特殊相機角度。
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 