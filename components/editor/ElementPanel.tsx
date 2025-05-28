'use client';

import React, { useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { CollageElement } from '@/types/collage';
import { Button } from '@/components/ui/button';
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Move
} from 'lucide-react';

interface ElementPanelProps {
  className?: string;
}

// 简单的Label组件
const Label = ({ htmlFor, children, className = '' }: { htmlFor?: string; children: React.ReactNode; className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

// 简单的Input组件
const Input = ({ className = '', type = 'text', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type={type}
    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    {...props}
  />
);

// 简单的Slider组件
const Slider = ({ value, onValueChange, min = 0, max = 100, step = 1, className = '' }: {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value[0]}
    onChange={(e) => onValueChange([parseFloat(e.target.value)])}
    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
  />
);

// 简单的Separator组件
const Separator = ({ className = '' }: { className?: string }) => (
  <hr className={`border-t border-gray-200 ${className}`} />
);

export default function ElementPanel({ className = '' }: ElementPanelProps) {
  const { selectedElement, updateElement, deleteElement, copyElement } = useEditor();

  // 更新元素属性的通用函数
  const updateElementProperty = useCallback((path: string, value: any) => {
    if (!selectedElement) return;

    const pathParts = path.split('.');
    const updatedElement: Partial<CollageElement> = {};
    
    // 构建嵌套对象
    if (pathParts.length === 1) {
      (updatedElement as any)[pathParts[0]] = value;
    } else if (pathParts.length === 2) {
      (updatedElement as any)[pathParts[0]] = {
        ...(selectedElement as any)[pathParts[0]],
        [pathParts[1]]: value
      };
    } else if (pathParts.length === 3) {
      (updatedElement as any)[pathParts[0]] = {
        ...(selectedElement as any)[pathParts[0]],
        [pathParts[1]]: {
          ...((selectedElement as any)[pathParts[0]] || {})[pathParts[1]],
          [pathParts[2]]: value
        }
      };
    }

    updateElement(selectedElement.id, updatedElement);
  }, [selectedElement, updateElement]);

  // 处理旋转
  const handleRotate = useCallback((direction: 'cw' | 'ccw') => {
    if (!selectedElement) return;
    const currentRotation = selectedElement.transform.rotation;
    const newRotation = direction === 'cw' ? currentRotation + 90 : currentRotation - 90;
    updateElementProperty('transform.rotation', newRotation % 360);
  }, [selectedElement, updateElementProperty]);

  // 处理翻转
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!selectedElement) return;
    const transform = selectedElement.transform;
    if (direction === 'horizontal') {
      updateElementProperty('transform.flipX', !transform.flipX);
    } else {
      updateElementProperty('transform.flipY', !transform.flipY);
    }
  }, [selectedElement, updateElementProperty]);

  // 处理锁定/解锁
  const handleToggleLock = useCallback(() => {
    if (!selectedElement) return;
    updateElementProperty('isLocked', !selectedElement.isLocked);
  }, [selectedElement, updateElementProperty]);

  // 处理显示/隐藏
  const handleToggleVisible = useCallback(() => {
    if (!selectedElement) return;
    updateElementProperty('isVisible', !selectedElement.isVisible);
  }, [selectedElement, updateElementProperty]);

  // 处理删除
  const handleDelete = useCallback(() => {
    if (!selectedElement) return;
    deleteElement(selectedElement.id);
  }, [selectedElement, deleteElement]);

  // 处理复制
  const handleCopy = useCallback(() => {
    if (!selectedElement) return;
    copyElement(selectedElement.id);
  }, [selectedElement, copyElement]);

  if (!selectedElement) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <Move size={48} className="opacity-50" />
          <p>选择一个元素来编辑其属性</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {/* 元素基本信息 */}
      <div>
        <h3 className="font-medium mb-2">元素信息</h3>
        <div className="text-sm text-gray-600">
          <p>类型: {selectedElement.type}</p>
          <p>ID: {selectedElement.id}</p>
        </div>
      </div>

      <Separator />

      {/* 位置和尺寸 */}
      <div>
        <h3 className="font-medium mb-3">位置和尺寸</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="x-position">X 位置</Label>
            <Input
              id="x-position"
              type="number"
              value={Math.round(selectedElement.transform.x)}
              onChange={(e) => updateElementProperty('transform.x', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="y-position">Y 位置</Label>
            <Input
              id="y-position"
              type="number"
              value={Math.round(selectedElement.transform.y)}
              onChange={(e) => updateElementProperty('transform.y', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="width">宽度</Label>
            <Input
              id="width"
              type="number"
              value={Math.round(selectedElement.transform.width)}
              onChange={(e) => updateElementProperty('transform.width', parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="height">高度</Label>
            <Input
              id="height"
              type="number"
              value={Math.round(selectedElement.transform.height)}
              onChange={(e) => updateElementProperty('transform.height', parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 变换控制 */}
      <div>
        <h3 className="font-medium mb-3">变换</h3>
        
        {/* 旋转 */}
        <div className="mb-3">
          <Label>旋转</Label>
          <div className="flex items-center space-x-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotate('ccw')}
            >
              <RotateCcw size={16} />
            </Button>
            <Input
              type="number"
              value={Math.round(selectedElement.transform.rotation)}
              onChange={(e) => updateElementProperty('transform.rotation', parseInt(e.target.value) || 0)}
              className="flex-1"
              placeholder="角度"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotate('cw')}
            >
              <RotateCw size={16} />
            </Button>
          </div>
        </div>

        {/* 翻转 */}
        <div className="mb-3">
          <Label>翻转</Label>
          <div className="flex space-x-2 mt-1">
            <Button
              variant={selectedElement.transform.flipX ? "default" : "outline"}
              size="sm"
              onClick={() => handleFlip('horizontal')}
              className="flex-1"
            >
              <FlipHorizontal size={16} className="mr-1" />
              水平
            </Button>
            <Button
              variant={selectedElement.transform.flipY ? "default" : "outline"}
              size="sm"
              onClick={() => handleFlip('vertical')}
              className="flex-1"
            >
              <FlipVertical size={16} className="mr-1" />
              垂直
            </Button>
          </div>
        </div>

        {/* 缩放 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="scale-x">X 缩放</Label>
            <Input
              id="scale-x"
              type="number"
              step="0.1"
              value={selectedElement.transform.scaleX}
              onChange={(e) => updateElementProperty('transform.scaleX', parseFloat(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="scale-y">Y 缩放</Label>
            <Input
              id="scale-y"
              type="number"
              step="0.1"
              value={selectedElement.transform.scaleY}
              onChange={(e) => updateElementProperty('transform.scaleY', parseFloat(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 样式控制 */}
      <div>
        <h3 className="font-medium mb-3">样式</h3>
        
        {/* 透明度 */}
        <div className="mb-3">
          <Label>透明度 ({Math.round(selectedElement.style.opacity * 100)}%)</Label>
          <Slider
            value={[selectedElement.style.opacity]}
            onValueChange={([value]) => updateElementProperty('style.opacity', value)}
            max={1}
            min={0}
            step={0.01}
            className="mt-2"
          />
        </div>

        {/* 圆角 */}
        <div className="mb-3">
          <Label htmlFor="border-radius">圆角</Label>
          <Input
            id="border-radius"
            type="number"
            value={selectedElement.style.borderRadius}
            onChange={(e) => updateElementProperty('style.borderRadius', parseInt(e.target.value) || 0)}
            className="mt-1"
          />
        </div>

        {/* Z-Index */}
        <div>
          <Label htmlFor="z-index">层级</Label>
          <Input
            id="z-index"
            type="number"
            value={selectedElement.zIndex}
            onChange={(e) => updateElementProperty('zIndex', parseInt(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
      </div>

      {/* 类型特定的控制 */}
      {selectedElement.type === 'text' && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium mb-3">文字属性</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="font-size">字体大小</Label>
                <Input
                  id="font-size"
                  type="number"
                  value={selectedElement.fontSize}
                  onChange={(e) => updateElementProperty('fontSize', parseInt(e.target.value) || 12)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="font-family">字体家族</Label>
                <Input
                  id="font-family"
                  value={selectedElement.fontFamily}
                  onChange={(e) => updateElementProperty('fontFamily', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="text-color">文字颜色</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => updateElementProperty('color', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {selectedElement.type === 'icon' && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium mb-3">图标属性</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="icon-size">图标大小</Label>
                <Input
                  id="icon-size"
                  type="number"
                  value={selectedElement.size}
                  onChange={(e) => updateElementProperty('size', parseInt(e.target.value) || 24)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="icon-color">图标颜色</Label>
                <Input
                  id="icon-color"
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => updateElementProperty('color', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {selectedElement.type === 'shape' && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium mb-3">形状属性</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="fill-color">填充颜色</Label>
                <Input
                  id="fill-color"
                  type="color"
                  value={selectedElement.fillColor}
                  onChange={(e) => updateElementProperty('fillColor', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {selectedElement.strokeColor && (
                <>
                  <div>
                    <Label htmlFor="stroke-color">边框颜色</Label>
                    <Input
                      id="stroke-color"
                      type="color"
                      value={selectedElement.strokeColor}
                      onChange={(e) => updateElementProperty('strokeColor', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stroke-width">边框宽度</Label>
                    <Input
                      id="stroke-width"
                      type="number"
                      value={selectedElement.strokeWidth || 0}
                      onChange={(e) => updateElementProperty('strokeWidth', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* 操作按钮 */}
      <div>
        <h3 className="font-medium mb-3">操作</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleLock}
            className="flex items-center"
          >
            {selectedElement.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            <span className="ml-1">{selectedElement.isLocked ? '解锁' : '锁定'}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleVisible}
            className="flex items-center"
          >
            {selectedElement.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="ml-1">{selectedElement.isVisible ? '隐藏' : '显示'}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center"
          >
            <Copy size={16} />
            <span className="ml-1">复制</span>
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="flex items-center"
          >
            <Trash2 size={16} />
            <span className="ml-1">删除</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 