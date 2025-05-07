// 图片处理工具函数

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
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
      img.crossOrigin = 'anonymous'; // 添加CORS支持
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

/**
 * 绘制图片到画布上下文
 * @param ctx 画布上下文
 * @param img 图片元素
 * @param x X坐标
 * @param y Y坐标
 * @param cellWidth 单元格宽度
 * @param cellHeight 单元格高度
 */
export const drawImageToCanvas = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number
) => {
  // 计算如何将图像适配到单元格中，保持图像比例
  const imgWidth = img.width;
  const imgHeight = img.height;
  
  // 计算适配尺寸 - 使用object-cover方式绘制，保持原比例
  let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
  
  // 根据图像比例决定如何填充单元格
  const imgRatio = imgWidth / imgHeight;
  const cellRatio = cellWidth / cellHeight;
  
  if (imgRatio > cellRatio) {
    // 图像更宽，以高度为基准，两侧可能会被裁剪
    drawHeight = cellHeight;
    drawWidth = drawHeight * imgRatio;
    offsetX = (cellWidth - drawWidth) / 2;
  } else {
    // 图像更高，以宽度为基准，上下可能会被裁剪
    drawWidth = cellWidth;
    drawHeight = drawWidth / imgRatio;
    offsetY = (cellHeight - drawHeight) / 2;
  }
  
  // 边界检查
  if (offsetX < 0) offsetX = 0;
  if (offsetY < 0) offsetY = 0;
  
  // 绘制图片到单元格
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, cellWidth, cellHeight);
  ctx.clip();
  
  // 在绘制前添加平滑效果
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
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
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}; 