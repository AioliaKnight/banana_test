"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/ImageUploader";
import ResultsDisplay from "@/components/ResultsDisplay";
import { HiOutlineChevronDown } from "react-icons/hi";

// 上傳限制常數
const DAILY_UPLOAD_LIMIT = 10;
const UPLOAD_COUNTER_KEY = 'cucumber_banana_daily_uploads';

interface ApiError {
  code: 'INVALID_OBJECT' | 'MULTIPLE_OBJECTS' | 'LOW_QUALITY' | 'API_ERROR' | 'GENERAL_ERROR';
  message: string;
}

interface AnalysisResult {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
  comment: string;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 剩餘上傳次數
  const [remainingUploads, setRemainingUploads] = useState<number>(DAILY_UPLOAD_LIMIT);

  // 初始化和檢查上傳次數限制
  useEffect(() => {
    // 獲取當前日期
    const today = new Date().toISOString().split('T')[0];
    
    // 檢查local storage中的上傳記錄
    const uploadRecord = localStorage.getItem(UPLOAD_COUNTER_KEY);
    let uploadData = { date: today, count: 0 };
    
    if (uploadRecord) {
      try {
        const savedData = JSON.parse(uploadRecord);
        // 如果日期相同，使用保存的計數
        // 如果日期不同，重置計數
        uploadData = savedData.date === today 
          ? savedData 
          : { date: today, count: 0 };
      } catch (e) {
        console.error('解析上傳記錄時出錯:', e);
      }
    }
    
    // 設置剩餘上傳次數
    setRemainingUploads(Math.max(0, DAILY_UPLOAD_LIMIT - uploadData.count));
    
    // 保存回 localStorage
    localStorage.setItem(UPLOAD_COUNTER_KEY, JSON.stringify(uploadData));
  }, []);

  // 增加上傳計數
  const incrementUploadCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const uploadRecord = localStorage.getItem(UPLOAD_COUNTER_KEY);
    
    let uploadData = { date: today, count: 1 };
    
    if (uploadRecord) {
      try {
        const savedData = JSON.parse(uploadRecord);
        if (savedData.date === today) {
          uploadData = { 
            date: today, 
            count: savedData.count + 1 
          };
        }
      } catch (e) {
        console.error('解析上傳記錄時出錯:', e);
      }
    }
    
    localStorage.setItem(UPLOAD_COUNTER_KEY, JSON.stringify(uploadData));
    setRemainingUploads(Math.max(0, DAILY_UPLOAD_LIMIT - uploadData.count));
  };

  const handleImageUpload = (file: File) => {
    // 檢查是否達到上傳限制
    if (remainingUploads <= 0) {
      setError('很抱歉，您已達到今日分析次數限制（10次/天）。請明天再試。');
      return;
    }
    
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;

    // 再次檢查是否達到上傳限制
    if (remainingUploads <= 0) {
      setError('很抱歉，您已達到今日分析次數限制（10次/天）。請明天再試。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // 處理API返回的錯誤
        if (errorData.error) {
          const apiError = errorData.error as ApiError;
          
          // 顯示友好的錯誤消息
          throw new Error(apiError.message || "分析時發生錯誤");
        } else {
          throw new Error("分析時發生錯誤");
        }
      }

      const data = await response.json();
      setAnalysisResult(data);
      
      // 分析成功後增加計數
      incrementUploadCount();
    } catch (err: unknown) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "分析時發生未知錯誤");
      setAnalysisResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setAnalysisResult(null);
    setError(null);
    setLoading(false);
  };

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <motion.main
      className="min-h-screen pb-20"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* 頁面頂部背景與波浪效果 */}
      <div className="relative pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-wave-pattern opacity-10" />
        
        {/* 頂部導航和 GitHub 連結 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-20">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <div className="flex items-center space-x-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 px-3 py-1 font-bold text-3xl sm:text-4xl">AI</span>
                <div className="flex flex-row shadow-sm">
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-l-md font-bold">香蕉</span>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-r-md font-bold">小黃瓜</span>
                </div>
                <span className="text-slate-800 font-bold">分析器</span>
              </div>
            </h1>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
              <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="bg-slate-100 px-4 py-2 rounded-md">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 font-bold">AI</span>
                  <span className="text-slate-900">測量評分</span>
                </span>
                <div className="flex flex-row mt-3 sm:mt-0">
                  <span className="bg-green-500 text-white px-4 py-2 rounded-l-md">小黃瓜</span>
                  <span className="bg-yellow-400 text-white px-4 py-2 rounded-r-md">香蕉</span>
                </div>
              </div>
            </h2>
            <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto">
              上傳照片，立即獲取專業分析評測。先進AI技術精準測量長度與粗細，保護隱私無需註冊，享受快速準確的評分體驗。
            </p>
            
            {/* 顯示剩餘分析次數 */}
            <div className="mt-3 bg-blue-50 rounded-full px-4 py-1 inline-flex items-center">
              <span className="text-sm text-blue-700">
                今日剩餘分析次數: <strong>{remainingUploads}</strong>/10
              </span>
            </div>
          </motion.div>

          {/* 主內容卡片 */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="card max-w-3xl mx-auto shadow-lg border-slate-200 p-4 sm:p-6 mb-16"
          >
            {!analysisResult ? (
              <div className="flex flex-col gap-6">
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  preview={preview}
                  onAnalyze={handleAnalyze}
                  loading={loading}
                  error={error}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <ResultsDisplay 
                  result={analysisResult} 
                  preview={preview!} 
                  onReset={handleReset} 
                />
              </div>
            )}
          </motion.div>

          {/* 結果僅供參考聲明 */}
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-slate-500 italic mb-6">
              * 本工具提供的所有分析結果僅供參考，實際數據可能因拍攝角度、光線條件及其他因素而有所差異。
            </p>
          </div>

          {/* 捲動指示 */}
          <div className="absolute left-0 right-0 bottom-[-60px] flex flex-col items-center justify-center pb-2">
            <div className="animate-bounce flex flex-col items-center">
              <span className="text-sm font-medium text-blue-900 mb-1">了解更多</span>
              <HiOutlineChevronDown className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 關於區塊 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            <span className="bg-slate-100 px-4 py-2 rounded-md text-slate-900 inline-block">
              關於 
              <span className="text-yellow-500 mx-1">香蕉</span>
              <span className="text-green-600 mx-1">小黃瓜</span>
              分析器
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">精準技術分析</h3>
              <p className="text-sm sm:text-base text-slate-600">
                採用先進的AI視覺辨識技術，我們能快速分析您上傳的小黃瓜或香蕉照片。系統自動辨識類型，
                精準評估長度、粗細和新鮮度，提供可靠的專業評分和詳細分析。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">安心隱私保障</h3>
              <p className="text-sm sm:text-base text-slate-600">
                您的圖片僅用於即時分析，絕不儲存上傳的照片。分析完成後，所有圖片數據立即從伺服器移除，
                確保您的隱私安全，讓您無顧慮地使用我們的服務。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">便捷使用體驗</h3>
              <p className="text-sm sm:text-base text-slate-600">
                無需註冊，無需繁瑣步驟，直接上傳圖片即可獲得專業分析。我們的AI模型經過數千張樣本訓練，
                提供精準評分與專業評語，讓您享受簡單快速的使用體驗。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">前沿技術支持</h3>
              <p className="text-sm sm:text-base text-slate-600">
                本服務結合 Google Cloud Vision API、Vertex AI 與 Gemini 模型，
                運用最先進的AI技術提供準確分析。支持多種圖片格式，確保各種拍攝條件下的最佳效果。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 頁腳 */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex flex-col items-center sm:items-start">
            <p className="text-slate-700 text-sm font-medium">
              © {new Date().getFullYear()} AI香蕉與小黃瓜分析器 - 所有權利保留
            </p>
            <p className="text-slate-500 text-xs mt-1">
              由 <a href="https://www.aideamed.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Aidea:Med</a> 精心開發 - 數位精準驅動專為真實服務
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-0">
            <a href="#" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">使用條款</a>
            <a href="#" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">隱私政策</a>
            <a href="#" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">常見問題</a>
          </div>
        </div>
      </footer>
    </motion.main>
  );
}
