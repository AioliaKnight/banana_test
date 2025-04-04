# AI 蔬果分析器 - 專案需求文檔 (RPD)

## 專案概述

AI 蔬果分析器是一個基於 Next.js 15+ 開發的單頁式網站應用程式，主要功能是讓使用者上傳小黃瓜或香蕉的圖片，利用 AI 視覺能力分析其特徵，並提供專業評分和詳細評語。本專案注重隱私保護（不保存使用者資料）、直覺操作和科技感設計。

## 使用者故事

1. 作為使用者，我想要能輕鬆上傳蔬果圖片，不需繁瑣的註冊登入程序
2. 作為使用者，我希望能看到 AI 給予的專業分析及評分，了解蔬果的長度、粗細和品質特徵
3. 作為使用者，我期望應用能提供視覺化的結果呈現，易於理解
4. 作為使用者，我希望能將結果分享到社交媒體平台與朋友分享
5. 作為使用者，我關心個人隱私，不希望上傳的圖片被保存或使用於其他用途

## 核心功能需求

### 1. 圖片上傳介面
- 支援拖放上傳
- 提供預覽功能
- 支援常見圖片格式 (JPG, PNG, WEBP)
- 直覺化操作流程

### 2. AI 分析功能
- 分析蔬果長度 (cm)
- 評估蔬果粗細 (cm)
- 評斷蔬果新鮮度
- 提供綜合評分 (滿分 10 分)
- 生成專業評語

### 3. 用戶體驗
- 科技感 UI 設計與流暢動畫
- 漸變背景效果
- 清晰明確的操作流程
- 無需註冊流程，減少使用門檻
- 隱私保護聲明與承諾

### 4. 分享功能
- 支援分享到 LINE
- 支援分享到 Instagram 限時動態
- 支援分享到 Threads

## 技術規格

### 前端技術
- Next.js 15+ (App Router)
- TypeScript
- TailwindCSS 
- Framer Motion (動畫效果)
- React Dropzone (拖放上傳)
- React Share (分享功能)
- React Icons (圖標)

### 後端技術
- Next.js API Routes
- Google Cloud Integration
  - Cloud Vision API (圖像分析)
  - Vertex AI - Gemini (文字生成)

### 資料流程
1. 使用者上傳圖片到前端
2. 前端將圖片發送至 API Route
3. API 將圖片傳送至 Google Cloud Vision 進行分析
4. 分析數據傳送至 Gemini 生成評語
5. 結果返回前端顯示
6. 所有數據在分析後即刪除，不做持久化存儲

## API 整合設計

### Google Cloud Vision API
- 用於識別上傳圖片中的蔬果對象
- 分析對象尺寸、形狀特徵
- 辨識顏色與質地

### Google Gemini API
- 根據 Vision API 結果生成專業評語
- 以女性視角提供評價
- 生成針對形狀、長度、粗細的綜合評分

## 部署計劃

### 環境需求
- Vercel 平台部署
- 環境變數管理
  - Google Cloud API Keys
  - Project IDs

### CI/CD 流程
- GitHub 儲存庫整合
- 自動化部署
- API 金鑰安全管理

## 測試計劃

### 單元測試
- 組件功能測試
- 圖片上傳流程測試
- API 響應測試

### 整合測試
- 前後端整合測試
- API 整合測試

### 用戶測試
- 界面易用性測試
- 移動設備兼容性測試

## 安全與隱私

- 不儲存用戶上傳的圖片
- 臨時數據在分析完成後即刻清除
- 明確的隱私政策聲明
- 符合 GDPR 數據處理要求

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
GOOGLE_API_KEY=your_google_api_key
```

4. 啟動開發服務器
```bash
npm run dev
```

5. 開啟瀏覽器訪問 `http://localhost:3000`

## Google Cloud 設置指南

### 前置需求
1. Google Cloud 帳號
2. 啟用計費功能

### 設置步驟
1. 建立新專案
   - 前往 Google Cloud Console
   - 點擊「新建專案」
   - 填寫專案名稱，例如「cucumber-banana-analyzer」
   - 選擇計費帳戶

2. 啟用 API
   - Cloud Vision API
   - Vertex AI API

3. 建立憑證
   - 建立 API 金鑰
   - 設置適當的使用限制（例如 HTTP 來源限制到您的網域）

4. 安全存儲憑證
   - 在 Vercel 中設置環境變數
   - 本地開發使用 .env.local

## 擴展計劃

### 短期目標
- 支援多語言界面
- 改進圖片處理效率
- 微調 AI 模型精準度

### 長期目標
- 新增更多蔬果類型分析
- 增加圖片比較功能
- 支援更多社交媒體分享
- 開發 PWA 版本提升移動端體驗

## License

MIT
