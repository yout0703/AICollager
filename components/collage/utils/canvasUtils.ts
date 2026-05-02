// 画布处理工具函数
import {
  AspectRatio,
  CollageImage,
  CUSTOM_LAYOUT_AREAS,
  Layout,
  getLayoutCellCount,
  normalizeImageTransform,
} from "../constants";
import { loadImageFromFile, drawImageToCanvas, createImageFromUrl } from "./imageUtils";

/**
 * 生成拼图图像
 * @param collageElement 拼图容器元素
 * @param images 图片列表
 * @param selectedLayout 选择的布局
 * @param selectedAspectRatio 选择的宽高比
 * @param cellGap 格子之间（以及外缘）的留白宽度（CSS 像素，默认 0）
 * @returns Promise<string> 返回图片的Data URL
 */
export const generateCollageImage = async (
  collageElement: HTMLDivElement,
  images: CollageImage[],
  selectedLayout: Layout,
  selectedAspectRatio: AspectRatio,
  cellGap: number = 0
): Promise<string> => {
  // 创建一个新的画布
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建画布上下文');
  }

  // 获取拼图区域的尺寸
  const rootRect = collageElement.getBoundingClientRect();
  const { width, height } = rootRect;

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
  for (let i = 0; i < getLayoutCellCount(selectedLayout); i++) {
    const image = images.find(img => img.position === i);
    if (image) {
      cellsWithImages.push({ position: i, image });
    }
  }

  const renderedCells = Array.from(
    collageElement.querySelectorAll<HTMLElement>("[data-position]")
  )
    .map((cell) => {
      const position = Number(cell.dataset.position);
      const rect = cell.getBoundingClientRect();
      if (Number.isNaN(position) || rect.width <= 0 || rect.height <= 0) return null;
      return {
        position,
        x: rect.left - rootRect.left,
        y: rect.top - rootRect.top,
        width: rect.width,
        height: rect.height,
      };
    })
    .filter((cell): cell is NonNullable<typeof cell> => Boolean(cell));

  if (renderedCells.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    for (const cell of renderedCells) {
      const image = images.find((img) => img.position === cell.position);
      if (!image) continue;

      try {
        let img;
        if (image.url.startsWith('data:')) {
          img = await createImageFromUrl(image.url);
        } else {
          img = await loadImageFromFile(image.file!);
        }

        drawImageToCanvas(
          ctx,
          img,
          cell.x,
          cell.y,
          cell.width,
          cell.height,
          normalizeImageTransform(image.transform),
          selectedLayout.maskShape,
          cell.position
        );
      } catch {
        // 处理错误但不打印调试信息
      }
    }

    ctx.restore();
    return canvas.toDataURL('image/png', 0.95);
  }

  const customAreas = selectedLayout.custom ? CUSTOM_LAYOUT_AREAS[selectedLayout.id] : undefined;

  // 如果是特殊布局，使用与 CSS grid-template-areas 相同的区域映射
  if (customAreas) {
    const totalCols = selectedLayout.cols;
    const totalRows = selectedLayout.rows;
    const innerWidth = Math.max(0, width - (totalCols + 1) * cellGap);
    const innerHeight = Math.max(0, height - (totalRows + 1) * cellGap);
    const cellUnitWidth = innerWidth / totalCols;
    const cellUnitHeight = innerHeight / totalRows;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 处理所有图片
    for (const { position, image } of cellsWithImages) {
      try {
        let img;
        if (image.url.startsWith('data:')) {
          img = await createImageFromUrl(image.url);
        } else {
          img = await loadImageFromFile(image.file!);
        }

        const area = customAreas[position];
        if (!area) continue;

        const x = cellGap + area.col * (cellUnitWidth + cellGap);
        const y = cellGap + area.row * (cellUnitHeight + cellGap);
        const actualCellWidth = area.spanCols * cellUnitWidth + (area.spanCols - 1) * cellGap;
        const actualCellHeight = area.spanRows * cellUnitHeight + (area.spanRows - 1) * cellGap;

        // 绘制图片到单元格，应用蒙版形状
        drawImageToCanvas(ctx, img, x, y, actualCellWidth, actualCellHeight, normalizeImageTransform(image.transform), selectedLayout.maskShape, position);
      } catch {
        // 处理错误但不打印调试信息
      }
    }
  } else {
    // 正常布局处理 - 均等网格 + 间距
    const innerWidth = Math.max(0, width - (selectedLayout.cols + 1) * cellGap);
    const innerHeight = Math.max(0, height - (selectedLayout.rows + 1) * cellGap);
    const cellWidth = innerWidth / selectedLayout.cols;
    const cellHeight = innerHeight / selectedLayout.rows;

    // 整个画布已是白色背景；无需逐格再 fill。

    // 如果没有图片，直接返回空白拼图
    if (cellsWithImages.length === 0) {
      ctx.restore();
      return canvas.toDataURL('image/png', 0.95);
    }

    // 处理所有图片
    for (const { position, image } of cellsWithImages) {
      try {
        // 计算单元格在网格中的位置（包含外边和内边的 gap）
        const row = Math.floor(position / selectedLayout.cols);
        const col = position % selectedLayout.cols;
        const x = cellGap + col * (cellWidth + cellGap);
        const y = cellGap + row * (cellHeight + cellGap);

        // 从URL或文件加载图片
        let img;
        if (image.url.startsWith('data:')) {
          // 如果是Data URL，直接使用
          img = await createImageFromUrl(image.url);
        } else {
          // 否则从文件加载
          img = await loadImageFromFile(image.file!);
        }

        // 绘制图片到单元格，应用蒙版形状
        drawImageToCanvas(ctx, img, x, y, cellWidth, cellHeight, normalizeImageTransform(image.transform), selectedLayout.maskShape, position);
      } catch {
        // 处理错误但不打印调试信息
      }
    }
  }

  // 恢复画布状态
  ctx.restore();

  // 转换为数据URL
  return canvas.toDataURL('image/png', 0.95);
};
