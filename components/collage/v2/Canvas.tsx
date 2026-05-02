"use client";

import { RefObject, useEffect, useRef, useState } from "react";
import {
  Crop,
  FlipHorizontal,
  ImageIcon,
  Maximize2,
  Plus,
  Replace,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import {
  AspectRatio,
  CollageImage,
  ImageTransform,
  Layout,
  getCollageGridClass,
  getCollageGridStyle,
  getLayoutCellCount,
  normalizeImageTransform,
} from "../constants";
import { getImageDrawRect } from "../utils/imageUtils";
import { cn } from "@/lib/utils";
import type { SizeMap, TranslateFn } from "./types";

interface CanvasProps {
  images: CollageImage[];
  layout: Layout;
  aspectRatio: AspectRatio;
  cellGap: number;
  selectedImageId: string | null;
  draggedOver: number | null;
  onDragOver: (e: React.DragEvent, position: number) => void;
  onDrop: (position: number) => void;
  onSelectImage: (id: string | null) => void;
  onCellClick: (position: number) => void;
  onRemoveFromCell: (id: string) => void;
  onQuickAction: (action: "fit" | "fill" | "rotate90" | "flip" | "reset") => void;
  onReplace: (id: string) => void;
  onUpdateTransform: (id: string, transform: ImageTransform) => void;
  onCommitTransform: () => void;
  onSizesChange: (next: SizeMap | ((prev: SizeMap) => SizeMap)) => void;
  translateFn: TranslateFn;
  collageRef: RefObject<HTMLDivElement>;
}

interface DragState {
  imageId: string;
  position: number;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startTransform: ImageTransform;
  dragTransform: ImageTransform;
  imageWidth: number;
  imageHeight: number;
  cellWidth: number;
  cellHeight: number;
  didMove: boolean;
}

// ----- Mask helpers (mirrors original CollagePreview) -----
const getMaskStyle = (layout: Layout, position: number): React.CSSProperties => {
  const { maskShape } = layout;
  if (!maskShape) return {};
  const cellMask = position !== undefined && maskShape.cellMasks?.[position];

  if (cellMask) {
    switch (cellMask.type) {
      case "rectangular": {
        const x = (cellMask.x || 0) * 100;
        const y = (cellMask.y || 0) * 100;
        const width = (cellMask.width || 1) * 100;
        const height = (cellMask.height || 1) * 100;
        return {
          clipPath: `inset(${y}% ${100 - width - x}% ${100 - height - y}% ${x}%)`,
        };
      }
      case "circular": {
        const radius = (cellMask.radius || 0.5) * 100;
        return { clipPath: `circle(${radius}% at center)` };
      }
      case "path":
        if (cellMask.svgPath) return { clipPath: `path('${cellMask.svgPath}')` };
        break;
    }
  } else if (maskShape) {
    switch (maskShape.type) {
      case "rectangular":
        return {};
      case "circular":
        return { clipPath: "circle(50% at center)" };
      case "path":
        if (maskShape.svgPath) return { clipPath: `path('${maskShape.svgPath}')` };
        break;
    }
  }
  return {};
};

const getCellGridArea = (layoutId: string, position: number): React.CSSProperties => {
  const map: Record<string, string[]> = {
    "layout-6": ["a", "b", "c"],
    "layout-7": ["a", "b", "c", "d", "e"],
    "layout-8": ["a", "b", "c", "d"],
    "layout-9": ["a", "b", "c"],
    "layout-10": ["a", "b", "c", "d"],
    "layout-11": ["a", "b", "c", "d"],
    "layout-12": ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
  };
  const areas = map[layoutId];
  return areas ? { gridArea: areas[position] || "" } : {};
};

// ----- Canvas component -----
export default function Canvas({
  images,
  layout,
  aspectRatio,
  cellGap,
  selectedImageId,
  draggedOver,
  onDragOver,
  onDrop,
  onSelectImage,
  onCellClick,
  onRemoveFromCell,
  onQuickAction,
  onReplace,
  onUpdateTransform,
  onCommitTransform,
  onSizesChange,
  collageRef,
}: CanvasProps) {
  // Local view of the lifted size state — re-derived inside this component
  // for fast rendering, then forwarded up via onSizesChange.
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [cellSizes, setCellSizes] = useState<Record<number, { width: number; height: number }>>({});
  const dragStateRef = useRef<DragState | null>(null);

  // Forward image sizes to parent whenever they change.
  useEffect(() => {
    onSizesChange((prev) => ({ ...prev, images: imageSizes }));
  }, [imageSizes, onSizesChange]);

  useEffect(() => {
    onSizesChange((prev) => ({ ...prev, cells: cellSizes }));
  }, [cellSizes, onSizesChange]);

  useEffect(() => {
    const measureCells = () => {
      const el = collageRef.current;
      if (!el) return;
      const next: Record<number, { width: number; height: number }> = {};
      el.querySelectorAll<HTMLElement>("[data-position]").forEach((cell) => {
        const position = Number(cell.dataset.position);
        const rect = cell.getBoundingClientRect();
        if (!Number.isNaN(position) && rect.width > 0 && rect.height > 0) {
          next[position] = { width: rect.width, height: rect.height };
        }
      });

      setCellSizes((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        const changed =
          prevKeys.length !== nextKeys.length ||
          nextKeys.some((key) => {
            const p = Number(key);
            const a = prev[p];
            const b = next[p];
            return !a || Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5;
          });
        return changed ? next : prev;
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
    // cellGap changes the layout, so re-measure when it changes.
  }, [collageRef, aspectRatio.ratio, layout.id, cellGap]);

  const totalCells = getLayoutCellCount(layout);
  const placedCount = images.filter((img) => img.position !== undefined).length;

  const getPreviewImageStyle = (
    image: CollageImage,
    transform: ImageTransform | undefined,
    position: number
  ): React.CSSProperties => {
    const t = normalizeImageTransform(transform);
    const imageSize = imageSizes[image.id];
    const cellSize = cellSizes[position];

    if (imageSize && cellSize) {
      const { drawWidth, drawHeight, drawX, drawY } = getImageDrawRect(
        imageSize.width,
        imageSize.height,
        cellSize.width,
        cellSize.height,
        t
      );
      return {
        left: `${drawX}px`,
        top: `${drawY}px`,
        width: `${drawWidth}px`,
        height: `${drawHeight}px`,
        objectFit: "fill",
        transform: `${t.scale < 0 ? "scaleX(-1) " : ""}rotate(${t.rotation}rad)`,
        transformOrigin: "center",
      };
    }

    if (!imageSize) {
      return {
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: t.fitMode === "stretch" ? "fill" : t.fitMode === "contain" ? "contain" : "cover",
        objectPosition: `${t.offsetX * 100}% ${t.offsetY * 100}%`,
        transform: `scale(${Math.abs(t.scale)}) ${t.scale < 0 ? "scaleX(-1) " : ""}rotate(${t.rotation}rad)`,
        transformOrigin: "center",
      };
    }

    const imgRatio = imageSize.width / imageSize.height;
    const cellRatio = (aspectRatio.ratio * layout.rows) / layout.cols;
    const scale = Math.abs(t.scale) || 1;
    const fitMode = t.fitMode ?? "cover";
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
      left: `${(100 - widthPercent) * t.offsetX}%`,
      top: `${(100 - heightPercent) * t.offsetY}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        objectFit: "fill",
        transform: `${t.scale < 0 ? "scaleX(-1) " : ""}rotate(${t.rotation}rad)`,
        transformOrigin: "center",
      };
  };

  const getDragReadyTransform = (
    imageWidth: number,
    imageHeight: number,
    cellWidth: number,
    cellHeight: number,
    transform: ImageTransform
  ): ImageTransform => {
    const rect = getImageDrawRect(imageWidth, imageHeight, cellWidth, cellHeight, transform);
    if (rect.drawWidth > cellWidth + 0.5 && rect.drawHeight > cellHeight + 0.5) {
      return transform;
    }

    const sign = transform.scale < 0 ? -1 : 1;
    return { ...transform, scale: Math.max(Math.abs(transform.scale) || 1, 1.12) * sign };
  };

  const getDraggedTransform = (
    state: DragState,
    clientX: number,
    clientY: number
  ): ImageTransform => {
    const dx = clientX - state.startClientX;
    const dy = clientY - state.startClientY;
    const rect = getImageDrawRect(
      state.imageWidth,
      state.imageHeight,
      state.cellWidth,
      state.cellHeight,
      state.dragTransform
    );
    const overflowX = rect.drawWidth - state.cellWidth;
    const overflowY = rect.drawHeight - state.cellHeight;

    return {
      ...state.dragTransform,
      offsetX:
        overflowX > 0.5
          ? Math.max(0, Math.min(1, state.startTransform.offsetX - dx / overflowX))
          : state.dragTransform.offsetX,
      offsetY:
        overflowY > 0.5
          ? Math.max(0, Math.min(1, state.startTransform.offsetY - dy / overflowY))
          : state.dragTransform.offsetY,
    };
  };

  const handleImagePointerDown = (
    event: React.PointerEvent<HTMLImageElement>,
    image: CollageImage,
    position: number,
    transform: ImageTransform | undefined
  ) => {
    const imageSize = imageSizes[image.id];
    const cellSize = cellSizes[position];
    if (!imageSize || !cellSize) return;

    event.preventDefault();
    event.stopPropagation();
    onSelectImage(image.id);

    const baseTransform = normalizeImageTransform(transform);
    const dragTransform = getDragReadyTransform(
      imageSize.width,
      imageSize.height,
      cellSize.width,
      cellSize.height,
      baseTransform
    );

    dragStateRef.current = {
      imageId: image.id,
      position,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startTransform: dragTransform,
      dragTransform,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height,
      cellWidth: cellSize.width,
      cellHeight: cellSize.height,
      didMove: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleImagePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    const next = getDraggedTransform(state, event.clientX, event.clientY);
    state.didMove =
      state.didMove ||
      Math.abs(event.clientX - state.startClientX) > 1 ||
      Math.abs(event.clientY - state.startClientY) > 1;
    onUpdateTransform(state.imageId, next);
  };

  const finishImageDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (state.didMove) onCommitTransform();
  };

  const handleCanvasBackgroundClick = (e: React.MouseEvent) => {
    // Click outside any cell deselects.
    if (e.target === e.currentTarget) {
      onSelectImage(null);
    }
  };

  const targetWidth = aspectRatio.width;
  const targetHeight = aspectRatio.height;

  return (
    <main className="relative flex flex-1 flex-col bg-[hsl(var(--secondary))] min-w-0">
      {/* Canvas chrome */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{aspectRatio.name}</span>
          <span className="h-3 w-px bg-border" />
          <span className="tabular-nums">
            {targetWidth} × {targetHeight} px
          </span>
          <span className="h-3 w-px bg-border" />
          <span>
            {placedCount} / {totalCells} 已填充
          </span>
        </div>
      </div>

      {/* Canvas body */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-8"
        onClick={handleCanvasBackgroundClick}
      >
        <div className="absolute inset-0 subtle-grid opacity-30" aria-hidden />

        <div
          className="relative w-full rounded-xl bg-card shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)]"
          style={{
            maxWidth:
              aspectRatio.ratio < 0.7
                ? "min(440px, 70vh * 0.65)"
                : aspectRatio.ratio > 1.4
                ? "min(720px, 100vw - 700px)"
                : "min(560px, 80vh)",
          }}
        >
          <div
            className="relative w-full"
            style={{ paddingBottom: `${(1 / aspectRatio.ratio) * 100}%` }}
          >
            <div
              ref={collageRef}
              className={`${getCollageGridClass(layout)} absolute inset-0`}
              style={{
                width: "100%",
                height: "100%",
                gap: `${cellGap}px`,
                padding: `${cellGap}px`,
                ...getCollageGridStyle(layout),
              }}
            >
              {Array.from({ length: totalCells }).map((_, i) => {
                const image = images.find((img) => img.position === i);
                const isSelected = !!image && selectedImageId === image.id;
                const isDragOver = draggedOver === i;
                const transform = image?.transform;

                return (
                  <div
                    key={`cell-${i}`}
                    className={cn(
                      "group/cell relative flex h-full w-full items-center justify-center overflow-hidden transition-all",
                      isDragOver && "ring-2 ring-primary",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      !image &&
                        !isDragOver &&
                        "border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
                    )}
                    style={{
                      ...(layout.custom ? getCellGridArea(layout.id, i) : {}),
                    }}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDrop={() => onDrop(i)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!image) onCellClick(i);
                    }}
                    data-position={i}
                  >
                    {image ? (
                      <div
                        className="relative h-full w-full overflow-hidden"
                        style={getMaskStyle(layout, i)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectImage(image.id);
                        }}
                      >
                        <img
                          src={image.url}
                          alt=""
                          className="absolute max-w-none cursor-grab select-none touch-none active:cursor-grabbing"
                          onLoad={(event) => {
                            const target = event.currentTarget;
                            setImageSizes((prev) => {
                              const existing = prev[image.id];
                              if (
                                existing?.width === target.naturalWidth &&
                                existing?.height === target.naturalHeight
                              ) {
                                return prev;
                              }
                              return {
                                ...prev,
                                [image.id]: {
                                  width: target.naturalWidth,
                                  height: target.naturalHeight,
                                },
                              };
                            });
                          }}
                          draggable={false}
                          onPointerDown={(event) =>
                            handleImagePointerDown(event, image, i, transform)
                          }
                          onPointerMove={handleImagePointerMove}
                          onPointerUp={finishImageDrag}
                          onPointerCancel={finishImageDrag}
                          crossOrigin={image.url.startsWith("data:") ? undefined : "anonymous"}
                          style={getPreviewImageStyle(image, transform, i)}
                        />

                        {/* Hover quick-remove (only when not selected) */}
                        {!isSelected && (
                          <button
                            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-card/95 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover/cell:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromCell(image.id);
                            }}
                            title="从拼图中移除"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Selection corner handles + floating toolbar */}
                        {isSelected && (
                          <>
                            <CornerHandle pos="top-left" />
                            <CornerHandle pos="top-right" />
                            <CornerHandle pos="bottom-left" />
                            <CornerHandle pos="bottom-right" />
                            <FloatingImageToolbar
                              placement={
                                !layout.custom && i >= layout.cols * (layout.rows - 1)
                                  ? "above"
                                  : "below"
                              }
                              onFit={() => onQuickAction("fit")}
                              onFill={() => onQuickAction("fill")}
                              onRotate={() => onQuickAction("rotate90")}
                              onFlip={() => onQuickAction("flip")}
                              onReplace={() => onReplace(image.id)}
                              onRemove={() => onRemoveFromCell(image.id)}
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      <EmptyCell isDragOver={isDragOver} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card/40 px-4 py-2 text-center text-[11px] text-muted-foreground">
        点击空格添加照片 · 拖拽调换位置 · 选中后可在画布上直接编辑
      </div>
    </main>
  );
}

// ----- Sub-components -----

function CornerHandle({
  pos,
}: {
  pos: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const cls: Record<typeof pos, string> = {
    "top-left": "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    "top-right": "right-0 top-0 translate-x-1/2 -translate-y-1/2",
    "bottom-left": "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
    "bottom-right": "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
  };
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-20 h-2.5 w-2.5 rounded-sm border-2 border-primary bg-card shadow-sm",
        cls[pos]
      )}
    />
  );
}

interface FloatingImageToolbarProps {
  placement?: "above" | "below";
  onFit: () => void;
  onFill: () => void;
  onRotate: () => void;
  onFlip: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

function FloatingImageToolbar({
  placement = "below",
  onFit,
  onFill,
  onRotate,
  onFlip,
  onReplace,
  onRemove,
}: FloatingImageToolbarProps) {
  return (
    <div
      className={cn(
        "absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-card px-1 py-1 shadow-lg",
        placement === "above" ? "bottom-full mb-3" : "top-full mt-3"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <ToolbarButton icon={Maximize2} label="适应" onClick={onFit} />
      <ToolbarButton icon={Crop} label="填满" onClick={onFill} />
      <ToolbarButton icon={RotateCw} label="旋转 90°" onClick={onRotate} />
      <ToolbarButton icon={FlipHorizontal} label="翻转" onClick={onFlip} />
      <span className="mx-0.5 h-5 w-px bg-border" />
      <ToolbarButton icon={Replace} label="替换" onClick={onReplace} />
      <ToolbarButton icon={Trash2} label="删除" onClick={onRemove} danger />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Maximize2;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        danger
          ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function EmptyCell({ isDragOver }: { isDragOver: boolean }) {
  return (
    <div className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-1 p-1 text-center">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors sm:h-8 sm:w-8",
          isDragOver ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
        )}
      >
        {isDragOver ? <ImageIcon className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
      </div>
      <p className="w-full truncate px-1 text-[10px] font-medium leading-4 text-primary sm:text-[11px]">
        {isDragOver ? "松开放入" : "点击添加"}
      </p>
    </div>
  );
}
