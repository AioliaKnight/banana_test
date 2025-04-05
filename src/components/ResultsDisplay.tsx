import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
  FaShareAlt,
  FaTimes
} from 'react-icons/fa';
import Image from 'next/image';
import TruthfulnessIndicator from './utils/TruthfulnessIndicator';
import StatCard from './utils/StatCard';
import { AnalysisResult } from '@/types'; // Import shared type
import CanvasImageGenerator from './utils/CanvasImageGenerator';

// Comment out the local definition
/* export interface AnalysisResult {
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
  // 新增分享图片路径
  shareImagePath?: string;
} */

export interface ResultsDisplayProps {
  // Use the imported type
  result: AnalysisResult;
  preview: string;
  onReset: () => void;
}

/**
 * Wraps Chinese text onto multiple lines within a canvas context.
 * @param ctx CanvasRenderingContext2D
 * @param text Text to wrap
 * @param x Starting X coordinate
 * @param y Starting Y coordinate
 * @param maxWidth Maximum line width
 * @param lineHeight Line height
 * @returns Array of lines with text and coordinates.
 */
const wrapTextChinese = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): { text: string; x: number; y: number }[] => {
  const chars = text.split('');
  let line = '';
  const lineArray = [];
  let currentY = y;

  for(let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && line.length > 0) {
      lineArray.push({text: line, x, y: currentY });
      line = chars[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.length > 0) {
    lineArray.push({text: line, x, y: currentY });
  }
  return lineArray;
};

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

  // 使用useMemo緩存分享信息
  const shareInfo = useMemo(() => {
    // Add default values to handle potential undefined result properties
    const typeLabel = result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體';
    const scoreValue = result.score ?? 0;
    const lengthValue = result.length ?? 0;
    const thicknessValue = result.thickness ?? 0;
    const freshnessValue = result.freshness ?? 0;
    const commentValue = result.comment || '暫無評語';

    const title = `這根${typeLabel}獲得了 ${scoreValue.toFixed(1)}/10 的評分！`;
    const description = `長度: ${lengthValue}cm, 粗細: ${thicknessValue}cm, 新鮮度: ${freshnessValue}/10\n${commentValue}`;
    const hashtag = "#AI蔬果分析";
    
    return { title, description, hashtag };
  }, [result.type, result.score, result.length, result.thickness, result.freshness, result.comment]);
  
  // 決定顯示的長度（考慮測謊儀調整）
  const getDisplayLength = useCallback(() => {
    // Add checks for result and truthAnalysis existence
    if (result?.truthAnalysis?.isSuspicious && result.truthAnalysis.adjustedLength !== undefined) {
      return result.truthAnalysis.adjustedLength;
    }
    // Return default length if truthAnalysis is not applicable or adjustedLength is missing
    return result?.length ?? 0;
  }, [result?.length, result?.truthAnalysis?.isSuspicious, result?.truthAnalysis?.adjustedLength]);

  const generateShareImage = useCallback(async () => {
    // 檢查必要的依賴
    if (!isClient || !canvasRef.current || !result) return null;
    
    setIsGeneratingImage(true);
    
    // 設置超時計時器，確保即使圖片加載失敗也能退出生成狀態
    const timeoutId = setTimeout(() => {
      console.warn('圖片生成超時，強制退出生成狀態');
      setIsGeneratingImage(false);
    }, 8000); // 8秒後強制超時
    
    try {
      // 獲取 Canvas 並設置尺寸
      const canvas = canvasRef.current;
      const canvasWidth = 1200;
      const canvasHeight = 630;
      
      // 初始化 CanvasImageGenerator 實例
      const generator = new CanvasImageGenerator({
        canvas,
        width: canvasWidth,
        height: canvasHeight,
        isMobile: window.innerWidth < 768,
        devicePixelRatio: window.devicePixelRatio || 1,
        debug: false
      });
      
      // === 背景與主結構 ===
      
      // 繪製漸變背景
      generator.drawGradientBackground('#eef2ff', '#f3f4f6', '#eff6ff');
      
      // 添加輕微紋理增加視覺深度
      generator.drawTexture(0.03);
      
      // 繪製主內容白色卡片（內邊距20px）
      generator.drawShadowRoundedRect(
        20, 20, canvasWidth - 40, canvasHeight - 40, 
        15, '#ffffff', 'rgba(0, 0, 0, 0.1)', 20
      );
      
      // === 圖片處理邏輯 ===
      try {
        // 圖片來源優先順序邏輯
        let imageSrc = '';
        
        // 檢查各種URL類型的函數
        const isBlobUrl = (url: string) => url && typeof url === 'string' && url.startsWith('blob:');
        const isDataUrl = (url: string) => url && typeof url === 'string' && url.startsWith('data:');
        const isRelativePath = (url: string) => url && typeof url === 'string' && url.startsWith('/');
        const isValidUrl = (url: string) => {
          if (!url || typeof url !== 'string') return false;
          try {
            new URL(url, window.location.origin);
            return true;
          } catch (_) {
            return false;
          }
        };
        
        // 檢查是否為男性特徵
        const isMaleFeature = result.isMaleFeature === true || 
                             (result.type === 'other_rod' && result.truthAnalysis?.isSuspicious === true);
        
        // 選擇最適合的圖片源
        if (isMaleFeature) {
          // 男性特徵使用預設圖片
          imageSrc = '/result.jpg';
        } else {
          // 非男性特徵按照原邏輯選擇圖片源
          // 1. 使用相對路徑的shareImagePath
          if (result.shareImagePath && isRelativePath(result.shareImagePath)) {
            imageSrc = result.shareImagePath;
          } 
          // 2. 使用非Blob的絕對URL
          else if (result.shareImagePath && isValidUrl(result.shareImagePath) && !isBlobUrl(result.shareImagePath)) {
            imageSrc = result.shareImagePath;
          }
          // 3. 使用Data URL (因為已經是圖片數據，不需要再加載)
          else if (result.shareImagePath && isDataUrl(result.shareImagePath)) {
            imageSrc = result.shareImagePath;
          }
          // 4. 使用preview (本地預覽)
          else if (preview) {
            imageSrc = preview;
          }
          // 5. 默認結果圖片
          else {
            imageSrc = '/result.jpg';
          }
        }
        
        // 圖片區域參數計算
        const imageAreaWidth = canvasHeight - 100;  // 圖片正方形區域寬度
        const imageX = 50;                          // 左邊距
        const imageY = (canvasHeight - imageAreaWidth) / 2;  // 垂直居中
        
        // 繪製圖片區域背景與陰影
        generator.drawShadowRoundedRect(
          imageX, imageY, imageAreaWidth, imageAreaWidth, 
          12, '#ffffff', 'rgba(0, 0, 0, 0.15)', 15, 0, 5
        );
        
        // 使用drawImage方法載入和繪製圖片（含錯誤處理）
        await generator.drawImage(
          imageSrc, 
          imageX, 
          imageY, 
          imageAreaWidth, 
          imageAreaWidth, 
          true,  // 保持圖片比例
          12     // 圓角裁剪半徑
        );
        
        // 物體類型標籤
        const typeLabel = result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體';
        const typeBgColor = result.type === 'cucumber' ? '#22c55e' : result.type === 'banana' ? '#eab308' : '#64748b';
        
        // 繪製物體類型標籤背景
        generator.drawRoundedRect(
          imageX + 10, 
          imageY + imageAreaWidth - 40, 
          90, 30, 15, 
          typeBgColor
        );
        
        // 繪製物體類型標籤文字
        generator.drawText(
          typeLabel, 
          imageX + 55, 
          imageY + imageAreaWidth - 20, 
          '#ffffff', 
          'bold 16px sans-serif', 
          'center'
        );
        
        // 如果有測謊儀結果，添加真實度標示
        if (result.truthAnalysis) {
          // 真實度標籤背景顏色
          const truthBgColor = result.truthAnalysis.isSuspicious 
            ? '#ef4444'  // 紅色警告
            : '#10b981'; // 綠色可信
          
          // 真實度標示
          generator.drawRoundedRect(
            imageX + imageAreaWidth - 100, 
            imageY + 10, 
            90, 30, 15, 
            truthBgColor
          );
          
          // 真實度文本
          generator.drawText(
            result.truthAnalysis.isSuspicious ? '可疑' : '真實', 
            imageX + imageAreaWidth - 55, 
            imageY + 30, 
            '#ffffff', 
            'bold 16px sans-serif', 
            'center'
          );
        }
        
      } catch (error) {
        console.error('圖片載入失敗:', error);
        
        // 圖片區域參數
        const imageAreaWidth = canvasHeight - 100;
        const imageX = 50;
        const imageY = (canvasHeight - imageAreaWidth) / 2;
        
        // 繪製錯誤佔位背景
        generator.drawRoundedRect(
          imageX, imageY, 
          imageAreaWidth, imageAreaWidth, 
          12, '#f1f5f9'
        );
        
        // 繪製錯誤圖標
        generator.drawRoundedRect(
          imageX + (imageAreaWidth/2) - 40, 
          imageY + (imageAreaWidth/2) - 40,
          80, 80, 40, 
          '#cbd5e1'
        );
        
        // 繪製錯誤消息
        generator.drawText(
          '圖片無法載入', 
          imageX + (imageAreaWidth/2), 
          imageY + imageAreaWidth - 60, 
          '#64748b', 
          '16px sans-serif', 
          'center'
        );
      }
      
      // === 內容區域 ===
      
      // 內容區域參數
      const contentX = 50 + (canvasHeight - 100) + 40; // 圖片右側邊界 + 間距
      const contentWidth = canvasWidth - contentX - 50; // 右側可用寬度
      const titleY = 80;
      
      // 繪製標題
      generator.drawTitle(
        'AI蔬果分析結果', 
        contentX, titleY,
        '#1e293b',
        window.innerWidth < 768 ? '32px' : '36px'
      );
      
      // 繪製裝飾線
      generator.drawGradientLine(
        contentX, titleY + 10, 
        80, 4,
        '#3b82f6', '#8b5cf6'
      );
      
      // === 分數區域 ===
      
      const scoreY = titleY + 60;
      
      // 根據分數確定顏色
      const scoreColor = result.score >= 8 
        ? '#10b981' // 綠色
        : result.score >= 6 
          ? '#3b82f6' // 藍色
          : '#f59e0b'; // 琥珀色
      
      // 繪製分數圓形背景
      generator.drawRoundedRect(
        contentX + 10, scoreY - 10, 
        80, 80, 40, 
        scoreColor
      );
      
      // 繪製分數文字
      generator.drawText(
        result.score.toFixed(1), 
        contentX + 50, scoreY + 33, 
        '#ffffff', 
        'bold 36px sans-serif', 
        'center'
      );
      
      // 繪製分數標籤
      generator.drawText(
        '總評分', 
        contentX + 110, scoreY + 10, 
        '#1e293b', 
        'bold 20px sans-serif'
      );
      
      // 繪製評分條背景
      generator.drawRoundedRect(
        contentX + 110, scoreY + 20, 
        contentWidth - 160, 20, 10, 
        '#e2e8f0'
      );
      
      // 繪製評分條填充
      generator.drawRoundedRect(
        contentX + 110, scoreY + 20, 
        (contentWidth - 160) * (result.score / 10), 20, 10, 
        scoreColor
      );
      
      // === 參數指標區域 ===
      
      const paramsY = scoreY + 90;
      const paramWidth = (contentWidth - 40) / 3;
      
      // 獲取顯示長度（考慮真實度調整）
      const displayLengthValue = getDisplayLength();
      
      // 長度參數
      generator.drawText('長度', contentX, paramsY, '#1e293b', 'bold 16px sans-serif');
      generator.drawText(
        `${displayLengthValue}`, 
        contentX, paramsY + 35, 
        '#1e293b', 
        'bold 32px sans-serif'
      );
      generator.drawText('厘米', contentX + 60, paramsY + 35, '#64748b', '16px sans-serif');
      
      // 粗細參數
      generator.drawText(
        '粗細', 
        contentX + paramWidth, paramsY, 
        '#1e293b', 
        'bold 16px sans-serif'
      );
      generator.drawText(
        `${result.thickness}`, 
        contentX + paramWidth, paramsY + 35, 
        '#1e293b', 
        'bold 32px sans-serif'
      );
      generator.drawText(
        '厘米', 
        contentX + paramWidth + 60, paramsY + 35, 
        '#64748b', 
        '16px sans-serif'
      );
      
      // 新鮮度參數
      generator.drawText(
        '新鮮度', 
        contentX + paramWidth * 2, paramsY, 
        '#1e293b', 
        'bold 16px sans-serif'
      );
      generator.drawText(
        `${result.freshness}`, 
        contentX + paramWidth * 2, paramsY + 35, 
        '#1e293b', 
        'bold 32px sans-serif'
      );
      generator.drawText(
        '/ 10', 
        contentX + paramWidth * 2 + 35, paramsY + 35, 
        '#64748b', 
        '16px sans-serif'
      );
      
      // === 評語區域 ===
      
      const commentY = paramsY + 80;
      const commentBoxHeight = 250; // 足夠的評語區域高度
      
      // 繪製評語背景
      generator.drawShadowRoundedRect(
        contentX, commentY, 
        contentWidth, commentBoxHeight, 
        10, '#f8fafc', 'rgba(0,0,0,0.04)', 10, 0, 3,
        '#e2e8f0'
      );
      
      // 評語標題背景
      generator.drawRoundedRect(
        contentX, commentY, 
        contentWidth, 40, 
        10, // 使用一個數字作為圓角半徑
        '#f1f5f9'
      );
      
      // 評語標題
      generator.drawText(
        '專業評語', 
        contentX + 20, commentY + 25, 
        '#334155', 
        'bold 20px sans-serif'
      );
      
      // 處理評語文本
      const commentText = result.comment || '暫無評語';
      const lineHeight = 24;
      const maxWidth = contentWidth - 40;
      
      // 使用現有的自定義函數包裝文本
      const commentLines = wrapTextChinese(
        generator.ctx, 
        commentText, 
        contentX + 20, 
        commentY + 60, 
        maxWidth, 
        lineHeight
      );
      
      // 繪製評語文本
      commentLines.forEach(line => {
        generator.drawText(
          line.text, 
          line.x, 
          line.y, 
          '#475569', 
          '16px sans-serif'
        );
      });
      
      // === 水印和品牌信息 ===
      
      // 繪製網站信息
      generator.drawText(
        'AI蔬果分析器 - aifruit.example.com', 
        canvasWidth / 2, 
        canvasHeight - 25, 
        '#64748b', 
        '16px sans-serif', 
        'center'
      );
      
      // 添加分析時間
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      generator.drawText(
        `分析日期: ${dateStr}`, 
        contentX, 
        canvasHeight - 25, 
        '#94a3b8', 
        '12px sans-serif'
      );
      
      // === 生成最終圖片 ===
      
      // 生成圖片 URL
      const dataUrl = await generator.generateImageUrl('image/png', 0.9);
      
      // 清除超時計時器
      clearTimeout(timeoutId);
      
      setIsGeneratingImage(false);
      return dataUrl;
      
    } catch (error) {
      console.error('無法生成分享圖片:', error);
      
      // 清除超時計時器
      clearTimeout(timeoutId);
      
      setIsGeneratingImage(false);
      return null;
    }
  }, [isClient, preview, result, getDisplayLength]);

  // 設定Open Graph元標籤（如果還未存在）
  useEffect(() => {
    if (!isClient || !shareImageUrl) return;
    
    // 動態更新meta標籤
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    
    ogImage.setAttribute('content', shareImageUrl);
  }, [shareImageUrl, isClient]);

  // 初始生成分享圖片
  useEffect(() => {
    if (!isClient || shareImageUrl) return;
    
    // 使用requestIdleCallback來生成圖片，避免阻塞UI
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        generateShareImage().then(url => {
          if (url) {
            setShareImageUrl(url);
          }
        });
      });
    } else {
      // 如果瀏覽器不支援requestIdleCallback，使用setTimeout
      setTimeout(() => {
        generateShareImage().then(url => {
          if (url) {
            setShareImageUrl(url);
          }
        });
      }, 200);
    }
  }, [isClient, generateShareImage, shareImageUrl]);

  const downloadImage = useCallback((url: string) => {
    if (!result?.type) return; // Ensure result type exists
    const typeLabel = result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體';
    const link = document.createElement('a');
    link.href = url;
    link.download = `${typeLabel}_分析結果.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result?.type]); // Only depend on result.type since that's all we use

  const openShareWindow = useCallback((platform: 'facebook' | 'twitter' | 'line') => {
    let shareUrl = '';
    const currentUrl = window.location.href;
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareInfo.title)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareInfo.title + '\n' + shareInfo.description)}&url=${encodeURIComponent(currentUrl)}&hashtags=${encodeURIComponent(shareInfo.hashtag.replace('#', ''))}`;
        break;
      case 'line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareInfo.title + '\n' + shareInfo.description)}`;
        break;
    }
    
    // 開啟分享視窗
    window.open(shareUrl, '_blank', 'width=600,height=600');
  }, [shareInfo]);

  const handleShare = useCallback((platform: 'facebook' | 'twitter' | 'line') => {
    if (!shareImageUrl) {
      setIsGeneratingImage(true);
      generateShareImage().then(url => {
        if (url) {
          setShareImageUrl(url);
          // 等待圖片生成後再分享
          openShareWindow(platform);
        }
        setIsGeneratingImage(false);
      });
    } else {
      openShareWindow(platform);
    }
  }, [generateShareImage, shareImageUrl, openShareWindow]);

  const handleDownload = useCallback(() => {
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
  }, [generateShareImage, shareImageUrl, downloadImage]);

  // 關閉分享選項當點擊外部區域
  useEffect(() => {
    const handleClickOutside = (/* event: MouseEvent */) => {
      if (showShareOptions) {
        setShowShareOptions(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showShareOptions]);

  // Add check for result before rendering
  if (!result) {
    // Optionally render a loading state or null
    return null; 
  }

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
            value={`${getDisplayLength()} cm`} // Already handles undefined
            icon={<FaRuler className="h-4 w-4 sm:h-5 sm:w-5" />}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
            className="hover:bg-blue-100 transition-colors duration-200"
          />
          <StatCard
            title="粗細"
            value={`${result.thickness ?? 0} cm`} // Add default value
            icon={<FaCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
            bgColor="bg-purple-50"
            iconColor="text-purple-600"
            className="hover:bg-purple-100 transition-colors duration-200"
          />
          <StatCard
            title="新鮮度"
            value={`${result.freshness ?? 0}/10`} // Add default value
            icon={<FaRegLightbulb className="h-4 w-4 sm:h-5 sm:w-5" />}
            bgColor="bg-green-50"
            iconColor="text-green-600"
            className="hover:bg-green-100 transition-colors duration-200"
          />
          <StatCard
            title="總評分"
            value={`${(result.score ?? 0).toFixed(1)}/10`} // Add default value and fix toFixed call
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
            // Ensure type is one of the expected values or default
            objectType={result.type ?? 'other_rod'} 
            originalLength={result.length ?? 0}
          />
        )}

        <div className="bg-slate-50 p-4 sm:p-5 rounded-lg mb-8 shadow-sm border border-slate-100">
          <div className="text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
            <p>{result.comment || '暫無評語'}</p> {/* Add default value */}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareOptions(!showShareOptions);
                  }}
                  className="btn btn-outline flex items-center gap-2 py-2 px-5 text-sm hover:bg-blue-50 transition-colors duration-200"
                >
                  <FaShareAlt className="h-4 w-4" />
                  分享結果
                </button>
                
                <AnimatePresence>
                  {showShareOptions && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleShare('facebook')} 
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
                        >
                          <FaFacebook className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleShare('twitter')} 
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-sky-500 text-white hover:bg-sky-600"
                        >
                          <FaTwitter className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleShare('line')} 
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
                        >
                          <FaLine className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showImagePreview && shareImageUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" 
            onClick={() => setShowImagePreview(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md w-full" 
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full aspect-[3/2]">
                <Image 
                  src={shareImageUrl} 
                  alt="分享圖片" 
                  className="rounded-lg shadow-2xl"
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <button 
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/20"
                onClick={() => setShowImagePreview(false)}
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 