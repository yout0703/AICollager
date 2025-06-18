// UCM (Universal Collage Model) 类型定义
// 基于最新设计文档 v1.2

// 画布背景类型
export interface CanvasBackground {
  type: 'color' | 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    direction?: string;
  };
  image?: {
    url: string;
    fit: 'cover' | 'contain' | 'fill';
  };
}

// 画布配置
export interface Canvas {
  units: 'px' | 'mm' | 'in';
  width: number;
  height: number;
  background: CanvasBackground;
}

// 变换属性
export interface Transform {
  rotation_degrees: number;
  scale: number;
  flip_horizontal: boolean;
  flip_vertical?: boolean;
  transformOrigin: {
    x: number; // 0-1 之间的百分比
    y: number; // 0-1 之间的百分比
  };
}

// 边框样式
export interface BorderStyle {
  width: number;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

// 阴影样式
export interface ShadowStyle {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

// 字体样式
export interface FontStyle {
  family: string;
  size: number;
  weight: string | number;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

// 基础元素样式
export interface BaseElementStyle {
  opacity: number;
  borderRadius?: number;
  border?: BorderStyle | null;
  shadow?: ShadowStyle | null;
}

// 图片元素样式
export interface ImageElementStyle extends BaseElementStyle {
  objectFit: 'cover' | 'contain' | 'fill' | 'scale-down';
}

// 文字元素样式
export interface TextElementStyle extends BaseElementStyle {
  font: FontStyle;
  color: string;
}

// 基础元素接口
export interface BaseElement {
  id: string;
  type: 'image' | 'text' | 'shape' | 'icon';
  zIndex: number;
  position: {
    x: number;
    y: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  transform: Transform;
}

// 图片元素
export interface ImageElement extends BaseElement {
  type: 'image';
  source: string; // 图片 URL 或占位符
  style: ImageElementStyle;
}

// 文字元素
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  style: TextElementStyle;
}

// 形状元素
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'polygon';
  style: BaseElementStyle & {
    fillColor: string;
    strokeColor?: string;
    strokeWidth?: number;
  };
}

// 图标元素
export interface IconElement extends BaseElement {
  type: 'icon';
  iconId: string;
  iconName: string;
  style: BaseElementStyle & {
    color: string;
    size: number;
  };
}

// 联合类型
export type UCMElement = ImageElement | TextElement | ShapeElement | IconElement;

// 元数据
export interface UCMMetadata {
  sourceTemplateId?: string;
  aiEngineVersion?: string;
  aiDetectedTheme?: string;
  aiUsedPalette?: string[];
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
}

// UCM 主模型
export interface UCMModel {
  version: string;
  name: string;
  metadata: UCMMetadata;
  canvas: Canvas;
  elements: UCMElement[];
}

// UCM 渲染器属性
export interface UCMRendererProps {
  model: UCMModel;
  scale?: number;
  interactive?: boolean;
  onElementClick?: (element: UCMElement) => void;
  onElementSelect?: (elementId: string) => void;
}

// UCM 编辑器属性
export interface UCMEditorProps {
  model: UCMModel;
  onChange: (model: UCMModel) => void;
  readOnly?: boolean;
} 