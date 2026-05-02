'use client';

import React, { useCallback } from 'react';
import { useEditor } from '@/contexts/EditorContext';
import { CollageElement, ImageElement } from '@/types/collage';
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
  Move,
  Scissors
} from 'lucide-react';

interface ElementPanelProps {
  className?: string;
}

// 简单的Label组件
const Label = ({ htmlFor, children, className = '' }: { htmlFor?: string; children: React.ReactNode; className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-xs font-medium text-foreground ${className}`}>
    {children}
  </label>
);

// 简单的Input组件
const Input = ({ className = '', type = 'text', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    type={type}
    className={`mt-0.5 block w-full px-2 py-1 text-xs border border-input bg-background rounded focus:outline-none focus:ring-primary focus:border-primary ${className}`}
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
    className={`w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer ${className}`}
  />
);

// 简单的Separator组件
const Separator = ({ className = '' }: { className?: string }) => (
  <hr className={`border-t border-border my-2 ${className}`} />
);

export default function ElementPanel({ className = '' }: ElementPanelProps) {
  const { selectedElement, updateElement, deleteElement, copyElement } = useEditor();

  // 检查当前元素是否为遮罩图片元素
  const isMaskElement = selectedElement &&
    selectedElement.type === 'image' &&
    (selectedElement as ImageElement).maskRegion;

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

  // 遮罩模式下的图片变换控制
  const handleMaskImageTransform = useCallback((property: string, value: any) => {
    if (!selectedElement || !isMaskElement) return;

    const currentTransform = (selectedElement as ImageElement).imageTransform || {
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      anchor: { x: 0.5, y: 0.5 }
    };

    const newTransform = { ...currentTransform };

    if (property === 'position.x') {
      newTransform.position.x = value;
    } else if (property === 'position.y') {
      newTransform.position.y = value;
    } else if (property === 'scale') {
      newTransform.scale = value;
    } else if (property === 'rotation') {
      newTransform.rotation = value;
    }

    updateElement(selectedElement.id, { imageTransform: newTransform });
  }, [selectedElement, isMaskElement, updateElement]);

  // 重置遮罩内图片位置
  const handleResetMaskImagePosition = useCallback(() => {
    if (!selectedElement || !isMaskElement) return;

    updateElement(selectedElement.id, {
      imageTransform: {
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 }
      }
    });
  }, [selectedElement, isMaskElement, updateElement]);

  // 处理旋转 - 只对非遮罩图片元素适用
  const handleRotate = useCallback((direction: 'cw' | 'ccw') => {
    if (!selectedElement || isMaskElement) return;
    const currentRotation = selectedElement.transform.rotation;
    const newRotation = direction === 'cw' ? currentRotation + 90 : currentRotation - 90;
    updateElementProperty('transform.rotation', newRotation % 360);
  }, [selectedElement, isMaskElement, updateElementProperty]);

  // 处理翻转 - 只对非遮罩图片元素适用
  const handleFlip = useCallback((direction: 'horizontal' | 'vertical') => {
    if (!selectedElement || isMaskElement) return;
    const transform = selectedElement.transform;
    if (direction === 'horizontal') {
      updateElementProperty('transform.flipX', !transform.flipX);
    } else {
      updateElementProperty('transform.flipY', !transform.flipY);
    }
  }, [selectedElement, isMaskElement, updateElementProperty]);

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
      <div className={`p-3 text-center text-gray-500 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <Move size={32} className="opacity-50" />
          <p className="text-xs">选择一个元素来编辑其属性</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-2 space-y-3 ${className}`}>
      {/* 元素基本信息 */}
      <div>
        <h3 className="font-medium text-xs mb-1">元素信息</h3>
        <div className="text-xs text-gray-600 space-y-0.5">
          <p>类型: {selectedElement.type}</p>
          <p className="truncate">ID: {selectedElement.id.slice(0, 20)}...</p>
          {isMaskElement && <p className="text-primary">遮罩图片元素</p>}
        </div>
      </div>

      <Separator />

      {/* 位置和尺寸 - 对遮罩图片显示遮罩信息 */}
      <div>
        <h3 className="font-medium text-xs mb-2">
          {isMaskElement ? '遮罩区域' : '位置和尺寸'}
        </h3>

        {isMaskElement ? (
          // 遮罩信息显示
          <div className="p-2 bg-primary/10 rounded border border-primary/20 mb-3">
            <h4 className="text-xs font-medium text-foreground mb-1">遮罩信息</h4>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>形状: {(selectedElement as ImageElement).maskRegion?.shape === 'circle' ? '圆形' : '矩形'}</p>
              <p>位置: {(selectedElement as ImageElement).maskRegion?.position.x}, {(selectedElement as ImageElement).maskRegion?.position.y}</p>
              <p>尺寸: {(selectedElement as ImageElement).maskRegion?.position.width} × {(selectedElement as ImageElement).maskRegion?.position.height}</p>
            </div>
          </div>
        ) : (
          // 普通元素的位置和尺寸控制
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="x-position">X 位置</Label>
              <Input
                id="x-position"
                type="number"
                value={Math.round(selectedElement.transform.x)}
                onChange={(e) => updateElementProperty('transform.x', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="y-position">Y 位置</Label>
              <Input
                id="y-position"
                type="number"
                value={Math.round(selectedElement.transform.y)}
                onChange={(e) => updateElementProperty('transform.y', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="width">宽度</Label>
              <Input
                id="width"
                type="number"
                value={Math.round(selectedElement.transform.width)}
                onChange={(e) => updateElementProperty('transform.width', parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <Label htmlFor="height">高度</Label>
              <Input
                id="height"
                type="number"
                value={Math.round(selectedElement.transform.height)}
                onChange={(e) => updateElementProperty('transform.height', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* 遮罩模式下的图片变换控制 */}
      {isMaskElement && (
        <>
          <div>
            <h3 className="font-medium text-xs mb-2 flex items-center">
              <Scissors size={14} className="mr-1 text-primary" />
              遮罩内图片变换
            </h3>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <Label htmlFor="mask-x-position">图片 X 偏移</Label>
                <Input
                  id="mask-x-position"
                  type="number"
                  value={Math.round((selectedElement as ImageElement).imageTransform?.position.x || 0)}
                  onChange={(e) => handleMaskImageTransform('position.x', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="mask-y-position">图片 Y 偏移</Label>
                <Input
                  id="mask-y-position"
                  type="number"
                  value={Math.round((selectedElement as ImageElement).imageTransform?.position.y || 0)}
                  onChange={(e) => handleMaskImageTransform('position.y', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* 遮罩内图片缩放 */}
            <div className="mb-3">
              <Label>
                图片缩放 ({Math.round(((selectedElement as ImageElement).imageTransform?.scale || 1) * 100)}%)
              </Label>
              <Slider
                value={[(selectedElement as ImageElement).imageTransform?.scale || 1]}
                onValueChange={([value]) => handleMaskImageTransform('scale', value)}
                max={3}
                min={0.1}
                step={0.1}
                className="mt-2"
              />
            </div>

            {/* 遮罩内图片旋转 */}
            <div className="mb-3">
              <Label htmlFor="mask-rotation">图片旋转</Label>
              <Input
                id="mask-rotation"
                type="number"
                value={Math.round((selectedElement as ImageElement).imageTransform?.rotation || 0)}
                onChange={(e) => handleMaskImageTransform('rotation', parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            {/* 重置按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetMaskImagePosition}
              className="w-full"
            >
              <RotateCw size={14} className="mr-1" />
              重置图片位置
            </Button>
          </div>

          <Separator />
        </>
      )}

      {/* 变换控制 - 对于遮罩模式需要隐藏或调整 */}
      {!isMaskElement && (
        <div>
          <h3 className="font-medium text-xs mb-3">变换</h3>

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
      )}

      <Separator />

      {/* 样式控制 */}
      <div>
        <h3 className="font-medium text-xs mb-3">样式</h3>

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
            <h3 className="font-medium text-xs mb-3">文字属性</h3>

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
            <h3 className="font-medium text-xs mb-3">图标属性</h3>

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
            <h3 className="font-medium text-xs mb-3">形状属性</h3>

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
        <h3 className="font-medium text-xs mb-3">操作</h3>

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
