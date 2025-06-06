/**
 * 重构后的拼图服务 - 现在使用拆分的子服务
 * 
 * 原来的大型 CollageService (1400+ 行) 已经被拆分为以下专门的服务：
 * - CollageValidationService: 用户验证和限制检查
 * - CollageImageService: 图片上传和分析  
 * - CollageLayoutService: 布局生成和Icon推荐
 * - CollageCrudService: 数据库CRUD操作
 * - CollageGenerationService: 拼图生成核心流程
 * 
 * 此文件现在只是一个向后兼容的包装器
 */

// 导入拆分后的服务
export {
  CollageService,
  collageService,
  collageValidationService,
  collageImageService,
  collageLayoutService,
  collageCrudService,
  collageGenerationService
} from './collage';

// 导出类型定义，保持向后兼容
export type {
  ValidationResult,
  ImageAnalysisResult,
  LayoutGenerationResult,
  CollageGenerationRequest,
  CollageGenerationResult
} from './collage'; 