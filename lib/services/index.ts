// AI服务层统一导出

// 核心服务
export { geminiService } from './core/geminiService';
export { aiAnalysisService } from './aiAnalysisService';

// 便捷函数
export { 
  analyzeImages, 
  suggestLayout,
  generateColorScheme,
  performCompleteAnalysis 
} from './aiAnalysisService';

// 类型定义
export type {
  ImageAnalysisResult,
  LayoutSuggestion,
  ColorScheme,
  ProcessingError
} from './aiAnalysisService';

export type {
  GeminiResponse,
  GeminiImageAnalysisRequest,
  GeminiLayoutSuggestionRequest,
  GeminiColorSchemeRequest
} from './core/geminiService'; 