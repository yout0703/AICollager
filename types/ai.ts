// AI服务相关类型定义

// AI使用统计类型 - 与数据库模型保持一致（驼峰命名）
export interface AIUsageStats {
  id: number;
  uuid: string;
  date: string;
  
  // 请求统计
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  
  // 功能分类统计
  imageAnalysisCount: number;
  layoutSuggestionCount: number;
  iconRecommendationCount: number;
  
  // 成本统计
  estimatedCost: string; // 数据库中存储为 decimal 字符串
  costCurrency: string;
  
  // 性能统计
  avgResponseTime: string; // 数据库中存储为 decimal 字符串
  totalProcessingTime: string;
  
  // 元数据
  metadata: unknown; // 数据库中存储为 jsonb
  
  createdAt: Date;
  updatedAt: Date;
}

// AI分析缓存类型 - 与数据库模型保持一致（驼峰命名）
export interface AIAnalysisCache {
  id: number;
  uuid: string;
  cacheType: 'image_analysis' | 'layout_suggestion' | 'icon_recommendation';
  inputHash: string; // 输入内容的hash
  
  // 分析结果
  analysisResult: unknown; // 数据库中存储为 jsonb
  confidenceScore: string | null; // 数据库中存储为 decimal
  
  // 使用统计
  useCount: number;
  lastUsedAt: Date;
  
  // 缓存管理
  expiresAt: Date;
  isValid: boolean;
  
  // 元数据
  metadata: unknown; // 数据库中存储为 jsonb
  
  createdAt: Date;
  updatedAt: Date;
}

// AI图片分析请求类型 - API 层保持下划线命名（面向前端）
export interface ImageAnalysisRequest {
  image_url: string;
  analysis_type: 'content' | 'color' | 'composition' | 'full';
  cache_enabled?: boolean;
}

// AI图片分析结果类型 - 业务逻辑层使用驼峰命名
export interface ImageAnalysisResult {
  content: {
    objects: string[];
    scenes: string[];
    activities: string[];
    peopleCount: number;
    mainSubject: string;
    confidence: number;
  };
  colors: {
    dominantColors: string[];
    colorPalette: string[];
    brightness: number;
    contrast: number;
    saturation: number;
  };
  composition: {
    ruleOfThirds: boolean;
    symmetry: number;
    balance: number;
    focalPoints: { x: number; y: number; strength: number }[];
  };
  metadata: {
    processingTime: number;
    model: string;
    confidence: number;
  };
}

// AI布局生成请求类型 - API 层保持下划线命名（面向前端）
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

// AI布局生成结果类型 - 业务逻辑层使用驼峰命名
export interface LayoutGenerationResult {
  canvasConfig: {
    width: number;
    height: number;
    aspectRatio: string;
    backgroundColor: string;
    padding: number;
  };
  elements: {
    id: string;
    type: 'image' | 'icon' | 'text' | 'shape';
    position: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    zIndex: number;
    style: Record<string, any>;
    content?: any;
  }[];
  recommendedIcons?: string[];
  colorPalette: string[];
  metadata: {
    templateId: string;
    style: string;
    confidence: number;
    reasoning: string;
    processingTime: number;
  };
}

// AI服务配置类型 - 业务逻辑层使用驼峰命名
export interface AIServiceConfig {
  model: string;
  fallbackModel?: string;
  maxRequestsPerDay: number;
  maxRequestsPerUserPerDay: number;
  cacheDurationDays: number;
  timeoutMs: number;
  retryAttempts: number;
}

// AI请求日志类型 - API 层保持下划线命名（面向前端）
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

// AI限制检查结果类型 - API 层保持下划线命名（面向前端）
export interface AILimitCheckResult {
  allowed: boolean;
  reason?: string;
  user_usage_today: number;
  user_limit: number;
  global_usage_today: number;
  global_limit: number;
  reset_time: string;
}