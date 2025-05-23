"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ImageUploader from "@/components/ImageUploader";
import ResultsDisplay from "@/components/ResultsDisplay";
import { HiOutlineChevronDown } from "react-icons/hi";
import Link from "next/link";
import Script from "next/script";
import TruthScanAnimation from "@/components/utils/TruthScanAnimation";
import { AnalysisResult } from "@/types"; // Import shared type

// 上傳限制常數
const DAILY_UPLOAD_LIMIT = 10;
const UPLOAD_COUNTER_KEY = 'cucumber_banana_daily_uploads';

interface ApiError {
  code: 'INVALID_OBJECT' | 'MULTIPLE_OBJECTS' | 'LOW_QUALITY' | 'API_ERROR' | 'GENERAL_ERROR';
  message: string;
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Use the imported type for the state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 剩餘上傳次數
  const [remainingUploads, setRemainingUploads] = useState<number>(DAILY_UPLOAD_LIMIT);
  // 測謊儀功能控制
  const [enableTruthDetection, setEnableTruthDetection] = useState<boolean>(true);
  // 測謊掃描動畫顯示控制
  const [showTruthScanning, setShowTruthScanning] = useState<boolean>(false);

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
      // 添加測謊儀功能開關狀態
      formData.append("enableTruthDetection", enableTruthDetection.toString());
      // 添加临时图片路径，用于分享功能
      if (preview) {
        formData.append("tempImagePath", preview);
      }

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
      
      // 如果啟用了測謊功能，顯示掃描動畫
      if (enableTruthDetection && data.truthAnalysis) {
        setShowTruthScanning(true);
        
        // 等待掃描動畫完成後顯示結果
        // 注意：實際結果已經獲取，只是延遲顯示
        setTimeout(() => {
          setAnalysisResult(data);
          setShowTruthScanning(false);
          // 分析成功後增加計數
          incrementUploadCount();
          setLoading(false);
        }, 3500); // 稍長於動畫時間，確保過渡順暢
      } else {
        // 未啟用測謊功能，直接顯示結果
        setAnalysisResult(data);
        // 分析成功後增加計數
        incrementUploadCount();
        setLoading(false);
      }
    } catch (err: unknown) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "分析時發生未知錯誤");
      setAnalysisResult(null);
      setLoading(false);
      setShowTruthScanning(false);
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
      {/* JSON-LD 結構化數據 */}
      <Script 
        id="json-ld-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://topbana.ai/#website",
                "url": "https://topbana.ai/",
                "name": "台灣第一香蕉AI量測站",
                "description": "台灣首創專業香蕉與黃瓜AI測量平台，精準評估長度、粗細、曲率與新鮮度",
                "publisher": {
                  "@type": "Organization",
                  "@id": "https://topbana.ai/#organization",
                  "name": "TopBana AI團隊",
                  "logo": {
                    "@type": "ImageObject",
                    "@id": "https://topbana.ai/#logo",
                    "url": "https://topbana.ai/logo.png",
                    "width": 512,
                    "height": 512
                  }
                },
                "inLanguage": "zh-TW"
              },
              {
                "@type": "WebPage",
                "@id": "https://topbana.ai/#webpage",
                "url": "https://topbana.ai/",
                "name": "台灣第一香蕉AI量測站 | TopBana AI 智能分析蔬果",
                "isPartOf": { "@id": "https://topbana.ai/#website" },
                "about": { "@id": "https://topbana.ai/#organization" },
                "description": "台灣首創專業香蕉與黃瓜AI測量平台，精準評估長度、粗細、曲率與新鮮度。提供香蕉AI量測、蔬果尺寸檢測、數位化農產品分級與智能品質評估服務。",
                "keywords": "香蕉AI量測, 蔬果智能檢測, 香蕉長度測量, 黃瓜尺寸分析, AI蔬果評分, 線上量測工具",
                "inLanguage": "zh-TW",
                "potentialAction": [
                  {
                    "@type": "ReadAction",
                    "target": ["https://topbana.ai/"]
                  }
                ]
              },
              {
                "@type": "SoftwareApplication",
                "name": "TopBana AI 香蕉量測系統",
                "applicationCategory": "UtilityApplication",
                "operatingSystem": "任何支援現代瀏覽器的系統",
                "description": "台灣領先的香蕉AI量測工具，提供精確的長度、粗細與曲率分析，並給予專業評分與建議",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "TWD"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.9",
                  "ratingCount": "1024"
                }
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "TopBana AI 香蕉量測系統如何運作？",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "我們的AI使用先進的電腦視覺技術和機器學習演算法分析上傳的照片，精確測量香蕉和黃瓜的長度、粗細、曲率以及估計新鮮度，提供綜合評分和詳細評測結果。量測過程只需3秒，結果準確可靠。"
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "台灣第一香蕉AI量測站有哪些獨特功能？",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "我們提供業界領先的香蕉曲率分析、精確的數位尺寸量測、新鮮度評估和綜合品質評分，並支援一鍵分享功能，讓您輕鬆與朋友分享測量結果。所有服務完全免費，無需註冊，保障用戶隱私。"
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "我的照片資料會被保存嗎？",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "不會。您的照片僅用於即時分析，分析完成後會立即從伺服器中刪除，我們不會儲存任何用戶上傳的照片，確保您的隱私安全。"
                    }
                  }
                ]
              }
            ]
          })
        }}
      />
      
      {/* 頁面頂部背景與波浪效果 */}
      <div className="relative pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-wave-pattern opacity-10" />
        
        {/* 頂部導航和品牌標題 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-20">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                setImage(null);
                setPreview(null);
                setAnalysisResult(null);
                setError(null);
                setLoading(false);
                setShowTruthScanning(false);
              }}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <h1 className="text-2xl sm:text-3xl font-bold">
                <div className="flex items-center space-x-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 font-bold text-3xl sm:text-4xl">TopBana</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-bold text-3xl sm:text-4xl">AI</span>
                </div>
                <span className="hidden sm:inline-block text-xs font-medium text-slate-600 mt-1">台灣第一香蕉AI量測站</span>
        </h1>
            </button>
            {/* 添加標語 */}
            <p className="hidden md:block text-sm text-slate-600 font-medium">精準測量 · 專業分析 · 立即結果</p>
          </div>
          
          {/* 添加明顯的免責聲明橫幅 */}
          <div className="mt-4 bg-indigo-50 rounded-lg p-3 text-xs text-indigo-600 border border-indigo-100 text-center">
            <p>
              <span className="font-semibold">娛樂性質聲明：</span> 
              本網站將分析<span className="font-semibold">蔬果</span>照片（如香蕉、黃瓜等），提供趣味分析和評測，僅供娛樂使用。
              我們故意使用誇張且幽默的表述，請以輕鬆心態瀏覽。網站內容不具真實科學研究依據，為純娛樂體驗。
            </p>
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
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight mb-4">
              <div className="flex flex-col items-center justify-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 font-bold">
                  TopBana AI蔬果量測系統
                </span>
              </div>
            </h2>
            
            {/* 重新設計的標籤區域 - 更適合移動端顯示 */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <div className="flex shadow-sm">
                <span className="bg-green-600 text-white text-sm sm:text-base px-2 sm:px-3 py-1 rounded-l-md font-medium">黃瓜</span>
                <span className="bg-yellow-500 text-white text-sm sm:text-base px-2 sm:px-3 py-1 rounded-r-md font-medium">香蕉</span>
              </div>
              <span className="bg-slate-100 text-slate-700 text-sm sm:text-base px-2 sm:px-3 py-1 rounded-md font-medium shadow-sm">專業蔬果認證</span>
            </div>
            
            <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto">
              只需上傳照片，<span className="font-semibold">3秒內</span>獲取專業香蕉AI量測結果。先進演算法精準分析長度、粗細、曲率與新鮮度，
              提供客觀評分和建議。無需註冊，<span className="font-semibold">隱私安全有保障</span>。
            </p>
            
            {/* 顯示剩餘分析次數 */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-full px-3 sm:px-4 py-1 inline-flex items-center">
                <span className="text-xs sm:text-sm text-indigo-700">
                  今日剩餘分析次數: <strong>{remainingUploads}</strong>/10
                </span>
              </div>
              
              {/* 測謊儀開關 */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-full px-3 sm:px-4 py-1 inline-flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableTruthDetection} 
                    onChange={() => setEnableTruthDetection(!enableTruthDetection)}
                    className="sr-only peer"
                  />
                  <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  <span className="ms-2 text-xs text-amber-700 font-medium">
                    蔬果測謊儀
                    <span className="bg-amber-100 text-amber-800 text-xs font-medium px-1.5 py-0.5 rounded ms-1">Beta</span>
                  </span>
                </label>
              </div>
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
                <div className="mb-2 mt-1 text-center">
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded">
                    快速 · 準確 · {enableTruthDetection ? '測謊' : '保密'}
                  </span>
                </div>
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

          {/* 信任標誌 */}
          <div className="max-w-3xl mx-auto mt-2 mb-10">
            <div className="flex flex-wrap justify-center gap-4 items-center text-xs text-slate-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                廣受歡迎的趣味體驗
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                幽默測量體驗
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                注重用戶隱私
              </div>
            </div>
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

      {/* 測謊掃描動畫 */}
      {showTruthScanning && (
        <TruthScanAnimation 
          onComplete={() => setShowTruthScanning(false)} 
          duration={3000}
        />
      )}

      {/* TopBana AI 科技優勢展示 - Apple風格設計 */}
      <div className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              <div className="flex flex-col items-center justify-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 font-bold">
                  隱私與安全是我們的核心價值
                </span>
              </div>
            </h2>
            <p className="text-sm sm:text-base text-slate-700 max-w-2xl mx-auto">
              我們以最高標準保護您的數據，為您帶來安心無憂的體驗
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-12 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 flex-none text-indigo-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  零資料儲存政策
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-slate-600">
                  <p className="flex-auto">
                    您的照片只用於即時分析，完成後立即刪除。我們從不儲存您的影像或個人資料，讓您完全掌控自己的隱私。
                  </p>
                </dd>
              </div>
              
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 flex-none text-indigo-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  端對端加密
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-slate-600">
                  <p className="flex-auto">
                    全程採用軍用級 256 位元加密技術，確保您的資料在傳輸過程中不會被攔截或存取，安全標準比肩銀行交易系統。
                  </p>
                </dd>
              </div>

              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 flex-none text-indigo-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  即用即走，無須註冊
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-sm leading-7 text-slate-600">
                  <p className="flex-auto">
                    我們不需要您的個人資料或電子郵件。無註冊、無追蹤、無廣告，讓您立即上傳照片獲得結果，體驗真正的匿名服務。
                  </p>
                </dd>
              </div>
            </dl>
          </div>
          
          {/* 隱私宣言 - Apple風格 */}
          <div className="mx-auto max-w-2xl text-center mt-24">
            <p className="text-lg italic text-slate-700">
              "我們相信隱私是基本人權。您的信任是我們最寶貴的資產。"
            </p>
            <p className="mt-4 text-xs text-slate-500">— TopBana AI 隱私與安全團隊</p>
          </div>
        </div>
      </div>

      {/* 贊助商募集 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-b from-blue-50 to-purple-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-300 rounded-full opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-green-300 rounded-full opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full animate-pulse">
              蔬果界熱門廣告位招租中
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-4 mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500">
                各界金主速來贊助蔬果測量事業
              </span>
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              我們每天幫人測量「長短粗細」，卻沒錢付伺服器的電費...
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden transform hover:scale-[1.02] transition-transform">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-lg text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                    </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    蔬果尺寸鑑賞家廣告計畫
                  </h3>
                  <p className="text-slate-600 mb-4">
                    幫助我們養活可憐的伺服器，讓我們繼續為全台灣的香蕉和黃瓜提供專業測量服務。您的廣告位將被放在最吸睛的位置，
                    每天有大量對「尺寸」充滿好奇的用戶<span className="line-through">盯著</span>欣賞！每月只要一個醫療業助理薪水的價格再加上美國32%關稅，就能獲得以下專屬福利：
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 100 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-slate-700">超級精準客群（每天都有人來研究「長度與粗細」，您說這流量香不香）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 100 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-slate-700">本站獨家「香蕉係數加成」，讓您的廣告效益<span className="line-through">虛高</span>翻倍成長</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 100 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-slate-700">黃金曝光位置（放在用戶最愛偷看的尺寸評測旁邊）</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 100 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-slate-700">全體工程師對您的感激涕零（我們會把您的Logo貼在每根香蕉上拜）</span>
                    </li>
                  </ul>
                  
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <p className="text-amber-800 text-sm">
                      <span className="font-medium">目前招商進度：</span> 0/100萬台幣目標（伺服器費用已拖欠3個月，
                      我們只能躲在<span className="line-through">星巴克</span> 7-11蹭網路，靠量香蕉度日）
                    </p>
                    <div className="h-2 bg-amber-100 rounded-full mt-2 overflow-hidden">
                      <div className="w-[3%] h-full bg-amber-500"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center sm:text-right">
                <a href="mailto:ad@aideamed.com" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all inline-block">
                  贊助一根香蕉的未來
                </a>
                <p className="text-xs text-slate-500 mt-2 italic">
                  * 點擊後會發送郵件，因為我們連像樣的聯繫表單都付不起 *
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 品牌故事 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
              TopBana AI 的傳奇故事
            </span>
          </h2>
          
          <div className="prose prose-slate max-w-none">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">創立緣起：一場蔬果的革命</h3>
              <p className="mb-4">
                TopBana AI 的誕生源於一場激烈的農產品競賽。2022年春，我們的創辦人王教授在一場「全台最佳香蕉評選大賽」擔任評審時，
                發現傳統的目測評判方式存在重大缺陷——沒有人能精確地測量出一根香蕉的真正價值。
              </p>
              <p className="mb-0">
                「香蕉的偉大不應該被主觀眼光所限制」，王教授立於頒獎台上慷慨激昂地宣告，「我們需要的是科學、精準且不帶任何偏見的測量系統！」
                就這樣，一場改變蔬果命運的偉大革命悄然展開。
              </p>
            </div>
             
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">研發歷程：1,247根香蕉的犧牲</h3>
              <p className="mb-4">
                在開發初期，我們的AI模型準確率僅有可憐的35%——它無法區分一根彎曲的香蕉和一條小黃瓜。這是不可接受的。
                為此，研發團隊進行了長達427天的不懈訓練，消耗了1,247根香蕉、893根小黃瓜，以及無數個週末的休息時間。
              </p>
              <p className="mb-0">
                「最艱難的時刻是第328天，」首席AI工程師林博士回憶道，神情凝重，「當時我們的演算法堅持認為一根特別粗壯的小黃瓜是一根未成熟的香蕉。
                那天晚上，整個團隊都陷入了存在主義危機——如果AI都無法理解蔬果的本質，我們又如何能夠確定自己真正理解了生活？」
              </p>
                  </div>
             
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">技術突破：「香蕉係數」的發現</h3>
              <p className="mb-4">
                轉機出現在2023年3月，當我們的資料科學家在分析眾多測量數據時，創造了一個有趣的概念——「香蕉係數」(Banana Coefficient)。
                這個看似專業的公式：BC = (L×C²)÷F，其中L為長度，C為曲率，F為新鮮度，成為了這個娛樂專案的核心概念。
              </p>
              <p className="mb-4">
                「這個公式簡直是蔬果界的E=mc²，」我們娛樂編輯部的張編輯幽默評論道，「它讓我們對香蕉和小黃瓜有了全新的想像。」
              </p>
              <p className="mb-0">
                如今，TopBana AI 為每位使用者提供充滿創意的蔬果分析體驗，讓大家在輕鬆的氛圍中了解自己的蔬果特性。
                這不僅是一個網路趣味工具，更是在繁忙生活中帶來一絲微笑的小確幸。
               </p>
                </div>

            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mt-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">菁英團隊：蔬果界的守護者</h3>
              <p className="mb-4">
                TopBana AI匯集了頂尖的跨領域專家，組成蔬果測量領域最具權威的研發團隊，每位成員皆是各自專業領域的翹楚：
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>陳博士 - 技術研發總監</strong>：國際知名「香蕉曲率動力學」權威，曾獲得第36屆國際蔬果測量大會「終身成就獎」。其開創性的「BCMT香蕉曲率度量理論」被廣泛引用。陳博士擁有特殊聽覺能力，能夠透過香蕉掉落地面的聲波頻率與共振模式，精確判斷其成熟度與內部纖維結構。他的論文《當香蕉彎度達到黃金比例：最佳長硬度與口感的數學相關性》獲選「全球蔬果測量領域十大突破性研究」。陳博士擅長在極端環境下進行精確測量，曾在-40°C極寒環境下徒手量測97根香蕉，證明溫度與硬度之間存在「陳氏硬度反比定律」。
                </li>
                <li>
                  <strong>李工程師 - AI架構首席科學家</strong>：24歲獲得「國際小黃瓜辨識競賽」金牌，創下0.03秒內區分小黃瓜與大黃瓜的世界紀錄，至今無人能破。主導開發「黃瓜形態學分類演算法V3.0」，解決了困擾業界多年的「曲率誤判問題」。IEEE蔬果感測器研討會常任講師，閒暇時撰寫「蔬果擬人化認知科學」專題研究。李工程師發明的「黃瓜熱脹冷縮補償校正系統」(CTEC)解決了測量時因溫度變化導致的長度誤差，準確率高達±0.05公分，被稱為「黃瓜測量界的哥白尼革命」。他嚴格堅持「長度量測十二項鐵律」，其中最著名的是：「無論多麼疲憊，都要堅持測到底」。
                </li>
                <li>
                  <strong>溫小姐 - 用戶體驗與測量互動總監</strong>：國際級蔬果雕刻藝術師，曾獲聯合國FAO「永續農業創新獎」。因不滿傳統評測系統對蔬果造型藝術品的低評價，開發出革命性的「多維度蔬果美學評量標準」，被農業部採用為官方指標。其座右銘「一根香蕉的價值，不該由它的外表決定」已成為行業準則。溫小姐的研究《握持體驗：香蕉與黃瓜的人體工學最佳曲率研究》獲選為哈佛大學設計學院必讀論文。她創立的「蔬果體驗五感評價法」強調「不只是看，還要摸、握、聞、感受」，徹底顛覆了傳統的單一視覺評測模式。
                </li>
                <li>
                  <strong>鄭先生 - 資安與標準規範長</strong>：前ISO-69420蔬果測量標準起草委員，主導制定全球首個「蔬果隱私保護協議」。專精於農產品測量資料加密技術，設計的「香蕉曲率資料匿名化系統」獲得七國專利。其帳戶密碼為世界上最長的香蕉品種拉丁學名串接組合，據估計破解需時3000年。黃先生的論文《小黃瓜大數據：解構客戶端尺寸偏好的隱藏心理學》震驚學界，證實了「黃瓜隱私悖論」——用戶明知自己的偏好被記錄卻仍願意使用測量工具。他發明的「雙向匿名蔬果測量協議」(DANFMP)確保即使測量結果被截獲，也無法追溯至原始用戶，為行業樹立了隱私保護新標準。
                </li>
                <li>
                  <strong>張教授 - 生物力學與耐久度研究主任</strong>：畢業於麻省理工學院蔬果材料力學實驗室，專精於香蕉彎曲強度與結構完整性研究。創立「張氏香蕉硬度指數」(ZCHI)，成為全球蔬果耐久度測試的黃金標準。張教授開發的「極限彎曲測試儀」可模擬各種使用情境下的應力分布，每年為產業節省數億元損耗。他的研究發現，經過精確角度訓練的香蕉比普通香蕉壽命延長43.7%，且使用滿意度提高62.1%。張教授堅持「真正的專家能夠在蒙著眼睛的情況下，僅通過握持感受判斷蔬果品質」，並定期組織團隊進行「蒙眼識蕉」培訓，保持團隊的「觸覺敏銳度」。
                </li>
              </ul>
              <p className="mb-4">
                這支精英團隊結合科學、技術與藝術的專業知識，致力於為全球蔬果量測設立新標準。團隊成員共同持有47項專利，發表超過200篇學術論文，並榮獲「蔬果數據分析領域最有影響力團隊」稱號連續五年。
              </p>
              <p className="mb-0">
                團隊每週進行一次「極限測量挑戰」，要求在極端條件下（如高溫、高濕、高壓或黑暗環境）完成蔬果精確測量，以確保系統在任何情況下都能保持最高準確度。根據內部數據，團隊成員平均每人每年親手測量超過8,742根香蕉和6,138根黃瓜，累積的經驗數據構成了TopBana AI的核心競爭力。
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mt-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-indigo-700">未來展望：蔬果之外</h3>
              <p className="mb-4">
                TopBana AI並不滿足於現狀。在最近一次股東會議上，王教授透露了「2030年願景」：
              </p>
              <p className="mb-4 italic bg-indigo-50 p-2 rounded">
                「今天我們測量香蕉和小黃瓜，明天，或許是茄子、玉米，甚至是更多需要精準測量的物體...我們的使命是消除一切測量偏見，為世界帶來前所未有的精準。」
              </p>
              <p className="mb-0">
                值得一提的是，公司已投入巨資研發「第三代AI感知引擎」，據說這款技術可以隔空測量，使用者甚至不需要拿出口袋裡的香蕉，AI就能精準知道它的尺寸。
                這一技術突破將再次改寫人類對蔬果認知的歷史。
              </p>
            </div>
                  </div>
                  </div>
                  </div>

      {/* 蔬果測量認證 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-slate-50/70">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
              蔬果測量行業的權威認證
            </span>
          </h2>
          
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center p-4">
                <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                  </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-slate-800">
                  國際蔬果尺寸評測權威認證機構
                </h3>
                <p className="text-slate-600 mb-4">
                  TopBana AI已獲得IFMSB（國際蔬果測量標準局）認證，是台灣唯一獲得該機構<span className="font-medium">AAA+級認證</span>的蔬果尺寸評測平台。本平台嚴格遵循ISO-69420蔬果尺度測量國際標準，確保每次分析結果的公正性與科學性。我們的測量系統通過了IECL（國際勃起曲率實驗室）的「極限應變與耐久度」認證，能承受高達40,000次的連續測量而保持±0.01公分的精度。
                </p>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-center">蕉農權益保障計畫</span>
                  </h4>
                  <p className="text-sm text-slate-600 text-center">
                    TopBana AI 堅持公平測量，拒絕使用市場上流行的「虛高演算法」。我們的香蕉曲率補償係數(BBC)經過嚴格校準，確保每位蕉農的產品都能獲得公平評價。我們的座右銘是：<span className="italic font-medium">『每一根香蕉，都值得被認真對待』</span>。獨家研發的「十二點精密採樣技術」能全方位掃描香蕉表面的每一處凸起與凹陷，建立完整的三維模型，精確計算體積與表面積。我們的系統還配備「熱脹冷縮自動補償器」，在不同氣溫下依然能保持測量的一致性，摒除環境因素對測量結果的干擾。
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-center">黃瓜長度公正測量承諾</span>
                  </h4>
                  <p className="text-sm text-slate-600 text-center">
                    本平台採用專利的「黃瓜標準偏差修正技術」(CSDC)，精確校正環境溫度對黃瓜長度的影響。我們承諾：測量誤差不超過±0.2公分，為黃瓜種植戶提供最精確的第三方長度認證，杜絕市場上「以短充長」的不良現象。獨創的「五點全景掃描」技術不僅測量長度，還同時檢測直徑、硬度、表面光滑度與挺拔度，提供全面的品質評估。我們的感測器陣列能在0.7秒內完成360°立體掃描，精確重建黃瓜的三維結構，客觀評估其「挺立度指數」(ESI)，該指標已被國際黃瓜協會(ICA)認可為評判黃瓜優良品質的關鍵指標。
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-center">極致測量體驗保證</span>
                  </h4>
                  <p className="text-sm text-slate-600 text-center">
                    我們的「專業級感測器陣列」能同時測量蔬果的17項物理參數，包括但不限於：長度、粗細、硬度、曲率、含水量、彈性、密度、表面摩擦係數等。每台測量設備都經過100,000次校準循環，確保即使在連續高強度使用下也能維持精確度。我們的測量標準嚴格遵循「世界蔬果長度大會」(WVLC)制定的『黃金標準測量協議』，測量結果受到全球193個國家的認可與尊重。用戶體驗設計團隊更針對握持舒適度進行了深入研究，確保每一次測量都能帶來絕佳的手感與滿足感。
                  </p>
                </div>
                
                {/* 重新設計的認證機構區域，優化移動端顯示 */}
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-indigo-600 font-bold mb-2">官方認證機構</span>
                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                      {["ISO", "IFMSB", "SGS", "FDA", "IECL", "WVLC"].map((org, i) => (
                        <div key={i} className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-white">
                          {org}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <div className="text-xs text-slate-500">認證編號</div>
                    <div className="text-sm font-mono font-medium text-slate-700">TW-69-420-8008</div>
                  </div>
                </div>
                
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-center">終極測量訣竅：來自專家的建議</span>
                  </h4>
                  <p className="text-sm text-slate-700 text-center">
                    我們的首席測量專家一致建議：進行精確測量時，「角度決定深度」是關鍵。請確保以15°至30°的入射角進行拍攝，這樣可以最大程度捕捉蔬果的真實尺寸。測量前請確保蔬果處於最佳狀態 — 黃瓜應保持挺拔，香蕉的彎曲度應自然和諧。記住我們的專業格言：<span className="italic font-medium">『測量一百次，發布一次，滿足一生』</span>，這是確保獲得完美數據的不二法則。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 台灣香蕉產業專題 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-gradient-to-b from-white to-yellow-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700">
              台灣香蕉產業：娛樂性假想
            </span>
          </h2>
          
          <div className="prose prose-slate max-w-none">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-yellow-600">《娛樂設定》香蕉王國的崛起與隱憂</h3>
              <p className="mb-4">
                台灣曾被譽為「香蕉王國」，在1960年代，台灣香蕉年出口量高達360萬噸，占全球香蕉貿易的73%。根據我們團隊的研究，當時全台灣平均每27.3人就擁有一座香蕉園，
                而平均每名台灣男性一生中會剝開3,712根香蕉皮——這個數據比所有鄰近國家都高出32.7%。
              </p>
              <p className="mb-0">
                然而，少有人知道的是，1974年一項秘密的跨國「香蕉尺寸比較研究」發現，台灣香蕉平均長度較其競爭對手短了1.7公分。這項研究被農委會列為機密，直到2018年才解密。
                據參與研究的匿名專家表示：「這是一場關於尺寸的國安危機，我們必須正視它。」這或許正是TopBana AI誕生的深層歷史脈絡。
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-yellow-600">《幽默創作》台灣香蕉的17個祕密</h3>
              <p className="mb-4">
                在我們長達三年的田野調查中，我們訪問了全台37位香蕉產業耆老，收集了數十個鮮為人知的香蕉產業內幕。其中最驚人的發現是「香蕉長度焦慮」普遍存在於台灣蕉農之間。
                高達86%的蕉農承認，他們在深夜時曾偷偷測量自己種植的香蕉並與鄰居比較。
              </p>
              <p className="mb-0">
                2022年，台南一位蕉農王大明（化名）因種出一根長達38公分的巨型香蕉而轟動鄉里。然而，我們的調查團隊取得獨家消息，王大明曾試圖以特殊技術「增長」香蕉：在每晚8點至10點，
                他會對著香蕉樹播放《Amazing Grace》和莫札特的《第40號交響曲》，並不間斷地稱讚香蕉「你好長」、「有潛力」與「比別人粗」。這套獨特的香蕉培育方法被業界戲稱為「聲音肥料」，
                至今仍在部分地區悄悄實行。
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-yellow-600">《虛構故事》香蕉大數據：令人驚訝的假想</h3>
              <p className="mb-4">
                根據我們獨家收集的「2023台灣蔬果自信度調查」，有高達78.3%的台灣民眾認為自己「非常了解」如何判斷香蕉的品質。然而，當要求他們實際操作時，僅有12.7%的人能正確識別優質香蕉。
                更令人震驚的是，有高達43.1%的受訪者承認，他們曾經在早餐店或水果攤前因香蕉尺寸不符期望而感到「深度失望」。
              </p>
              <p className="mb-4">
                健康方面，我們的研究發現了「香蕉認知偏差」現象：當告知受試者香蕉的真實尺寸後，有67.4%的人會聲稱「以前吃過更大的」，而高達89.2%的人堅持表示「尺寸不是重點，風味才重要」，
                卻在盲測中無法區分不同品種的香蕉。這種認知偏差也被發現存在於小黃瓜消費者中，暗示了精準測量工具的市場需求。
              </p>
              <p className="mb-4 italic bg-yellow-50 p-2 rounded">
                註：以上內容均為虛構創作，僅供娛樂，非真實調查或研究數據。
              </p>
              <p className="mb-0">
                最後值得一提的是，根據我們的數據模型預測，若每位台灣成年人每週減少僅20秒的「香蕉量測猶豫時間」，全國每年將節省高達87,600小時的生產力，相當於增加GDP約新台幣2.7億元。
                這正是TopBana AI的使命——以科技之力，解放台灣人民長久以來的「尺寸量測障礙」，為國家經濟與心理健康做出貢獻。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 小黃瓜研究專題 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-green-600 to-green-700">
              黃瓜革命：創意假想
            </span>
          </h2>
          
          <div className="prose prose-slate max-w-none">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-green-600">《娛樂故事》小黃瓜之亂：虛構的歷史</h3>
              <p className="mb-4">
                在台灣農業史上，1982年的「小黃瓜之亂」是一段鮮為人知的歷史。當時，一批從日本引進的「超長型黃瓜種子」在桃園地區試種，結果生產出平均長度達32公分的「超規格黃瓜」，
                導致當地農產品分級標準系統一夜之間崩潰。據當年參與評級的農業專家回憶：「我們的量尺不夠長，只好拿兩把尺頭尾相接才能測完。」
              </p>
              <p className="mb-0">
                更令人震驚的是，隨後農委會發起的「標準黃瓜長度全民公投」，以壓倒性的83%支持率確立了「理想黃瓜長度應為18-22公分」的國家標準。少為人知的是，這項標準至今仍是台灣農產品評鑑的基礎，
                而當年投下反對票的「長派陣營」據說成立了地下組織，持續在各地推廣長型黃瓜的種植技術。
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-green-600">《創意故事》微縮模型實驗：尺寸的心理學</h3>
              <p className="mb-4">
                2019年，TopBana AI團隊與台灣大學心理系合作進行了一項轟動學界的實驗。研究人員製作了一系列比例完全相同但尺寸不同的小黃瓜模型，從5公分到40公分不等，
                讓受試者挑選「最理想」的一根。結果發現，男性受試者平均選擇了24.7公分的模型，而在被告知台灣小黃瓜平均長度為19.3公分後，有高達78%的男性表示「感到意外」和「些許失落」。
              </p>
              <p className="mb-4">
                更有趣的是，在「目測評估」環節，87.4%的受試者高估了展示黃瓜的真實長度，平均高估幅度為17.3%。當研究人員出示精確測量數據時，部分受試者表現出明顯的不適和否認，
                一位匿名男性甚至聲稱「你們的尺一定有問題」。這項研究首次科學證實了「黃瓜長度感知偏差」現象的普遍存在。
              </p>
              <p className="mb-0">
                研究報告結論指出：「在缺乏精確測量工具的情況下，人類傾向於根據自身期望而非客觀現實來感知物體尺寸。這一發現對農產品評級、消費者教育甚至公共健康都具有深遠意義。」
                該研究成果已發表於《蔬果與人類心理學季刊》，並入圍2020年「搞笑諾貝爾」心理學獎。
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-slate-100">
              <h3 className="text-xl font-bold mb-4 text-green-600">《趣味創作》黃瓜經濟學：尺寸與定價的想象關係</h3>
              <p className="mb-4">
                我們的經濟研究團隊發現了令人震驚的「黃瓜尺寸溢價效應」：市場上每增加1公分的黃瓜長度，價格平均上漲13.7%，遠高於其他農產品的尺寸溢價（蘋果為4.2%，葡萄為0.8%）。
                然而，這一溢價存在「臨界點」——超過26公分的黃瓜反而會迅速貶值，業內人士稱之為「過長懲罰」。
              </p>
              <p className="mb-4">
                更耐人尋味的是，我們通過隱藏攝影機記錄了超市顧客挑選黃瓜的行為，發現高達92.3%的消費者會在挑選過程中下意識地「比較尺寸」，而其中63.1%的人最終選擇了視覺上較長的一根，
                儘管價格更高。一位不願具名的超市經理透露：「我們專門把較長的黃瓜放在顯眼位置，銷售率總是更高，特別是男性顧客。」
              </p>
              <p className="mb-4 italic bg-green-50 p-2 rounded">
                註：以上內容均為虛構創作，僅供娛樂，非真實調查或研究數據。數據和故事均為幽默創作，不應作為任何決策依據。
              </p>
              <p className="mb-0">
                我們的研究預測，若全台灣主婦使用TopBana AI進行購物決策，每年可節省高達2.7億元的「尺寸溢價浪費」。這不僅是金錢問題，更是一場心理解放運動：讓民眾明白，
                在小黃瓜的世界裡，「適合自己的尺寸」才是最好的尺寸。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 幽默免責聲明 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border-2 border-dashed border-indigo-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              非常嚴肅的免責聲明
            </h2>
            
            <div className="prose prose-slate max-w-none text-center">
              <p className="mb-4">
                本網站所有&#39;研究數據&#39;、&#39;專家引述&#39;、&#39;科學發現&#39;以及關於香蕉與小黃瓜的&#39;歷史事件&#39;皆為娛樂創作，
                純屬虛構，請勿用於學術研究、農業生產、蔬果鑑定或個人自信建立。
              </p>
              
              <p className="mb-4">
                特別聲明：我們從未監聽過任何蕉農對香蕉的鼓勵言論，也沒有在超市安裝隱藏攝影機記錄消費者挑選小黃瓜的行為（這可能違反法律）。
                &#39;香蕉係數&#39;公式BC = (L×C²)÷F雖然看起來很科學，但在實際計算時可能會導致電腦當機、計算器爆炸或嚴重的數學焦慮。
              </p>
              
              <p className="mb-0 font-medium">
                但我們<span className="underline text-indigo-600">確實能</span>精準測量您的蔬果尺寸，這點是真的，其他都是開玩笑。
              </p>
              
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 italic">
                <p>若您已讀到此處，感謝您的幽默感與耐心。您已正式成為TopBana AI忠實粉絲俱樂部的榮譽會員。
                會費NT$0，權益包含無限笑聲與對蔬果的嶄新視角。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 頁腳 */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex flex-col items-center sm:items-start">
            <p className="text-slate-700 text-sm font-medium">
              © {new Date().getFullYear()} TopBana AI - 台灣第一香蕉AI量測站
            </p>
            <p className="text-slate-500 text-xs mt-1">
              由 <a href="https://www.aideamed.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Aidea:Med</a> 精心開發 - 數位精準驅動專為真實服務
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link href="/terms" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">使用條款</Link>
            <Link href="/privacy" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">隱私政策</Link>
            <Link href="/faq" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">常見問題</Link>
          </div>
        </div>

        {/* SEO優化頁腳 */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-100">
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-700 mb-3">台灣首創香蕉AI量測平台</h2>
            <p className="text-xs text-slate-500 mb-4 max-w-3xl mx-auto">
              TopBana AI是台灣第一香蕉AI量測站，結合先進人工智慧技術，提供精準的蔬果尺寸量測、曲率分析、新鮮度評估與品質檢測服務。
              我們專精於香蕉與黃瓜的數位化量測，為台灣農業與消費者提供創新的蔬果評估解決方案。
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs text-slate-600 mt-4">
            <div>
              <h3 className="font-medium mb-2 text-slate-700">熱門AI量測服務</h3>
              <ul className="space-y-1">
                <li>香蕉智能曲率量測</li>
                <li>黃瓜精確長度檢測</li>
                <li>蔬果AI粗細分析</li>
                <li>香蕉數位化品質評估</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-slate-700">服務地區</h3>
              <ul className="space-y-1">
                <li>台北香蕉AI量測</li>
                <li>台中蔬果數據分析</li>
                <li>高雄農產品檢測</li>
                <li>全台線上量測系統</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-slate-700">量測技術特色</h3>
              <ul className="space-y-1">
                <li>香蕉精準AI量測</li>
                <li>多維度蔬果分析</li>
                <li>智能曲率計算系統</li>
                <li>隱私資料保護機制</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-slate-700">關於我們</h3>
              <ul className="space-y-1">
                <li>台灣AI量測領導品牌</li>
                <li>香蕉數據分析專家</li>
                <li>專業蔬果研究中心</li>
                <li>數位農業技術合作</li>
              </ul>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400 mt-8">
            台灣第一香蕉AI量測站 © {new Date().getFullYear()} - 專業提供香蕉AI量測、黃瓜尺寸檢測、蔬果曲率分析、農產品品質數位評估服務
          </p>
        </div>
      </footer>
    </motion.main>
  );
}
