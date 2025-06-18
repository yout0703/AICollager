'use client';

import React from 'react';
import type { UCMRendererProps, UCMElement, ImageElement, TextElement, ShapeElement, IconElement } from '@/types/ucm';

// 渲染图片元素
const renderImageElement = (element: ImageElement, scale: number = 1) => {
  const { position, dimensions, transform, style, source } = element;
  
  // 直接使用 position 作为左上角位置
  const actualLeft = position.x * scale;
  const actualTop = position.y * scale;
  
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: actualLeft,
    top: actualTop,
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    transform: `
      rotate(${transform.rotation_degrees}deg) 
      scale(${transform.scale}) 
      ${transform.flip_horizontal ? 'scaleX(-1)' : ''}
      ${transform.flip_vertical ? 'scaleY(-1)' : ''}
    `,
    transformOrigin: `${transform.transformOrigin.x * 100}% ${transform.transformOrigin.y * 100}%`,
    zIndex: element.zIndex,
    opacity: style.opacity,
    borderRadius: style.borderRadius ? `${style.borderRadius * scale}px` : undefined,
    objectFit: style.objectFit,
    border: style.border ? `${style.border.width * scale}px ${style.border.style || 'solid'} ${style.border.color}` : undefined,
    boxShadow: style.shadow ? `${style.shadow.offsetX * scale}px ${style.shadow.offsetY * scale}px ${style.shadow.blur * scale}px ${style.shadow.color}` : undefined,
  };

  // 如果是占位符或图片加载失败，显示占位符样式
  if (source.startsWith('placeholder_') || source.includes('placeholder')) {
    const placeholderText = source.startsWith('placeholder_') 
      ? source.replace('placeholder_', '').replace('_', ' ')
      : '等待图片';
    
    return (
      <div
        key={element.id}
        style={{
          ...elementStyle,
          backgroundColor: '#f3f4f6',
          border: '2px dashed #d1d5db',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: `${14 * scale}px`,
        }}
      >
        <div style={{ fontSize: `${24 * scale}px`, marginBottom: `${8 * scale}px` }}>
          📷
        </div>
        <div>{placeholderText}</div>
        <div style={{ fontSize: `${10 * scale}px`, opacity: 0.7, marginTop: `${4 * scale}px` }}>
          {dimensions.width} × {dimensions.height}
        </div>
      </div>
    );
  }

  return (
    <img
      key={element.id}
      src={source}
      alt={`Element ${element.id}`}
      style={elementStyle}
      draggable={false}
    />
  );
};

// 渲染文字元素
const renderTextElement = (element: TextElement, scale: number = 1) => {
  const { position, dimensions, transform, style } = element;
  
  // 直接使用 position 作为左上角位置
  const actualLeft = position.x * scale;
  const actualTop = position.y * scale;
  
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: actualLeft,
    top: actualTop,
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    transform: `
      rotate(${transform.rotation_degrees}deg) 
      scale(${transform.scale}) 
      ${transform.flip_horizontal ? 'scaleX(-1)' : ''}
      ${transform.flip_vertical ? 'scaleY(-1)' : ''}
    `,
    transformOrigin: `${transform.transformOrigin.x * 100}% ${transform.transformOrigin.y * 100}%`,
    zIndex: element.zIndex,
    opacity: style.opacity,
    borderRadius: style.borderRadius ? `${style.borderRadius * scale}px` : undefined,
    border: style.border ? `${style.border.width * scale}px ${style.border.style || 'solid'} ${style.border.color}` : undefined,
    boxShadow: style.shadow ? `${style.shadow.offsetX * scale}px ${style.shadow.offsetY * scale}px ${style.shadow.blur * scale}px ${style.shadow.color}` : undefined,
    
    // 文字样式
    fontFamily: style.font.family,
    fontSize: `${style.font.size * scale}px`,
    fontWeight: style.font.weight,
    textAlign: style.font.align,
    lineHeight: style.font.lineHeight,
    color: style.color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: style.font.align === 'center' ? 'center' : style.font.align === 'right' ? 'flex-end' : 'flex-start',
  };

  return (
    <div
      key={element.id}
      style={elementStyle}
    >
      {element.content}
    </div>
  );
};

// 渲染形状元素
const renderShapeElement = (element: ShapeElement, scale: number = 1) => {
  const { position, dimensions, transform, style } = element;
  
  // 直接使用 position 作为左上角位置
  const actualLeft = position.x * scale;
  const actualTop = position.y * scale;
  
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: actualLeft,
    top: actualTop,
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    transform: `
      rotate(${transform.rotation_degrees}deg) 
      scale(${transform.scale}) 
      ${transform.flip_horizontal ? 'scaleX(-1)' : ''}
      ${transform.flip_vertical ? 'scaleY(-1)' : ''}
    `,
    transformOrigin: `${transform.transformOrigin.x * 100}% ${transform.transformOrigin.y * 100}%`,
    zIndex: element.zIndex,
    opacity: style.opacity,
    backgroundColor: style.fillColor,
    border: style.strokeColor && style.strokeWidth ? 
      `${style.strokeWidth * scale}px solid ${style.strokeColor}` : 
      (style.border ? `${style.border.width * scale}px ${style.border.style || 'solid'} ${style.border.color}` : undefined),
    boxShadow: style.shadow ? `${style.shadow.offsetX * scale}px ${style.shadow.offsetY * scale}px ${style.shadow.blur * scale}px ${style.shadow.color}` : undefined,
  };

  // 根据形状类型设置不同的样式
  switch (element.shapeType) {
    case 'circle':
      baseStyle.borderRadius = '50%';
      break;
    case 'rectangle':
      baseStyle.borderRadius = style.borderRadius ? `${style.borderRadius * scale}px` : undefined;
      break;
    default:
      baseStyle.borderRadius = style.borderRadius ? `${style.borderRadius * scale}px` : undefined;
  }

  return (
    <div
      key={element.id}
      style={baseStyle}
    />
  );
};

// 渲染图标元素
const renderIconElement = (element: IconElement, scale: number = 1) => {
  const { position, dimensions, transform, style } = element;
  
  // 直接使用 position 作为左上角位置
  const actualLeft = position.x * scale;
  const actualTop = position.y * scale;
  
  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: actualLeft,
    top: actualTop,
    width: dimensions.width * scale,
    height: dimensions.height * scale,
    transform: `
      rotate(${transform.rotation_degrees}deg) 
      scale(${transform.scale}) 
      ${transform.flip_horizontal ? 'scaleX(-1)' : ''}
      ${transform.flip_vertical ? 'scaleY(-1)' : ''}
    `,
    transformOrigin: `${transform.transformOrigin.x * 100}% ${transform.transformOrigin.y * 100}%`,
    zIndex: element.zIndex,
    opacity: style.opacity,
    borderRadius: style.borderRadius ? `${style.borderRadius * scale}px` : undefined,
    border: style.border ? `${style.border.width * scale}px ${style.border.style || 'solid'} ${style.border.color}` : undefined,
    boxShadow: style.shadow ? `${style.shadow.offsetX * scale}px ${style.shadow.offsetY * scale}px ${style.shadow.blur * scale}px ${style.shadow.color}` : undefined,
    
    // 图标样式
    color: style.color,
    fontSize: `${style.size * scale}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div
      key={element.id}
      style={elementStyle}
    >
      {/* 这里可以根据 iconId 渲染实际的图标，现在先显示图标名称 */}
      <span>{element.iconName || '🎨'}</span>
    </div>
  );
};

// 渲染单个元素
const renderElement = (element: UCMElement, scale: number = 1) => {
  switch (element.type) {
    case 'image':
      return renderImageElement(element, scale);
    case 'text':
      return renderTextElement(element, scale);
    case 'shape':
      return renderShapeElement(element, scale);
    case 'icon':
      return renderIconElement(element, scale);
    default:
      return null;
  }
};

// UCM 渲染器主组件
export const UCMRenderer: React.FC<UCMRendererProps> = ({
  model,
  scale = 1,
  interactive = false,
  onElementClick,
  onElementSelect
}) => {
  const { canvas, elements } = model;
  
  // 计算画布样式
  const canvasStyle: React.CSSProperties = {
    position: 'relative',
    width: canvas.width * scale,
    height: canvas.height * scale,
    backgroundColor: (canvas.background.type === 'color' || canvas.background.type === 'solid') ? canvas.background.color : '#ffffff',
    backgroundImage: canvas.background.type === 'gradient' && canvas.background.gradient ? 
      `linear-gradient(${canvas.background.gradient.direction || '0deg'}, ${canvas.background.gradient.colors.join(', ')})` : 
      undefined,
    overflow: 'hidden',
    cursor: interactive ? 'pointer' : 'default',
  };

  // 按 zIndex 排序元素
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const handleElementClick = (element: UCMElement, event: React.MouseEvent) => {
    if (interactive) {
      event.stopPropagation();
      onElementClick?.(element);
      onElementSelect?.(element.id);
    }
  };

  return (
    <div style={canvasStyle}>
      {sortedElements.map((element) => (
        <div
          key={element.id}
          onClick={(e) => handleElementClick(element, e)}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          {renderElement(element, scale)}
        </div>
      ))}
    </div>
  );
}; 