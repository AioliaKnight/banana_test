import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface TruthScanAnimationProps {
  onComplete: () => void;
  duration?: number; // 持續時間（毫秒）
}

export default function TruthScanAnimation({ 
  onComplete, 
  duration = 3000 
}: TruthScanAnimationProps) {
  // 動畫完成後自動調用onComplete
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
    >
      <div className="bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-6">
            {/* 旋轉的外圈 */}
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 2, 
                ease: "linear",
                repeat: Infinity
              }}
              className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-blue-300 rounded-full"
            />
            
            {/* 反向旋轉的中圈 */}
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ 
                duration: 3, 
                ease: "linear",
                repeat: Infinity
              }}
              className="absolute inset-2 border-4 border-transparent border-t-indigo-400 border-l-indigo-300 rounded-full"
            />
            
            {/* 脈衝效果的中心 */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0.3 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-4xl">🔍</span>
            </motion.div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">蔬果真實度分析中</h3>
          <p className="text-blue-200 text-sm text-center mb-4">
            AI測謊儀正在掃描您的照片，尋找可能的「視覺增強」痕跡...
          </p>
          
          {/* 進度條 */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
            />
          </div>
          
          {/* 隨機輪換的掃描訊息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-xs text-blue-100 italic text-center"
          >
            <ScanningMessages />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// 輪換顯示的掃描訊息組件
function ScanningMessages() {
  const messages = [
    "分析照片透視效果...",
    "檢查蔬果比例是否合理...",
    "測量光影與形狀一致性...",
    "對比標準蔬果資料庫...",
    "評估可能的廣角效應...",
    "計算真實度得分...",
    "尋找可能的戰略性拍攝痕跡...",
    "比對光線與陰影分佈...",
    "驗證與台灣平均尺寸的差異..."
  ];
  
  return (
    <motion.div
      animate={{ y: [-20, 0] }}
      transition={{ 
        duration: 0.5,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 2.5
      }}
    >
      {messages.map((message, index) => (
        <motion.p
          key={index}
          initial={{ opacity: 0, display: "none" }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            display: ["none", "block", "block", "none"]
          }}
          transition={{ 
            duration: 3,
            times: [0, 0.1, 0.9, 1],
            delay: index * 3,
            repeat: Infinity,
            repeatDelay: messages.length * 3 - 3
          }}
        >
          {message}
        </motion.p>
      ))}
    </motion.div>
  );
} 