// 画布处理工具函数
import { CollageImage, Layout, DEFAULT_IMAGE_TRANSFORM, AspectRatio } from "../constants";
import { loadImageFromFile, drawImageToCanvas, createImageFromUrl } from "./imageUtils";

/**
 * 生成拼图图像
 * @param collageElement 拼图容器元素
 * @param images 图片列表
 * @param selectedLayout 选择的布局
 * @param selectedAspectRatio 选择的宽高比
 * @returns Promise<string> 返回图片的Data URL
 */
export const generateCollageImage = async (
  collageElement: HTMLDivElement,
  images: CollageImage[],
  selectedLayout: Layout,
  selectedAspectRatio: AspectRatio
): Promise<string> => {
  // 创建一个新的画布
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }
  
  // 获取拼图区域的尺寸
  const { width, height } = collageElement.getBoundingClientRect();
  
  // 使用选定的宽高比设置推荐尺寸
  const recommendedWidth = selectedAspectRatio.width;
  const recommendedHeight = selectedAspectRatio.height;
  
  // 设置画布尺寸（使用选定的宽高比）
  canvas.width = recommendedWidth;
  canvas.height = recommendedHeight;
  
  // 设置白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 计算实际缩放比例 - 保持整个拼图适应画布
  const scaleX = recommendedWidth / width;
  const scaleY = recommendedHeight / height;
  const scale = Math.min(scaleX, scaleY);
  
  // 居中拼图
  const centerOffsetX = (recommendedWidth - width * scale) / 2;
  const centerOffsetY = (recommendedHeight - height * scale) / 2;
  
  // 应用缩放和居中
  ctx.save();
  ctx.translate(centerOffsetX, centerOffsetY);
  ctx.scale(scale, scale);
  
  // 获取有图片的单元格
  const cellsWithImages: { position: number; image: CollageImage }[] = [];
  
  // 遍历所有拼图单元格
  for (let i = 0; i < selectedLayout.cols * selectedLayout.rows; i++) {
    const image = images.find(img => img.position === i);
    if (image) {
      cellsWithImages.push({ position: i, image });
    }
  }
  
  // 如果是特殊布局，使用自定义网格
  if (selectedLayout.custom && selectedLayout.id === "layout-6") {
    // 特殊布局6的列和行(3x2)
    const totalCols = 3;
    const totalRows = 2;
    const cellUnitWidth = width / totalCols;
    const cellUnitHeight = height / totalRows;
    
    // 清空整个区域背景
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0, 0, width, height);
    
    // 处理所有图片
    for (const { position, image } of cellsWithImages) {
      try {
        let img;
        if (image.url.startsWith('data:')) {
          img = await createImageFromUrl(image.url);
        } else {
          img = await loadImageFromFile(image.file!);
        }
        
        let x, y, actualCellWidth, actualCellHeight;
        
        // 根据位置确定单元格在网格中的位置和尺寸（与CSS grid-area对应）
        if (position === 0) { // 区域 'a' - 左侧大图
          x = 0;
          y = 0;
          actualCellWidth = cellUnitWidth * 2; // 占据2列
          actualCellHeight = cellUnitHeight * 2; // 占据2行
        } else if (position === 1) { // 区域 'b' - 右上角
          x = cellUnitWidth * 2;
          y = 0;
          actualCellWidth = cellUnitWidth;
          actualCellHeight = cellUnitHeight;
        } else { // 区域 'c' - 右下角
          x = cellUnitWidth * 2;
          y = cellUnitHeight;
          actualCellWidth = cellUnitWidth;
          actualCellHeight = cellUnitHeight;
        }
        
        // 使用图像变换或默认变换
        const transform = image.transform || DEFAULT_IMAGE_TRANSFORM;
        
        // 绘制图片到单元格，应用蒙版形状
        drawImageToCanvas(ctx, img, x, y, actualCellWidth, actualCellHeight, transform, selectedLayout.maskShape, position);
      } catch (error) {
        // 处理错误但不打印调试信息
      }
    }
  } else {
    // 正常布局处理 - 均等网格
    const cellWidth = width / selectedLayout.cols;
    const cellHeight = height / selectedLayout.rows;
    
    // 先绘制所有单元格的背景和边框
    for (let row = 0; row < selectedLayout.rows; row++) {
      for (let col = 0; col < selectedLayout.cols; col++) {
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        // 绘制单元格背景
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(x, y, cellWidth, cellHeight);
        
        // 绘制单元格边框
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }
    }
    
    // 如果没有图片，直接返回空白拼图
    if (cellsWithImages.length === 0) {
      ctx.restore();
      return canvas.toDataURL('image/png', 0.95);
    }
    
    // 处理所有图片
    for (const { position, image } of cellsWithImages) {
      try {
        // 计算单元格在网格中的位置
        const row = Math.floor(position / selectedLayout.cols);
        const col = position % selectedLayout.cols;
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        // 从URL或文件加载图片
        let img;
        if (image.url.startsWith('data:')) {
          // 如果是Data URL，直接使用
          img = await createImageFromUrl(image.url);
        } else {
          // 否则从文件加载
          img = await loadImageFromFile(image.file!);
        }
        
        // 使用图像变换或默认变换
        const transform = image.transform || DEFAULT_IMAGE_TRANSFORM;
        
        // 绘制图片到单元格，应用蒙版形状
        drawImageToCanvas(ctx, img, x, y, cellWidth, cellHeight, transform, selectedLayout.maskShape, position);
      } catch (error) {
        // 处理错误但不打印调试信息
      }
    }
  }
  
  // 恢复画布状态
  ctx.restore();
  
  // 转换为数据URL
  return canvas.toDataURL('image/png', 0.95);
}; 