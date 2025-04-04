"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

// FAQ项组件
interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        className="flex justify-between items-center w-full py-5 px-2 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-slate-800">{question}</h3>
        <svg
          className={`w-5 h-5 text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-5 px-2" : "max-h-0"
        }`}
      >
        <div className="prose prose-slate max-w-none text-slate-600">{answer}</div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  // FAQ数据
  const faqItems = [
    {
      question: "TopBana AI 是做什麼的？",
      answer: (
        <p>
          TopBana AI 是一個娛樂性質的AI蔬果分析服務，專門用於分析香蕉、小黃瓜等蔬果的尺寸。我們使用先進的AI技術來測量您上傳的蔬果照片，提供長度、粗細和新鮮度等維度的評估和趣味性評分。
          請注意，本服務僅供娛樂，所有分析結果和評語均帶有幽默色彩，不應被視為專業或科學評估。
        </p>
      ),
    },
    {
      question: "如何使用 TopBana AI？",
      answer: (
        <>
          <p>使用TopBana AI非常簡單，只需三個步驟：</p>
          <ol className="list-decimal pl-6 mb-4">
            <li>在主頁上傳您想分析的香蕉或小黃瓜照片</li>
            <li>點擊「立即分析」按鈕</li>
            <li>等待約3秒鐘，系統會自動顯示分析結果</li>
          </ol>
          <p>
            您還可以選擇分享分析結果或下載結果圖片。每位用戶每天可享有10次免費分析機會。
          </p>
        </>
      ),
    },
    {
      question: "我的隱私是否安全？",
      answer: (
        <p>
          我們非常重視您的隱私。您上傳的照片僅用於即時分析，一旦分析完成，系統會立即自動刪除您的照片。
          我們不會永久存儲任何用戶上傳的照片，也不會將這些照片用於AI模型訓練。分析結果僅在您的會話期間保存，
          且不會與您的個人身份資訊關聯。如需了解更多詳情，請查閱我們的<Link href="/privacy" className="text-blue-600 hover:underline">隱私政策</Link>。
        </p>
      ),
    },
    {
      question: "為什麼我每天只能分析10次？",
      answer: (
        <p>
          為了確保所有用戶都能享受到穩定、高質量的服務體驗，我們設置了每日10次的使用限制。
          這也有助於我們控制服務器負載和維持分析品質。限制次數會在每天午夜（台灣時間）自動重置。
        </p>
      ),
    },
    {
      question: "分析結果的準確性如何？",
      answer: (
        <p>
          TopBana AI 的分析結果相對準確，但請記住這是一個娛樂性質的服務。測量結果可能受到多種因素影響，
          如照片的角度、光線條件、背景複雜度等。我們使用先進的AI技術進行計算，但所有結果和評語都應被視為有趣的參考，
          而非絕對精準的科學測量。如果您需要精確測量，建議使用專業測量工具。
        </p>
      ),
    },
    {
      question: "為什麼我的照片無法被分析？",
      answer: (
        <>
          <p>可能有幾個原因導致照片無法被成功分析：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>照片中沒有清晰可見的香蕉或小黃瓜</li>
            <li>照片質量太低（太模糊或太暗）</li>
            <li>照片中有多個物體，導致AI無法確定要分析哪一個</li>
            <li>上傳的不是支持的蔬果類型</li>
            <li>照片格式不受支持（我們支持JPG、PNG和WEBP格式）</li>
          </ul>
          <p>
            建議上傳清晰、光線充足、背景簡單、物體完整可見的照片，以獲得最佳分析結果。
          </p>
        </>
      ),
    },
    {
      question: "我可以上傳其他物品的照片嗎？",
      answer: (
        <p>
          TopBana AI 專為分析香蕉和小黃瓜等棒狀蔬果設計。雖然系統也可能識別和分析其他類似形狀的蔬果，
          但最準確的結果來自於分析香蕉和小黃瓜。我們不建議上傳其他類型的物品，因為系統可能無法正確識別或提供有意義的分析結果。
          同時，我們嚴禁上傳任何不適當、冒犯性或違法的內容，所有此類嘗試都會被系統自動拒絕。
        </p>
      ),
    },
    {
      question: "我可以訂閱高級版本嗎？",
      answer: (
        <p>
          目前，TopBana AI 提供的是完全免費的服務，不設置訂閱或付費計劃。每位用戶每天可享有10次免費分析機會。
          我們認為這對於一個娛樂性質的應用來說已經足夠了。未來如果我們推出更多功能或提供高級版本，我們會在網站上通知所有用戶。
        </p>
      ),
    },
    {
      question: "TopBana AI 的分析結果是如何計算的？",
      answer: (
        <p>
          我們的AI系統使用計算機視覺技術來識別照片中的蔬果，並測量其維度。具體來說，系統會：
          1）識別物體類型（香蕉、小黃瓜等）；
          2）計算其長度和粗細；
          3）分析表面特徵以評估新鮮度；
          4）根據多項因素綜合評分。
          請注意，「香蕉係數」等專業術語和評分標準都是我們創造的娛樂性概念，並非真實的科學指標。
          所有的評語和建議都經過精心設計，旨在帶給用戶輕鬆愉快的體驗。
        </p>
      ),
    },
    {
      question: "如果我對結果不滿意，可以重新分析嗎？",
      answer: (
        <p>
          當然可以！如果您對分析結果不滿意，可以點擊「重新測量」按鈕重新上傳照片。每次新上傳都會消耗一次當日的分析機會。
          建議您嘗試從不同角度拍攝，或在光線更好的環境下重新拍攝，這可能會得到更理想的結果。
          請記住，TopBana AI 提供的是娛樂性質的分析，結果可能因多種因素而有所偏差。
        </p>
      ),
    },
  ];

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
            <h1 className="text-3xl font-bold mb-6 text-slate-800">常見問題</h1>
            
            <div className="mb-8">
              <p className="text-slate-600">
                關於TopBana AI的常見問題解答。如果您的問題沒有在這裡得到回答，請隨時聯繫我們的支持團隊。
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {faqItems.map((item, index) => (
                <FAQItem key={index} question={item.question} answer={item.answer} />
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200">
              <p className="text-slate-600 text-center">
                還有問題？請發送郵件至{" "}
                <a href="mailto:support@aideamed.com" className="text-blue-600 hover:underline">
                  support@aideamed.com
                </a>
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