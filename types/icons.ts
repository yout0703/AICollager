// Icon库相关类型定义

// Icon分类类型
export interface IconCategory {
  id: number;
  uuid: string;
  category_id: string;
  category_name: string;
  parent_category_id?: string;
  
  // 描述信息
  description?: string;
  ai_description?: string;
  ai_keywords: string[];
  
  // 显示配置
  display_order: number;
  icon_color: string;
  is_active: boolean;
  
  // 统计信息
  icon_count: number;
  usage_count: number;
  
  created_at: string;
  updated_at: string;
}

// Icon类型
export interface Icon {
  id: number;
  uuid: string;
  icon_id: string;
  icon_name: string;
  category_id: string;
  
  // 内容和样式
  svg_content: string;
  style: 'outline' | 'filled' | 'duotone' | 'color';
  
  // 支持的变体
  size_variants: string[];
  color_variants: string[];
  
  // AI相关
  tags: string[];
  ai_keywords: string[];
  semantic_meaning?: string;
  ai_description?: string;
  
  // 使用统计
  popularity_score: number;
  usage_count: number;
  last_used_at?: string;
  
  // 状态和权限
  is_active: boolean;
  is_premium: boolean;
  
  // 元数据
  source?: string;
  version: string;
  license: string;
  metadata?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

// Icon搜索请求类型
export interface IconSearchRequest {
  query?: string;
  category_id?: string;
  style?: Icon['style'];
  tags?: string[];
  is_premium?: boolean;
  size?: string;
  limit?: number;
  offset?: number;
}

// Icon搜索结果类型
export interface IconSearchResult {
  icons: Icon[];
  total: number;
  categories: IconCategory[];
  suggestions?: string[];
}

// AI Icon推荐请求类型
export interface IconRecommendationRequest {
  context: string; // 上下文描述，如"旅行拼图"
  theme?: string; // 主题，如"vacation", "family"
  mood?: string; // 情绪，如"happy", "romantic"
  color_palette?: string[]; // 色彩调色板
  existing_icons?: string[]; // 已使用的icon ID
  limit?: number;
}

// AI Icon推荐结果类型
export interface IconRecommendationResult {
  recommendations: {
    icon: Icon;
    reason: string;
    confidence: number;
    category_match: boolean;
    theme_match: boolean;
  }[];
  alternative_categories: string[];
}

// Icon使用记录类型
export interface IconUsage {
  icon_id: string;
  user_id?: string;
  session_id?: string;
  collage_id?: string;
  context: string;
  used_at: string;
}

// Icon批量导入类型
export interface IconImportRequest {
  source: string; // 'heroicons', 'lucide', 'custom'
  category_id: string;
  icons: {
    icon_id: string;
    icon_name: string;
    svg_content: string;
    style: Icon['style'];
    tags: string[];
    ai_keywords: string[];
  }[];
} 