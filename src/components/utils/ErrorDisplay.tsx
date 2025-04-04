import { motion } from 'framer-motion';
import { FiAlertCircle, FiWifiOff, FiImage, FiClock } from 'react-icons/fi';

interface ErrorDisplayProps {
  errorMessage: string | null;
  className?: string;
}

export default function ErrorDisplay({ errorMessage, className = '' }: ErrorDisplayProps) {
  if (!errorMessage) return null;
  
  // 確定錯誤類型
  const errorType = 
    errorMessage.includes("不是小黃瓜或香蕉") || 
    errorMessage.includes("不符合要求") ? "object-type" :
    errorMessage.includes("多個物體") ? "multiple-objects" :
    errorMessage.includes("超時") || errorMessage.includes("稍後再試") ? "timeout" :
    errorMessage.includes("不可用") ? "service-unavailable" :
    "generic";
  
  // 根據錯誤類型選擇圖標
  const IconComponent = 
    errorType === "object-type" ? FiImage :
    errorType === "multiple-objects" ? FiImage :
    errorType === "timeout" ? FiClock :
    errorType === "service-unavailable" ? FiWifiOff :
    FiAlertCircle;
  
  // 針對特定錯誤類型提供建議
  const suggestion = 
    errorType === "object-type" ? "請上傳小黃瓜或香蕉的照片" :
    errorType === "multiple-objects" ? "請確保圖片中只有一個物體" :
    errorType === "timeout" ? "請檢查網路連接或稍後再試" :
    errorType === "service-unavailable" ? "AI服務暫時忙碌，請稍後再試" :
    "請重試或上傳其他圖片";
  
  // 不同錯誤類型的背景顏色
  const bgColor = 
    errorType === "generic" ? "bg-red-50" :
    errorType === "timeout" ? "bg-amber-50" :
    errorType === "service-unavailable" ? "bg-blue-50" :
    "bg-red-50";
  
  const borderColor = 
    errorType === "generic" ? "border-red-100" :
    errorType === "timeout" ? "border-amber-100" :
    errorType === "service-unavailable" ? "border-blue-100" :
    "border-red-100";
  
  const textColor = 
    errorType === "generic" ? "text-red-600" :
    errorType === "timeout" ? "text-amber-600" :
    errorType === "service-unavailable" ? "text-blue-600" :
    "text-red-600";

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 p-3 sm:p-4 ${bgColor} border ${borderColor} rounded-lg flex items-start ${textColor} ${className}`}
    >
      <IconComponent className="mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex flex-col">
        <p className="text-sm font-medium">
          {errorType === "object-type" ? "物體類型錯誤" :
           errorType === "multiple-objects" ? "圖片有多個物體" :
           errorType === "timeout" ? "請求超時" :
           errorType === "service-unavailable" ? "服務暫時不可用" :
           "分析錯誤"}
        </p>
        <p className="text-xs mt-1 opacity-90">{errorMessage}</p>
        <p className="text-xs mt-2 opacity-80 font-medium">{suggestion}</p>
      </div>
    </motion.div>
  );
} 