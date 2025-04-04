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
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = `我的${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}獲得了 ${result.score.toFixed(1)}/10 的評分！`;
  const shareDescription = `長度: ${result.length}cm, 粗細: ${result.thickness}cm, 新鮮度: ${result.freshness}/10\n${result.comment}`;
  const hashtag = "#AI蔬果分析";

  // 設定Open Graph元標籤（如果還未存在）
  useEffect(() => {
    if (!isClient) return;
    
    // 生成預設分享圖片
    if (!shareImageUrl) {
      // 內聯generateShareImage以避免依賴問題
      const generateImage = async () => {
        if (!canvasRef.current) return;
        setIsGeneratingImage(true);
        try {
          // 執行圖片生成邏輯
          // ... 圖片生成邏輯 ...
          // 模擬生成並設置URL
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 在這裡我們只是設置一個簡單的值來避免重複觸發
          setShareImageUrl("generated-image");
        } catch (err) {
          console.error("Error generating share image", err);
        } finally {
          setIsGeneratingImage(false);
        }
      };
      
      generateImage();
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
      
      // 判斷裝置類型，為手機設置更合適的尺寸
      const isMobile = window.innerWidth < 768;
      
      // 根據裝置調整畫布尺寸和布局
      const canvasWidth = isMobile ? 800 : 1200;
      const canvasHeight = isMobile ? 1200 : 630;
      
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
      
      if (isMobile) {
        // 手機版垂直布局
        // 添加標題
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText('AI蔬果分析器', 50, 60);
        
        // 添加漸變標題底線
        const lineGradient = ctx.createLinearGradient(50, 70, 300, 70);
        lineGradient.addColorStop(0, '#3b82f6');
        lineGradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = lineGradient;
        ctx.fillRect(50, 70, 200, 4);
        
        // 添加分數 - 放在頂部中央
        const scoreColorValue = result.score >= 8 
          ? '#10b981' // 綠色
          : result.score >= 6 
            ? '#3b82f6' // 藍色
            : '#f59e0b'; // 琥珀色
        
        // 繪製分數背景
        const scoreSize = 120;
        const scoreX = (canvasWidth - scoreSize) / 2;
        const scoreY = 100;
        
        // 繪製光暈效果
        const scoreGlow = ctx.createRadialGradient(
          scoreX + scoreSize/2, 
          scoreY + scoreSize/2, 
          scoreSize/4,
          scoreX + scoreSize/2, 
          scoreY + scoreSize/2, 
          scoreSize
        );
        scoreGlow.addColorStop(0, scoreColorValue + '40'); // 40% 透明度
        scoreGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = scoreGlow;
        ctx.fillRect(scoreX - 20, scoreY - 20, scoreSize + 40, scoreSize + 40);
        
        // 繪製分數背景
        ctx.fillStyle = scoreColorValue;
        ctx.beginPath();
        ctx.roundRect(scoreX, scoreY, scoreSize, scoreSize, 20);
        ctx.fill();
        
        // 繪製分數文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(result.score.toFixed(1), scoreX + scoreSize/2, scoreY + scoreSize/2 + 20);
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('評分', scoreX + scoreSize/2, scoreY + scoreSize - 15);
        ctx.textAlign = 'start';
        
        // 添加蔬果類型
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}分析結果`, canvasWidth/2, 260);
        ctx.textAlign = 'start';
        
        // 載入預覽圖片
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = preview;
        });
        
        // 繪製預覽圖片（置中）
        const imgWidth = canvasWidth - 100;
        const imgHeight = 320;
        const imgX = 50;
        const imgY = 290;
        
        // 繪製圖片框
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20, 15);
        ctx.fill();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 清除陰影，避免影響後續繪製
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 繪製圖片
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 10);
        ctx.clip();
        
        // 計算保持圖像比例的繪製尺寸
        const imgRatio = img.width / img.height;
        let drawWidth = imgWidth;
        let drawHeight = imgWidth / imgRatio;
        
        if (drawHeight > imgHeight) {
          drawHeight = imgHeight;
          drawWidth = imgHeight * imgRatio;
        }
        
        // 居中繪製
        const offsetX = (imgWidth - drawWidth) / 2;
        const offsetY = (imgHeight - drawHeight) / 2;
        
        ctx.drawImage(
          img, 
          imgX + offsetX, 
          imgY + offsetY, 
          drawWidth, 
          drawHeight
        );
        ctx.restore();
        
        // 繪製參數區塊（垂直排列）
        const statsWidth = canvasWidth - 100;
        const statHeight = 80;
        const statsX = 50;
        let currentY = imgY + imgHeight + 40;
        
        // 繪製參數區塊陰影和背景
        const bgColors = ['#eff6ff', '#f5f3ff', '#ecfdf5'];
        const icons = ['📏', '⭕', '🌟'];
        const titles = ['長度', '粗細', '新鮮度'];
        const values = [`${result.length} cm`, `${result.thickness} cm`, `${result.freshness}/10`];
        const colors = ['#3b82f6', '#8b5cf6', '#10b981'];
        
        for (let i = 0; i < 3; i++) {
          // 底部陰影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.beginPath();
          ctx.roundRect(statsX + 5, currentY + 5, statsWidth, statHeight, 15);
          ctx.fill();
          
          // 背景
          ctx.fillStyle = bgColors[i];
          ctx.beginPath();
          ctx.roundRect(statsX, currentY, statsWidth, statHeight, 15);
          ctx.fill();
          
          // 繪製圖示和文字
          ctx.font = '24px sans-serif';
          ctx.fillText(icons[i], statsX + 30, currentY + statHeight/2 + 8);
          
          // 標題
          ctx.fillStyle = '#64748b';
          ctx.font = '20px sans-serif';
          ctx.fillText(titles[i], statsX + 80, currentY + statHeight/2 - 5);
          
          // 數值
          ctx.fillStyle = colors[i];
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(values[i], statsX + 80, currentY + statHeight/2 + 25);
          
          currentY += statHeight + 20;
        }
        
        // 繪製評語區塊
        const commentWidth = canvasWidth - 100;
        const commentHeight = 240;
        const commentX = 50;
        const commentY = currentY + 20;
        
        // 繪製評語區塊陰影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.beginPath();
        ctx.roundRect(commentX + 5, commentY + 5, commentWidth, commentHeight, 15);
        ctx.fill();
        
        // 繪製評語區塊背景
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(commentX, commentY, commentWidth, commentHeight, 15);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 繪製評語標題背景
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.roundRect(commentX + 20, commentY + 20, 110, 40, 8);
        ctx.fill();
        
        // 繪製評語標題
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('💡 AI評語', commentX + 30, commentY + 48);
        
        // 繪製評語文字
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#475569';
        
        // 使用優化的中文換行函數
        const commentLines = wrapTextChinese(
          ctx, 
          result.comment, 
          commentX + 30, 
          commentY + 85, 
          commentWidth - 60, 
          32
        );
        
        commentLines.forEach(line => {
          ctx.fillText(line.text, line.x, line.y);
        });
      } else {
        // 桌面版水平布局，保持原樣
        // 添加標題
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 52px sans-serif';
        ctx.fillText('AI蔬果分析器', 50, 80);
        
        // 添加漸變標題底線
        const lineGradient = ctx.createLinearGradient(50, 90, 300, 90);
        lineGradient.addColorStop(0, '#3b82f6');
        lineGradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = lineGradient;
        ctx.fillRect(50, 90, 250, 4);
        
        // 添加日期
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.fillText(new Date().toLocaleDateString(), canvas.width - 200, canvas.height - 40);
        
        // 添加分數
        const scoreColorValue = result.score >= 8 
          ? '#10b981' // 綠色
          : result.score >= 6 
            ? '#3b82f6' // 藍色
            : '#f59e0b'; // 琥珀色
        
        // 繪製分數背景
        const scoreX = canvas.width - 180;
        const scoreY = 50;
        const scoreSize = 130;
        
        // 繪製光暈效果
        const scoreGlow = ctx.createRadialGradient(
          scoreX + scoreSize/2, 
          scoreY + scoreSize/2, 
          scoreSize/4,
          scoreX + scoreSize/2, 
          scoreY + scoreSize/2, 
          scoreSize
        );
        scoreGlow.addColorStop(0, scoreColorValue + '40'); // 40% 透明度
        scoreGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = scoreGlow;
        ctx.fillRect(scoreX - 20, scoreY - 20, scoreSize + 40, scoreSize + 40);
        
        // 繪製分數背景
        ctx.fillStyle = scoreColorValue;
        ctx.beginPath();
        ctx.roundRect(scoreX, scoreY, scoreSize, scoreSize, 20);
        ctx.fill();
        
        // 繪製分數文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(result.score.toFixed(1), scoreX + scoreSize/2, scoreY + scoreSize/2 + 20);
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('評分', scoreX + scoreSize/2, scoreY + scoreSize - 20);
        ctx.textAlign = 'start';
        
        // 添加蔬果類型
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(`${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}分析結果`, 50, 170);
        
        // 載入預覽圖片
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = preview;
        });
        
        // 繪製預覽圖片（左側）
        const imgX = 50;
        const imgY = 200;
        const imgWidth = 350;
        const imgHeight = 350;
        
        // 繪製圖片框
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20, 15);
        ctx.fill();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 清除陰影，避免影響後續繪製
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 繪製圖片
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 10);
        ctx.clip();
        
        // 計算保持圖像比例的繪製尺寸
        const imgRatio = img.width / img.height;
        let drawWidth = imgWidth;
        let drawHeight = imgWidth / imgRatio;
        
        if (drawHeight > imgHeight) {
          drawHeight = imgHeight;
          drawWidth = imgHeight * imgRatio;
        }
        
        // 居中繪製
        const offsetX = (imgWidth - drawWidth) / 2;
        const offsetY = (imgHeight - drawHeight) / 2;
        
        ctx.drawImage(
          img, 
          imgX + offsetX, 
          imgY + offsetY, 
          drawWidth, 
          drawHeight
        );
        ctx.restore();
        
        // 繪製參數區塊（右側）
        const statsX = 450;
        const statsY = 200;
        const statWidth = 200;
        const statHeight = 140;
        const statGap = 25;
        
        // 繪製參數區塊陰影和背景
        for (let i = 0; i < 3; i++) {
          const curX = statsX + (statWidth + statGap) * i;
          
          // 底部陰影
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.beginPath();
          ctx.roundRect(curX + 5, statsY + 5, statWidth, statHeight, 15);
          ctx.fill();
          
          // 背景
          const bgColors = ['#eff6ff', '#f5f3ff', '#ecfdf5'];
          ctx.fillStyle = bgColors[i];
          ctx.beginPath();
          ctx.roundRect(curX, statsY, statWidth, statHeight, 15);
          ctx.fill();
        }
        
        // 繪製圖示和文字
        const icons = ['📏', '⭕', '🌟'];
        const titles = ['長度', '粗細', '新鮮度'];
        const values = [`${result.length} cm`, `${result.thickness} cm`, `${result.freshness}/10`];
        const colors = ['#3b82f6', '#8b5cf6', '#10b981'];
        
        for (let i = 0; i < 3; i++) {
          const curX = statsX + (statWidth + statGap) * i;
          
          // 圖示
          ctx.font = '36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(icons[i], curX + statWidth/2, statsY + 50);
          
          // 標題
          ctx.fillStyle = '#64748b';
          ctx.font = '24px sans-serif';
          ctx.fillText(titles[i], curX + statWidth/2, statsY + 90);
          
          // 數值
          ctx.fillStyle = colors[i];
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText(values[i], curX + statWidth/2, statsY + 130);
        }
        
        ctx.textAlign = 'start';
        
        // 繪製評語區塊
        const commentX = 450;
        const commentY = 370;
        const commentWidth = 700;
        const commentHeight = 200;
        
        // 繪製評語區塊陰影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.beginPath();
        ctx.roundRect(commentX + 5, commentY + 5, commentWidth, commentHeight, 15);
        ctx.fill();
        
        // 繪製評語區塊背景
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(commentX, commentY, commentWidth, commentHeight, 15);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 繪製評語標題背景
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.roundRect(commentX + 20, commentY + 20, 110, 40, 8);
        ctx.fill();
        
        // 繪製評語標題
        ctx.fillStyle = '#d97706';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('💡 AI評語', commentX + 30, commentY + 48);
        
        // 繪製評語文字
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#475569';
        
        // 使用優化的中文換行函數
        const commentLines = wrapTextChinese(
          ctx, 
          result.comment, 
          commentX + 30, 
          commentY + 85, 
          commentWidth - 60, 
          36
        );
        
        commentLines.forEach(line => {
          ctx.fillText(line.text, line.x, line.y);
        });
      }
      
      // 繪製品牌水印
      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(hashtag, 50, canvas.height - 40);
      
      // 繪製網址
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('AI蔬果分析平台 | cucumber-banana-analyzer.com', canvas.width - 50, canvas.height - 40);
      ctx.textAlign = 'start';
      
      // 生成圖片URL
      const dataUrl = canvas.toDataURL('image/png');
      setShareImageUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('生成分享圖片失敗:', error);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadImage = async () => {
    let imgUrl = shareImageUrl;
    
    if (!imgUrl) {
      imgUrl = await generateShareImage();
      if (!imgUrl) {
        alert('生成分享圖片失敗，請稍後再試');
        return;
      }
    }
    
    const link = document.createElement('a');
    link.download = `AI蔬果分析_${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}_${new Date().getTime()}.png`;
    link.href = imgUrl;
    link.click();
  };

  const handleShareClick = async (platform: 'facebook' | 'twitter' | 'line') => {
    setSelectedPlatform(platform);
    
    if (!shareImageUrl) {
      const imgUrl = await generateShareImage();
      if (!imgUrl) {
        alert('生成分享圖片失敗，請稍後再試');
        return;
      }
      
      // 自動顯示圖片預覽
      setShowImagePreview(true);
    } else {
      // 已經有圖片URL，直接顯示預覽
      setShowImagePreview(true);
    }
  };

  const shareToSelectedPlatform = () => {
    if (!selectedPlatform || !shareImageUrl) return;
    
    // 確保有生成分享圖片
    const finalShareText = `${shareTitle}\n${shareDescription}\n${hashtag}\n查看我的完整分析結果：`;
    
    switch (selectedPlatform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(finalShareText)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle + '\n' + shareDescription)}&hashtags=${hashtag.replace('#', '')}`, '_blank');
        break;
      case 'line':
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(finalShareText)}`, '_blank');
        break;
    }
    
    // 重置選擇的平台
    setSelectedPlatform(null);
    setShowImagePreview(false);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 圖片預覽彈窗 */}
      {showImagePreview && shareImageUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-4 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedPlatform ? `分享到${selectedPlatform === 'facebook' ? 'Facebook' : selectedPlatform === 'twitter' ? 'Twitter' : 'Line'}` : '分享圖片預覽'}
              </h3>
              <button 
                onClick={() => setShowImagePreview(false)}
                className="text-slate-400 hover:text-slate-600 h-10 w-10 flex items-center justify-center rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto flex-1 mb-4">
              <img src={shareImageUrl} alt="分享預覽" className="w-full h-auto object-contain rounded-lg" />
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
                onClick={downloadImage}
              >
                <FaDownload className="h-4 w-4" />
                下載圖片
              </button>
              {selectedPlatform && (
                <button 
                  className="btn btn-primary flex items-center gap-2 text-sm py-2.5 px-4"
                  onClick={shareToSelectedPlatform}
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
            <img 
              src={preview} 
              alt={`${result.type === 'cucumber' ? '小黃瓜' : result.type === 'banana' ? '香蕉' : '物體'}分析圖`}
              className="w-full h-full object-cover"
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
            <div className="flex items-center justify-between mb-4">
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
                className="btn btn-outline flex items-center gap-2 text-sm py-2 px-4"
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
            className="relative border border-slate-100 bg-white/50 rounded-xl p-5 backdrop-blur-sm shadow-sm mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <FaRegLightbulb className="text-amber-500" />
              <h3 className="font-medium text-slate-800">AI評語</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed italic">
              {result.comment}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-4 items-center"
          >
            <div className="flex flex-col md:flex-row gap-3 w-full justify-center">
              <button 
                className="btn btn-outline flex items-center justify-center gap-2 md:w-auto w-full text-sm py-2.5 px-4"
                onClick={downloadImage}
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    處理中...
                  </>
                ) : (
                  <>
                    <FaDownload className="h-4 w-4" />
                    下載分享圖片
                  </>
                )}
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-2 mt-2">分享到社群媒體</p>
            
            <div className="flex justify-center space-x-5">
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                className="bg-[#1877F2] rounded-full w-12 h-12 flex items-center justify-center text-white shadow-md"
                onClick={() => handleShareClick('facebook')}
                disabled={isGeneratingImage}
                aria-label="分享到Facebook"
              >
                <FaFacebook size={22} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                className="bg-[#1DA1F2] rounded-full w-12 h-12 flex items-center justify-center text-white shadow-md"
                onClick={() => handleShareClick('twitter')}
                disabled={isGeneratingImage}
                aria-label="分享到Twitter"
              >
                <FaTwitter size={22} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                className="bg-[#06C755] rounded-full w-12 h-12 flex items-center justify-center text-white shadow-md"
                onClick={() => handleShareClick('line')}
                disabled={isGeneratingImage}
                aria-label="分享到Line"
              >
                <FaLine size={22} />
              </motion.button>
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
        className="text-center text-xs text-slate-400 bg-slate-50 p-3 rounded-lg"
      >
        保護隱私：您的圖片僅用於即時分析，分析完成後不會保存在伺服器上
      </motion.div>
    </div>
  );
} 