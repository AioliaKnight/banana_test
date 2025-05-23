import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap'
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap'
});

// 使用環境變數設定基礎 URL
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://topbana.ai' 
    : 'http://localhost:3000');

// 將 viewport 設定分離為獨立配置
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: '%s | TopBana AI 智能分析蔬果',
    default: '台灣第一香蕉AI量測站 | TopBana AI 智能分析蔬果'
  },
  description: "台灣首創專業香蕉與黃瓜AI測量平台，精準評估長度、粗細、曲率與新鮮度。3秒快速分析，隱私安全有保障，免費體驗台灣最值得信賴的蔬果評測服務。",
  keywords: "台灣香蕉測量, AI蔬果分析, 黃瓜評測, 香蕉曲率, 香蕉AI量測工具, 智能香蕉長度測量, 香蕉粗細AI分析, 台灣蔬果量測專家, 線上香蕉品質評估, 黃瓜尺寸AI檢測, 蔬果數位量測系統, 免費香蕉測量工具, 農產品AI評分, 香蕉品質數據分析, 人工智慧香蕉檢測, 即時蔬果量測APP, 專業香蕉曲率計算, 台灣農產品數位分級, 黃瓜新鮮度AI評估, 香蕉成熟度檢測, 台灣第一, 蔬果品質AI辨識, TopBana AI",
  authors: [{ name: "TopBana AI實驗室", url: baseUrl }],
  creator: "TopBana AI團隊 - 台灣第一蔬果AI研究中心",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '台灣第一香蕉AI量測站',
  },
  applicationName: "TopBana AI",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: baseUrl,
    siteName: "台灣第一香蕉AI量測站",
    title: "台灣第一香蕉AI量測站 | 精準測量蔬果大小和品質",
    description: "專業香蕉與黃瓜AI量測平台，3秒內精準評估長度、粗細與新鮮度。台灣首創，隱私安全，立即免費體驗！",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "台灣第一香蕉AI量測站 - 精準評測蔬果",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "台灣第一香蕉AI量測站 | 精準分析香蕉與黃瓜",
    description: "台灣首創蔬果AI量測服務，精準評估長度、粗細與品質，上傳照片3秒立即分析，隱私安全有保障！",
    images: ["/og-image.png"],
    site: "@topbana_ai",
    creator: "@topbana_ai",
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'zh-TW': `${baseUrl}`,
      'en-US': `${baseUrl}/en`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || "verification_token",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "verification_token",
  },
  category: "蔬果分析工具",
  manifest: `${baseUrl}/manifest.json`,
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${jakarta.variable} scroll-smooth`}>
      <body className={`${inter.className} font-sans antialiased min-h-screen safe-padding`}>
        <div className="bg-noise bg-fixed bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-50/30 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
