"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <motion.main
      className="min-h-screen pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 顶部背景 */}
      <div className="relative pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent" />
        
        {/* 导航和标题 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-20">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl sm:text-3xl font-bold">
              <div className="flex items-center space-x-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 font-bold text-3xl sm:text-4xl">TopBana</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-bold text-3xl sm:text-4xl">AI</span>
              </div>
            </Link>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-slate-100">
            <h1 className="text-3xl font-bold mb-6 text-slate-800">隱私政策</h1>
            
            <div className="prose prose-slate max-w-none">
              <p className="mb-4">
                本隱私政策描述了TopBana AI（以下簡稱"我們"、"本服務"）如何收集、使用和披露您的信息。
                我們重視您的隱私，並致力於保護您的個人資料。使用本服務即表示您同意本隱私政策中描述的做法。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">1. 收集的資料</h2>
              <p className="mb-4">
                我們可能收集以下類型的資料：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>上傳的圖片</strong>：您提供給我們分析的蔬果照片。</li>
                <li><strong>使用數據</strong>：您與服務的互動信息，如您使用服務的頻率和持續時間。</li>
                <li><strong>裝置資訊</strong>：瀏覽器類型、IP地址和其他裝置識別信息。</li>
                <li><strong>Cookie數據</strong>：我們使用Cookie和類似技術來追蹤服務的活動並保留某些信息。</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">2. 資料使用</h2>
              <p className="mb-4">
                我們會將收集的資料用於以下目的：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>提供和維護服務</li>
                <li>改進服務質量和用戶體驗</li>
                <li>分析服務使用情況</li>
                <li>偵測、預防和解決技術問題</li>
                <li>履行法律義務</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">3. 圖片處理和存儲</h2>
              <p className="mb-4">
                <strong>重要聲明</strong>：當您上傳圖片進行分析時，我們只會在分析過程中暫時存儲您的圖片。一旦分析完成，我們會立即刪除您的圖片。我們不會永久存儲您上傳的任何圖片或將其用於訓練我們的AI模型。
              </p>
              <p className="mb-4">
                分析結果僅在您的會話期間保存，並且不會與您的個人身份信息關聯。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">4. 數據共享</h2>
              <p className="mb-4">
                我們不會出售或出租您的個人數據給第三方。我們可能在以下情況下共享您的信息：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>服務提供商</strong>：我們可能使用第三方服務提供商來協助我們提供服務（如雲存儲或分析服務）。</li>
                <li><strong>法律要求</strong>：如果法律要求或為回應有效的法律程序，我們可能披露您的信息。</li>
                <li><strong>保護權利</strong>：當合理必要時，保護我們或他人的權利、財產或安全。</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">5. 數據安全</h2>
              <p className="mb-4">
                我們採取合理的安全措施來保護您的數據免遭未經授權的訪問、使用或披露。然而，請注意，互聯網上的數據傳輸不能保證100%安全。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">6. 您的數據權利</h2>
              <p className="mb-4">
                根據台灣《個人資料保護法》，您有權：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>查詢或請求閱覽您的個人資料</li>
                <li>請求製給您的個人資料複製本</li>
                <li>請求補充或更正您的個人資料</li>
                <li>請求停止蒐集、處理或利用您的個人資料</li>
                <li>請求刪除您的個人資料</li>
              </ul>
              <p className="mb-4">
                如果您想行使這些權利，請通過下方提供的聯繫方式與我們聯繫。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">7. Cookie政策</h2>
              <p className="mb-4">
                我們使用Cookie和類似技術來追蹤服務上的活動並保存某些信息。Cookie是包含少量數據的文件，可能包含匿名唯一標識符。
              </p>
              <p className="mb-4">
                您可以指示您的瀏覽器拒絕所有Cookie或在發送Cookie時指示。但是，如果您不接受Cookie，您可能無法使用我們服務的某些部分。
              </p>
              <p className="mb-4">
                我們使用的Cookie類型：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>必要Cookie</strong>：對於服務的運行是必不可少的</li>
                <li><strong>功能Cookie</strong>：使我們能夠記住您的偏好</li>
                <li><strong>分析Cookie</strong>：幫助我們了解用戶如何使用我們的服務</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">8. 兒童隱私</h2>
              <p className="mb-4">
                我們的服務不針對16歲以下的兒童。我們不會故意收集16歲以下兒童的個人身份信息。如果您是父母或監護人，並且您知道您的孩子向我們提供了個人數據，請聯繫我們。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">9. 政策變更</h2>
              <p className="mb-4">
                我們可能會不時更新我們的隱私政策。我們將通過在此頁面上發布新的隱私政策來通知您任何變更。建議您定期查看此隱私政策以了解任何變更。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">10. 聯繫我們</h2>
              <p className="mb-4">
                如果您對本隱私政策有任何疑問或建議，請聯繫我們：
                <br />
                電子郵件：privacy@aideamed.com
              </p>

              <p className="text-sm text-slate-500 mt-8">
                最後更新日期：{new Date().toISOString().split('T')[0]}
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
              © {new Date().getFullYear()} TopBana AI - 所有權利保留
            </p>
            <p className="text-slate-500 text-xs mt-1">
              由 <a href="https://www.aideamed.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Aidea:Med</a> 精心開發
            </p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link href="/terms" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">使用條款</Link>
            <Link href="/privacy" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">隱私政策</Link>
            <Link href="/faq" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">常見問題</Link>
          </div>
        </div>
      </footer>
    </motion.main>
  );
} 