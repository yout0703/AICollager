'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { CollageElement } from '@/types/collage';

interface CanvasProps {
  className?: string;
}

export default function Canvas({ className = '' }: CanvasProps) {
  const { state, selectElement, updateElement } = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElement, setDragElement] = useState<string | null>(null);

  // 处理元素点击选择
  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    selectElement(elementId);
  }, [selectElement]);

  // 处理画布点击（取消选择）
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  }, [selectElement]);

  // 处理鼠标按下（开始拖拽）
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragElement(elementId);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    selectElement(elementId);
  }, [selectElement]);

  // 处理鼠标移动（拖拽中）
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    // 找到拖拽的元素
    const element = state.elements.find(el => el.id === dragElement);
    if (!element) return;

    // 更新元素位置
    updateElement(dragElement, {
      transform: {
        ...element.transform,
        x: Math.max(0, element.transform.x + deltaX),
        y: Math.max(0, element.transform.y + deltaY)
      }
    });

    setDragStart({ x: currentX, y: currentY });
  }, [isDragging, dragElement, dragStart, state.elements, updateElement]);

  // 处理鼠标抬起（结束拖拽）
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragElement(null);
  }, []);

  // 绑定全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 渲染元素的样式
  const getElementStyle = useCallback((element: CollageElement): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: element.transform.x,
      top: element.transform.y,
      width: element.transform.width,
      height: element.transform.height,
      transform: `rotate(${element.transform.rotation}deg) scaleX(${element.transform.scaleX}) scaleY(${element.transform.scaleY})`,
      opacity: element.style.opacity,
      borderRadius: element.style.borderRadius,
      zIndex: element.zIndex,
      cursor: isDragging && dragElement === element.id ? 'grabbing' : 'grab',
      userSelect: 'none',
      pointerEvents: element.isLocked ? 'none' : 'auto',
      display: element.isVisible ? 'block' : 'none'
    };

    // 添加边框
    if (element.style.border) {
      baseStyle.border = `${element.style.border.width}px ${element.style.border.style} ${element.style.border.color}`;
    }

    // 添加阴影
    if (element.style.shadow) {
      baseStyle.boxShadow = `${element.style.shadow.offsetX}px ${element.style.shadow.offsetY}px ${element.style.shadow.blur}px ${element.style.shadow.color}`;
    }

    // 添加滤镜
    if (element.style.filter) {
      const filters = [];
      if (element.style.filter.brightness !== 1) filters.push(`brightness(${element.style.filter.brightness})`);
      if (element.style.filter.contrast !== 1) filters.push(`contrast(${element.style.filter.contrast})`);
      if (element.style.filter.saturation !== 1) filters.push(`saturate(${element.style.filter.saturation})`);
      if (element.style.filter.blur > 0) filters.push(`blur(${element.style.filter.blur}px)`);
      if (filters.length > 0) {
        baseStyle.filter = filters.join(' ');
      }
    }

    return baseStyle;
  }, [isDragging, dragElement]);

  // 渲染图片元素
  const renderImageElement = useCallback((element: CollageElement) => {
    if (element.type !== 'image') return null;

    return (
      <img
        src={element.src}
        alt={element.alt || ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit: element.cropArea ? 'cover' : 'contain',
          objectPosition: element.cropArea ? 
            `${-element.cropArea.x}px ${-element.cropArea.y}px` : 'center'
        }}
        draggable={false}
      />
    );
  }, []);

  // 渲染Icon元素
  const renderIconElement = useCallback((element: CollageElement) => {
    if (element.type !== 'icon') return null;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          color: element.color,
          fontSize: element.size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        dangerouslySetInnerHTML={{ __html: element.svgContent }}
      />
    );
  }, []);

  // 渲染文字元素
  const renderTextElement = useCallback((element: CollageElement) => {
    if (element.type !== 'text') return null;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          fontWeight: element.fontWeight,
          color: element.color,
          textAlign: element.textAlign,
          lineHeight: element.lineHeight,
          letterSpacing: element.letterSpacing,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap'
        }}
      >
        {element.content}
      </div>
    );
  }, []);

  // 渲染形状元素
  const renderShapeElement = useCallback((element: CollageElement) => {
    if (element.type !== 'shape') return null;

    let shapeStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      backgroundColor: element.fillColor
    };

    if (element.strokeColor && element.strokeWidth) {
      shapeStyle.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
    }

    switch (element.shapeType) {
      case 'circle':
        shapeStyle.borderRadius = '50%';
        break;
      case 'rectangle':
        // 默认矩形样式
        break;
      case 'triangle':
        // 使用CSS创建三角形
        shapeStyle = {
          width: 0,
          height: 0,
          borderLeft: `${element.transform.width/2}px solid transparent`,
          borderRight: `${element.transform.width/2}px solid transparent`,
          borderBottom: `${element.transform.height}px solid ${element.fillColor}`,
          backgroundColor: 'transparent'
        };
        break;
      case 'star':
      case 'heart':
        // 这些复杂形状可以使用SVG或CSS clip-path
        shapeStyle.clipPath = getClipPath(element.shapeType);
        break;
    }

    return <div style={shapeStyle} />;
  }, []);

  // 渲染边框元素
  const renderBorderElement = useCallback((element: CollageElement) => {
    if (element.type !== 'border') return null;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `${element.thickness}px solid ${element.color}`,
          borderStyle: element.borderType === 'decorative' ? 'dashed' : 'solid'
        }}
      />
    );
  }, []);

  // 获取裁剪路径
  const getClipPath = (shapeType: string): string => {
    switch (shapeType) {
      case 'star':
        return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
      case 'heart':
        return 'path("M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z")';
      default:
        return 'none';
    }
  };

  // 渲染单个元素
  const renderElement = useCallback((element: CollageElement) => {
    const isSelected = state.selectedElementId === element.id;
    
    return (
      <div
        key={element.id}
        style={{
          ...getElementStyle(element),
          outline: isSelected ? '2px solid #3b82f6' : 'none',
          outlineOffset: '2px'
        }}
        onClick={(e) => handleElementClick(e, element.id)}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
      >
        {element.type === 'image' && renderImageElement(element)}
        {element.type === 'icon' && renderIconElement(element)}
        {element.type === 'text' && renderTextElement(element)}
        {element.type === 'shape' && renderShapeElement(element)}
        {element.type === 'border' && renderBorderElement(element)}
        
        {/* 选中时显示操作控制点 */}
        {isSelected && !element.isLocked && (
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize" />
        )}
        {isSelected && !element.isLocked && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize" />
        )}
        {isSelected && !element.isLocked && (
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize" />
        )}
        {isSelected && !element.isLocked && (
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize" />
        )}
      </div>
    );
  }, [state.selectedElementId, getElementStyle, handleElementClick, handleMouseDown, renderImageElement, renderIconElement, renderTextElement, renderShapeElement, renderBorderElement]);

  // 按z-index排序元素
  const sortedElements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={canvasRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: state.canvas.width,
        height: state.canvas.height,
        backgroundColor: state.canvas.backgroundColor,
        padding: state.canvas.padding,
        borderRadius: state.canvas.borderRadius,
        border: state.canvas.border ? 
          `${state.canvas.border.width}px ${state.canvas.border.style} ${state.canvas.border.color}` : 
          'none'
      }}
      onClick={handleCanvasClick}
    >
      {sortedElements.map(renderElement)}
      
      {/* 网格辅助线（可选） */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      )}
    </div>
  );
} 