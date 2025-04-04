"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index) 
        : [...prev, index]
    );
  };

  const faqItems = [
    {
      question: "TopBana AI 是什麼？",
      answer: "TopBana AI 是一個娛樂性質的網站，使用AI技術分析上傳的香蕉和小黃瓜照片，提供有趣的尺寸、形狀和新鮮度評分。這是一個純粹供娛樂使用的服務，所有分析結果均為虛構，不應被視為真實的科學評估。"
    },
    {
      question: "如何使用TopBana AI？",
      answer: "使用非常簡單！只需點擊首頁上的「上傳圖片」按鈕，選擇您要分析的香蕉或小黃瓜照片，然後等待幾秒鐘。系統會自動進行分析並顯示結果。每天可以分析最多10次。"
    },
    {
      question: "我的照片會被保存嗎？",
      answer: "不會。您上傳的所有圖片僅用於即時分析，分析完成後會立即從我們的伺服器中刪除。我們不會永久存儲您的圖片，也不會使用它們來訓練我們的AI模型或分享給任何第三方。"
    },
    {
      question: "分析結果是真實的科學數據嗎？",
      answer: "不是。TopBana AI 提供的所有分析結果都是虛構的，僅供娛樂目的。分析中顯示的尺寸、評分和比較均非基於真實的科學研究或數據，不應被視為真實的測量或評估。"
    },
    {
      question: "為什麼每天只能分析10次？",
      answer: "為了確保所有用戶都能享受到我們的服務，同時控制伺服器負載，我們限制每個用戶每天最多可以進行10次分析。計數會在每天凌晨重置。"
    },
    {
      question: "分析結果可以分享嗎？",
      answer: "可以。每次分析完成後，您會看到「分享」按鈕，允許您下載或分享結果圖片。不過，請記住這些結果僅供娛樂，並考慮您分享內容的適當性。"
    },
    {
      question: "我的分析數據會被用來做什麼？",
      answer: "我們不會收集或存儲您的分析數據或上傳的圖片。我們僅使用匿名的使用統計來改進我們的服務，如每日分析總次數等。"
    },
    {
      question: "TopBana AI 適合所有年齡使用嗎？",
      answer: "TopBana AI 是一個娛樂網站，建議由成年人使用。雖然我們的內容保持在幽默而非明確色情的界限內，但某些幽默可能不適合兒童。"
    },
    {
      question: "分析結果為什麼顯示「敏感內容」？",
      answer: "為了保護用戶隱私和維持適當的內容標準，當我們的系統檢測到上傳的圖片可能包含不適當或敏感內容時，會顯示此訊息。這是我們確保平台安全的措施之一。"
    },
    {
      question: "我可以分析其他水果或蔬菜嗎？",
      answer: "目前，TopBana AI 僅支持分析香蕉和小黃瓜。我們可能會在未來拓展支持其他蔬果類型，敬請期待！"
    }
  ];

  return (
    <motion.main
      className="min-h-screen pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative pt-8 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent" />
        
        {/* 頂部導航 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-20 mb-12">
          <Link href="/" className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>返回首頁</span>
          </Link>
        </div>

        {/* 主要內容 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-xl p-6 sm:p-10">
            <h1 className="text-3xl font-bold mb-8 text-slate-800">常見問題</h1>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 mb-8">
                我們收集了一些使用者經常問到的問題。如果您的問題沒有在下面找到答案，請隨時通過電子郵件聯繫我們。
              </p>
              
              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div 
                    key={index}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <button
                      className="flex justify-between items-center w-full px-4 py-4 text-left bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800 font-medium"
                      onClick={() => toggleItem(index)}
                    >
                      <span>{item.question}</span>
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${openItems.includes(index) ? 'rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openItems.includes(index) ? 'max-h-96' : 'max-h-0'}`}
                    >
                      <div className="px-4 py-4 bg-white border-t border-slate-200">
                        <p className="text-slate-600">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <h3 className="text-xl font-semibold mb-4">還有其他問題？</h3>
                <p className="text-slate-600">
                  如果您沒有在上面找到您的問題答案，請隨時發送電子郵件至<br />
                  <a href="mailto:support@topbana-ai.example.com" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                    support@topbana-ai.example.com
                  </a>
                </p>
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
          </div>
          <div className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link href="/terms" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">使用條款</Link>
            <Link href="/privacy" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">隱私政策</Link>
            <Link href="/faq" className="text-sm text-indigo-600 font-medium">常見問題</Link>
          </div>
        </div>
      </footer>
    </motion.main>
  );
} 