import { CanvasImageOptions } from '@/types'; // Import from shared types

// MOVED TO: src/types/index.ts
/* interface CanvasImageOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  isMobile: boolean;
  devicePixelRatio?: number;
  debug?: boolean;
} */

export class CanvasImageGenerator {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  options: CanvasImageOptions; // Use imported type
  
  constructor(options: CanvasImageOptions) { // Use imported type
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('無法獲取畫布上下文');
    
    this.ctx = ctx;
    this.options = options;
    
    // 調整 Canvas 尺寸適應設備像素比
    const dpr = options.devicePixelRatio || window.devicePixelRatio || 1;
    
    // 設置實際尺寸 (考慮 DPR 以提高清晰度)
    this.canvas.width = options.width * dpr;
    this.canvas.height = options.height * dpr;
    
    // 在 DOM 中的顯示尺寸
    this.canvas.style.width = `${options.width}px`;
    this.canvas.style.height = `${options.height}px`;
    
    // 根據像素比例調整繪製比例
    ctx.scale(dpr, dpr);
    
    if (options.debug) {
      console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height} (DPR: ${dpr})`);
    }
  }
  
  // 繪製漸變背景
  drawGradientBackground(startColor: string = '#f8fafc', middleColor: string = '#eff6ff', endColor: string = '#f8fafc') {
    const { ctx, options } = this;
    
    // 創建漸變背景
    const grd = ctx.createLinearGradient(0, 0, options.width, options.height);
    grd.addColorStop(0, startColor);
    grd.addColorStop(0.5, middleColor);
    grd.addColorStop(1, endColor);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, options.width, options.height);
    
    return this;
  }
  
  // 繪製紋理
  drawTexture(opacity: number = 0.05) {
    const { ctx, options } = this;
    
    try {
      ctx.strokeStyle = `rgba(0,0,0,${opacity})`;
      ctx.lineWidth = 0.5;
      
      // 創建細微雜點紋理
      for (let i = 0; i < options.width; i += 10) {
        for (let j = 0; j < options.height; j += 10) {
          if (Math.random() > 0.85) {
            ctx.beginPath();
            ctx.moveTo(i, j);
            ctx.lineTo(i + 1, j + 1);
            ctx.stroke();
          }
        }
      }
    } catch (e) {
      if (this.options.debug) {
        console.log("紋理繪製失敗，略過", e);
      }
    }
    
    return this;
  }
  
  // 繪製標題
  drawTitle(text: string, x: number, y: number, color: string = '#1e293b', fontStyle: string = '52px') {
    const { ctx } = this;
    
    ctx.fillStyle = color;
    ctx.font = `bold ${fontStyle} sans-serif`;
    ctx.fillText(text, x, y);
    
    return this;
  }
  
  // 繪製漸變底線
  drawGradientLine(x: number, y: number, width: number, height: number, startColor: string = '#3b82f6', endColor: string = '#8b5cf6') {
    const { ctx } = this;
    
    const lineGradient = ctx.createLinearGradient(x, y, x + width, y);
    lineGradient.addColorStop(0, startColor);
    lineGradient.addColorStop(1, endColor);
    ctx.fillStyle = lineGradient;
    ctx.fillRect(x, y, width, height);
    
    return this;
  }
  
  // 顯示文本
  drawText(text: string, x: number, y: number, color: string = '#64748b', fontStyle: string = '20px sans-serif', textAlign: CanvasTextAlign = 'start') {
    const { ctx } = this;
    
    ctx.fillStyle = color;
    ctx.font = fontStyle;
    ctx.textAlign = textAlign;
    ctx.fillText(text, x, y);
    ctx.textAlign = 'start'; // 重置為預設值
    
    return this;
  }
  
  // 繪製圓角矩形
  drawRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: string) {
    const { ctx } = this;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    return this;
  }
  
  // 繪製包含陰影的圓角矩形
  drawShadowRoundedRect(x: number, y: number, width: number, height: number, radius: number, 
                        fillColor: string = '#ffffff', 
                        shadowColor: string = 'rgba(0, 0, 0, 0.1)',
                        shadowBlur: number = 15,
                        shadowOffsetX: number = 0,
                        shadowOffsetY: number = 5,
                        strokeColor?: string) {
    const { ctx } = this;
    
    // 陰影設置
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
    
    // 填充矩形
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
    
    // 繪製邊框（如果有指定顏色）
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // 重置陰影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    return this;
  }
  
  // 裁剪為圓角區域
  clipRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    const { ctx } = this;
    
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.clip();
    
    return this;
  }
  
  // 恢復裁剪狀態
  restoreClip() {
    this.ctx.restore();
    return this;
  }
  
  // 載入並繪製圖片
  async drawImage(imageUrl: string, x: number, y: number, width: number, height: number, 
                 keepRatio: boolean = true, clipRadius?: number) {
    const { ctx } = this;
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // 等待圖片載入
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = imageUrl;
      });
      
      // 如果需要保持圖片比例
      if (keepRatio) {
        const imgRatio = img.width / img.height;
        let drawWidth = width;
        let drawHeight = width / imgRatio;
        
        if (drawHeight > height) {
          drawHeight = height;
          drawWidth = height * imgRatio;
        }
        
        // 計算居中位置
        const offsetX = (width - drawWidth) / 2;
        const offsetY = (height - drawHeight) / 2;
        
        // 如果需要圓角裁剪
        if (clipRadius) {
          this.clipRoundedRect(x, y, width, height, clipRadius);
        }
        
        // 繪製圖片
        ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
        
        // 恢復裁剪
        if (clipRadius) {
          this.restoreClip();
        }
      } else {
        // 不保持比例，直接拉伸填充
        if (clipRadius) {
          this.clipRoundedRect(x, y, width, height, clipRadius);
        }
        
        ctx.drawImage(img, x, y, width, height);
        
        if (clipRadius) {
          this.restoreClip();
        }
      }
    } catch (e) {
      if (this.options.debug) {
        console.error('圖片繪製失敗', e);
      }
      // 繪製錯誤占位
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('圖片載入失敗', x + width/2, y + height/2);
      ctx.textAlign = 'start';
    }
    
    return this;
  }
  
  // 繪製發光效果
  drawGlow(centerX: number, centerY: number, innerRadius: number, outerRadius: number, startColor: string, endColor: string) {
    const { ctx } = this;
    
    const glow = ctx.createRadialGradient(
      centerX, centerY, innerRadius,
      centerX, centerY, outerRadius
    );
    glow.addColorStop(0, startColor);
    glow.addColorStop(1, endColor);
    ctx.fillStyle = glow;
    ctx.fillRect(centerX - outerRadius - 20, centerY - outerRadius - 20, (outerRadius + 20) * 2, (outerRadius + 20) * 2);
    
    return this;
  }
  
  // 優化的中文文字換行函數
  wrapTextChinese(text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const { ctx } = this;
    
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
  }
  
  // 繪製多行文本
  drawWrappedText(lines: {text: string, x: number, y: number}[], color: string = '#475569', fontStyle: string = '24px sans-serif') {
    const { ctx } = this;
    
    ctx.font = fontStyle;
    ctx.fillStyle = color;
    
    lines.forEach(line => {
      ctx.fillText(line.text, line.x, line.y);
    });
    
    return this;
  }
  
  // 生成圖片 URL
  async generateImageUrl(type: string = 'image/png', quality: number = 0.9): Promise<string> {
    return this.canvas.toDataURL(type, quality);
  }
  
  // 清除畫布
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    return this;
  }
}

export default CanvasImageGenerator; 