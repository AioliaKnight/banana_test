import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: "台灣第一香蕉AI量測站 | TopBana AI 智能分析蔬果",
  description: "台灣首創專業香蕉與黃瓜AI測量平台，精準評估長度、粗細、曲率與新鮮度。3秒快速分析，隱私安全有保障，免費體驗台灣最值得信賴的蔬果評測服務。",
  keywords: "台灣香蕉測量, AI蔬果分析, 黃瓜評測, 香蕉曲率, 蔬果品質, 人工智慧分析, 精準尺寸測量, 農產品評分, 新鮮度檢測, 台灣第一, 長度測量, 粗細評估, BanaCumber AI",
  authors: [{ name: "TopBana AI實驗室" }],
  creator: "TopBana AI團隊 - 台灣第一蔬果AI研究中心",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '台灣第一香蕉AI量測站',
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://topbana.ai",
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
    canonical: "https://topbana.ai",
    languages: {
      'zh-TW': "https://topbana.ai",
      'en-US': "https://topbana.ai/en",
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
    google: "verification_token",
    yandex: "verification_token",
  },
  category: "蔬果分析工具",
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
