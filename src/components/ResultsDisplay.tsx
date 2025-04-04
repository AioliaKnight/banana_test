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

export interface AnalysisResult {
  type: 'cucumber' | 'banana' | 'other_rod';
  length: number;
  thickness: number;
  freshness: number;
  score: number;
  comment: string;
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
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'twitter' | 'line' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 確保只在客戶端使用
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const shareTitle = `這根${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}獲得了 ${result.score.toFixed(1)}/10 的評分！`;
  const shareDescription = `長度: ${result.length}cm, 粗細: ${result.thickness}cm, 新鮮度: ${result.freshness}/10\n${result.comment}`;
  const hashtag = "#AI蔬果分析";

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
    if (!ogImage && shareImageUrl) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    
    if (ogImage && shareImageUrl) {
      ogImage.setAttribute('content', shareImageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareImageUrl, isClient]);

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
      
  const generateShareImage = async () => {
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
      
      // 繪製長度參數
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('長度', contentX, paramsY);
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`${result.length}`, contentX, paramsY + 40);
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
  };

  // 處理分享動作
  const handleShare = (platform: 'facebook' | 'twitter' | 'line') => {
    setSelectedPlatform(platform);
    
    if (!shareImageUrl) {
      setIsGeneratingImage(true);
      generateShareImage().then(url => {
        if (url) {
          setShareImageUrl(url);
        }
        setShowImagePreview(true);
        setIsGeneratingImage(false);
      });
    } else {
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
  
  // 確認分享到社交媒體
  const confirmShare = () => {
    if (!shareImageUrl || !selectedPlatform) return;
    
    let shareUrl = '';
    
    switch (selectedPlatform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareTitle)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle + '\n' + shareDescription)}&url=${encodeURIComponent(window.location.href)}&hashtags=${encodeURIComponent(hashtag.replace('#', ''))}`;
        break;
      case 'line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareTitle + '\n' + shareDescription)}`;
        break;
    }
    
    // 開啟分享視窗
    window.open(shareUrl, '_blank', 'width=600,height=600');
    setShowImagePreview(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 圖片預覽彈窗 */}
      {showImagePreview && shareImageUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4 sm:mb-5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                {selectedPlatform ? `分享到${selectedPlatform === 'facebook' ? 'Facebook' : selectedPlatform === 'twitter' ? 'Twitter' : 'Line'}` : '分享圖片預覽'}
              </h3>
              <button 
                onClick={() => setShowImagePreview(false)}
                className="text-slate-400 hover:text-slate-600 h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto flex-1 mb-4 sm:mb-5">
              <div className="relative rounded-lg overflow-hidden border border-slate-100 shadow-sm">
                <Image 
                  src={shareImageUrl} 
                  alt="分享預覽" 
                  className="w-full h-auto object-contain" 
                  width={800}
                  height={420}
                  style={{width: '100%', height: 'auto'}}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              <button 
                className="btn btn-outline flex items-center gap-2 text-sm py-2.5 px-4"
                onClick={() => setShowImagePreview(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-outline flex items-center gap-2 text-sm py-2.5 px-4"
                onClick={handleDownload}
              >
                <FaDownload className="h-4 w-4" />
                下載圖片
              </button>
              {selectedPlatform && (
                <button 
                  className="btn btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
                  onClick={confirmShare}
                >
                  <FaShareAlt className="h-4 w-4" />
                  {`分享到${selectedPlatform === 'facebook' ? 'Facebook' : selectedPlatform === 'twitter' ? 'Twitter' : 'Line'}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* 左側結果圖片 */}
        <div className="w-full md:w-2/5 lg:w-1/3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl overflow-hidden shadow-lg aspect-square relative"
          >
            <Image 
              src={preview} 
              alt={`${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}分析圖`}
              className="w-full h-full object-cover"
              width={400}
              height={400}
              style={{width: '100%', height: '100%'}}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}
                </span>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  result.score >= 8 ? 'bg-green-500' : 
                  result.score >= 6 ? 'bg-blue-500' : 'bg-amber-500'
                }`}>
                  {result.score.toFixed(1)} / 10
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 bg-slate-50 rounded-xl p-4 shadow-sm border border-slate-100"
          >
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <FaShareAlt className="text-slate-400" />
              分享結果
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleDownload}
                disabled={isGeneratingImage}
                className="btn btn-outline text-slate-600 border-slate-200 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 py-2 px-1"
              >
                <FaDownload className="text-lg" />
                <span className="text-xs">下載</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="btn btn-outline text-blue-600 border-blue-100 hover:bg-blue-50 flex flex-col items-center justify-center gap-1 py-2 px-1"
              >
                <FaFacebook className="text-lg" />
                <span className="text-xs">FB</span>
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="btn btn-outline text-blue-400 border-blue-100 hover:bg-blue-50 flex flex-col items-center justify-center gap-1 py-2 px-1"
              >
                <FaTwitter className="text-lg" />
                <span className="text-xs">Twitter</span>
              </button>
              <button
                onClick={() => handleShare('line')}
                className="btn btn-outline text-green-600 border-green-100 hover:bg-green-50 flex flex-col items-center justify-center gap-1 py-2 px-1"
              >
                <FaLine className="text-lg" />
                <span className="text-xs">Line</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* 右側分析結果 */}
        <div className="w-full md:w-3/5 lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 mb-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pl-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                  {result.type === 'cucumber' 
                    ? '小黃瓜分析結果' 
                    : result.type === 'banana' 
                      ? '香蕉分析結果'
                      : '條狀物分析結果'}
                </h2>
                {result.type === 'other_rod' && (
                  <p className="text-sm text-slate-500 mt-1">
                    (非標準分析對象，僅供參考)
                  </p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-outline flex items-center gap-2 text-sm py-2 px-4 self-start"
                onClick={onReset}
              >
                <FaRedo className="h-3 w-3" />
                重新分析
              </motion.button>
            </div>

            {result.type === 'other_rod' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg text-blue-700 text-sm"
              >
                <p className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    上傳的不是小黃瓜或香蕉，但我們仍可分析這個條狀/棒狀物體的基本參數。
                    如需更準確的評估，請上傳小黃瓜或香蕉照片。
                  </span>
                </p>
              </motion.div>
            )}
            
            {/* 評分區塊 - 重新設計 */}
            <div className="mb-8 pl-3">
              <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.8 5.2C13.2 4.5 12.6 3.8 12 3.8C11.3 3.8 10.7 4.4 10.2 5.2L3 16C2.3 17 2.9 18.5 4 18.5H20C21.1 18.5 21.7 17 21 16L13.8 5.2Z" fill={result.score >= 8 ? '#10b981' : result.score >= 6 ? '#3b82f6' : '#f59e0b'} />
                </svg>
                {result.type === 'other_rod' ? '參考評分' : '總評分'}
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`relative bg-gradient-to-br ${
                  result.type === 'other_rod' 
                    ? 'from-slate-500 to-slate-600' 
                    : result.score >= 8 
                      ? 'from-green-500 to-green-600' 
                      : result.score >= 6 
                        ? 'from-blue-500 to-blue-600'
                        : 'from-amber-500 to-amber-600'
                } text-white text-4xl font-bold w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg`}>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse" style={{animationDuration: '3s'}}></div>
                  {result.score.toFixed(1)}
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.score / 10) * 100}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className={`h-full ${
                        result.type === 'other_rod' 
                          ? 'bg-slate-500' 
                          : result.score >= 8 
                            ? 'bg-gradient-to-r from-green-500 to-green-400' 
                            : result.score >= 6 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                              : 'bg-gradient-to-r from-amber-500 to-amber-400'
                      }`}
                    />
                  </div>
                  
                  <div className="mt-3 relative h-7">
                    {[0, 2, 4, 6, 8, 10].map((mark) => (
                      <div 
                        key={mark} 
                        className="absolute transform -translate-x-1/2"
                        style={{ left: `${(mark / 10) * 100}%` }}
                      >
                        <div className={`mx-auto w-0.5 h-1.5 ${result.score >= mark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                        <div className={`text-xs mt-1 ${result.score >= mark ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                          {mark}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 參數指標 - 重新設計 */}
            <div className="grid grid-cols-3 gap-4 mb-8 pl-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaRuler className="text-blue-500" />
                  <span className="text-xs font-medium text-blue-700">長度</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-800 text-2xl">{result.length}</span>
                  <span className="text-xs text-slate-600 ml-1">厘米</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaCircle className="text-purple-500" />
                  <span className="text-xs font-medium text-purple-700">粗細</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-800 text-2xl">{result.thickness}</span>
                  <span className="text-xs text-slate-600 ml-1">厘米</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaStar className="text-green-500" />
                  <span className="text-xs font-medium text-green-700">
                    {result.type === 'other_rod' ? '形狀評分' : '新鮮度'}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-bold text-slate-800 text-2xl">{result.freshness}</span>
                  <span className="text-xs text-slate-600 ml-1">/ 10</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 評語區塊 - 重新設計 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 mb-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-500 to-amber-600"></div>
            
            <div className="flex items-start gap-3 mb-4 pl-3">
              <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
                <FaRegLightbulb className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">AI專業評語</h3>
                <p className="text-xs text-slate-500">基於數據分析對您的{result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}進行評估</p>
              </div>
            </div>
            
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/70 pl-3">
              <div className="max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {result.comment}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm"
          >
            <p className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              保護隱私：您的圖片僅用於即時分析，分析完成後不會保存在伺服器上
            </p>
          </motion.div>
        </div>
      </div>

      {/* 用於生成圖片的隱藏Canvas */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width="1200"
        height="630"
      />
    </div>
  );
} 