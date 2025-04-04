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
        
        {/* 頂部導航和品牌標題 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-20">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <div className="flex items-center space-x-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 font-bold text-3xl sm:text-4xl">TopBana</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-bold text-3xl sm:text-4xl">AI</span>
              </div>
            </h1>
            {/* 添加標語 */}
            <p className="hidden md:block text-sm text-slate-600 font-medium">智能評測 · 精準分析 · 即時結果</p>
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
              <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 font-bold">AI精準測量</span>
                <div className="flex flex-row mt-3 sm:mt-0 items-center">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-l-md font-bold">黃瓜</span>
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-r-md font-bold">香蕉</span>
                  <span className="ml-2 text-slate-700 font-bold">專業評分</span>
                </div>
              </div>
            </h2>
            <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto">
              只需上傳照片，<span className="font-semibold">3秒內</span>獲取專業分析評測。先進AI技術精準測量長度、粗細與新鮮度，
              給您最客觀的評分和建議。無需註冊，<span className="font-semibold">隱私安全有保障</span>。
            </p>
            
            {/* 顯示剩餘分析次數 */}
            <div className="mt-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-full px-4 py-1 inline-flex items-center">
              <span className="text-sm text-indigo-700">
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
                <div className="mb-2 mt-1 text-center">
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded">
                    快速 · 準確 · 保密
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

      {/* 關於區塊 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
              認識 
              <span className="font-bold mx-1">TopBana AI</span>
              的優勢
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
                精準技術分析
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                採用先進的AI視覺辨識技術，我們能快速分析您上傳的黃瓜或香蕉照片。系統自動辨識類型，
                精準評估長度、粗細和新鮮度，提供可靠的專業評分和詳細分析。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                </svg>
                安心隱私保障
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                您的圖片僅用於即時分析，絕不儲存上傳的照片。分析完成後，所有圖片數據立即從伺服器移除，
                確保您的隱私安全，讓您無顧慮地使用我們的服務。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                </svg>
                便捷使用體驗
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                無需註冊，無需繁瑣步驟，直接上傳圖片即可獲得專業分析。我們的AI模型經過數千張樣本訓練，
                提供精準評分與專業評語，讓您享受簡單快速的使用體驗。
              </p>
            </div>
            
            <div className="card card-hover">
              <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                頂尖技術支持
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                TopBana AI 結合 Google Cloud Vision API、Vertex AI 與 Gemini 模型，
                運用最先進的AI技術提供準確分析。支持多種圖片格式，確保各種拍攝條件下的最佳效果。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 用戶評價 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
              用戶好評如潮
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-slate-500 ml-2">昨天</span>
              </div>
              <p className="text-sm text-slate-700">「這個工具太神奇了！上傳照片後立即得到精確的測量結果，幫我省去許多時間。」</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">張先生 - 台北</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-slate-500 ml-2">一週前</span>
              </div>
              <p className="text-sm text-slate-700">「評分系統非常專業，連新鮮度都能分析出來！對農產品品質把關很有幫助。」</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">林小姐 - 高雄</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-slate-500 ml-2">兩週前</span>
              </div>
              <p className="text-sm text-slate-700">「介面簡單易用，分析結果可以一鍵分享，朋友們都覺得很有趣！」</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">王先生 - 台中</p>
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
                TopBana AI的創意團隊由一群熱愛科技與幽默的夥伴組成，他們創造了這個充滿趣味的虛構角色：
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>
                  <strong>虛構角色：技術總監陳博士</strong>：我們編劇筆下的角色，擁有「香蕉曲率動力學」博士學位。據說他可以僅憑聽一根香蕉掉在地上的聲音，就能判斷它的成熟度。
                </li>
                <li>
                  <strong>虛構角色：AI架構師李工程師</strong>：這個角色在我們的故事中24歲獲得「國際小黃瓜辨識競賽」冠軍，創下了0.03秒內區分小黃瓜與大黃瓜的世界紀錄。閒暇時愛好撰寫「如果蔬果會說話」主題小說。
                </li>
                <li>
                  <strong>虛構角色：使用者體驗總監林小姐</strong>：虛構的蔬果雕刻藝術家，因不滿傳統評測系統對她作品的低評價而加入團隊。她的座右銘是「一根香蕉的價值，不該由它的外表決定」。
                </li>
                <li>
                  <strong>虛構角色：資安長黃先生</strong>：故事中的資安專家，在我們的劇情設定中開發了「蔬果隱私保護協議」。據說他的電腦密碼是一串連AI都無法破解的香蕉品種拉丁名。
                </li>
              </ul>
              <p className="mb-0">
                我們的創意團隊在構思這些角色時，希望能帶給用戶歡樂的使用體驗，創造一個輕鬆幽默的蔬果分析世界。
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
                本網站所有"研究數據"、"專家引述"、"科學發現"以及關於香蕉與小黃瓜的"歷史事件"皆為娛樂創作，
                純屬虛構，請勿用於學術研究、農業生產、蔬果鑑定或個人自信建立。
              </p>
              
              <p className="mb-4">
                特別聲明：我們從未監聽過任何蕉農對香蕉的鼓勵言論，也沒有在超市安裝隱藏攝影機記錄消費者挑選小黃瓜的行為（這可能違反法律）。
                "香蕉係數"公式BC = (L×C²)÷F雖然看起來很科學，但在實際計算時可能會導致電腦當機、計算器爆炸或嚴重的數學焦慮。
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
              © {new Date().getFullYear()} TopBana AI - 所有權利保留
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
