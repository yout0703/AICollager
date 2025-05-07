// 画布处理工具函数
import { CollageImage, Layout } from "../constants";
import { loadImageFromFile, drawImageToCanvas } from "./imageUtils";

/**
 * 生成拼图图像
 * @param collageElement 拼图容器元素
 * @param images 图片列表
 * @param selectedLayout 选择的布局
 * @returns Promise<string> 返回图片的Data URL
 */
export const generateCollageImage = async (
  collageElement: HTMLDivElement,
  images: CollageImage[],
  selectedLayout: Layout
): Promise<string> => {
  // 创建一个新的画布
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }
  
  // 获取拼图区域的尺寸
  const { width, height } = collageElement.getBoundingClientRect();
  
  // 设置推荐尺寸为1080×1350 px (4:5比例)
  const recommendedWidth = 1080;
  const recommendedHeight = 1350;
  
  // 设置画布尺寸（确保4:5比例）
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
  
  // 计算每个单元格的尺寸和位置
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
      let x = col * cellWidth;
      let y = row * cellHeight;
      let actualCellWidth = cellWidth;
      let actualCellHeight = cellHeight;
      
      // 处理特殊布局
      if (selectedLayout.custom && selectedLayout.id === "layout-6") {
        if (position === 0) {
          // 主图占据左侧两格
          actualCellWidth = cellWidth * 2;
          actualCellHeight = cellHeight * 2;
        }
      }
      
      // 从文件加载图片
      const img = await loadImageFromFile(image.file);
      
      // 绘制图片到单元格
      drawImageToCanvas(ctx, img, x, y, actualCellWidth, actualCellHeight);
    } catch (error) {
      console.error(`处理位置 ${position} 的图片时出错:`, error);
    }
  }
  
  // 恢复画布状态
  ctx.restore();
  
  // 转换为数据URL
  return canvas.toDataURL('image/png', 0.95);
}; 