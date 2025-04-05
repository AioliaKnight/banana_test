import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { 
  FaRuler, 
  FaCircle, 
  FaStar, 
  FaRedo,
  FaRegLightbulb,
  FaDownload,
  FaFacebook,
  FaTwitter,
  FaLine,
  FaShareAlt
} from 'react-icons/fa';
import Image from 'next/image';
import TruthfulnessIndicator from './utils/TruthfulnessIndicator';
import StatCard from './utils/StatCard';

export interface AnalysisResult {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
  comment: string;
  // 添加真實度分析結構
  truthAnalysis?: {
    truthScore: number;
    suspiciousFeatures: string[];
    adjustedLength: number;
    adjustmentFactor: number;
    funnyMessage: string;
    isSuspicious: boolean;
  };
}

export interface ResultsDisplayProps {
  result: AnalysisResult;
  preview: string;
  onReset: () => void;
}

export default function ResultsDisplay({ result, preview, onReset }: ResultsDisplayProps) {
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 確保只在客戶端使用
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 決定顯示的長度（考慮測謊儀調整）
  const getDisplayLength = () => {
    // 如果有真實度分析且被判定為可疑，顯示調整後的長度
    if (result.truthAnalysis?.isSuspicious) {
      return result.truthAnalysis.adjustedLength;
    }
    // 否則顯示原始長度
    return result.length;
  };
  
  // 更新分享標題和描述，使其更具吸引力
  const shareTitle = `我的${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}獲得了 ${result.score.toFixed(1)}/10 的專業評分！`;
  const shareDescription = `長度: ${getDisplayLength()}cm, 粗細: ${result.thickness}cm, 新鮮度: ${result.freshness}/10\n${result.comment.substring(0, 100)}${result.comment.length > 100 ? '...' : ''}`;
  const hashtag = "#AI蔬果分析 #尺寸測量";

  // 設定Open Graph元標籤（如果還未存在）
  useEffect(() => {
    if (!isClient) return;
    
    // 生成預設分享圖片
    if (!shareImageUrl) {
      // 直接調用實際的圖片生成函數
      generateShareImage().then(url => {
        if (url) {
          setShareImageUrl(url);
        }
      });
    }
    
    // 動態更新meta標籤
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    
    if (ogImage && shareImageUrl) {
      ogImage.setAttribute('content', shareImageUrl);
    }
    
    // 設置其他OG標籤
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', shareTitle);
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', shareDescription);
    
    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');
    
    // eslint-disable-next-line 
  }, [shareImageUrl, isClient, shareTitle, shareDescription]);

  // 優化的中文文字換行函數
  const wrapTextChinese = (
    ctx: CanvasRenderingContext2D, 
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    lineHeight: number
  ) => {
    // 為中文處理優化換行
    const chars = text.split('');
    let line = '';
    const lineArray = [];
    
    for(let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && line.length > 0) {
        lineArray.push({text: line, x, y});
        line = chars[i];
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    
    lineArray.push({text: line, x, y});
    return lineArray;
  };
      
  const generateShareImage = async (): Promise<string | null> => {
    if (!canvasRef.current) {
      console.error("Canvas reference is null");
      return null;
    }

    try {
      setIsGeneratingImage(true);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error("Canvas context is null");
        return null;
      }
      
      // 設置畫布尺寸
      const canvasWidth = 1200;
      const canvasHeight = 630; // 優化社交媒體分享的尺寸比例
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // 繪製背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#f8fafc');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // 添加藍色頂部裝飾
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, canvasWidth, 8);
      
      // 添加裝飾半圓形元素
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.beginPath();
      ctx.arc(canvasWidth - 100, 100, 200, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.beginPath();
      ctx.arc(150, canvasHeight - 100, 250, 0, Math.PI * 2);
      ctx.fill();
      
      // 設置內容區域
      const contentX = 100;
      const titleY = 80;
      const contentWidth = canvasWidth - 200;
      
      // 繪製標題
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'start';
      ctx.fillText('AI蔬果分析結果', contentX, titleY);
      
      // 繪製裝飾線
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(contentX, titleY + 10, 60, 4);
      
      // 分數區域
      const scoreY = titleY + 60;
      const scoreColor = result.score >= 8 
        ? '#10b981' // 綠色
        : result.score >= 6 
          ? '#3b82f6' // 藍色
          : '#f59e0b'; // 琥珀色
      
      // 繪製分數背景
      ctx.fillStyle = scoreColor;
      ctx.beginPath();
      ctx.arc(contentX + 50, scoreY + 20, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // 繪製分數文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(result.score.toFixed(1), contentX + 50, scoreY + 30);
      
      // 繪製分數標籤
      ctx.textAlign = 'start';
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('總評分', contentX + 100, scoreY);
      
      // 繪製評分條
      const barY = scoreY + 10;
      const barWidth = contentWidth - 150;
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(contentX + 100, barY, barWidth, 20, 10);
      ctx.fill();
      
      ctx.fillStyle = scoreColor;
      ctx.beginPath();
      ctx.roundRect(contentX + 100, barY, barWidth * (result.score / 10), 20, 10);
      ctx.fill();
      
      // 參數指標區域
      const paramsY = scoreY + 80;
      const paramWidth = (contentWidth - 20) / 3;
      
      // 繪製長度參數
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('長度', contentX, paramsY);
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`${getDisplayLength()}`, contentX, paramsY + 40); // 使用可能調整後的長度
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('厘米', contentX + 50, paramsY + 40);
      
      // 繪製粗細參數
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('粗細', contentX + paramWidth, paramsY);
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`${result.thickness}`, contentX + paramWidth, paramsY + 40);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('厘米', contentX + paramWidth + 50, paramsY + 40);
      
      // 繪製新鮮度參數
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('新鮮度', contentX + paramWidth * 2, paramsY);
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`${result.freshness}`, contentX + paramWidth * 2, paramsY + 40);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('/ 10', contentX + paramWidth * 2 + 30, paramsY + 40);

      // 評語區域 - 增大區域確保文字完整顯示
      const commentY = paramsY + 80;
      const commentBoxHeight = 250; // 增加評語區域高度
      
      // 繪製評語背景
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(contentX, commentY, contentWidth, commentBoxHeight, 10);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 評語標題背景
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(contentX, commentY, contentWidth, 40, [10, 10, 0, 0]);
      ctx.fill();
      
      // 評語標題
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('專業評語', contentX + 20, commentY + 25);
      
      // 評語內容 - 使用較小字體並自動換行確保完整顯示
      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      
      // 使用完整評語而不截斷
      const commentText = result.comment;
      const lineHeight = 24;
      const maxWidth = contentWidth - 40;
      const commentLines = wrapTextChinese(
        ctx, 
        commentText, 
        contentX + 20, 
        commentY + 60, 
        maxWidth,
        lineHeight
      );
      
      // 繪製所有評語行
      commentLines.forEach(line => {
        ctx.fillText(line.text, line.x, line.y);
      });
      
      // 底部網站信息
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI蔬果分析器', canvasWidth / 2, canvasHeight - 40);
      ctx.font = '14px sans-serif';
      ctx.fillText('取得你的分析結果: aifruit.example.com', canvasWidth / 2, canvasHeight - 20);

      // 添加辨識標籤
      if (result.truthAnalysis?.isSuspicious) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'start';
        ctx.fillText('⚠️ 已修正: 照片真實度評分 ' + result.truthAnalysis.truthScore + '/100', contentX, commentY + commentBoxHeight + 20);
      }

      // 生成圖片URL
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;
    } catch (error) {
      console.error('Error generating share image:', error);
      return '/result_error.jpg'; // 假設有一個錯誤提示圖片
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 處理分享動作
  const handleShare = (platform: 'facebook' | 'twitter' | 'line' | 'whatsapp' | 'telegram' | 'copy') => {
    // 先確保有分享圖片
    if (!shareImageUrl) {
      setIsGeneratingImage(true);
      generateShareImage().then(url => {
        if (url) {
          setShareImageUrl(url);
          executeShare(platform, url);
        }
        setIsGeneratingImage(false);
      });
    } else {
      executeShare(platform, shareImageUrl);
    }
  };
  
  // 執行實際分享操作
  const executeShare = (platform: 'facebook' | 'twitter' | 'line' | 'whatsapp' | 'telegram' | 'copy', imageUrl: string) => {
    // 網頁URL
    const pageUrl = window.location.href;
    // 直接開啟分享視窗
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareTitle)}`;
        window.open(shareUrl, '_blank', 'width=600,height=600');
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(pageUrl)}&hashtags=${encodeURIComponent(hashtag.replace(/#/g, ''))}`;
        window.open(shareUrl, '_blank', 'width=600,height=600');
        break;
      case 'line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareTitle + '\n' + shareDescription)}`;
        window.open(shareUrl, '_blank', 'width=600,height=600');
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + '\n' + pageUrl)}`;
        window.open(shareUrl, '_blank', 'width=600,height=600');
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareTitle)}`;
        window.open(shareUrl, '_blank', 'width=600,height=600');
        break;
      case 'copy':
        // 複製分享鏈結到剪貼簿
        navigator.clipboard.writeText(`${shareTitle}\n${shareDescription}\n${pageUrl}`)
          .then(() => {
            // 顯示複製成功提示
            alert('分享內容已複製到剪貼簿！');
          })
          .catch(err => {
            console.error('複製失敗:', err);
            alert('複製失敗，請手動複製。');
          });
        break;
    }
    
    // 顯示圖片預覽（除了複製鏈結的情況）
    if (platform !== 'copy') {
      setShowImagePreview(true);
    }
  };
  
  // 處理下載圖片
  const handleDownload = () => {
    if (!shareImageUrl) {
      setIsGeneratingImage(true);
      generateShareImage().then(url => {
        if (url) {
          setShareImageUrl(url);
          downloadImage(url);
        }
        setIsGeneratingImage(false);
      });
    } else {
      downloadImage(shareImageUrl);
    }
  };
  
  // 下載圖片
  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}_分析結果.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <div className="mb-4 pb-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-bold text-slate-700">測量結果</h3>
        <button
          onClick={onReset}
          className="btn btn-outline flex items-center justify-center gap-2 py-1.5 px-4 text-sm"
        >
          <FaRedo className="h-3 w-3" />
          重新上傳
        </button>
      </div>

      <div className="mb-6">
        <div className="relative mb-6">
          <div className="flex justify-center">
            <div className="relative rounded-lg w-full h-64 sm:h-72 md:h-80 overflow-hidden border border-slate-200 shadow-sm">
              <Image 
                src={preview} 
                alt="上傳圖片" 
                className="rounded-lg object-contain"
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
          <StatCard
            title="長度"
            value={`${getDisplayLength()} cm`}
            icon={<FaRuler className="h-4 w-4 sm:h-5 sm:w-5" />}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            className="hover:bg-blue-100 transition-colors duration-200"
          />
          <StatCard
            title="粗細"
            value={`${result.thickness} cm`}
            icon={<FaCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
            className="hover:bg-purple-100 transition-colors duration-200"
          />
          <StatCard
            title="新鮮度"
            value={`${result.freshness}/10`}
            icon={<FaRegLightbulb className="h-4 w-4 sm:h-5 sm:w-5" />}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            className="hover:bg-green-100 transition-colors duration-200"
          />
          <StatCard
            title="總評分"
            value={`${result.score.toFixed(1)}/10`}
            icon={<FaStar className="h-4 w-4 sm:h-5 sm:w-5" />}
            bgColor="bg-amber-50"
            iconColor="text-amber-600"
            className="hover:bg-amber-100 transition-colors duration-200"
          />
        </div>
        
        {/* 在統計卡下方顯示真實度分析器 */}
        {result.truthAnalysis && (
          <TruthfulnessIndicator
            truthAnalysis={result.truthAnalysis}
            objectType={result.type}
            originalLength={result.length}
          />
        )}

        <div className="bg-slate-50 p-4 sm:p-5 rounded-lg mb-8 shadow-sm border border-slate-100">
          <div className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
            <p>{result.comment}</p>
          </div>
        </div>
        
        {/* 相機圖標和水印 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {isClient && (
            <>
              <button 
                onClick={handleDownload}
                className="btn btn-outline flex items-center gap-2 py-2 px-5 text-sm hover:bg-blue-50 transition-colors duration-200"
                disabled={isGeneratingImage}
              >
                <FaDownload className="h-4 w-4" />
                {isGeneratingImage ? '生成中...' : '儲存結果圖片'}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="btn btn-outline flex items-center gap-2 py-2 px-5 text-sm hover:bg-blue-50 transition-colors duration-200"
                >
                  <FaShareAlt className="h-4 w-4" />
                  分享結果
                </button>
                
                {showShareOptions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-10"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <p className="text-xs text-slate-500">選擇分享平台</p>
                      <button 
                        onClick={() => setShowShareOptions(false)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleShare('facebook')} 
                        className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                      >
                        <FaFacebook className="h-5 w-5" />
                        <span className="text-[10px] mt-1">Facebook</span>
                      </button>
                      <button 
                        onClick={() => handleShare('twitter')} 
                        className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                      >
                        <FaTwitter className="h-5 w-5" />
                        <span className="text-[10px] mt-1">Twitter</span>
                      </button>
                      <button 
                        onClick={() => handleShare('line')} 
                        className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <FaLine className="h-5 w-5" />
                        <span className="text-[10px] mt-1">Line</span>
                      </button>
                      <button 
                        onClick={() => handleShare('whatsapp')} 
                        className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5 fill-current">
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                        <span className="text-[10px] mt-1">WhatsApp</span>
                      </button>
                      <button 
                        onClick={() => handleShare('telegram')} 
                        className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-blue-400 text-white hover:bg-blue-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" className="h-5 w-5 fill-current">
                          <path d="M248,8C111.033,8,0,119.033,0,256S111.033,504,248,504,496,392.967,496,256,384.967,8,248,8ZM362.952,176.66c-3.732,39.215-19.881,134.378-28.1,178.3-3.476,18.584-10.322,24.816-16.948,25.425-14.4,1.326-25.338-9.517-39.287-18.661-21.827-14.308-34.158-23.215-55.346-37.177-24.485-16.135-8.612-25,5.342-39.5,3.652-3.793,67.107-61.51,68.335-66.746.153-.655.3-3.1-1.154-4.384s-3.59-.849-5.135-.5q-3.283.746-104.608,69.142-14.845,10.194-26.894,9.934c-8.855-.191-25.888-5.006-38.551-9.123-15.531-5.048-27.875-7.717-26.8-16.291q.84-6.7,18.45-13.7,108.446-47.248,144.628-62.3c68.872-28.647,83.183-33.623,92.511-33.789,2.052-.034,6.639.474,9.61,2.885a10.452,10.452,0,0,1,3.53,6.716A43.765,43.765,0,0,1,362.952,176.66Z"/>
                        </svg>
                        <span className="text-[10px] mt-1">Telegram</span>
                      </button>
                      <button 
                        onClick={() => handleShare('copy')} 
                        className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-slate-600 text-white hover:bg-slate-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                        <span className="text-[10px] mt-1">複製連結</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 改進分享圖片預覽的視覺效果 */}
      {showImagePreview && shareImageUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowImagePreview(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-lg w-full bg-white p-3 rounded-xl shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[3/2] bg-slate-50 rounded-lg overflow-hidden">
              <Image 
                src={shareImageUrl} 
                alt="分享圖片" 
                className="rounded-lg"
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="p-3 bg-white">
              <p className="text-slate-800 font-medium mb-1">分享預覽</p>
              <p className="text-slate-500 text-sm mb-3">這張圖片將會在分享時顯示</p>
              <div className="flex justify-between">
                <button 
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors"
                  onClick={() => setShowImagePreview(false)}
                >
                  關閉
                </button>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={handleDownload}
                >
                  儲存圖片
                </button>
              </div>
            </div>
            <button 
              className="absolute top-2 right-2 bg-white/10 backdrop-blur-sm text-slate-800 rounded-full p-1.5 hover:bg-white/20 transition-colors"
              onClick={() => setShowImagePreview(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
} 