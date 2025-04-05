import { motion } from 'framer-motion';
import { FiAlertCircle, FiWifiOff, FiImage, FiClock, FiServer } from 'react-icons/fi';

interface ErrorDisplayProps {
  errorMessage: string | null;
  className?: string;
}

export default function ErrorDisplay({ errorMessage, className = '' }: ErrorDisplayProps) {
  if (!errorMessage) return null;
  
  // 確定錯誤類型（基於 ApiError 的 code 類型）
  const errorType = 
    errorMessage.includes("不是小黃瓜或香蕉") || 
    errorMessage.includes("無法辨識") || 
    errorMessage.includes("不符合要求") || 
    errorMessage.includes("INVALID_OBJECT") ? "invalid-object" :
    errorMessage.includes("多個物體") || 
    errorMessage.includes("MULTIPLE_OBJECTS") ? "multiple-objects" :
    errorMessage.includes("質量不佳") || 
    errorMessage.includes("更清晰") || 
    errorMessage.includes("LOW_QUALITY") ? "low-quality" :
    errorMessage.includes("超時") || 
    errorMessage.includes("稍後再試") ? "timeout" :
    errorMessage.includes("不可用") || 
    errorMessage.includes("AI服務") ? "service-unavailable" :
    errorMessage.includes("分析過程中") || 
    errorMessage.includes("API") || 
    errorMessage.includes("API_ERROR") ? "api-error" :
    errorMessage.includes("GENERAL_ERROR") ? "general-error" :
    "general-error";
  
  // 根據錯誤類型選擇圖標
  const IconComponent = 
    errorType === "invalid-object" ? FiImage :
    errorType === "multiple-objects" ? FiImage :
    errorType === "low-quality" ? FiImage :
    errorType === "timeout" ? FiClock :
    errorType === "service-unavailable" ? FiWifiOff :
    errorType === "api-error" ? FiServer :
    FiAlertCircle;
  
  // 針對特定錯誤類型提供建議
  const suggestion = 
    errorType === "invalid-object" ? "請上傳包含清晰的香蕉或小黃瓜的照片，確保物體完整可見且占據照片主要部分。系統目前僅支援這兩種蔬果的分析。" :
    errorType === "multiple-objects" ? "請確保圖片中只有一個香蕉或小黃瓜，避免背景雜亂或出現其他物品。框取單一蔬果或使用簡單背景拍攝可提高辨識度。" :
    errorType === "low-quality" ? "請上傳更高畫質、光線充足的照片，避免模糊或曝光不足。理想情況下，蔬果應在自然光下拍攝並確保手機鏡頭乾淨。" :
    errorType === "timeout" ? "伺服器處理時間過長，請檢查網路連接是否穩定或稍後再試。如果問題持續出現，可能是我們的服務暫時負載過高。" :
    errorType === "service-unavailable" ? "AI服務暫時忙碌或不可用，請稍後再嘗試。我們的團隊已經收到通知，正在努力恢復服務。" :
    errorType === "api-error" ? "AI分析服務出現技術問題，請稍後再試。若問題持續出現，請透過首頁下方的聯絡方式告知我們，我們會儘快修復。" :
    "請重試或上傳其他圖片，確保使用正確的檔案格式（JPG、PNG等）且檔案大小不超過10MB。如需幫助，請查看常見問題或聯絡我們的支援團隊。";
  
  // 不同錯誤類型的背景顏色
  const bgColor = 
    errorType === "invalid-object" || errorType === "multiple-objects" || errorType === "low-quality" ? "bg-amber-50" :
    errorType === "timeout" ? "bg-amber-50" :
    errorType === "service-unavailable" || errorType === "api-error" ? "bg-blue-50" :
    "bg-red-50";
  
  const borderColor = 
    errorType === "invalid-object" || errorType === "multiple-objects" || errorType === "low-quality" ? "border-amber-100" :
    errorType === "timeout" ? "border-amber-100" :
    errorType === "service-unavailable" || errorType === "api-error" ? "border-blue-100" :
    "border-red-100";
  
  const textColor = 
    errorType === "invalid-object" || errorType === "multiple-objects" || errorType === "low-quality" ? "text-amber-600" :
    errorType === "timeout" ? "text-amber-600" :
    errorType === "service-unavailable" || errorType === "api-error" ? "text-blue-600" :
    "text-red-600";

  // 錯誤標題映射
  const errorTitle = 
    errorType === "invalid-object" ? "無法辨識有效物體" :
    errorType === "multiple-objects" ? "偵測到多個物體" :
    errorType === "low-quality" ? "圖片質量不佳" :
    errorType === "timeout" ? "請求處理超時" :
    errorType === "service-unavailable" ? "服務暫時不可用" :
    errorType === "api-error" ? "AI分析服務錯誤" :
    "分析處理錯誤";

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 p-3 sm:p-4 ${bgColor} border ${borderColor} rounded-lg flex items-start ${textColor} ${className}`}
    >
      <IconComponent className="mr-3 flex-shrink-0 mt-0.5" />
      <div className="flex flex-col">
        <p className="text-sm font-medium">{errorTitle}</p>
        <p className="text-xs mt-1 opacity-90">{errorMessage}</p>
        <p className="text-xs mt-2 opacity-80 font-medium">{suggestion}</p>
      </div>
    </motion.div>
  );
} 