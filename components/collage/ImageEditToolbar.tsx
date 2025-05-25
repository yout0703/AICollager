"use client";

import { useMemo } from "react";
import { CollageImage, DEFAULT_IMAGE_TRANSFORM, ImageTransform } from "./constants";

interface ImageEditToolbarProps {
  image: CollageImage | undefined;
  onChange: (transform: ImageTransform) => void;
  onClose: () => void;
  translateFn: (key: string) => string;
}

export default function ImageEditToolbar({
  image,
  onChange,
  onClose,
  translateFn
}: ImageEditToolbarProps) {
  const transform = useMemo(() => {
    return image?.transform || DEFAULT_IMAGE_TRANSFORM;
  }, [image]);

  if (!image) return null;

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
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">{translateFn('imageEditor')}</h3>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
          title={translateFn('close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* 图片预览 */}
        <div className="relative w-full h-36 bg-gray-100 rounded-md overflow-hidden">
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
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-500">{translateFn('scale')}</label>
            <span className="text-xs">{transform.scale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={transform.scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 旋转控制 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-500">{translateFn('rotation')}</label>
            <span className="text-xs">{rotationDegrees}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={rotationDegrees}
            onChange={(e) => handleRotationChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 水平位置控制 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-500">{translateFn('horizontalPosition')}</label>
            <span className="text-xs">{Math.round(transform.offsetX * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={transform.offsetX}
            onChange={(e) => handleOffsetChange('X', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 垂直位置控制 */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-500">{translateFn('verticalPosition')}</label>
            <span className="text-xs">{Math.round(transform.offsetY * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={transform.offsetY}
            onChange={(e) => handleOffsetChange('Y', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* 保持比例切换 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{translateFn('keepRatio')}</span>
          <button
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              transform.keepAspectRatio ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            onClick={handleKeepAspectRatioToggle}
            aria-pressed={transform.keepAspectRatio}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                transform.keepAspectRatio ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 底部操作区：重置按钮 */}
        <div className="flex justify-center pt-2">
          <button
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded transition-colors"
            onClick={handleResetTransform}
            title={translateFn("resetTransform")}
          >
            {translateFn("resetTransform")}
          </button>
        </div>
      </div>
    </div>
  );
} 