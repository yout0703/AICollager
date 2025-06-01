'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { CollageElement, ImageElement, MaskRegion, ImageTransform } from '@/types/collage';

interface CanvasProps {
  className?: string;
}

export default function Canvas({ className = '' }: CanvasProps) {
  const { state, selectElement, updateElement } = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragElement, setDragElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });

  // 处理鼠标按下事件 - 遮罩模式
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = state.elements.find(el => el.id === elementId) as ImageElement;
    if (!element || element.isLocked || element.type !== 'image' || !element.maskRegion) return;
    
    selectElement(elementId);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragElement(elementId);
    setDragStart({ x: clientX, y: clientY });
    // 记录图片在遮罩内的起始位置
    setElementStart({ 
      x: element.imageTransform?.position.x || 0, 
      y: element.imageTransform?.position.y || 0 
    });
  }, [state.elements, selectElement]);

  // 处理鼠标移动事件 - 遮罩模式
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragElement || !isDragging) return;
    
    const element = state.elements.find(el => el.id === dragElement) as ImageElement;
    if (!element || element.type !== 'image' || !element.maskRegion) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // 计算鼠标移动的距离
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // 更新图片在遮罩内的位置
    const newImageTransform: ImageTransform = {
      ...element.imageTransform,
      position: {
        x: elementStart.x + deltaX,
        y: elementStart.y + deltaY
      },
      scale: element.imageTransform?.scale || 1,
      rotation: element.imageTransform?.rotation || 0,
      anchor: element.imageTransform?.anchor || { x: 0.5, y: 0.5 }
    };
    
    updateElement(dragElement, {
      imageTransform: newImageTransform
    });
  }, [isDragging, dragElement, dragStart, elementStart, state.elements, updateElement]);

  // 处理鼠标抬起事件
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragElement(null);
  }, []);

  // 处理画布点击事件
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectElement(null);
    }
  }, [selectElement]);

  // 处理键盘事件 - 遮罩模式
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!state.selectedElementId) return;
    
    const element = state.elements.find(el => el.id === state.selectedElementId) as ImageElement;
    if (!element || element.isLocked || element.type !== 'image' || !element.maskRegion) return;
    
    const step = e.shiftKey ? 10 : 1; // Shift键加速移动
    const currentTransform = element.imageTransform || { 
      position: { x: 0, y: 0 }, 
      scale: 1, 
      rotation: 0, 
      anchor: { x: 0.5, y: 0.5 } 
    };
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        updateElement(element.id, {
          imageTransform: {
            ...currentTransform,
            position: {
              ...currentTransform.position,
              y: currentTransform.position.y - step
            }
          }
        });
        break;
      case 'ArrowDown':
        e.preventDefault();
        updateElement(element.id, {
          imageTransform: {
            ...currentTransform,
            position: {
              ...currentTransform.position,
              y: currentTransform.position.y + step
            }
          }
        });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        updateElement(element.id, {
          imageTransform: {
            ...currentTransform,
            position: {
              ...currentTransform.position,
              x: currentTransform.position.x - step
            }
          }
        });
        break;
      case 'ArrowRight':
        e.preventDefault();
        updateElement(element.id, {
          imageTransform: {
            ...currentTransform,
            position: {
              ...currentTransform.position,
              x: currentTransform.position.x + step
            }
          }
        });
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        // TODO: 实现删除元素功能
        break;
    }
  }, [state.selectedElementId, state.elements, updateElement]);

  // 绑定事件监听器
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseUp, handleKeyDown]);

  // 渲染遮罩模式下的图片元素 - 分层渲染方式
  const renderMaskModeImageElement = useCallback((element: ImageElement) => {
    if (!element.maskRegion) {
      return null;
    }

    const imageTransform = element.imageTransform || {
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      anchor: { x: 0.5, y: 0.5 }
    };

    const isSelected = state.selectedElementId === element.id;

    // 遮罩区域的位置和尺寸（固定不变）
    const maskRegion = element.maskRegion;
    const maskX = maskRegion.position.x;
    const maskY = maskRegion.position.y;
    const maskWidth = maskRegion.position.width;
    const maskHeight = maskRegion.position.height;

    // 图片的显示尺寸（要比遮罩大，这样才能拖动）
    const imageSize = Math.max(state.canvas.width, state.canvas.height) * 1.5; // 1.5倍画布大小
    
    // 图片在遮罩区域内的实际位置
    const imageX = maskX + imageTransform.position.x;
    const imageY = maskY + imageTransform.position.y;

    return (
      <React.Fragment key={element.id}>
        {/* 遮罩容器 - 位置固定，作为裁剪窗口 */}
        <div
          className={`absolute overflow-hidden ${isSelected ? 'z-10' : 'z-0'}`}
          style={{
            left: maskX,
            top: maskY,
            width: maskWidth,
            height: maskHeight,
            borderRadius: maskRegion.shape === 'circle' ? '50%' : '4px',
            // 遮罩本身不可见，只是作为裁剪容器
            pointerEvents: 'none',
          }}
        >
          {/* 图片 - 在遮罩容器内可以移动 */}
          <div
            className="absolute"
            style={{
              // 图片相对于遮罩容器的位置
              left: imageTransform.position.x - (imageSize - maskWidth) / 2,
              top: imageTransform.position.y - (imageSize - maskHeight) / 2,
              width: imageSize * imageTransform.scale,
              height: imageSize * imageTransform.scale,
              transform: `rotate(${imageTransform.rotation}deg)`,
              transformOrigin: 'center',
              opacity: element.style.opacity,
              display: element.isVisible ? 'block' : 'none',
            }}
          >
            <img
              src={element.src}
              alt={element.alt || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              draggable={false}
              onError={(e) => {
                console.warn('图片加载失败:', element.src);
                (e.target as HTMLImageElement).style.backgroundColor = '#f3f4f6';
              }}
            />
          </div>
        </div>

        {/* 交互层 - 用于接收鼠标事件，覆盖整个遮罩区域 */}
        <div
          className={`absolute ${isSelected ? 'z-20' : 'z-10'}`}
          style={{
            left: maskX,
            top: maskY,
            width: maskWidth,
            height: maskHeight,
            cursor: isDragging && dragElement === element.id ? 'grabbing' : 'grab',
            pointerEvents: element.isLocked ? 'none' : 'auto',
            // 透明的交互层
            backgroundColor: 'transparent',
          }}
          onMouseDown={(e) => !element.isLocked && handleMouseDown(e, element.id)}
          onClick={(e) => {
            e.stopPropagation();
            selectElement(element.id);
          }}
          title={`拖动调整图片在遮罩内的位置`}
        />

        {/* 遮罩边界指示器（仅选中时显示） */}
        {isSelected && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: maskX,
              top: maskY,
              width: maskWidth,
              height: maskHeight,
              border: '2px solid #3B82F6',
              borderRadius: maskRegion.shape === 'circle' ? '50%' : '4px',
            }}
            title="遮罩区域边界（固定）"
          />
        )}

        {/* 开发模式：显示完整图片的边界 */}
        {isSelected && process.env.NODE_ENV === 'development' && (
          <div
            className="absolute pointer-events-none z-40"
            style={{
              left: imageX - (imageSize * imageTransform.scale - maskWidth) / 2,
              top: imageY - (imageSize * imageTransform.scale - maskHeight) / 2,
              width: imageSize * imageTransform.scale,
              height: imageSize * imageTransform.scale,
              border: '1px dashed #ff0000',
              opacity: 0.5,
            }}
            title="完整图片边界（可拖动）"
          />
        )}
      </React.Fragment>
    );
  }, [isDragging, dragElement, state.selectedElementId, state.canvas, handleMouseDown, selectElement]);

  // 获取遮罩模式下的图片元素
  const maskModeImageElements = state.elements.filter(el => 
    el.type === 'image' && (el as ImageElement).maskRegion
  ) as ImageElement[];

  return (
    <div
      ref={canvasRef}
      className={`relative overflow-hidden bg-white ${className}`}
      style={{
        width: state.canvas.width,
        height: state.canvas.height,
        backgroundColor: state.canvas.backgroundColor,
        borderRadius: state.canvas.borderRadius || 0,
        border: state.canvas.border ? 
          `${state.canvas.border.width}px ${state.canvas.border.style} ${state.canvas.border.color}` : 
          '2px solid #e5e7eb'
      }}
      onClick={handleCanvasClick}
      onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
    >
      {/* 渲染画布背景纹理 */}
      {state.canvas.backgroundTexture && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: state.canvas.backgroundTexture.value,
            opacity: 0.1
          }}
        />
      )}

      {/* 渲染遮罩图片元素 */}
      {maskModeImageElements.map(renderMaskModeImageElement)}
      
      {/* 开发模式下的网格辅助线 */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      )}
      
      {/* 画布中心辅助线 */}
      {state.selectedElementId && (
        <>
          <div 
            className="absolute bg-red-500 opacity-30 pointer-events-none"
            style={{
              left: state.canvas.width / 2 - 0.5,
              top: 0,
              width: 1,
              height: state.canvas.height
            }}
          />
          <div 
            className="absolute bg-red-500 opacity-30 pointer-events-none"
            style={{
              left: 0,
              top: state.canvas.height / 2 - 0.5,
              width: state.canvas.width,
              height: 1
            }}
          />
        </>
      )}

      {/* 遮罩模式提示信息 */}
      {maskModeImageElements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 text-sm text-center">
            <p>遮罩拼图模式</p>
            <p className="text-xs mt-1">图片将显示在遮罩区域内</p>
            <p className="text-xs mt-1">🔍 拖动图片可调整露出的内容</p>
          </div>
        </div>
      )}

      {/* 遮罩模式使用提示 */}
      {maskModeImageElements.length > 0 && !state.selectedElementId && (
        <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 pointer-events-none">
          <div className="flex items-center mb-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            <span className="font-medium">遮罩拼图模式</span>
          </div>
          <p>• 洞的位置固定不变</p>
          <p>• 拖动移动洞后面的图片</p>
          <p>• 可看到图片不同部分</p>
        </div>
      )}
    </div>
  );
} 