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
  title: "AI 蔬果分析器 | 專業評測小黃瓜與香蕉",
  description: "上傳小黃瓜或香蕉照片，獲得AI專業評測與評分。保護隱私，無需註冊，立即分析。",
  keywords: "蔬果分析, AI分析, 小黃瓜分析, 香蕉分析, 蔬果評分, 人工智慧, 長度評測, 粗細評測",
  authors: [{ name: "AI蔬果實驗室" }],
  creator: "AI蔬果實驗室",
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
    title: 'AI蔬果分析器',
  },
  openGraph: {
    type: "website",
    title: "AI 蔬果分析器 | 專業評測小黃瓜與香蕉",
    description: "上傳小黃瓜或香蕉照片，獲得AI專業評測與評分。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI 蔬果分析器",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 蔬果分析器 | 專業評測小黃瓜與香蕉",
    description: "上傳小黃瓜或香蕉照片，獲得AI專業評測與評分。",
    images: ["/og-image.png"],
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
