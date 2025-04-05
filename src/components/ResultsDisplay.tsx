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

  // 使用useMemo緩存分享信息
  const shareInfo = useMemo(() => {
    const title = `這根${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}獲得了 ${result.score.toFixed(1)}/10 的評分！`;
    const description = `長度: ${result.length}cm, 粗細: ${result.thickness}cm, 新鮮度: ${result.freshness}/10\n${result.comment}`;
    const hashtag = "#AI蔬果分析";
    
    return { title, description, hashtag };
  }, [result.type, result.score, result.length, result.thickness, result.freshness, result.comment]);
  
  // 決定顯示的長度（考慮測謊儀調整）
  const getDisplayLength = useCallback(() => {
    // 如果有真實度分析且被判定為可疑，顯示調整後的長度
    if (result.truthAnalysis?.isSuspicious) {
      return result.truthAnalysis.adjustedLength;
    }
    // 否則顯示原始長度
    return result.length;
  }, [result.length, result.truthAnalysis?.isSuspicious, result.truthAnalysis?.adjustedLength]);

  const wrapTextChinese = useCallback((
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
  }, []);
    
  const generateShareImage = useCallback(async () => {
    if (!isClient || !canvasRef.current) return null;
    
    setIsGeneratingImage(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('無法獲取畫布上下文');
      
      const canvasWidth = 1200;
      const canvasHeight = 630;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // 繪製漸變背景
      const grd = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grd.addColorStop(0, '#f8f9ff');
      grd.addColorStop(1, '#f0f4ff');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 繪製邊框和陰影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 20, canvasWidth - 40, canvasHeight - 40);
      ctx.shadowColor = 'transparent';

      // 左側圖片區域 - 使用用戶上傳的圖片或預設圖片
      try {
        // 判斷內容是否可能敏感
        const isSensitiveContent = (): boolean => {
          // 如果不是other_rod類型，則不是敏感內容
          if (result.type !== 'other_rod') {
            return false;
          }
          
          // 檢查評語中是否包含可能暗示敏感內容的關鍵詞
          const sensitiveKeywords = [
            '男性特徵', '私密', '敏感', '性', '親愛的', '姐妹', 
            '尺寸適中', '尺寸還不錯', '遐想', '有趣的棒狀物', '棒狀物體'
          ];
          
          // 評語中包含敏感詞，或評分特別高（超過8.5分）且為other_rod類型
          const hasSensitiveWords = sensitiveKeywords.some(keyword => 
            result.comment.toLowerCase().includes(keyword.toLowerCase())
          );
          
          // 如果是other_rod並且評分很高或包含敏感詞，則視為敏感內容
          return hasSensitiveWords || (result.type === 'other_rod' && result.score > 8.5);
        };
        
        // 決定使用哪個圖片來源
        // 1. 如果是一般水果(小黃瓜或香蕉)，則使用用戶原始圖片
        // 2. 如果是other_rod但非敏感內容，也使用用戶原始圖片
        // 3. 如果是敏感內容，則使用替代圖片
        const imageSrc = !isSensitiveContent()
          ? preview  // 使用用戶上傳的圖片
          : '/result.jpg';  // 敏感內容使用替代圖片
        
        const userImage = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = imageSrc;
          // 加入超時處理，防止圖片加載永久阻塞
          setTimeout(() => reject(new Error('圖片加載超時')), 5000);
        });
        
        // 圖片區域
        const imageSize = canvasHeight - 100;
        const imageX = 50;
        const imageY = (canvasHeight - imageSize) / 2;
        
        // 繪製圖片
        // 繪製陰影區域
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(imageX, imageY, imageSize, imageSize, 10);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        // 繪製圖片
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imageX, imageY, imageSize, imageSize, 10);
        ctx.clip();
        ctx.drawImage(userImage, imageX, imageY, imageSize, imageSize);
        ctx.restore();
        
        // 繪製圖片邊框
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(imageX, imageY, imageSize, imageSize, 10);
        ctx.stroke();
        
        // 左下角添加水果類型標籤
        const typeLabel = result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體';
        const typeBgColor = result.type === 'cucumber' ? '#22c55e' : result.type === 'banana' ? '#eab308' : '#64748b';
        
        ctx.fillStyle = typeBgColor;
        ctx.beginPath();
        ctx.roundRect(imageX + 10, imageY + imageSize - 40, 80, 30, 15);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(typeLabel, imageX + 50, imageY + imageSize - 20);
      } catch (error) {
        console.error('無法加載圖片:', error);
      }

      // 右側內容區域
      const contentX = 50 + (canvasHeight - 100) + 40; // 圖片右側邊界 + 間距
      const contentWidth = canvasWidth - contentX - 50; // 右側可用寬度
      const titleY = 80;

      // 繪製標題
      ctx.textAlign = 'start';
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 36px sans-serif';
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
      
      // 繪製長度參數 - 使用調整後的長度（如果有真實度分析）
      const displayLengthValue = getDisplayLength();
        
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('長度', contentX, paramsY);
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`${displayLengthValue}`, contentX, paramsY + 40);
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
      ctx.fillText('AI蔬果分析器 - aifruit.example.com', canvasWidth / 2, canvasHeight - 30);

      // 生成圖片URL
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;
    } catch (error) {
      console.error('Error generating share image:', error);
      return '/result_error.jpg'; // 假設有一個錯誤提示圖片
    } finally {
      setIsGeneratingImage(false);
    }
  }, [isClient, preview, result, wrapTextChinese, getDisplayLength]);

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
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}_分析結果.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result.type]);

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