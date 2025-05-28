'use client';

import React, { useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2,
  ChevronUp,
  ChevronDown,
  Image,
  Type,
  Square,
  Star
} from 'lucide-react';
import { CollageElement } from '@/types/collage';

interface LayerPanelProps {
  className?: string;
}

export default function LayerPanel({ className = '' }: LayerPanelProps) {
  const { 
    state, 
    selectElement, 
    updateElement, 
    deleteElement, 
    reorderElement 
  } = useEditor();

  // 按z-index倒序排列（最上层在最前面）
  const sortedElements = [...state.elements].sort((a, b) => b.zIndex - a.zIndex);

  // 获取元素图标
  const getElementIcon = useCallback((element: CollageElement) => {
    switch (element.type) {
      case 'image':
        return <Image size={16} className="text-green-600" />;
      case 'text':
        return <Type size={16} className="text-blue-600" />;
      case 'shape':
        return element.shapeType === 'circle' ? 
          <div className="w-4 h-4 bg-orange-600 rounded-full" /> :
          <Square size={16} className="text-orange-600" />;
      case 'icon':
        return <Star size={16} className="text-purple-600" />;
      default:
        return <Square size={16} className="text-gray-600" />;
    }
  }, []);

  // 获取元素名称
  const getElementName = useCallback((element: CollageElement) => {
    switch (element.type) {
      case 'image':
        return element.alt || '图片';
      case 'text':
        return element.content?.slice(0, 20) + (element.content && element.content.length > 20 ? '...' : '') || '文字';
      case 'shape':
        return `${element.shapeType || '形状'}`;
      case 'icon':
        return element.iconName || 'Icon';
      case 'border':
        return '边框';
      default:
        return '元素';
    }
  }, []);

  // 选择元素
  const handleSelectElement = useCallback((elementId: string) => {
    selectElement(elementId);
  }, [selectElement]);

  // 切换元素可见性
  const handleToggleVisible = useCallback((element: CollageElement, e: React.MouseEvent) => {
    e.stopPropagation();
    updateElement(element.id, { isVisible: !element.isVisible });
  }, [updateElement]);

  // 切换元素锁定状态
  const handleToggleLock = useCallback((element: CollageElement, e: React.MouseEvent) => {
    e.stopPropagation();
    updateElement(element.id, { isLocked: !element.isLocked });
  }, [updateElement]);

  // 删除元素
  const handleDeleteElement = useCallback((elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteElement(elementId);
  }, [deleteElement]);

  // 上移图层
  const handleMoveUp = useCallback((element: CollageElement, e: React.MouseEvent) => {
    e.stopPropagation();
    const maxZIndex = Math.max(...state.elements.map(el => el.zIndex));
    if (element.zIndex < maxZIndex) {
      updateElement(element.id, { zIndex: element.zIndex + 1 });
    }
  }, [state.elements, updateElement]);

  // 下移图层
  const handleMoveDown = useCallback((element: CollageElement, e: React.MouseEvent) => {
    e.stopPropagation();
    const minZIndex = Math.min(...state.elements.map(el => el.zIndex));
    if (element.zIndex > minZIndex) {
      updateElement(element.id, { zIndex: element.zIndex - 1 });
    }
  }, [state.elements, updateElement]);

  if (state.elements.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p className="text-sm">暂无图层</p>
        <p className="text-xs text-gray-400 mt-1">添加元素后将在此显示</p>
      </div>
    );
  }

  return (
    <div className={`p-2 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">图层</h3>
        <span className="text-xs text-gray-500">{state.elements.length} 个</span>
      </div>

      <div className="space-y-1">
        {sortedElements.map((element) => (
          <div
            key={element.id}
            className={`
              flex items-center p-2 rounded cursor-pointer transition-colors
              ${state.selectedElementId === element.id 
                ? 'bg-blue-50 border border-blue-200' 
                : 'hover:bg-gray-50 border border-transparent'
              }
              ${!element.isVisible ? 'opacity-50' : ''}
            `}
            onClick={() => handleSelectElement(element.id)}
          >
            {/* 元素图标 */}
            <div className="flex-shrink-0 mr-2">
              {getElementIcon(element)}
            </div>

            {/* 元素名称 */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {getElementName(element)}
              </div>
              <div className="text-xs text-gray-500">
                {element.type} • z: {element.zIndex}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1 ml-2">
              {/* 图层顺序 */}
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-4 p-0"
                  onClick={(e) => handleMoveUp(element, e)}
                  disabled={element.zIndex >= Math.max(...state.elements.map(el => el.zIndex))}
                >
                  <ChevronUp size={10} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-3 w-4 p-0"
                  onClick={(e) => handleMoveDown(element, e)}
                  disabled={element.zIndex <= Math.min(...state.elements.map(el => el.zIndex))}
                >
                  <ChevronDown size={10} />
                </Button>
              </div>

              {/* 可见性切换 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => handleToggleVisible(element, e)}
              >
                {element.isVisible ? (
                  <Eye size={12} className="text-gray-600" />
                ) : (
                  <EyeOff size={12} className="text-gray-400" />
                )}
              </Button>

              {/* 锁定切换 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => handleToggleLock(element, e)}
              >
                {element.isLocked ? (
                  <Lock size={12} className="text-orange-600" />
                ) : (
                  <Unlock size={12} className="text-gray-400" />
                )}
              </Button>

              {/* 删除 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                onClick={(e) => handleDeleteElement(element.id, e)}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 图层操作说明 */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        <p>• 点击选择图层</p>
        <p>• 使用 ↑↓ 调整层级</p>
        <p>• 👁️ 显示/隐藏</p>
        <p>• 🔒 锁定/解锁</p>
      </div>
    </div>
  );
} 