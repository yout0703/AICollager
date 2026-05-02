'use client';

import React, { useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { Button } from '@/components/ui/button';
import {
  Undo2,
  Redo2,
  Image as ImageIcon,
  Type,
  Square,
  Circle,
  Star,
  Download,
  Save,
  Layers,
  Trash2
} from 'lucide-react';
import { CollageElement } from '@/types/collage';

interface ToolbarProps {
  className?: string;
  onSave?: () => void;
  onExport?: () => void;
  onAddImage?: () => void;
}

export default function Toolbar({
  className = '',
  onSave,
  onExport,
  onAddImage
}: ToolbarProps) {
  const {
    state,
    addElement,
    deleteElement,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedElement,
    pasteElement
  } = useEditor();

  // 添加文字元素
  const addTextElement = useCallback(() => {
    const newElement: CollageElement = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      transform: {
        x: 100,
        y: 100,
        width: 200,
        height: 40,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false
      },
      style: {
        opacity: 1,
        borderRadius: 0
      },
      zIndex: state.elements.length + 1,
      isVisible: true,
      isLocked: false,
      content: '点击编辑文字',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal',
      color: '#000000',
      textAlign: 'left',
      lineHeight: 1.5,
      letterSpacing: 0
    };

    addElement(newElement);
  }, [addElement, state.elements.length]);

  // 添加形状元素
  const addShapeElement = useCallback((shapeType: 'rectangle' | 'circle' | 'triangle' | 'star') => {
    const newElement: CollageElement = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shape',
      transform: {
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        flipX: false,
        flipY: false
      },
      style: {
        opacity: 1,
        borderRadius: shapeType === 'circle' ? 50 : 0
      },
      zIndex: state.elements.length + 1,
      isVisible: true,
      isLocked: false,
      shapeType,
      fillColor: '#3b82f6',
      strokeColor: '#1e40af',
      strokeWidth: 2
    };

    addElement(newElement);
  }, [addElement, state.elements.length]);

  // 删除选中元素
  const handleDeleteSelected = useCallback(() => {
    if (selectedElement) {
      deleteElement(selectedElement.id);
    }
  }, [selectedElement, deleteElement]);

  // 处理键盘快捷键
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 防止在输入框中触发
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            onSave?.();
            break;
          case 'v':
            e.preventDefault();
            pasteElement();
            break;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, onSave, pasteElement, handleDeleteSelected]);

  return (
    <div className={`flex items-center space-x-1.5 px-3 py-1.5 bg-white border-b border-gray-200 ${className}`}>
      {/* 撤销重做 */}
      <div className="flex items-center space-x-0.5">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          title="撤销 (Ctrl+Z)"
          className="h-7 w-7 p-0"
        >
          <Undo2 size={14} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Ctrl+Y)"
          className="h-7 w-7 p-0"
        >
          <Redo2 size={14} />
        </Button>
      </div>

      <div className="w-px h-5 bg-gray-300" />

      {/* 添加元素 */}
      <div className="flex items-center space-x-0.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddImage}
          title="添加图片"
          className="h-7 px-2 text-xs"
        >
          <ImageIcon size={12} className="mr-1" />
          图片
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addTextElement}
          title="添加文字"
          className="h-7 px-2 text-xs"
        >
          <Type size={12} className="mr-1" />
          文字
        </Button>

        {/* 形状按钮组 */}
        <div className="flex items-center space-x-0.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addShapeElement('rectangle')}
            title="添加矩形"
            className="h-7 w-7 p-0"
          >
            <Square size={12} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addShapeElement('circle')}
            title="添加圆形"
            className="h-7 w-7 p-0"
          >
            <Circle size={12} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addShapeElement('star')}
            title="添加星形"
            className="h-7 w-7 p-0"
          >
            <Star size={12} />
          </Button>
        </div>
      </div>

      <div className="w-px h-5 bg-gray-300" />

      {/* 选中元素操作 */}
      {selectedElement && (
        <div className="flex items-center space-x-0.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSelected}
            title="删除选中元素 (Delete)"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive/80 hover:border-destructive/30"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      )}

      {/* 右侧操作 */}
      <div className="flex-1" />

      <div className="flex items-center space-x-1">
        {/* 图层信息 */}
        <div className="flex items-center text-xs text-gray-500">
          <Layers size={12} className="mr-1" />
          {state.elements.length}
        </div>

        <div className="w-px h-5 bg-gray-300" />

        {/* 保存和导出 */}
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          title="保存 (Ctrl+S)"
          disabled={!state.isDirty}
          className="h-7 px-2 text-xs"
        >
          <Save size={12} className="mr-1" />
          保存
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onExport}
          title="导出图片"
          className="h-7 px-2 text-xs"
        >
          <Download size={12} className="mr-1" />
          导出
        </Button>
      </div>
    </div>
  );
}
