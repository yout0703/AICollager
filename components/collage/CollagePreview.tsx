"use client";

import { RefObject, useEffect, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { AspectRatio, CollageImage, ImageTransform, Layout, getCollageGridClass, getCollageGridStyle, normalizeImageTransform } from "./constants";
import { getImageDrawRect } from "./utils/imageUtils";
import { cn } from "@/lib/utils";

interface CollagePreviewProps {
  images: CollageImage[];
  selectedLayout: Layout;
  selectedAspectRatio: AspectRatio;
  draggedOver: number | null;
  onDragOver: (e: React.DragEvent, position: number) => void;
  onDrop: (position: number) => void;
  onRemoveImage: (id: string) => void;
  onUpdateImageTransform: (id: string, transform: ImageTransform) => void;
  onImageClick?: (id: string) => void;
  selectedImageId?: string | null;
  translateFn: (key: string) => string;
  collageRef: RefObject<HTMLDivElement>;
}

// 应用蒙版CSS样式的辅助函数
const getMaskStyle = (layout: Layout, position: number) => {
  const { maskShape } = layout;
  if (!maskShape) return {};

  // 检查是否有针对特定单元格的蒙版
  const cellMask = position !== undefined && maskShape.cellMasks?.[position];

  // 单元格特定蒙版
  if (cellMask) {
    switch (cellMask.type) {
      case 'rectangular':
        const x = (cellMask.x || 0) * 100;
        const y = (cellMask.y || 0) * 100;
        const width = (cellMask.width || 1) * 100;
        const height = (cellMask.height || 1) * 100;
        return {
          clipPath: `inset(${y}% ${100-width-x}% ${100-height-y}% ${x}%)`
        };

      case 'circular':
        const radius = (cellMask.radius || 0.5) * 100;
        return {
          clipPath: `circle(${radius}% at center)`
        };

      case 'path':
        if (cellMask.svgPath) {
          return {
            clipPath: `path('${cellMask.svgPath}')`
          };
        }
        break;
    }
  } else if (maskShape) {
    // 整体蒙版
    switch (maskShape.type) {
      case 'rectangular':
        return {};

      case 'circular':
        return {
          clipPath: 'circle(50% at center)'
        };

      case 'path':
        if (maskShape.svgPath) {
          return {
            clipPath: `path('${maskShape.svgPath}')`
          };
        }
        break;
    }
  }

  return {};
};

// 获取单元格网格区域
const getCellGridArea = (layoutId: string, position: number): React.CSSProperties => {
  if (layoutId === "layout-6") {
    return { gridArea: position === 0 ? 'a' : position === 1 ? 'b' : 'c' };
  }

  if (layoutId === "layout-7") {
    const areas = ['a', 'b', 'c', 'd', 'e'];
    return { gridArea: areas[position] || '' };
  }

  if (layoutId === "layout-8") {
    const areas = ['a', 'b', 'c', 'd'];
    return { gridArea: areas[position] || '' };
  }

  if (layoutId === "layout-9") {
    const areas = ['a', 'b', 'c'];
    return { gridArea: areas[position] || '' };
  }

  if (layoutId === "layout-10") {
    const areas = ['a', 'b', 'c', 'd'];
    return { gridArea: areas[position] || '' };
  }

  if (layoutId === "layout-11") {
    const areas = ['a', 'b', 'c', 'd'];
    return { gridArea: areas[position] || '' };
  }

  if (layoutId === "layout-12") {
    const areas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
    return { gridArea: areas[position] || '' };
  }

  return {};
};

export default function CollagePreview({
  images,
  selectedLayout,
  selectedAspectRatio,
  draggedOver,
  onDragOver,
  onDrop,
  onRemoveImage,
  onUpdateImageTransform: _onUpdateImageTransform,
  onImageClick,
  selectedImageId,
  translateFn,
  collageRef
}: CollagePreviewProps) {
  // 精确模式状态
  const [exactMode, setExactMode] = useState(false);
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [cellSizes, setCellSizes] = useState<Record<number, { width: number; height: number }>>({});

  useEffect(() => {
    const measureCells = () => {
      const collageElement = collageRef.current;
      if (!collageElement) return;

      const nextSizes: Record<number, { width: number; height: number }> = {};
      collageElement.querySelectorAll<HTMLElement>("[data-position]").forEach((cell) => {
        const position = Number(cell.dataset.position);
        const rect = cell.getBoundingClientRect();
        if (!Number.isNaN(position) && rect.width > 0 && rect.height > 0) {
          nextSizes[position] = {
            width: rect.width,
            height: rect.height
          };
        }
      });

      setCellSizes((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextSizes);
        const hasChanged =
          prevKeys.length !== nextKeys.length ||
          nextKeys.some((key) => {
            const position = Number(key);
            const prevSize = prev[position];
            const nextSize = nextSizes[position];
            return (
              !prevSize ||
              Math.abs(prevSize.width - nextSize.width) > 0.5 ||
              Math.abs(prevSize.height - nextSize.height) > 0.5
            );
          });

        return hasChanged ? nextSizes : prev;
      });
    };

    measureCells();

    if (typeof ResizeObserver === "undefined" || !collageRef.current) {
      window.addEventListener("resize", measureCells);
      return () => window.removeEventListener("resize", measureCells);
    }

    const observer = new ResizeObserver(measureCells);
    observer.observe(collageRef.current);

    return () => observer.disconnect();
  }, [collageRef, selectedAspectRatio.ratio, selectedLayout.id]);

  // 处理图片选择
  const handleImageSelect = (id: string) => {
    if (onImageClick) {
      onImageClick(id);
    }
  };

  const getPreviewImageStyle = (
    image: CollageImage,
    transform: ImageTransform | undefined,
    position: number
  ): React.CSSProperties => {
    const currentTransform = normalizeImageTransform(transform);
    const imageSize = imageSizes[image.id];
    const cellSize = cellSizes[position];

    if (imageSize && cellSize) {
      const { drawWidth, drawHeight, drawX, drawY } = getImageDrawRect(
        imageSize.width,
        imageSize.height,
        cellSize.width,
        cellSize.height,
        currentTransform
      );

      return {
        left: `${drawX}px`,
        top: `${drawY}px`,
        width: `${drawWidth}px`,
        height: `${drawHeight}px`,
        objectFit: "fill",
        transform: `rotate(${currentTransform.rotation}rad)`,
        transformOrigin: "center"
      };
    }

    if (!imageSize) {
      return {
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: currentTransform.fitMode === "stretch"
          ? "fill"
          : currentTransform.fitMode === "contain"
            ? "contain"
            : "cover",
        objectPosition: `${currentTransform.offsetX * 100}% ${currentTransform.offsetY * 100}%`,
        transform: `scale(${currentTransform.scale}) rotate(${currentTransform.rotation}rad)`,
        transformOrigin: "center"
      };
    }

    const imgRatio = imageSize.width / imageSize.height;
    const cellRatio = (selectedAspectRatio.ratio * selectedLayout.rows) / selectedLayout.cols;
    const scale = Math.abs(currentTransform.scale) || 1;
    const fitMode = currentTransform.fitMode ?? "cover";
    const widthPercent = fitMode === "stretch"
      ? 100 * scale
      : fitMode === "contain"
        ? (imgRatio > cellRatio ? 100 : (imgRatio / cellRatio) * 100) * scale
        : (imgRatio > cellRatio ? (imgRatio / cellRatio) * 100 : 100) * scale;
    const heightPercent = fitMode === "stretch"
      ? 100 * scale
      : fitMode === "contain"
        ? (imgRatio > cellRatio ? (cellRatio / imgRatio) * 100 : 100) * scale
        : (imgRatio > cellRatio ? 100 : (cellRatio / imgRatio) * 100) * scale;

    return {
      left: `${(100 - widthPercent) * currentTransform.offsetX}%`,
      top: `${(100 - heightPercent) * currentTransform.offsetY}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`,
      objectFit: "fill",
      transform: `rotate(${currentTransform.rotation}rad)`,
      transformOrigin: "center"
    };
  };

  return (
    <div className="h-full rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">{translateFn('previewArea')}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {translateFn('collageWorkspace.previewDescription')}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2 sm:justify-end">
          <span className="text-xs font-medium text-muted-foreground">
            {exactMode ? translateFn('exactMode') : translateFn('beautyMode')}
          </span>
            <button
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${exactMode ? 'bg-primary' : 'bg-secondary'}`}
              onClick={() => setExactMode(!exactMode)}
              aria-pressed={exactMode}
              title={exactMode ? translateFn('switchToBeautyMode') : translateFn('switchToExactMode')}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background ring-0 transition duration-200 ease-in-out ${exactMode ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
        </div>
      </div>

      <div
        className="relative mx-auto rounded-lg bg-secondary/60 p-3 sm:p-4"
        style={{
          maxWidth: selectedAspectRatio.ratio < 0.7 ? "430px" : selectedAspectRatio.ratio > 1.4 ? "680px" : "560px"
        }}
      >
        <div
          className="relative"
          style={{ paddingBottom: `${(1 / selectedAspectRatio.ratio) * 100}%` }}
        >
          <div
            ref={collageRef}
            className={`${getCollageGridClass(selectedLayout)} absolute inset-0 rounded-md`}
            style={{
              width: '100%',
              height: '100%',
              gap: '0px',
              ...getCollageGridStyle(selectedLayout)
            }}
          >
            {Array.from({ length: selectedLayout.cols * selectedLayout.rows }).map((_, i) => {
              const image = images.find(img => img.position === i);
              const cellClass = selectedLayout.custom && selectedLayout.id === "layout-6"
                ? `cell-${i}`
                : '';

              const isSelected = image && selectedImageId === image.id;
              const transform = image?.transform;

              return (
                <div
                  key={`cell-${i}`}
                  className={cn(
                    "flex h-full w-full items-center justify-center overflow-hidden transition-colors",
                    cellClass,
                    draggedOver === i && "border-primary bg-primary/10 ring-2 ring-primary/20",
                    isSelected && "border-primary ring-2 ring-primary/25",
                    !draggedOver && !isSelected && image && "border-0 bg-background",
                    !draggedOver && !isSelected && !image && "border border-dashed border-border bg-background/70"
                  )}
                  style={{
                    ...(selectedLayout.custom
                      ? getCellGridArea(selectedLayout.id, i)
                      : {}),
                  }}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(i)}
                  data-position={i}
                >
                  {image ? (
                    <div
                      className="group relative h-full w-full overflow-hidden"
                      style={getMaskStyle(selectedLayout, i)}
                    >
                      <img
                        src={image.url}
                        alt={translateFn("collageImage")}
                        className="absolute max-w-none cursor-pointer"
                        onClick={() => handleImageSelect(image.id)}
                        onLoad={(event) => {
                          const target = event.currentTarget;
                          setImageSizes(prev => {
                            const existing = prev[image.id];
                            if (existing?.width === target.naturalWidth && existing?.height === target.naturalHeight) {
                              return prev;
                            }
                            return {
                              ...prev,
                              [image.id]: {
                                width: target.naturalWidth,
                                height: target.naturalHeight
                              }
                            };
                          });
                        }}
                        draggable={false}
                        crossOrigin={image.url.startsWith('data:') ? undefined : "anonymous"}
                        style={getPreviewImageStyle(image, transform, i)}
                      />
                      <button
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage(image.id);
                        }}
                        title={translateFn("removeImage")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <ImageIcon className="mb-2 h-6 w-6 text-muted-foreground/70" />
                      <p className="text-[11px] leading-4 text-muted-foreground">
                        {draggedOver === i ? translateFn('collageWorkspace.dropHint') : translateFn('collageWorkspace.emptyCellHint')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-secondary/40 px-3 py-2 text-center text-xs leading-5 text-muted-foreground">
        {translateFn('previewInstructions')}
        <span className="mx-2 text-border">/</span>
        {translateFn('collageWorkspace.exactModeHelp')}
      </div>
    </div>
  );
}
