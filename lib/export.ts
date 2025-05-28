import { CollageElement, CanvasConfig } from '@/types/collage';

// 导出配置类型
export interface ExportConfig {
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0-1
  scale: number; // 导出缩放比例
  backgroundColor?: string;
}

// 默认导出配置
const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'png',
  quality: 0.9,
  scale: 1,
  backgroundColor: '#ffffff'
};

/**
 * 将画布元素转换为图片数据URL
 */
export async function exportCanvasToImage(
  canvas: CanvasConfig,
  elements: CollageElement[],
  config: Partial<ExportConfig> = {}
): Promise<string> {
  const exportConfig = { ...DEFAULT_EXPORT_CONFIG, ...config };
  
  // 创建临时画布元素
  const canvasElement = document.createElement('canvas');
  const ctx = canvasElement.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }

  // 设置画布尺寸
  const width = canvas.width * exportConfig.scale;
  const height = canvas.height * exportConfig.scale;
  
  canvasElement.width = width;
  canvasElement.height = height;
  
  // 设置背景色
  ctx.fillStyle = exportConfig.backgroundColor || canvas.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 按z-index排序元素
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  // 绘制每个元素
  for (const element of sortedElements) {
    if (!element.isVisible) continue;
    
    ctx.save();
    
    // 应用变换
    const x = element.transform.x * exportConfig.scale;
    const y = element.transform.y * exportConfig.scale;
    const w = element.transform.width * exportConfig.scale;
    const h = element.transform.height * exportConfig.scale;
    
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((element.transform.rotation * Math.PI) / 180);
    ctx.scale(element.transform.scaleX, element.transform.scaleY);
    if (element.transform.flipX) ctx.scale(-1, 1);
    if (element.transform.flipY) ctx.scale(1, -1);
    
    // 设置透明度
    ctx.globalAlpha = element.style.opacity;

    // 根据元素类型绘制
    switch (element.type) {
      case 'image':
        await drawImageElement(ctx, element, w, h);
        break;
      case 'text':
        drawTextElement(ctx, element, w, h);
        break;
      case 'shape':
        drawShapeElement(ctx, element, w, h);
        break;
      case 'icon':
        await drawIconElement(ctx, element, w, h);
        break;
      case 'border':
        drawBorderElement(ctx, element, w, h);
        break;
    }
    
    ctx.restore();
  }

  // 转换为数据URL
  const mimeType = `image/${exportConfig.format}`;
  return canvasElement.toDataURL(mimeType, exportConfig.quality);
}

/**
 * 绘制图片元素
 */
async function drawImageElement(
  ctx: CanvasRenderingContext2D,
  element: CollageElement,
  width: number,
  height: number
): Promise<void> {
  if (element.type !== 'image') return;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = element.src;
  });
}

/**
 * 绘制文字元素
 */
function drawTextElement(
  ctx: CanvasRenderingContext2D,
  element: CollageElement,
  width: number,
  height: number
): void {
  if (element.type !== 'text') return;
  
  ctx.fillStyle = element.color;
  ctx.font = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  ctx.textAlign = element.textAlign as CanvasTextAlign;
  ctx.textBaseline = 'middle';
  
  // 处理多行文本
  const lines = element.content.split('\n');
  const lineHeight = element.fontSize * element.lineHeight;
  const totalHeight = lines.length * lineHeight;
  const startY = -totalHeight / 2 + lineHeight / 2;
  
  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    let x = 0;
    
    if (element.textAlign === 'center') x = 0;
    else if (element.textAlign === 'right') x = width / 2;
    else x = -width / 2;
    
    ctx.fillText(line, x, y);
  });
}

/**
 * 绘制形状元素
 */
function drawShapeElement(
  ctx: CanvasRenderingContext2D,
  element: CollageElement,
  width: number,
  height: number
): void {
  if (element.type !== 'shape') return;
  
  ctx.fillStyle = element.fillColor;
  
  if (element.strokeColor && element.strokeWidth) {
    ctx.strokeStyle = element.strokeColor;
    ctx.lineWidth = element.strokeWidth;
  }
  
  switch (element.shapeType) {
    case 'rectangle':
      ctx.fillRect(-width / 2, -height / 2, width, height);
      if (element.strokeColor && element.strokeWidth) {
        ctx.strokeRect(-width / 2, -height / 2, width, height);
      }
      break;
      
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) / 2, 0, 2 * Math.PI);
      ctx.fill();
      if (element.strokeColor && element.strokeWidth) {
        ctx.stroke();
      }
      break;
      
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -height / 2);
      ctx.lineTo(-width / 2, height / 2);
      ctx.lineTo(width / 2, height / 2);
      ctx.closePath();
      ctx.fill();
      if (element.strokeColor && element.strokeWidth) {
        ctx.stroke();
      }
      break;
      
    default:
      // 其他复杂形状可以后续实现
      ctx.fillRect(-width / 2, -height / 2, width, height);
  }
}

/**
 * 绘制图标元素
 */
async function drawIconElement(
  ctx: CanvasRenderingContext2D,
  element: CollageElement,
  width: number,
  height: number
): Promise<void> {
  if (element.type !== 'icon') return;
  
  // 图标绘制比较复杂，这里简化处理
  // 实际应用中可能需要将SVG转换为Canvas路径或使用其他方法
  ctx.fillStyle = element.color;
  ctx.font = `${element.size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Icon', 0, 0);
}

/**
 * 绘制边框元素
 */
function drawBorderElement(
  ctx: CanvasRenderingContext2D,
  element: CollageElement,
  width: number,
  height: number
): void {
  if (element.type !== 'border') return;
  
  ctx.strokeStyle = element.color;
  ctx.lineWidth = element.thickness;
  
  if (element.borderType === 'decorative') {
    ctx.setLineDash([5, 5]);
  }
  
  ctx.strokeRect(-width / 2, -height / 2, width, height);
  ctx.setLineDash([]);
}

/**
 * 下载图片数据URL为文件
 */
export function downloadImageDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 生成导出文件名
 */
export function generateExportFilename(config: ExportConfig): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `collage_${timestamp}.${config.format}`;
} 