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
    image_index: number;
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
export interface Collage {
  id: number;
  uuid: string;
  user_id?: string;
  session_id?: string;
  title?: string;
  description?: string;
  
  // 拼图数据 - 这是Canvas组件需要的核心数据
  canvas_config: CanvasConfig;
  elements: CollageElement[];
  metadata: CollageMetadata;
  
  // 模板和风格
  template_id?: string;
  generated_style?: string;
  user_preferences?: Record<string, any>;
  
  // 图片资源
  thumbnail_url?: string;
  preview_url?: string;
  full_image_url?: string;
  
  // AI相关
  ai_model?: string;
  ai_processing_time?: number;
  credits_used: number;
  
  // 状态管理
  status: 'draft' | 'processing' | 'completed' | 'failed' | 'deleted';
  generation_status: 'pending' | 'analyzing' | 'generating' | 'rendering' | 'completed';
  
  // 权限和分享
  visibility: 'private' | 'public' | 'unlisted';
  is_featured: boolean;
  download_count: number;
  view_count: number;
  
  // 版本控制
  version: number;
  parent_collage_id?: string;
  
  // 时间记录
  started_at: string;
  completed_at?: string;
  last_edited_at: string;
  created_at: string;
  updated_at: string;
}

// 拼图图片记录类型
export interface CollageImage {
  id: number;
  uuid: string;
  collage_id: string;
  image_index: number;
  element_id?: string;
  
  // 图片信息
  original_url: string;
  processed_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  
  // 图片属性
  original_dimensions?: { width: number; height: number };
  processed_dimensions?: { width: number; height: number };
  
  // AI分析结果
  ai_analysis?: Record<string, any>;
  dominant_colors?: string[];
  content_tags?: string[];
  
  // 处理状态
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
  
  uploaded_at: string;
  created_at: string;
}

// API请求类型
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