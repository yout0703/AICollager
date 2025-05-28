'use client';

import React from 'react';
import { EditorProvider } from '@/contexts/EditorContext';
import Canvas from '@/components/editor/Canvas';
import Toolbar from '@/components/editor/Toolbar';
import ElementPanel from '@/components/editor/ElementPanel';
import LayerPanel from '@/components/editor/LayerPanel';
import { CollageElement, CanvasConfig } from '@/types/collage';

// 测试用的初始画布配置
const testCanvas: CanvasConfig = {
  width: 800,
  height: 600,
  aspectRatio: '4:3',
  backgroundColor: '#f0f0f0',
  padding: 20,
  borderRadius: 8
};

// 测试用的初始元素
const testElements: CollageElement[] = [
  {
    id: 'test-text-1',
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
    zIndex: 1,
    isVisible: true,
    isLocked: false,
    content: '测试文字',
    fontSize: 24,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    color: '#333333',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 0
  },
  {
    id: 'test-shape-1',
    type: 'shape',
    transform: {
      x: 300,
      y: 200,
      width: 100,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      flipX: false,
      flipY: false
    },
    style: {
      opacity: 0.8,
      borderRadius: 0
    },
    zIndex: 2,
    isVisible: true,
    isLocked: false,
    shapeType: 'circle',
    fillColor: '#3b82f6',
    strokeColor: '#1e40af',
    strokeWidth: 2
  }
];

export default function EditorTestPage() {
  const handleSave = () => {
    console.log('保存测试');
    alert('保存功能测试');
  };

  const handleExport = () => {
    console.log('导出测试');
    alert('导出功能测试');
  };

  const handleAddImage = () => {
    console.log('添加图片测试');
    alert('添加图片功能测试');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <EditorProvider initialCanvas={testCanvas} initialElements={testElements}>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">拼图编辑器测试页面</h1>
          
          {/* 工具栏 */}
          <div className="mb-4">
            <Toolbar
              onSave={handleSave}
              onExport={handleExport}
              onAddImage={handleAddImage}
            />
          </div>

          <div className="flex gap-4">
            {/* 左侧图层面板 */}
            <div className="w-64 bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-2">图层管理</h2>
              <LayerPanel />
            </div>

            {/* 中央画布 */}
            <div className="flex-1 bg-white rounded-lg shadow p-4 flex justify-center">
              <Canvas />
            </div>

            {/* 右侧属性面板 */}
            <div className="w-80 bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-2">元素属性</h2>
              <ElementPanel />
            </div>
          </div>
        </div>
      </EditorProvider>
    </div>
  );
} 