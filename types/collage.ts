// 拼图相关类型定义 - 遮罩拼图专用数据模型

// 画布配置类型 - 专用于遮罩拼图
export interface CanvasConfig {
  width: number;
  height: number;
  aspectRatio: string; // '1:1', '4:3', '16:9' 等
  backgroundColor: string;
  padding: number;
  borderRadius?: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  // 背景纹理（可选）
  backgroundTexture?: {
    type: 'solid' | 'gradient' | 'pattern';
    value: string;
    style?: string;
  };
}

// 遮罩区域定义 - 遮罩拼图的核心概念
export interface MaskRegion {
  id: string;
  shape: 'circle' | 'rectangle' | 'hexagon' | 'diamond' | 'star' | 'heart' | 'custom';
  clipPath: string; // CSS clip-path定义遮罩边界
  position: {
    x: number; // 遮罩在画布上的绝对位置（像素）
    y: number; // 遮罩在画布上的绝对位置（像素）
    width: number; // 遮罩的宽度（像素）
    height: number; // 遮罩的高度（像素）
  };
  style?: {
    border?: {
      width: number;
      color: string;
      style: 'solid' | 'dashed' | 'dotted';
    };
    shadow?: {
      offsetX: number;
      offsetY: number;
      blur: number;
      color: string;
    };
    glow?: {
      color: string;
      size: number;
    };
  };
}

// 图片在遮罩内的变换 - 图片可以在遮罩内移动、旋转、缩放
export interface ImageTransform {
  position: { 
    x: number; // 图片相对于遮罩区域的偏移（像素）
    y: number; // 图片相对于遮罩区域的偏移（像素）
  }; 
  scale: number; // 缩放比例
  rotation: number; // 旋转角度
  anchor: { x: number; y: number }; // 变换锚点（0-1的百分比）
}

// 基础变换属性类型 - 简化版，主要用于非图片元素的兼容性
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
}

// 样式属性类型
export interface ElementStyle {
  opacity: number;
  borderRadius: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  filter?: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
  };
}

// 拼图元素基础类型
export interface BaseElement {
  id: string;
  type: 'image' | 'icon' | 'text' | 'shape' | 'border';
  zIndex: number;
  transform: Transform; // 保留用于兼容性，但图片元素主要使用imageTransform
  style: ElementStyle;
  isLocked: boolean;
  isVisible: boolean;
  
  // 遮罩相关字段 - 图片元素必须有，其他元素可选
  maskRegion?: MaskRegion; // 遮罩区域定义（图片元素必须有）
  imageTransform?: ImageTransform; // 图片在遮罩内的变换（图片元素必须有）
  
  // AI 推荐信息（可选）
  aiRecommendation?: {
    reason: string;
    alternatives?: string[];
    confidence: number;
  };
}

// 图片元素类型 - 遮罩拼图的主要元素
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  originalSrc: string;
  alt?: string;
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  alignment?: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  aiAnalysis?: {
    dominantColors: string[];
    contentTags: string[];
    confidence: number;
  };
  
  // 遮罩模式字段 - 图片元素必须有
  maskRegion: MaskRegion; // 每个图片都有对应的遮罩区域
  imageTransform: ImageTransform; // 图片在遮罩内的变换
  constrainToMask?: boolean; // 是否限制在遮罩边界内（默认true）
  maskOverflow?: 'hidden' | 'visible'; // 遮罩溢出处理（默认hidden）
}

// Icon元素类型
export interface IconElement extends BaseElement {
  type: 'icon';
  iconId: string;
  iconName: string;
  category: string;
  svgContent: string;
  color: string;
  size: number;
}

// 文字元素类型
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}

// 形状元素类型
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart';
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
}

// 边框元素类型
export interface BorderElement extends BaseElement {
  type: 'border';
  borderType: 'frame' | 'decorative' | 'pattern';
  pattern?: string;
  thickness: number;
  color: string;
}

// 联合类型 - 这是AI输出和Canvas输入的核心数据结构
export type CollageElement = ImageElement | IconElement | TextElement | ShapeElement | BorderElement;

// AI布局建议接口 - 专为遮罩拼图设计
export interface AILayoutSuggestion {
  layout_type: 'mask_collage'; // 只支持遮罩拼图
  mask_strategy: string; // 遮罩布局策略
  aspect_ratio: string;
  canvas_background?: {
    color: string;
    texture: 'solid' | 'gradient' | 'pattern';
    style: string;
  };
  suggestions: Array<{
    imageIndex: number;
    z_index: number;
    
    // 遮罩拼图专用字段
    mask_region: {
      shape: string;
      clip_path: string;
      position: { x: number; y: number; width: number; height: number };
    };
    image_transform: {
      position: { x: number; y: number };
      scale: number;
      rotation: number;
    };
    
    // 可选效果
    effects?: string[];
    opacity?: number;
    borderRadius?: number;
  }>;
  overall_theme: string;
  color_scheme: string[];
  confidence_score: number;
  reasoning: string;
}

// AI图片分析结果
export interface AIImageAnalysis {
  description: string;
  objects: Array<{
    name: string;
    confidence: number;
    position?: { x: number; y: number; width: number; height: number };
  }>;
  colors: Array<{
    color: string;
    percentage: number;
    hex: string;
  }>;
  style: {
    type: string;
    mood: string;
    composition: string;
  };
  themes: string[];
  keywords: string[];
  confidence_score: number;
}

// 拼图元数据类型
export interface CollageMetadata {
  aiAnalysis: {
    processingTime: number;
    model: string;
    confidence: number;
    recommendations: {
      templateId: string;
      reason: string;
      confidence: number;
    }[];
    colorPalette: string[];
    theme: string;
    mood: string;
  };
  userPreferences?: {
    preferredStyle: string;
    colorScheme: string;
    layoutDensity: 'sparse' | 'normal' | 'dense';
  };
  performance: {
    renderTime?: number;
    fileSize?: number;
  };
}

// 拼图主类型 - 数据库存储和API传输格式
// 统一使用数据库字段命名（驼峰命名）
export interface Collage {
  id: number;
  uuid: string;
  userId: string | null;
  sessionId: string | null;
  title: string;
  description: string | null;
  
  // 拼图数据 - 这是Canvas组件需要的核心数据  
  canvasConfig: unknown; // 数据库中存储为 jsonb
  elements: unknown; // 数据库中存储为 jsonb
  metadata: unknown; // 数据库中存储为 jsonb
  
  // 模板和风格
  templateId: string | null;
  generatedStyle: string | null;
  userPreferences: unknown;
  
  // 图片资源
  thumbnailUrl: string | null;
  previewUrl: string | null;
  fullImageUrl: string | null;
  
  // AI相关
  aiModel: string | null;
  aiProcessingTime: number | null;
  creditsUsed: number;
  
  // 状态管理
  status: string;
  generationStatus: string;
  
  // 权限和分享
  visibility: string;
  isFeatured: number; // 数据库存储为 0 或 1
  downloadCount: number;
  viewCount: number;
  
  // 版本控制
  version: number;
  parentCollageId: string | null;
  
  // 时间记录 - 数据库存储为 Date 对象
  startedAt: Date | null;
  completedAt: Date | null;
  lastEditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 拼图图片记录类型 - 与数据库模型保持一致
export interface CollageImage {
  id: number;
  uuid: string;
  collageId: string;
  imageIndex: number;
  
  // 图片信息
  originalUrl: string;
  processedUrl: string | null;
  thumbnailUrl: string | null;
  
  // 文件信息
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  
  // 图片属性
  width: number | null;
  height: number | null;
  format: string | null;
  
  // AI分析结果
  aiAnalysis: unknown; // 数据库中存储为 jsonb
  
  // 元数据
  metadata: unknown; // 数据库中存储为 jsonb
  
  // 时间记录
  createdAt: Date;
  updatedAt: Date;
}

// API请求类型 - 保持下划线命名（snake_case）用于外部API接口
// 注意：这些接口与内部数据库模型（驼峰命名）有所不同，在业务逻辑层进行转换
export interface CreateCollageRequest {
  user_id?: string;
  session_id?: string;
  title?: string;
  description?: string;
  template_id?: string;
  user_preferences?: Record<string, any>;
  images: File[] | string[]; // 文件对象或URL数组
}

export interface UpdateCollageRequest {
  title?: string;
  description?: string;
  canvas_config?: CanvasConfig;
  elements?: CollageElement[];
  visibility?: 'private' | 'public' | 'unlisted';
}

// AI服务输入输出类型
export interface AICollageGenerationInput {
  images: Array<{
    data: Buffer | string;
    mimeType: string;
    filename?: string;
    url?: string;
  }>;
  preferences?: {
    aspect_ratio?: string;
    style?: 'modern' | 'vintage' | 'artistic' | 'minimal';
    theme?: 'travel' | 'family' | 'food' | 'pets' | 'celebration';
    colorScheme?: 'auto' | 'warm' | 'cool' | 'monochrome';
    complexity?: 'simple' | 'moderate' | 'complex';
    mood?: string;
  };
}

export interface AICollageGenerationOutput {
  success: boolean;
  canvas_config: CanvasConfig;
  elements: CollageElement[];
  aiAnalysis: {
    imageAnalyses: AIImageAnalysis[];
    layoutSuggestion: AILayoutSuggestion;
    processingTime: number;
    model: string;
  };
  error?: string;
}

// 遮罩拼图工具类型
export interface MaskCollageUtils {
  // 检查遮罩区域是否重叠
  checkMaskOverlap: (masks: MaskRegion[]) => boolean;
  // 计算图片在遮罩内的最佳位置
  calculateOptimalImagePosition: (imageSize: {width: number, height: number}, maskRegion: MaskRegion) => ImageTransform;
  // 验证图片是否在遮罩边界内
  validateImageInMask: (imageTransform: ImageTransform, maskRegion: MaskRegion) => boolean;
  // 将AI建议转换为遮罩元素
  convertAISuggestionToMaskElements: (suggestion: AILayoutSuggestion) => CollageElement[];
} 