"use client";

import { RefObject, useState } from "react";
import { CollageImage, DEFAULT_IMAGE_TRANSFORM, ImageTransform, Layout, getCollageGridClass, getCollageGridStyle, AspectRatio } from "./constants";

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
  onUpdateImageTransform,
  onImageClick,
  translateFn,
  collageRef
}: CollagePreviewProps) {
  // 精确模式状态
  const [exactMode, setExactMode] = useState(false);
  // 当前选中的图片
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  // 处理图片选择
  const handleImageSelect = (id: string) => {
    setSelectedImageId(prev => prev === id ? null : id);
    // 如果提供了外部点击回调，则调用它
    if (onImageClick) {
      onImageClick(id);
    }
  };
  
  // 处理缩放变化
  const handleScaleChange = (id: string, newScale: number) => {
    const image = images.find(img => img.id === id);
    if (!image) return;
    
    const currentTransform = image.transform || DEFAULT_IMAGE_TRANSFORM;
    onUpdateImageTransform(id, {
      ...currentTransform,
      scale: newScale
    });
  };
  
  // 处理保持比例切换
  const handleKeepAspectRatioToggle = (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;
    
    const currentTransform = image.transform || DEFAULT_IMAGE_TRANSFORM;
    onUpdateImageTransform(id, {
      ...currentTransform,
      keepAspectRatio: !currentTransform.keepAspectRatio
    });
  };
  
  // 处理重置变换
  const handleResetTransform = (id: string) => {
    const image = images.find(img => img.id === id);
    if (!image) return;
    
    onUpdateImageTransform(id, { ...DEFAULT_IMAGE_TRANSFORM });
  };
  
  return (
    <div className="h-full p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">{translateFn('previewArea')}</h3>
        <div className="flex flex-col items-end">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">{exactMode ? translateFn('exactMode') : translateFn('beautyMode')}</span>
            <button 
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${exactMode ? 'bg-blue-600' : 'bg-gray-200'}`}
              onClick={() => setExactMode(!exactMode)}
              aria-pressed={exactMode}
              title={exactMode ? translateFn('switchToBeautyMode') : translateFn('switchToExactMode')}
            >
              <span 
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${exactMode ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{translateFn('exactModeDescription')}</p>
        </div>
      </div>
      
      <div 
        className="relative mx-auto" 
        style={{ 
          paddingBottom: `${(1 / selectedAspectRatio.ratio) * 100}%`, 
          maxWidth: "90%" 
        }}
      >
        <div 
          ref={collageRef}
          className={`${getCollageGridClass(selectedLayout)} absolute inset-0 shadow-md`}
          style={{ 
            width: '100%',
            height: '100%',
            gap: '8px',
            ...getCollageGridStyle(selectedLayout)
          }}
        >
          {Array.from({ length: selectedLayout.cols * selectedLayout.rows }).map((_, i) => {
            const image = images.find(img => img.position === i);
            const cellClass = selectedLayout.custom && selectedLayout.id === "layout-6" 
              ? `cell-${i}`
              : '';
            
            const isSelected = image && selectedImageId === image.id;
              
            return (
              <div
                key={`cell-${i}`}
                className={`w-full h-full border flex items-center justify-center overflow-hidden ${cellClass} ${
                  draggedOver === i 
                    ? 'bg-blue-100 border-blue-300 border-2' 
                    : isSelected
                      ? 'border-blue-500 border-2'
                      : image 
                        ? 'border-gray-300' 
                        : 'border-gray-200 bg-gray-50'
                }`}
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
                    className="relative w-full h-full overflow-hidden"
                    style={getMaskStyle(selectedLayout, i)}
                  >
                    <img
                      src={image.url}
                      alt={translateFn("collageImage")}
                      className={`w-full h-full ${
                        exactMode 
                          ? 'object-fill' 
                          : (image.transform?.keepAspectRatio !== false) 
                            ? 'object-cover' 
                            : 'object-fill'
                      } cursor-pointer`}
                      onClick={() => handleImageSelect(image.id)}
                      draggable={false}
                      crossOrigin={image.url.startsWith('data:') ? undefined : "anonymous"}
                      style={{
                        transform: exactMode 
                          ? 'none' 
                          : `scale(${image.transform?.scale || 1})`,
                        transformOrigin: 'center',
                        maxWidth: '100%',
                        maxHeight: '100%'
                      }}
                    />
                    <button
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImage(image.id);
                      }}
                      title={translateFn("removeImage")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-400">{translateFn('dragImages')}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 选中图片的控制面板 */}
      {selectedImageId && (
        <div className="mt-3 p-2 border border-gray-200 rounded-md bg-gray-50">
          <h4 className="text-xs font-medium mb-2">{translateFn('imageControls')}</h4>
          
          {(() => {
            const selectedImage = images.find(img => img.id === selectedImageId);
            if (!selectedImage) return null;
            
            const transform = selectedImage.transform || DEFAULT_IMAGE_TRANSFORM;
            
            return (
              <div className="space-y-2">
                {/* 缩放控制 */}
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 w-16">{translateFn('scale')}</span>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2" 
                    step="0.1" 
                    value={transform.scale} 
                    onChange={(e) => handleScaleChange(selectedImageId, parseFloat(e.target.value))}
                    className="flex-1" 
                  />
                  <span className="text-xs ml-2 w-8">{transform.scale.toFixed(1)}</span>
                </div>
                
                {/* 保持比例切换 */}
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 w-16">{translateFn('keepRatio')}</span>
                  <button 
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${transform.keepAspectRatio ? 'bg-blue-600' : 'bg-gray-200'}`}
                    onClick={() => handleKeepAspectRatioToggle(selectedImageId)}
                    aria-pressed={transform.keepAspectRatio}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${transform.keepAspectRatio ? 'translate-x-5' : 'translate-x-0'}`} 
                    />
                  </button>
                </div>
              </div>
            );
          })()}
          
          {/* 重置按钮 */}
          <div className="flex justify-end mt-2">
            <button 
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded"
              onClick={() => handleResetTransform(selectedImageId)}
              title={translateFn("resetTransform")}
            >
              {translateFn("resetTransform")}
            </button>
          </div>
        </div>
      )}
      
      <p className="mt-3 text-center text-xs text-gray-500">
        {translateFn('previewInstructions')}
      </p>
      
      <div className="mt-2 text-center text-xs text-gray-400">
        <span className="inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {selectedImageId 
            ? translateFn('clickImageToEditInfo')
            : exactMode 
              ? translateFn('exactModeInfo') 
              : translateFn('aspectRatioInfo')}
        </span>
      </div>
    </div>
  );
} 