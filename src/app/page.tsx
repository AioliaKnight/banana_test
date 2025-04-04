"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/ImageUploader";
import ResultsDisplay from "@/components/ResultsDisplay";
import { FiGithub } from "react-icons/fi";
import { HiOutlineChevronDown } from "react-icons/hi";

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

  const handleImageUpload = (file: File) => {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <div className="inline-block px-2 py-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI</span>
                <span className="text-yellow-500">香蕉</span>
                <span className="text-blue-900">與</span>
                <span className="text-green-600">小黃瓜</span>
                <span className="text-blue-900">分析器</span>
              </div>
            </h1>
            <a 
              href="https://github.com/yourusername/cucumber-banana-analyzer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FiGithub className="h-5 w-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
              <span className="inline-block mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI</span>
                <span className="text-slate-900">評測你的</span>
                <span className="text-green-600">小黃瓜</span>
                <span className="text-slate-900">或</span>
                <span className="text-yellow-500">香蕉</span>
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-800 max-w-2xl mx-auto">
              上傳照片，由AI進行專業評測。無須註冊，保護您的隱私，立即獲得評分結果。
            </p>
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
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 inline-block px-4 py-2 text-blue-900">
            關於 AI香蕉與小黃瓜分析器
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">我們怎麼運作?</h3>
              <p className="text-sm sm:text-base text-slate-600">
                我們使用先進的AI視覺辨識技術，分析您上傳的小黃瓜或香蕉照片。系統會自動辨識蔬果類型，
                並評估其長度、粗細和新鮮度，提供詳細的專業評分。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">注重隱私</h3>
              <p className="text-sm sm:text-base text-slate-600">
                您的圖片資料僅用於即時分析，我們不會儲存您上傳的照片。分析完成後，圖片數據會立即從伺服器移除，
                確保您的隱私安全。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">為何選擇我們?</h3>
              <p className="text-sm sm:text-base text-slate-600">
                我們的AI模型經過數千張蔬果照片訓練，能夠準確辨識和評分。無需註冊，
                操作簡易快速，且完全免費使用。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">使用技術</h3>
              <p className="text-sm sm:text-base text-slate-600">
                本服務使用 Google Cloud Vision API 結合 Vertex AI 與 Gemini 模型，
                以最先進的技術分析您的蔬果照片。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 頁腳 */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-slate-700 text-sm font-medium">
            © {new Date().getFullYear()} AI香蕉與小黃瓜分析器 - 所有權利保留
          </p>
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
