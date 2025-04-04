"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Privacy() {
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
            <h1 className="text-3xl font-bold mb-8 text-slate-800">隱私政策</h1>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-sm text-indigo-600 font-medium mb-6 bg-indigo-50 p-3 rounded-md">
                最後更新日期：{new Date().toISOString().split('T')[0]}
              </p>
              
              <h2>1. 前言</h2>
              <p>
                TopBana AI（以下簡稱"我們"、"本網站"）重視用戶的隱私。本隱私政策旨在說明我們如何收集、使用、披露和保護您的個人信息。
                使用本網站即表示您接受本隱私政策中描述的做法。
              </p>
              
              <h2>2. 信息收集</h2>
              <p>
                我們可能收集的信息包括：
              </p>
              <ul>
                <li><strong>上傳的圖片</strong>：您上傳到我們網站的蔬果照片。</li>
                <li><strong>使用數據</strong>：關於您如何使用我們服務的信息，例如您每日使用的分析次數。</li>
                <li><strong>裝置信息</strong>：瀏覽器類型、IP地址、訪問時間等技術信息。</li>
                <li><strong>Cookies</strong>：我們使用cookies來跟踪用戶每日的使用次數和提供更好的用戶體驗。</li>
              </ul>
              
              <h2>3. 信息使用</h2>
              <p>
                我們使用收集的信息用於：
              </p>
              <ul>
                <li>提供、維護和改進我們的服務</li>
                <li>處理您的蔬果照片分析請求</li>
                <li>跟踪用戶每日使用次數以執行使用限制</li>
                <li>監控和分析使用趨勢和偏好</li>
                <li>防止欺詐活動和改善網站安全</li>
              </ul>
              
              <h2>4. 圖片處理與隱私</h2>
              <p>
                關於您上傳的圖片，我們特別說明：
              </p>
              <ul>
                <li>所有上傳的圖片僅用於即時分析</li>
                <li>我們不會永久存儲您上傳的圖片</li>
                <li>分析完成後，您的圖片數據會立即從我們的伺服器中刪除</li>
                <li>圖片不會被用於訓練我們的AI模型</li>
                <li>圖片不會被共享給任何第三方</li>
              </ul>
              
              <h2>5. 信息共享</h2>
              <p>
                我們不會出售、交易或以其他方式轉讓您的個人信息給外部第三方。以下情況除外：
              </p>
              <ul>
                <li>當我們聘請服務提供商協助我們運營網站或服務時</li>
                <li>當我們相信披露是為了遵守法律、法規或法律程序時</li>
                <li>當我們相信披露是為了保護我們的權利或財產安全時</li>
                <li>在獲得您的同意的情況下</li>
              </ul>
              
              <h2>6. 信息安全</h2>
              <p>
                我們實施各種安全措施，以維護您個人信息的安全。然而，請注意，互聯網上的傳輸方法或電子存儲方法都不是100%安全的。我們努力保護您的個人信息，但不能保證其絕對安全。
              </p>
              
              <h2>7. 兒童隱私</h2>
              <p>
                我們的服務不針對13歲以下的兒童。我們不會故意收集13歲以下兒童的個人信息。如果我們發現不小心收集了這類信息，我們將立即採取措施刪除。
              </p>
              
              <h2>8. 您的權利</h2>
              <p>
                根據適用的隱私法律，您可能擁有以下權利：
              </p>
              <ul>
                <li>訪問您的個人信息</li>
                <li>更正不準確的個人信息</li>
                <li>刪除您的個人信息</li>
                <li>反對或限制處理您的個人信息</li>
                <li>數據可攜性</li>
              </ul>
              <p>
                如要行使這些權利，請通過下方聯繫方式與我們聯絡。
              </p>
              
              <h2>9. Cookie政策</h2>
              <p>
                我們使用cookies來跟踪每日使用次數和提供更好的用戶體驗。您可以通過瀏覽器設置來控制cookies的使用。但請注意，禁用cookies可能會影響某些網站功能。
              </p>
              
              <h2>10. 第三方鏈接</h2>
              <p>
                我們的網站可能包含指向第三方網站的鏈接。我們對這些網站的隱私做法不負責任。我們鼓勵您在離開我們的網站時閱讀您訪問的每個網站的隱私聲明。
              </p>
              
              <h2>11. 隱私政策變更</h2>
              <p>
                我們可能會不時更新我們的隱私政策。我們將通過在網站上發布新的隱私政策來通知您任何變更。建議您定期查看本隱私政策以了解任何變更。
              </p>
              
              <h2>12. 聯繫我們</h2>
              <p>
                如果您對本隱私政策有任何問題或疑慮，請通過以下方式聯繫我們：<br />
                電子郵件：privacy@topbana-ai.example.com
              </p>
              
              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-600">
                  通過使用TopBana AI，您表示同意本隱私政策的條款。如果您不同意本政策，請不要使用我們的網站和服務。
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
            <Link href="/privacy" className="text-sm text-indigo-600 font-medium">隱私政策</Link>
            <Link href="/faq" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">常見問題</Link>
          </div>
        </div>
      </footer>
    </motion.main>
  );
} 