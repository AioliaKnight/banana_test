"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function TermsPage() {
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
            <h1 className="text-3xl font-bold mb-6 text-slate-800">使用條款</h1>
            
            <div className="prose prose-slate max-w-none">
              <h2 className="text-xl font-semibold mb-4 text-slate-700">1. 服務條款接受</h2>
              <p className="mb-4">
                歡迎使用TopBana AI（以下簡稱「本服務」）。本服務由Aidea:Med（以下簡稱「我們」）提供。透過訪問或使用本服務，您同意受本使用條款的約束。如果您不同意這些條款，請勿使用本服務。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">2. 服務說明</h2>
              <p className="mb-4">
                TopBana AI是一個娛樂性質的AI蔬果分析服務，用於分析香蕉、小黃瓜等蔬果的尺寸。本服務旨在提供娛樂體驗，不應被視為專業測量工具或用於任何專業目的。
              </p>
              <p className="mb-4">
                本服務提供的分析和結果僅供娛樂目的，不應被視為科學準確或可靠。所有功能和內容可能隨時變更，無需事先通知。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">3. 使用限制</h2>
              <p className="mb-4">
                您同意不會：
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>使用本服務於任何非法目的或違反任何法律法規；</li>
                <li>上傳包含不適當、冒犯性或違法內容的圖片；</li>
                <li>上傳不符合服務目的的圖片（非香蕉、小黃瓜等蔬果）；</li>
                <li>干擾或破壞服務或連接到服務的伺服器或網絡；</li>
                <li>濫用服務資源或企圖超出每日使用限制；</li>
                <li>嘗試獲取對服務的未授權訪問。</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">4. 知識產權</h2>
              <p className="mb-4">
                本服務及其原始內容、功能和設計均為Aidea:Med及其授權方的專有財產，受著作權、商標和其他知識產權法律保護。
              </p>
              <p className="mb-4">
                您可以使用本服務生成的分析結果截圖用於個人、非商業目的。任何商業使用需獲得我們的事先書面同意。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">5. 免責聲明</h2>
              <p className="mb-4">
                本服務按「現狀」和「可用性」提供，不提供任何形式的保證，無論是明示的還是暗示的。我們不保證服務將不間斷、及時、安全或無錯誤，也不保證結果的準確性或可靠性。
              </p>
              <p className="mb-4">
                您理解並同意，使用本服務的風險完全由您自行承擔。本服務的設計目的純粹是娛樂性質，不應用於任何專業或商業決策。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">6. 責任限制</h2>
              <p className="mb-4">
                在適用法律允許的最大範圍內，我們及我們的供應商、分包商和授權方對任何直接、間接、偶然、特殊、後果性或懲罰性損害不承擔責任，包括但不限於利潤損失、商譽損失、數據損失或其他無形損失。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">7. 修改</h2>
              <p className="mb-4">
                我們保留隨時修改或替換這些條款的權利。如有重大變更，我們將嘗試提前至少30天通知。如果您在變更生效後繼續訪問或使用本服務，則視為您接受修改後的條款。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">8. 適用法律</h2>
              <p className="mb-4">
                這些條款及您對服務的使用受中華民國台灣法律管轄，不考慮法律衝突原則。
              </p>

              <h2 className="text-xl font-semibold mb-4 text-slate-700">9. 聯絡我們</h2>
              <p className="mb-4">
                如果您對這些使用條款有任何疑問，請聯絡我們：
                <br />
                電子郵件：support@aideamed.com
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