"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Terms() {
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
            <h1 className="text-3xl font-bold mb-8 text-slate-800">使用條款</h1>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-sm text-indigo-600 font-medium mb-6 bg-indigo-50 p-3 rounded-md">
                最後更新日期：{new Date().toISOString().split('T')[0]}
              </p>
              
              <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 font-medium">重要提示：BanaCumber AI（TopBana AI）是一個純娛樂性質的網站。所有分析結果均為虛構，僅供娛樂用途。不應將其視為真實科學評估或醫療建議。</p>
              </div>
              
              <h2>1. 服務接受</h2>
              <p>
                歡迎使用 BanaCumber AI（以下簡稱"我們"、"本網站"或"服務"）。這些使用條款（"條款"）規定了您使用我們網站和服務的條件。
                通過訪問或使用我們的服務，您同意受這些條款的約束。如果您不同意這些條款，請不要使用我們的服務。
              </p>
              
              <h2>2. 服務描述</h2>
              <p>
                BanaCumber AI 是一個娛樂性質的網站，使用人工智能技術分析上傳的香蕉和小黃瓜照片，提供有趣的尺寸、形狀和新鮮度評分。
                <strong>請注意，本服務僅供娛樂之用，所有分析結果均為虛構，不應被視為真實的科學評估。</strong>
              </p>
              
              <h2>3. 使用限制</h2>
              <p>
                使用我們的服務時，您同意:
              </p>
              <ul>
                <li>每位用戶每日最多可使用本服務 10 次</li>
                <li>不上傳含有不當或淫穢內容的圖片</li>
                <li>不使用自動化方式訪問或使用我們的服務</li>
                <li>不嘗試規避我們的使用限制或安全措施</li>
                <li>不使用我們的服務進行任何違法或有害的活動</li>
                <li>僅上傳您擁有權利使用的圖片</li>
              </ul>
              
              <h2>4. 內容限制</h2>
              <p>
                您不得上傳或分享含有以下內容的材料：
              </p>
              <ul>
                <li>淫穢、色情或露骨性內容</li>
                <li>暴力或煽動性內容</li>
                <li>歧視、仇恨或騷擾內容</li>
                <li>非法內容或促進非法活動的內容</li>
                <li>侵犯他人隱私的內容</li>
                <li>侵犯知識產權的內容</li>
                <li>含有病毒、惡意代碼或其他有害成分的內容</li>
              </ul>
              
              <h2>5. 所有權與知識產權</h2>
              <p>
                本服務及其原始內容、功能和設計受國際版權、商標、專利、商業秘密和其他知識產權法律的保護。
                我們保留對服務的所有權利、所有權和權益。您不得複製、修改、創建衍生作品、公開展示、公開表演、
                重新發布、下載、存儲或傳輸本服務中的任何材料，除非本條款明確允許。
              </p>
              
              <h2>6. 免責聲明</h2>
              <p>
                本服務按"現狀"和"可用性"提供，不提供任何明示或暗示的保證或條件。
                我們不保證服務將不間斷、及時、安全或無錯誤，也不保證結果將準確或可靠。
                您同意使用本服務的風險完全由您自己承擔。
              </p>
              <p>
                <strong>特別聲明：BanaCumber AI 提供的所有分析結果純屬娛樂性質，完全為虛構內容，
                不基於任何科學研究或實際測量數據。這些結果不構成醫療建議或科學評估，
                不應用於任何實際決策或自我評價目的。</strong>
              </p>
              
              <h2>7. 責任限制</h2>
              <p>
                在任何情況下，我們對因使用或無法使用服務而導致的任何間接、附帶、特殊、示範性或後果性損害（包括但不限於業務損失、收入損失、利潤損失、使用損失、數據損失或其他經濟優勢損失）概不負責，無論這些損害是基於保證、合同、侵權行為還是任何其他法律理論，即使我們已被告知此類損害的可能性。
              </p>
              <p>
                某些司法管轄區不允許排除或限制附帶或後果性損害的責任，因此上述限制可能不適用於您。
              </p>
              
              <h2>8. 賠償</h2>
              <p>
                您同意賠償、辯護並使我們及我們的子公司、附屬公司、合作伙伴、高級職員、董事、代理人、承包商和員工免受因您違反這些條款或您使用服務引起的任何第三方索賠、訴訟、要求、損失、責任、損害或費用（包括但不限於律師費）。
              </p>
              
              <h2>9. 服務變更與終止</h2>
              <p>
                我們保留隨時修改或終止服務的權利，恕不另行通知。我們不對您或任何第三方負責任何服務修改、暫停或終止的責任。
              </p>
              <p>
                我們有權出於任何原因暫停或終止您對服務的訪問，包括但不限於違反這些條款。
              </p>
              
              <h2>10. 隱私政策</h2>
              <p>
                您對我們服務的使用也受我們的<Link href="/privacy" className="text-indigo-600 hover:text-indigo-800">隱私政策</Link>的約束，該政策納入本使用條款。
                請注意，我們不會永久存儲您上傳的任何圖片，分析完成後會立即刪除。
              </p>
              
              <h2>11. 管轄法律</h2>
              <p>
                這些條款受台灣法律管轄，不考慮法律衝突原則。您同意就與這些條款或我們服務有關的任何爭議，台灣法院具有專屬管轄權。
              </p>
              
              <h2>12. 條款修改</h2>
              <p>
                我們保留隨時修改這些條款的權利。修改後的條款將在我們的網站上發布。您繼續使用服務將被視為接受修改後的條款。
                建議您定期查看這些條款以了解任何變更。
              </p>
              
              <h2>13. 聯繫我們</h2>
              <p>
                如果您對這些使用條款有任何問題或疑慮，請通過以下方式聯繫我們：<br />
                電子郵件：terms@topbana-ai.example.com
              </p>
              
              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-600">
                  通過使用BanaCumber AI，您表示已閱讀、理解並同意接受這些條款。
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
            <Link href="/terms" className="text-sm text-indigo-600 font-medium">使用條款</Link>
            <Link href="/privacy" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">隱私政策</Link>
            <Link href="/faq" className="text-sm text-slate-700 hover:text-blue-600 transition-colors p-2 font-medium">常見問題</Link>
          </div>
        </div>
      </footer>
    </motion.main>
  );
} 