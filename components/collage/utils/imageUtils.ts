// 图片处理工具函数
import { ImageTransform, DEFAULT_IMAGE_TRANSFORM, MaskShape } from "../constants";

/**
 * 从文件加载图片
 * @param file 图片文件
 * @returns Promise<HTMLImageElement>
 */
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
      };
      img.onerror = (error) => {
        reject(new Error('图片加载失败'));
      };
      img.src = e.target?.result as string;
      // 对于 DataURL 不需要设置 crossOrigin
    };
    reader.onerror = (error) => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 应用图像变换
 * @param ctx 画布上下文
 * @param x 单元格X坐标
 * @param y 单元格Y坐标
 * @param width 单元格宽度
 * @param height 单元格高度
 * @param transform 图像变换参数
 */
export const applyTransform = (
  ctx: CanvasRenderingContext2D,
  x: number, 
  y: number, 
  width: number, 
  height: number,
  transform: ImageTransform = DEFAULT_IMAGE_TRANSFORM
) => {
  // 计算中心点
  const centerX = x + width * transform.offsetX;
  const centerY = y + height * transform.offsetY;
  
  // 移动到中心点
  ctx.translate(centerX, centerY);
  
  // 应用旋转
  ctx.rotate(transform.rotation);
  
  // 应用缩放
  ctx.scale(transform.scale, transform.scale);
  
  // 返回中心点偏移量，以便后续绘制时使用
  return {
    offsetX: -width / 2,
    offsetY: -height / 2,
  };
};

/**
 * 应用形状蒙版
 * @param ctx 画布上下文
 * @param x 单元格X坐标
 * @param y 单元格Y坐标
 * @param width 单元格宽度
 * @param height 单元格高度
 * @param maskShape 蒙版形状
 * @param position 单元格位置（用于单元格特定蒙版）
 */
export const applyMaskShape = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  maskShape?: MaskShape,
  position?: number
) => {
  if (!maskShape) return;
  
  // 保存当前状态
  ctx.save();
  
  // 开始新路径
  ctx.beginPath();
  
  // 检查是否有针对特定单元格的蒙版
  const cellMask = position !== undefined && maskShape.cellMasks?.[position];
  
  if (cellMask) {
    // 单元格特定蒙版
    switch (cellMask.type) {
      case 'rectangular':
        const rectX = x + (cellMask.x || 0) * width;
        const rectY = y + (cellMask.y || 0) * height;
        const rectWidth = (cellMask.width || 1) * width;
        const rectHeight = (cellMask.height || 1) * height;
        ctx.rect(rectX, rectY, rectWidth, rectHeight);
        break;
        
      case 'circular':
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = (cellMask.radius || 0.5) * Math.min(width, height);
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        break;
        
      case 'path':
        if (cellMask.svgPath) {
          const path = new Path2D(cellMask.svgPath);
          // 缩放路径以适应单元格
          ctx.translate(x, y);
          ctx.scale(width / 100, height / 100);
          ctx.fill(path);
        }
        break;
    }
  } else {
    // 整体蒙版
    switch (maskShape.type) {
      case 'rectangular':
        ctx.rect(x, y, width, height);
        break;
        
      case 'circular':
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        break;
        
      case 'path':
        if (maskShape.svgPath) {
          const path = new Path2D(maskShape.svgPath);
          // 缩放路径以适应整个画布
          ctx.translate(x, y);
          ctx.scale(width / 100, height / 100);
          ctx.fill(path);
        }
        break;
        
      case 'custom':
        if (maskShape.drawFunction) {
          // 使用自定义绘制函数
          maskShape.drawFunction(ctx, width, height);
        }
        break;
    }
  }
  
  // 将路径设为裁剪区域
  ctx.clip();
}

/**
 * 绘制图片到画布上下文（带变换支持和蒙版）
 * @param ctx 画布上下文
 * @param img 图片元素
 * @param x X坐标
 * @param y Y坐标
 * @param cellWidth 单元格宽度
 * @param cellHeight 单元格高度
 * @param transform 图像变换参数
 * @param maskShape 蒙版形状
 * @param position 单元格位置
 */
export const drawImageToCanvas = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number,
  transform: ImageTransform = DEFAULT_IMAGE_TRANSFORM,
  maskShape?: MaskShape,
  position?: number
) => {
  // 保存当前状态
  ctx.save();
  
  // 应用单元格裁剪 - 确保图片不会绘制到单元格外部
  ctx.beginPath();
  ctx.rect(x, y, cellWidth, cellHeight);
  ctx.clip();
  
  // 如果有蒙版形状，应用它
  if (maskShape) {
    applyMaskShape(ctx, x, y, cellWidth, cellHeight, maskShape, position);
  }
  
  // 应用变换并获取偏移量
  const { offsetX, offsetY } = applyTransform(ctx, x, y, cellWidth, cellHeight, transform);
  
  // 计算绘制尺寸
  const imgWidth = img.width;
  const imgHeight = img.height;
  
  // 根据是否保持长宽比计算绘制尺寸
  let drawWidth, drawHeight;
  
  if (transform.keepAspectRatio) {
    // 保持长宽比的情况
    const imgRatio = imgWidth / imgHeight;
    const cellRatio = cellWidth / cellHeight;
    
    if (imgRatio > cellRatio) {
      // 图像更宽，以高度为基准
      drawHeight = cellHeight;
      drawWidth = drawHeight * imgRatio;
    } else {
      // 图像更高，以宽度为基准
      drawWidth = cellWidth;
      drawHeight = drawWidth / imgRatio;
    }
  } else {
    // 不保持长宽比，直接使用单元格尺寸
    drawWidth = cellWidth;
    drawHeight = cellHeight;
  }
  
  // 绘制图片
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  
  // 恢复状态
  ctx.restore();
};

/**
 * 绘制图片到画布的简化方法（无需保存变换）
 * 用于预览UI中简单场景，与导出保持一致性
 */
export const drawSimpleImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  keepAspectRatio: boolean = true
) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  
  if (keepAspectRatio) {
    // 保持原始比例
    const imgRatio = img.width / img.height;
    const cellRatio = width / height;
    
    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
    
    if (imgRatio > cellRatio) {
      // 图像更宽
      drawHeight = height;
      drawWidth = drawHeight * imgRatio;
      offsetX = (width - drawWidth) / 2;
    } else {
      // 图像更高
      drawWidth = width;
      drawHeight = drawWidth / imgRatio;
      offsetY = (height - drawHeight) / 2;
    }
    
    ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
  } else {
    // 拉伸填充
    ctx.drawImage(img, x, y, width, height);
  }
  
  ctx.restore();
};

/**
 * 从URL创建图片
 * @param url 图片URL
 * @returns Promise<HTMLImageElement>
 */
export const createImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (error) => {
      reject(new Error('图片加载失败'));
    };
    // 对于 DataURL 不需要设置 crossOrigin
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;
  });
}; 