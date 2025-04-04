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
  
  const shareTitle = `我的${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}獲得了 ${result.score.toFixed(1)}/10 的評分！`;
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

      // 繪製固定背景圖片
      const bgImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = '/result.jpg'; // 使用public目錄下的result.jpg
      });
      ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);

      // 添加半透明疊加層，使文字更清晰
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // 40%透明度的黑色
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // --- 在背景圖上重新設計文字佈局 ---

      // 添加標題 (白色，更顯眼)
      ctx.fillStyle = '#ffffff'; 
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center'; // 居中對齊
      ctx.fillText('AI蔬果分析結果', canvasWidth / 2, 100);

      // 添加漸變標題底線 (保持)
      const lineGradient = ctx.createLinearGradient(canvasWidth/2 - 150, 115, canvasWidth/2 + 150, 115);
      lineGradient.addColorStop(0, '#3b82f6');
      lineGradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = lineGradient;
      ctx.fillRect(canvasWidth / 2 - 150, 115, 300, 5);

      // 添加分數 (白色，更大更顯眼)
      const scoreColorValue = result.score >= 8 
        ? '#10b981' // 綠色
        : result.score >= 6 
          ? '#3b82f6' // 藍色
          : '#f59e0b'; // 琥珀色

      // 繪製分數背景 (使用明亮顏色)
      const scoreSize = 120; // 增大尺寸
      const scoreX = canvasWidth / 2;
      const scoreY = 220; 

      // 繪製光暈效果 (更明顯)
      const scoreGlow = ctx.createRadialGradient(
        scoreX, scoreY, scoreSize/3,
        scoreX, scoreY, scoreSize * 0.8
      );
      scoreGlow.addColorStop(0, scoreColorValue + '80'); // 50% 透明度
      scoreGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = scoreGlow;
      ctx.beginPath();
      ctx.arc(scoreX, scoreY, scoreSize * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // 繪製分數背景圓圈
      ctx.fillStyle = scoreColorValue;
      ctx.beginPath();
      ctx.arc(scoreX, scoreY, scoreSize/2, 0, Math.PI * 2);
      ctx.fill();
      
      // 添加陰影增加立體感
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;

      // 繪製分數文字 (白色，居中)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif'; // 增大字體
      ctx.textAlign = 'center';
      ctx.fillText(result.score.toFixed(1), scoreX, scoreY + 18);

      // 清除陰影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.textAlign = 'start'; // 恢復默認對齊

      // 添加分析數據 (白色，水平排列在下方)
      const statY = 350; // 調整Y軸位置
      const statWidth = (canvasWidth - 200) / 3; // 調整寬度分配
      const dataXStart = 100; // 起始X軸位置

      const drawStat = (label: string, value: string | number, unit: string, x: number, y: number) => {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif'; // 增大標籤字體
        ctx.fillText(label, x, y);
        ctx.font = 'bold 48px sans-serif'; // 增大數值字體
        // 測量數值寬度以精確放置單位
        const valueWidth = ctx.measureText(value.toString()).width;
        ctx.fillText(value.toString(), x, y + 55);
        ctx.font = '20px sans-serif'; // 調整單位字體
        ctx.fillText(unit, x + valueWidth + 10, y + 55);
      };

      // 長度
      drawStat('長度', result.length, '厘米', dataXStart, statY);
      // 粗細
      drawStat('粗細', result.thickness, '厘米', dataXStart + statWidth, statY);
      // 新鮮度
      drawStat('新鮮度', result.freshness, '/ 10', dataXStart + statWidth * 2, statY);
      
      // ===== 優化評語區域 =====
      const commentY = 480; // 調整Y軸位置
      const commentWidth = canvasWidth - 200;
      const lineHeight = 28; // 增加行高
      const commentFontSize = 20; // 增加字體大小

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // 使用半透明白色背景，更融入背景
      ctx.beginPath();
      ctx.roundRect(
        dataXStart - 20, 
        commentY - 30, 
        commentWidth + 40, 
        100, // 固定高度，預留空間
        10
      );
      ctx.fill();
      
      // 繪製評語標題
      ctx.fillStyle = '#333333'; // 深灰色文字
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('AI專業評語:', dataXStart, commentY);

      // 繪製評語內容 (深灰色)
      ctx.fillStyle = '#444444'; 
      ctx.font = `${commentFontSize}px sans-serif`;

      let comment = result.comment;
      if (comment.length > 150) { // 限制評語長度
        comment = comment.substring(0, 150) + '...';
      }
      
      // 使用優化的文字換行函數
      const commentLines = wrapTextChinese(ctx, comment, dataXStart, commentY + 35, commentWidth, lineHeight);
      
      // 限制顯示行數
      const maxLines = 2; 
      const displayLines = commentLines.slice(0, maxLines);

      displayLines.forEach((line, index) => {
        ctx.fillText(
          line.text, 
          line.x, 
          line.y
        );
      });
      
      if (commentLines.length > maxLines) {
         ctx.fillText('...', dataXStart, commentY + 35 + (maxLines * lineHeight));
      }

      // 添加網站連結 (白色，置於底部)
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI蔬果分析器 - aifruit.example.com', canvasWidth / 2, canvasHeight - 30);

      // 生成圖片URL
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;
    } catch (error) {
      console.error('Error generating share image:', error);
      // 可以添加一個錯誤回退圖片URL
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
                  
                  <div className="mt-3 grid grid-cols-5">
                    {[2, 4, 6, 8, 10].map((mark) => (
                      <div key={mark} className="text-center">
                        <div className={`mx-auto w-0.5 h-1.5 ${result.score >= mark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                        <div className={`text-xs mt-1 ${result.score >= mark ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{mark}</div>
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
                  {result.comment.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + (index * 0.005), duration: 0.2 }}
                    >
                      {char}
                    </motion.span>
                  ))}
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