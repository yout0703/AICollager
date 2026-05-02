"use client";

import { useMemo } from "react";
import { CollageImage, DEFAULT_IMAGE_TRANSFORM, ImageTransform } from "./constants";
import { Button } from "@/components/ui/button";
import { ImageIcon, RotateCcw, SlidersHorizontal, X } from "lucide-react";

interface ImageEditToolbarProps {
  image: CollageImage | undefined;
  onChange: (transform: ImageTransform) => void;
  onClose: () => void;
  translateFn: (key: string) => string;
  placedCount?: number;
}

export default function ImageEditToolbar({
  image,
  onChange,
  onClose,
  translateFn,
  placedCount = 0
}: ImageEditToolbarProps) {
  const transform = useMemo(() => {
    return image?.transform || DEFAULT_IMAGE_TRANSFORM;
  }, [image]);

  if (!image) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {translateFn('collageWorkspace.fineTune')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {placedCount} {translateFn('collageWorkspace.editEmptyStats')}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-background text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {translateFn('collageWorkspace.editEmptyTitle')}
          </h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {translateFn('collageWorkspace.editEmptyDescription')}
          </p>
        </div>
      </div>
    );
  }

  const rangeClassName = "h-2 w-full cursor-pointer accent-primary";

  // 处理缩放变化
  const handleScaleChange = (newScale: number) => {
    onChange({
      ...transform,
      scale: newScale
    });
  };

  // 处理旋转变化
  const handleRotationChange = (newRotation: number) => {
    onChange({
      ...transform,
      rotation: newRotation * (Math.PI / 180) // 转换为弧度
    });
  };

  // 处理偏移量变化
  const handleOffsetChange = (axis: 'X' | 'Y', value: number) => {
    onChange({
      ...transform,
      [`offset${axis}`]: value
    });
  };

  // 处理保持比例切换
  const handleKeepAspectRatioToggle = () => {
    onChange({
      ...transform,
      keepAspectRatio: !transform.keepAspectRatio
    });
  };

  // 重置变换
  const handleResetTransform = () => {
    onChange({ ...DEFAULT_IMAGE_TRANSFORM });
  };

  // 获取旋转角度（转换为度数）
  const rotationDegrees = Math.round((transform.rotation * 180) / Math.PI);

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{translateFn('imageEditor')}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {translateFn('collageWorkspace.selectedImage')}
          </p>
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={onClose}
          title={translateFn('ui.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5">
        {/* 图片预览 */}
        <div className="relative h-40 w-full overflow-hidden rounded-lg bg-secondary">
          <img
            src={image.url}
            alt={translateFn("imagePreview")}
            className={`w-full h-full ${transform.keepAspectRatio ? 'object-contain' : 'object-fill'}`}
            style={{
              transform: `scale(${transform.scale}) rotate(${transform.rotation}rad)`,
              transformOrigin: 'center',
              objectPosition: `${transform.offsetX * 100}% ${transform.offsetY * 100}%`
            }}
          />
        </div>

        {/* 缩放控制 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">{translateFn('scale')}</label>
            <span className="text-xs text-muted-foreground">{transform.scale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={transform.scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className={rangeClassName}
          />
        </div>

        {/* 旋转控制 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">{translateFn('editor.rotation')}</label>
            <span className="text-xs text-muted-foreground">{rotationDegrees}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={rotationDegrees}
            onChange={(e) => handleRotationChange(parseInt(e.target.value))}
            className={rangeClassName}
          />
        </div>

        {/* 水平位置控制 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">{translateFn('horizontalPosition')}</label>
            <span className="text-xs text-muted-foreground">{Math.round(transform.offsetX * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={transform.offsetX}
            onChange={(e) => handleOffsetChange('X', parseFloat(e.target.value))}
            className={rangeClassName}
          />
        </div>

        {/* 垂直位置控制 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">{translateFn('verticalPosition')}</label>
            <span className="text-xs text-muted-foreground">{Math.round(transform.offsetY * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={transform.offsetY}
            onChange={(e) => handleOffsetChange('Y', parseFloat(e.target.value))}
            className={rangeClassName}
          />
        </div>

        {/* 保持比例切换 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{translateFn('keepRatio')}</span>
          <button
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              transform.keepAspectRatio ? 'bg-primary' : 'bg-secondary'
            }`}
            onClick={handleKeepAspectRatioToggle}
            aria-pressed={transform.keepAspectRatio}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background ring-0 transition duration-200 ease-in-out ${
                transform.keepAspectRatio ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 底部操作区：重置按钮 */}
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleResetTransform}
            title={translateFn("resetTransform")}
          >
            <RotateCcw className="h-4 w-4" />
            {translateFn("collageWorkspace.reset")}
          </Button>
        </div>
      </div>
    </div>
  );
}
