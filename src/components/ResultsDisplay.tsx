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

  const scoreColor = result.score >= 8 
    ? 'from-green-500 to-green-600' 
    : result.score >= 6 
      ? 'from-blue-500 to-blue-600'
      : 'from-amber-500 to-amber-600';
  
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
      
      // 固定畫布尺寸為桌面版佈局大小
      const canvasWidth = 1200;
      const canvasHeight = 630;
      
      // 設置畫布尺寸
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // 繪製背景
      const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grd.addColorStop(0, '#f8fafc');
      grd.addColorStop(0.5, '#eff6ff');
      grd.addColorStop(1, '#f8fafc');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 添加紋理
      try {
        ctx.strokeStyle = "rgba(0,0,0,0.05)";
        ctx.lineWidth = 0.5;
        
        const pattern = ctx.createPattern(canvas, "repeat");
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } catch (e) {
        console.log("紋理繪製失敗，略過", e);
      }
      
      // --- 重新設計的佈局 ---
      
      // 添加標題和logo
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('AI蔬果分析器', 80, 80);
      
      // 添加漸變標題底線
      const lineGradient = ctx.createLinearGradient(80, 95, 300, 95);
      lineGradient.addColorStop(0, '#3b82f6');
      lineGradient.addColorStop(1, '#8b5cf6');
      ctx.fillStyle = lineGradient;
      ctx.fillRect(80, 95, 220, 4);
      
      // 添加分析結果區域 - 擴展到全幅
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(80, 120, canvasWidth - 160, 430, 15);
      ctx.fill();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 清除陰影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 添加蔬果類型標題
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(`${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}分析結果`, 120, 170);
      
      // 添加分數
      const scoreColorValue = result.score >= 8 
        ? '#10b981' // 綠色
        : result.score >= 6 
          ? '#3b82f6' // 藍色
          : '#f59e0b'; // 琥珀色
      
      // 繪製分數背景
      const scoreSize = 100;
      const scoreX = canvasWidth - 150;
      const scoreY = 170;
      
      // 繪製光暈效果
      const scoreGlow = ctx.createRadialGradient(
        scoreX, scoreY, scoreSize/4,
        scoreX, scoreY, scoreSize
      );
      scoreGlow.addColorStop(0, scoreColorValue + '40'); // 40% 透明度
      scoreGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = scoreGlow;
      ctx.fillRect(scoreX - 20, scoreY - 20, scoreSize + 40, scoreSize + 40);
      
      // 繪製分數背景
      ctx.fillStyle = scoreColorValue;
      ctx.beginPath();
      ctx.arc(scoreX, scoreY, scoreSize/2, 0, Math.PI * 2);
      ctx.fill();
      
      // 繪製分數文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(result.score.toFixed(1), scoreX, scoreY + 12);
      ctx.textAlign = 'start';
      
      // 添加分析數據 - 水平排列
      const statY = 230;
      const statWidth = (canvasWidth - 240) / 3;
      
      // 長度
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('長度', 120, statY);
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(result.length.toString(), 120, statY + 45);
      ctx.font = '18px sans-serif';
      ctx.fillText('厘米', 120 + 60, statY + 45);
      
      // 粗細
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('粗細', 120 + statWidth, statY);
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(result.thickness.toString(), 120 + statWidth, statY + 45);
      ctx.font = '18px sans-serif';
      ctx.fillText('厘米', 120 + statWidth + 60, statY + 45);
      
      // 新鮮度
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('新鮮度', 120 + statWidth * 2, statY);
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(result.freshness.toString(), 120 + statWidth * 2, statY + 45);
      ctx.font = '18px sans-serif';
      ctx.fillText('/ 10', 120 + statWidth * 2 + 50, statY + 45);
      
      // 水平分隔線
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(120, statY + 70);
      ctx.lineTo(canvasWidth - 120, statY + 70);
      ctx.stroke();
      
      // ===== 優化評語區域 =====
      
      // 預先計算評語文字適合的大小和行高
      const commentX = 120;
      const commentY = 345;
      const commentWidth = canvasWidth - 240;
      const lineHeight = 22; // 稍微調小行高，避免超出區域
      const commentFontSize = 16; // 設置字體大小
      
      // 設置評語區域字體
      ctx.font = `${commentFontSize}px sans-serif`;
      
      // 對較長的評語進行截斷
      let comment = result.comment;
      // 如果評語超過300個字元，進行截斷
      if (comment.length > 300) {
        comment = comment.substring(0, 300) + '...';
      }
      
      // 使用優化的文字換行函數計算行數
      const commentLines = wrapTextChinese(ctx, comment, commentX, commentY, commentWidth, lineHeight);
      
      // 嚴格限制顯示區域的高度
      const maxCommentHeight = 180;
      const maxLines = Math.floor(maxCommentHeight / lineHeight);
      const displayLines = commentLines.slice(0, maxLines);
      
      // 實際評語區域尺寸計算
      const commentBoxHeight = Math.min(lineHeight * displayLines.length + 50, maxCommentHeight);
      
      // 繪製評語區域背景
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(
        commentX - 20, 
        commentY - 40, 
        commentWidth + 40, 
        commentBoxHeight, 
        10
      );
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 添加評語標題區域和標題文字
      ctx.fillStyle = '#f1f5f9'; // 更淺的背景色
      ctx.beginPath();
      // 使用單一半徑繪製標題區域
      ctx.roundRect(
        commentX - 20, 
        commentY - 40, 
        commentWidth + 40, 
        30,
        [10]
      );
      ctx.fill();
      
      // 標題左側的驚嘆號圖標
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(commentX, commentY - 25, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', commentX, commentY - 21);
      ctx.textAlign = 'start';
      
      // 評語標題文字
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('專業評語', commentX + 16, commentY - 20);
      
      // 繪製評語內容，確保在指定區域內
      ctx.fillStyle = '#475569';
      ctx.font = `${commentFontSize}px sans-serif`;
      
      // 添加一些額外的內容邊距
      const contentPaddingTop = 6;
      
      // 繪製每一行文字
      displayLines.forEach((line, index) => {
        // 只繪製最大行數內的內容
        if (index < maxLines) {
          ctx.fillText(
            line.text, 
            line.x, 
            commentY + contentPaddingTop + (index * lineHeight)
          );
        }
      });
      
      // 如果有被截斷的文字，添加省略號提示
      if (commentLines.length > maxLines) {
        ctx.fillText('...', commentX, commentY + contentPaddingTop + (maxLines * lineHeight));
      }
      
      // 添加網站連結 (統一放置在底部)
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI蔬果分析器 - aifruit.example.com', canvasWidth / 2, canvasHeight - 30);

      // 生成圖片URL
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl;
    } catch (error) {
      console.error('Error generating share image:', error);
      return null;
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
        <div className="w-full md:w-1/3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg overflow-hidden shadow-md aspect-square"
          >
            <Image 
              src={preview} 
              alt={`${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}分析圖`}
              className="w-full h-full object-cover"
              width={400}
              height={400}
              style={{width: '100%', height: '100%'}}
            />
          </motion.div>
        </div>

        {/* 右側分析結果 */}
        <div className="w-full md:w-2/3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {result.type === 'cucumber' 
                  ? '小黃瓜分析結果' 
                  : result.type === 'banana' 
                    ? '香蕉分析結果'
                    : '條狀物分析結果'}
                {result.type === 'other_rod' && (
                  <span className="text-sm font-normal ml-2 text-slate-500">
                    (非標準分析對象)
                  </span>
                )}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-outline flex items-center gap-2 text-sm py-2 px-4 self-start sm:self-auto"
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
                className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 text-sm"
              >
                <p>
                  <span className="font-medium">注意：</span>
                  上傳的不是小黃瓜或香蕉，但我們仍可分析這個條狀/棒狀物體的基本參數。
                  如需更準確的評估，請上傳小黃瓜或香蕉照片。
                </p>
              </motion.div>
            )}

            <div className="relative z-10 border border-slate-100 bg-white/50 rounded-xl p-5 backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className={`bg-gradient-to-r ${
                  result.type === 'other_rod' 
                    ? 'from-slate-500 to-slate-600' 
                    : scoreColor
                } text-white text-3xl font-bold w-20 h-20 rounded-xl flex items-center justify-center shadow-lg`}>
                  {result.score.toFixed(1)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-500 mb-1">
                    {result.type === 'other_rod' ? '參考評分' : '總評分'}
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(result.score / 10) * 100}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className={`h-full bg-gradient-to-r ${
                        result.type === 'other_rod' 
                          ? 'from-slate-500 to-slate-600' 
                          : scoreColor
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="flex flex-col items-center bg-blue-50 rounded-lg p-3 sm:p-4">
                  <FaRuler className="text-blue-500 mb-2" />
                  <span className="text-xs text-slate-600 mb-1">長度</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">{result.length} cm</span>
                </div>
                <div className="flex flex-col items-center bg-purple-50 rounded-lg p-3 sm:p-4">
                  <FaCircle className="text-purple-500 mb-2" />
                  <span className="text-xs text-slate-600 mb-1">粗細</span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">{result.thickness} cm</span>
                </div>
                <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 sm:p-4">
                  <FaStar className="text-green-500 mb-2" />
                  <span className="text-xs text-slate-600 mb-1">
                    {result.type === 'other_rod' ? '形狀評分' : '新鮮度'}
                  </span>
                  <span className="font-bold text-slate-800 text-sm sm:text-base">{result.freshness}/10</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative border border-slate-100 bg-white/50 rounded-xl p-4 sm:p-5 backdrop-blur-sm shadow-sm mb-5"
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <FaRegLightbulb className="text-amber-500 flex-shrink-0" />
              <h3 className="font-medium text-slate-800">AI評語</h3>
            </div>
            <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              <p className="text-slate-600 text-sm leading-relaxed mobile-text-tight">
                {result.comment}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-4 items-center"
          >
            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-slate-700">分享結果</h3>
                  <button 
                    className="btn btn-primary flex items-center justify-center gap-2 text-sm py-2 px-4"
                    onClick={handleDownload}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        處理中...
                      </>
                    ) : (
                      <>
                        <FaDownload className="h-4 w-4" />
                        下載圖片
                      </>
                    )}
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="btn btn-outline text-blue-600 border-blue-100 hover:bg-blue-50 flex items-center justify-center gap-2 py-3"
                  >
                    <FaFacebook className="text-lg" />
                    <span className="hidden sm:inline">Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="btn btn-outline text-blue-400 border-blue-100 hover:bg-blue-50 flex items-center justify-center gap-2 py-3"
                  >
                    <FaTwitter className="text-lg" />
                    <span className="hidden sm:inline">Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare('line')}
                    className="btn btn-outline text-green-600 border-green-100 hover:bg-green-50 flex items-center justify-center gap-2 py-3"
                  >
                    <FaLine className="text-lg" />
                    <span className="hidden sm:inline">Line</span>
                  </button>
                </div>
              </div>
            </div>
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-xs text-slate-400 bg-slate-50 p-2 sm:p-3 rounded-lg mt-4"
      >
        保護隱私：您的圖片僅用於即時分析，分析完成後不會保存在伺服器上
      </motion.div>
    </div>
  );
} 