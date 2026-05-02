"use client";

import { useMemo } from "react";
import {
  Crop,
  FlipHorizontal,
  ImageIcon,
  Lock,
  Maximize2,
  Replace,
  RotateCcw,
  RotateCw,
  Sparkles,
  X,
} from "lucide-react";
import { normalizeImageTransform } from "../constants";
import { getImageDrawRect } from "../utils/imageUtils";
import type { CollageImage, ImageTransform, SizeMap, TranslateFn } from "./types";
import { cn } from "@/lib/utils";

interface RightPanelProps {
  selectedImage: CollageImage | undefined;
  placedCount: number;
  totalCells: number;
  sizes: SizeMap;
  onUpdateTransform: (id: string, t: ImageTransform) => void;
  onCommitTransform: () => void;
  onQuickAction: (action: "fit" | "fill" | "rotate90" | "flip" | "reset") => void;
  onReplace: (id: string) => void;
  onClose: () => void;
  isToolOpen?: boolean;
  translateFn: TranslateFn;
}

interface AxisRoom {
  hasRoom: boolean;
  /** Pixels of overflow available in this axis (0 means perfectly filling). */
  overflow: number;
}

function computeAxisRoom(
  imgWidth: number,
  imgHeight: number,
  cellWidth: number,
  cellHeight: number,
  transform: ImageTransform
): { x: AxisRoom; y: AxisRoom } {
  const { drawWidth, drawHeight } = getImageDrawRect(
    imgWidth,
    imgHeight,
    cellWidth,
    cellHeight,
    transform
  );

  const overflowX = Math.max(0, drawWidth - cellWidth);
  const overflowY = Math.max(0, drawHeight - cellHeight);
  return {
    x: { hasRoom: overflowX > 0.5, overflow: overflowX },
    y: { hasRoom: overflowY > 0.5, overflow: overflowY },
  };
}

export default function RightPanel({
  selectedImage,
  placedCount,
  totalCells,
  sizes,
  onUpdateTransform,
  onCommitTransform,
  onQuickAction,
  onReplace,
  onClose,
  isToolOpen,
}: RightPanelProps) {
  if (!selectedImage) {
    return <EmptyState placedCount={placedCount} totalCells={totalCells} isToolOpen={isToolOpen} />;
  }

  return (
    <SelectedState
      image={selectedImage}
      sizes={sizes}
      onUpdateTransform={onUpdateTransform}
      onCommitTransform={onCommitTransform}
      onQuickAction={onQuickAction}
      onReplace={onReplace}
      onClose={onClose}
      isToolOpen={isToolOpen}
    />
  );
}

// ---------- Empty state ----------

function getPanelClassName(isToolOpen?: boolean) {
  return cn(
    "hidden w-64 shrink-0 flex-col border-l border-border bg-card xl:w-72",
    isToolOpen ? "min-[1100px]:flex" : "min-[760px]:flex"
  );
}

function EmptyState({
  placedCount,
  totalCells,
  isToolOpen,
}: {
  placedCount: number;
  totalCells: number;
  isToolOpen?: boolean;
}) {
  return (
    <aside className={getPanelClassName(isToolOpen)}>
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">图片调整</h3>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
          点击画布中的图片开始编辑
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-background text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">还没选中图片</h4>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
            点击拼图里的任意一张照片，可以调整缩放、旋转、位置和滤镜。
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-secondary/80 px-2.5 py-1 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            已放置 {placedCount} / {totalCells}
          </div>
        </div>

        <div className="mt-5">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            快捷键
          </h4>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <ShortcutLine keyLabel="⌘ Z" desc="撤销" />
            <ShortcutLine keyLabel="⌘ ⇧ Z" desc="重做" />
            <ShortcutLine keyLabel="Delete" desc="移除选中图片" />
            <ShortcutLine keyLabel="R" desc="选中图片旋转 90°" />
            <ShortcutLine keyLabel="Esc" desc="取消选择" />
          </ul>
        </div>
      </div>
    </aside>
  );
}

function ShortcutLine({ keyLabel, desc }: { keyLabel: string; desc: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span>{desc}</span>
      <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
        {keyLabel}
      </kbd>
    </li>
  );
}

// ---------- Selected state ----------

interface SelectedStateProps {
  image: CollageImage;
  sizes: SizeMap;
  onUpdateTransform: (id: string, t: ImageTransform) => void;
  onCommitTransform: () => void;
  onQuickAction: (action: "fit" | "fill" | "rotate90" | "flip" | "reset") => void;
  onReplace: (id: string) => void;
  onClose: () => void;
  isToolOpen?: boolean;
}

function SelectedState({
  image,
  sizes,
  onUpdateTransform,
  onCommitTransform,
  onQuickAction,
  onReplace,
  onClose,
  isToolOpen,
}: SelectedStateProps) {
  const transform = useMemo(
    () => normalizeImageTransform(image.transform),
    [image.transform]
  );
  const rotationDegrees = Math.round((transform.rotation * 180) / Math.PI);

  const ensureAxisRoom = (axis: "x" | "y", next: ImageTransform): ImageTransform => {
    const imgSize = sizes.images[image.id];
    const cellSize =
      typeof image.position === "number" ? sizes.cells[image.position] : undefined;
    if (!imgSize || !cellSize) return next;

    const room = computeAxisRoom(
      imgSize.width,
      imgSize.height,
      cellSize.width,
      cellSize.height,
      next
    );
    if (room[axis].hasRoom) return next;

    const scaleSign = next.scale < 0 ? -1 : 1;
    const currentScale = Math.abs(next.scale) || 1;
    return { ...next, scale: Math.max(currentScale, 1.08) * scaleSign };
  };

  const updateTransient = (patch: Partial<ImageTransform>, axis?: "x" | "y") => {
    const next = { ...transform, ...patch };
    onUpdateTransform(image.id, axis ? ensureAxisRoom(axis, next) : next);
  };

  const handleUnlockAxis = () => {
    // Slightly zoom in (preserving aspect ratio) so both axes get room to pan.
    // If the user already zoomed beyond 1.05, leave it alone — they're already
    // in a state where both axes should have room.
    const sign = transform.scale < 0 ? -1 : 1;
    const nextScale = Math.max(Math.abs(transform.scale), 1.08) * sign;
    onUpdateTransform(image.id, { ...transform, scale: nextScale });
    onCommitTransform();
  };

  return (
    <aside className={getPanelClassName(isToolOpen)}>
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">图片调整</h3>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              已选中
            </span>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="取消选择 (Esc)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {image.position !== undefined && (
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
            位置 #{image.position + 1} · 双击画布也可取消选择
          </p>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Preview + Replace */}
        <div className="relative aspect-video overflow-hidden rounded-md bg-secondary">
          <img
            src={image.url}
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectFit: transform.keepAspectRatio
                ? transform.fitMode === "contain"
                  ? "contain"
                  : "cover"
                : "fill",
              objectPosition: `${transform.offsetX * 100}% ${transform.offsetY * 100}%`,
              transform: `scale(${Math.abs(transform.scale)}) rotate(${transform.rotation}rad)`,
              transformOrigin: "center",
            }}
          />
          <button
            onClick={() => onReplace(image.id)}
            className="absolute right-2 top-2 flex h-7 items-center gap-1 rounded-md bg-card/95 px-2 text-[11px] font-medium text-foreground shadow-sm hover:bg-card"
          >
            <Replace className="h-3 w-3" />
            替换
          </button>
        </div>

        {/* Quick actions */}
        <div>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            快捷操作
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            <QuickAction icon={Maximize2} label="适应格子" onClick={() => onQuickAction("fit")} />
            <QuickAction icon={Crop} label="填满格子" onClick={() => onQuickAction("fill")} />
            <QuickAction
              icon={RotateCw}
              label="旋转 90°"
              onClick={() => onQuickAction("rotate90")}
            />
            <QuickAction
              icon={FlipHorizontal}
              label="水平翻转"
              onClick={() => onQuickAction("flip")}
            />
          </div>
        </div>

        {/* Manual sliders */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            手动调整
          </h4>

          <Slider
            label="缩放"
            value={`${(Math.abs(transform.scale)).toFixed(1)}x`}
            min={0.5}
            max={2}
            step={0.05}
            current={Math.abs(transform.scale)}
            onChange={(v) => {
              const sign = transform.scale < 0 ? -1 : 1;
              updateTransient({ scale: sign * v });
            }}
            onCommit={onCommitTransform}
          />

          <Slider
            label="旋转"
            value={`${rotationDegrees}°`}
            min={-180}
            max={180}
            step={1}
            current={rotationDegrees}
            onChange={(v) => updateTransient({ rotation: (v * Math.PI) / 180 })}
            onCommit={onCommitTransform}
          />

          <PositionSlider
            label="水平位置"
            current={1 - transform.offsetX}
            onChange={(v) => updateTransient({ offsetX: 1 - v }, "x")}
            onCommit={onCommitTransform}
            hasRoom
            onUnlock={handleUnlockAxis}
            unlockHint="拖动时会自动放大以腾出水平移动空间"
          />

          <PositionSlider
            label="垂直位置"
            current={1 - transform.offsetY}
            onChange={(v) => updateTransient({ offsetY: 1 - v }, "y")}
            onCommit={onCommitTransform}
            hasRoom
            onUnlock={handleUnlockAxis}
            unlockHint="拖动时会自动放大以腾出垂直移动空间"
          />

          <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">锁定原始比例</span>
            </div>
            <Toggle
              on={transform.keepAspectRatio}
              onChange={() => {
                const keepAspectRatio = !transform.keepAspectRatio;
                onUpdateTransform(image.id, {
                  ...transform,
                  keepAspectRatio,
                  fitMode: keepAspectRatio ? "cover" : "stretch",
                });
                onCommitTransform();
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <button
          onClick={() => onQuickAction("reset")}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          重置全部调整
        </button>
      </div>
    </aside>
  );
}

// ---------- helpers ----------

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Maximize2;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </button>
  );
}

interface SliderProps {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
  onCommit: () => void;
}

function Slider({ label, value, min, max, step, current, onChange, onCommit }: SliderProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px] tabular-nums text-foreground">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="h-2 w-full cursor-pointer accent-primary"
      />
    </div>
  );
}

interface PositionSliderProps {
  label: string;
  current: number;
  onChange: (value: number) => void;
  onCommit: () => void;
  hasRoom: boolean;
  onUnlock: () => void;
  unlockHint: string;
}

function PositionSlider({
  label,
  current,
  onChange,
  onCommit,
  hasRoom,
  onUnlock,
  unlockHint,
}: PositionSliderProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium",
            hasRoom ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 text-[11px] tabular-nums",
            hasRoom
              ? "border-border bg-background text-foreground"
              : "border-border bg-secondary/60 text-muted-foreground"
          )}
        >
          {Math.round(current * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={current}
        disabled={!hasRoom}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className={cn(
          "h-2 w-full accent-primary",
          hasRoom ? "cursor-pointer" : "cursor-not-allowed opacity-50"
        )}
      />
      {!hasRoom && (
        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-md border border-dashed border-border bg-secondary/40 px-2 py-1 text-[10px] leading-4 text-muted-foreground">
          <span>{unlockHint}</span>
          <button
            type="button"
            onClick={onUnlock}
            className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary hover:bg-primary/20"
          >
            解锁
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={on}
      className={cn(
        "relative inline-flex h-5 w-10 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
        on ? "bg-primary" : "bg-secondary"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background ring-0 transition duration-200 ease-in-out",
          on ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
