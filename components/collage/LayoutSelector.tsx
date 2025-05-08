"use client";

import { Layout, SHAPE_LAYOUTS, MaskShape } from "./constants";

interface LayoutSelectorProps {
  layouts: Layout[];
  shapeLayouts?: Layout[];
  selectedLayout: Layout;
  onSelectLayout: (layout: Layout) => void;
  translateFn: (key: string) => string;
}

// 从CollagePreview组件复制的辅助函数，应用蒙版CSS样式
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

// 自定义布局渲染函数 - 根据不同布局ID渲染不同的预览样式
const getLayoutPreview = (layout: Layout) => {
  const { id, cols, rows } = layout;
  
  // 渲染特殊布局
  if (layout.custom) {
    if (id === "layout-6") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-2 gap-1 p-1">
          <div className="bg-gray-300 row-span-2 col-span-2"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
        </div>
      );
    }
    
    if (id === "layout-7") {
      return (
        <div className="w-full aspect-square grid grid-cols-4 grid-rows-3 gap-1 p-1">
          <div className="bg-gray-300 col-span-2 row-span-1"></div>
          <div className="bg-gray-300 col-span-2 row-span-3"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-2 row-span-1"></div>
        </div>
      );
    }
    
    if (id === "layout-8") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-4 gap-1 p-1">
          <div className="bg-gray-300 col-span-3 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-2"></div>
        </div>
      );
    }
    
    if (id === "layout-9") {
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-3 gap-1 p-1">
          <div className="bg-gray-300 col-span-2 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
        </div>
      );
    }
    
    if (id === "layout-10") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-2 gap-1 p-1">
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-3 row-span-1"></div>
        </div>
      );
    }
    
    if (id === "layout-11") {
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-3 gap-1 p-1">
          <div className="bg-gray-300 col-span-1 row-span-3"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
        </div>
      );
    }
    
    if (id === "layout-12") {
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-3 gap-1 p-1">
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
        </div>
      );
    }
  }
  
  // 根据不同的ID返回特定的布局预览
  switch (id) {
    // 基础布局
    case "layout-1": // 2x1
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-1 gap-1 p-1">
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
        </div>
      );
    case "layout-2": // 2x2
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-2 gap-1 p-1">
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
        </div>
      );
    case "layout-3": // 3x1
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-1 gap-1 p-1">
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
        </div>
      );
    case "layout-4": // 1x2
      return (
        <div className="w-full aspect-square grid grid-cols-1 grid-rows-2 gap-1 p-1">
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
        </div>
      );
    case "layout-5": // 3x2
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-2 gap-1 p-1">
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
          <div className="bg-gray-300"></div>
        </div>
      );
      
    // 更多布局样式 - 参考图片中的样式
    case "layout-7": // 左侧3个小格，右侧1个大格
      return (
        <div className="w-full aspect-square grid grid-cols-4 grid-rows-3 gap-1 p-1">
          <div className="bg-gray-300 col-span-2 row-span-1"></div>
          <div className="bg-gray-300 col-span-2 row-span-3"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-2 row-span-1"></div>
        </div>
      );
    case "layout-8": // 上方1个大格，下方3个小格
      return (
        <div className="w-full aspect-square grid grid-cols-3 grid-rows-4 gap-1 p-1">
          <div className="bg-gray-300 col-span-3 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-2"></div>
        </div>
      );
    case "layout-9": // 上1大下2小
      return (
        <div className="w-full aspect-square grid grid-cols-2 grid-rows-3 gap-1 p-1">
          <div className="bg-gray-300 col-span-2 row-span-2"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
          <div className="bg-gray-300 col-span-1 row-span-1"></div>
        </div>
      );
      
    // 默认渲染方式
    default:
      return (
        <div className={`w-full aspect-square grid grid-cols-${cols} grid-rows-${rows} gap-1 p-1`}>
          {Array.from({ length: cols * rows }).map((_, i) => (
            <div key={i} className="bg-gray-300"></div>
          ))}
        </div>
      );
  }
};

export default function LayoutSelector({
  layouts,
  shapeLayouts = SHAPE_LAYOUTS,
  selectedLayout,
  onSelectLayout,
  translateFn
}: LayoutSelectorProps) {
  return (
    <div className="mb-4 bg-white p-4 border border-gray-200 rounded-lg">
      <h3 className="text-sm font-medium mb-3">{translateFn('chooseLayout')}</h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        {layouts.map(layout => (
          <button
            key={layout.id}
            type="button"
            onClick={() => onSelectLayout(layout)}
            className={`border rounded-lg p-2 transition-all hover:border-blue-500 hover:shadow-md ${
              selectedLayout.id === layout.id 
                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                : 'border-gray-200'
            }`}
            title={layout.description}
          >
            {getLayoutPreview(layout)}
          </button>
        ))}
      </div>
      
      {shapeLayouts && shapeLayouts.length > 0 && (
        <h3 className="text-sm font-medium mb-3">{translateFn('shapeLayouts')}</h3>
      )}
      
      {shapeLayouts && shapeLayouts.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {shapeLayouts.map(layout => (
            <button
              key={layout.id}
              type="button"
              onClick={() => onSelectLayout(layout)}
              className={`border rounded-lg p-2 transition-all hover:border-blue-500 hover:shadow-md ${
                selectedLayout.id === layout.id 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200'
              }`}
              title={layout.description}
            >
              <div className={`w-full aspect-square grid ${layout.template} gap-1 p-1 relative`}>
                {Array.from({ length: layout.cols * layout.rows }).map((_, i) => {
                  const cellStyle = layout.maskShape ? getMaskStyle(layout, i) : {};
                  
                  return (
                    <div 
                      key={i} 
                      className="bg-gray-100 relative"
                    >
                      <div 
                        className="absolute inset-0 bg-blue-200"
                        style={cellStyle}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 