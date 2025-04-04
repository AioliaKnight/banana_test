# AI 蔬果分析器 - Cucumber Banana Analyzer

![版本](https://img.shields.io/badge/版本-0.1.0-blue)
![框架](https://img.shields.io/badge/框架-Next.js%2015.2.4-black)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)
![開源授權](https://img.shields.io/badge/授權-MIT-green)

## 專案簡介

AI 蔬果分析器是一款專門為分析小黃瓜和香蕉設計的人工智能應用。透過先進的 AI 視覺技術，系統能快速分析上傳的蔬果照片，提供長度、粗細、新鮮度等關鍵指標，並給予專業評分和詳細評語。本應用強調隱私保護，所有分析即時進行，不保存使用者圖片。

> [!提示]
> 部署於 [Vercel](https://vercel.com) 平台，提供全球高速訪問體驗。

## 主要功能

### 🥒 蔬果分析
- 支援小黃瓜和香蕉兩種蔬果的專業分析
- 測量並顯示蔬果長度（公分）
- 評估蔬果粗細（公分）
- 根據外觀和形狀判斷蔬果新鮮度（10分制）
- 提供綜合品質評分（10分制）
- 生成專業詳細評語，解釋評分理由和特點

### 📱 用戶體驗
- 直覺化拖放上傳介面
- 支援手機拍照直接上傳
- 即時圖片預覽功能
- 優雅流暢的動畫過渡效果
- 無需註冊，立即使用
- 響應式設計，完美支援所有設備尺寸

### 🔒 隱私保護
- 不保存用戶上傳的圖片
- 所有分析在雲端完成後即刻刪除資料
- 不記錄使用者的個人資訊
- 透明的數據處理流程

### 🔗 分享功能
- 一鍵下載高品質分析結果圖片
- 支援分享到主流社交平台（Facebook、Twitter、Line）
- 自動生成精美分享卡片，包含完整分析結果

## 技術架構

### 前端技術
- **Next.js 15.2.4** - 採用App Router架構
- **React 19.0.0** - 使用最新版React框架
- **TypeScript** - 確保代碼質量與類型安全
- **TailwindCSS 3.4** - 實現現代化UI設計
- **Framer Motion** - 流暢的動畫效果
- **React Dropzone** - 高質量文件上傳體驗
- **React Icons** - 豐富的圖標庫

### 後端技術
- **Next.js API Routes** - 無服務器後端架構
- **Google Cloud Vision API** - 圖像分析
- **Google Gemini AI** - 文本生成與解釋
- **HTML-to-Image** - 分享圖片生成

### 工程特色
- 高效的圖片處理策略
- 客戶端圖片壓縮與調整
- 可定制的分享圖片生成系統
- 完整錯誤處理機制
- 優化的移動設備體驗

## 本地開發

1. 複製專案
```bash
git clone [your-repo-url]
cd cucumber-banana-analyzer
```

2. 安裝依賴
```bash
npm install
```

3. 設置環境變數
建立 `.env.local` 檔案，添加：
```
GOOGLE_CLOUD_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
```

4. 啟動開發服務器
```bash
npm run dev --turbo
```

5. 開啟瀏覽器訪問 `http://localhost:3000`

## 部署指南

### Vercel 部署（推薦）
1. Fork 此儲存庫到您的 GitHub 帳號
2. 在 Vercel 中導入該專案
3. 配置環境變數
4. 部署

### 其他平台
本專案可部署到任何支援 Next.js 的平台，如 Netlify、AWS Amplify 等。

## 功能展示

> [!注意]
> 在這裡添加應用功能截圖，展示上傳界面、分析結果和分享功能等。

## 最近更新

- ✅ 修復移動端相機功能，添加直接拍照按鈕
- ✅ 優化分享圖片生成系統，統一桌面和移動設備的圖片格式
- ✅ 改進錯誤處理機制，提供更明確的用戶提示
- ✅ 優化首頁文案，提升用戶體驗
- ✅ 使用Next.js Image組件，提升圖片載入性能

## 貢獻指南

歡迎提交Pull Request或報告Issues！在貢獻之前，請確保您的更改符合項目要求和代碼風格。

## 授權協議

本專案採用 MIT 授權協議。詳見 [LICENSE](LICENSE) 文件。

## 開發者

由 [Aidea:Med](https://aideamed.com) 團隊開發

---

📊 **分析精確度** | 🛡️ **隱私至上** | 🚀 **高效體驗** 

---
