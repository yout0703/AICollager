// 拼图相关类型定义

// 画布配置类型
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
}

// 变换属性类型
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
  transform: Transform;
  style: ElementStyle;
  isLocked: boolean;
  isVisible: boolean;
}

// 图片元素类型
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
  aiAnalysis?: {
    dominantColors: string[];
    contentTags: string[];
    confidence: number;
  };
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

// 联合类型
export type CollageElement = ImageElement | IconElement | TextElement | ShapeElement | BorderElement;

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

// 拼图主类型
export interface Collage {
  id: number;
  uuid: string;
  user_id?: string;
  session_id?: string;
  title?: string;
  description?: string;
  
  // 拼图数据
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

// 拼图图片类型
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

// 拼图创建请求类型
export interface CreateCollageRequest {
  user_id?: string;
  session_id?: string;
  title?: string;
  description?: string;
  template_id?: string;
  user_preferences?: Record<string, any>;
  images: File[] | string[]; // 文件对象或URL数组
}

// 拼图更新请求类型
export interface UpdateCollageRequest {
  title?: string;
  description?: string;
  canvas_config?: CanvasConfig;
  elements?: CollageElement[];
  visibility?: 'private' | 'public' | 'unlisted';
} 