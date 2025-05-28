// AI服务相关类型定义

// AI使用统计类型
export interface AIUsageStats {
  id: number;
  date: string;
  
  // 请求统计
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  
  // 功能分类统计
  image_analysis_requests: number;
  layout_generation_requests: number;
  icon_recommendation_requests: number;
  
  // 成本统计
  total_cost: number;
  avg_cost_per_request: number;
  
  // 性能统计
  avg_processing_time: number;
  max_processing_time: number;
  
  created_at: string;
}

// AI分析缓存类型
export interface AIAnalysisCache {
  id: number;
  uuid: string;
  cache_key: string;
  cache_type: 'image_analysis' | 'layout_suggestion' | 'icon_recommendation';
  
  // AI模型信息
  ai_model: string;
  model_version?: string;
  
  // 缓存内容
  input_data?: Record<string, any>;
  analysis_result: Record<string, any>;
  confidence_score?: number;
  
  // 使用统计
  use_count: number;
  last_used_at: string;
  
  // 有效期
  expires_at: string;
  created_at: string;
}

// AI图片分析请求类型
export interface ImageAnalysisRequest {
  image_url: string;
  analysis_type: 'content' | 'color' | 'composition' | 'full';
  cache_enabled?: boolean;
}

// AI图片分析结果类型
export interface ImageAnalysisResult {
  content: {
    objects: string[];
    scenes: string[];
    activities: string[];
    people_count: number;
    main_subject: string;
    confidence: number;
  };
  colors: {
    dominant_colors: string[];
    color_palette: string[];
    brightness: number;
    contrast: number;
    saturation: number;
  };
  composition: {
    rule_of_thirds: boolean;
    symmetry: number;
    balance: number;
    focal_points: { x: number; y: number; strength: number }[];
  };
  metadata: {
    processing_time: number;
    model: string;
    confidence: number;
  };
}

// AI布局生成请求类型
export interface LayoutGenerationRequest {
  images: {
    url: string;
    analysis?: ImageAnalysisResult;
  }[];
  preferences?: {
    style: 'modern' | 'vintage' | 'minimal' | 'artistic';
    density: 'sparse' | 'normal' | 'dense';
    aspect_ratio: '1:1' | '4:3' | '16:9' | 'auto';
    theme?: string;
  };
  constraints?: {
    max_elements: number;
    min_spacing: number;
    preserve_aspect_ratios: boolean;
  };
}

// AI布局生成结果类型
export interface LayoutGenerationResult {
  canvas_config: {
    width: number;
    height: number;
    aspect_ratio: string;
    background_color: string;
    padding: number;
  };
  elements: {
    id: string;
    type: 'image' | 'icon' | 'text' | 'shape';
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    z_index: number;
    style: Record<string, any>;
    content?: any;
  }[];
  recommended_icons?: string[];
  color_palette: string[];
  metadata: {
    template_id: string;
    style: string;
    confidence: number;
    reasoning: string;
    processing_time: number;
  };
}

// AI服务配置类型
export interface AIServiceConfig {
  model: string;
  fallback_model?: string;
  max_requests_per_day: number;
  max_requests_per_user_per_day: number;
  cache_duration_days: number;
  timeout_ms: number;
  retry_attempts: number;
}

// AI请求日志类型
export interface AIRequestLog {
  id: string;
  user_id?: string;
  session_id?: string;
  request_type: 'image_analysis' | 'layout_generation' | 'icon_recommendation';
  model: string;
  input_size: number;
  output_size: number;
  processing_time: number;
  cost: number;
  success: boolean;
  error_message?: string;
  cache_hit: boolean;
  created_at: string;
}

// AI限制检查结果类型
export interface AILimitCheckResult {
  allowed: boolean;
  reason?: string;
  user_usage_today: number;
  user_limit: number;
  global_usage_today: number;
  global_limit: number;
  reset_time: string;
}