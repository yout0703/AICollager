import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from '@/lib/ai-config';

// 初始化Gemini AI客户端
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini API 请求参数类型
export interface GeminiImageAnalysisRequest {
  images: Array<{
    data: string; // base64
    mimeType: string;
  }>;
  prompt: string;
}

export interface GeminiLayoutSuggestionRequest {
  prompt: string;
}

export interface GeminiColorSchemeRequest {
  prompt: string;
}

// Gemini API 响应类型
export interface GeminiResponse {
  success: boolean;
  text: string;
  error?: string;
  processingTime: number;
}

/**
 * 纯粹的 Gemini API 交互服务
 * 只负责与 Gemini API 的通信，不包含业务逻辑
 */
export class GeminiService {
  private static instance: GeminiService;
  
  private constructor() {}
  
  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }
  
  /**
   * 图片分析 - 调用 Gemini Vision API
   */
  async analyzeImages(request: GeminiImageAnalysisRequest): Promise<GeminiResponse> {
    const startTime = Date.now();
    
    try {
      const config = getAIConfig();
      const model = genAI.getGenerativeModel({ model: config.models.primary });
      
      const imageParts = request.images.map(img => ({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType
        }
      }));
      
      const result = await model.generateContent([request.prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        text,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        text: '',
        error: error instanceof Error ? error.message : 'Gemini API调用失败',
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * 单张图片分析 - 调用 Gemini Vision API
   */
  async analyzeSingleImage(image: { data: string; mimeType: string }, prompt: string): Promise<GeminiResponse> {
    return this.analyzeImages({
      images: [image],
      prompt
    });
  }
  
  /**
   * 文本生成 - 调用 Gemini Pro API
   */
  async generateText(request: GeminiLayoutSuggestionRequest | GeminiColorSchemeRequest): Promise<GeminiResponse> {
    const startTime = Date.now();
    
    try {
      const config = getAIConfig();
      console.log('🤖 Gemini配置:', { model: config.models.primary });
      console.log('📝 发送的prompt长度:', request.prompt.length);
      
      const model = genAI.getGenerativeModel({ 
        model: config.models.primary,
        generationConfig: {
          temperature: 1.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          candidateCount: 1
        }
      });
      
      const result = await model.generateContent(request.prompt);
      const response = await result.response;
      
      // 检查响应状态和安全过滤
      console.log('📊 Gemini响应状态:', {
        candidates: result.response.candidates?.length || 0,
        promptFeedback: result.response.promptFeedback,
        safetyRatings: result.response.candidates?.[0]?.safetyRatings
      });
      
      // 检查是否被安全过滤阻止
      if (result.response.promptFeedback?.blockReason) {
        throw new Error(`Prompt被安全过滤阻止: ${result.response.promptFeedback.blockReason}`);
      }
      
      if (!result.response.candidates || result.response.candidates.length === 0) {
        throw new Error('Gemini未返回任何候选响应，可能是模型配置错误或API配额不足');
      }
      
      const candidate = result.response.candidates[0];
      
      // 详细检查候选响应的安全状态
      if (candidate.safetyRatings) {
        const blockedRatings = candidate.safetyRatings.filter(rating => 
          rating.probability === 'HIGH' || rating.probability === 'MEDIUM'
        );
        if (blockedRatings.length > 0) {
          console.warn('⚠️ 内容被安全过滤:', blockedRatings);
        }
      }
      
      // 检查完成原因
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        const finishReasonMessages = {
          'MAX_TOKENS': '回答太长，已达到最大token限制',
          'SAFETY': '内容被安全过滤器阻止',
          'RECITATION': '内容可能涉及版权问题',
          'OTHER': '其他未知原因导致生成停止'
        };
        
        const message = finishReasonMessages[candidate.finishReason as keyof typeof finishReasonMessages] || 
                       `响应异常结束: ${candidate.finishReason}`;
        
        if (candidate.finishReason === 'SAFETY') {
          throw new Error(`内容被安全过滤器阻止，请尝试修改输入内容`);
        } else {
          console.warn('⚠️ Gemini响应异常结束:', message);
        }
      }
      
      const text = response.text();
      console.log('📤 Gemini返回文本长度:', text.length);
      
      if (!text || text.trim().length === 0) {
        throw new Error('Gemini返回了空响应');
      }
      
      return {
        success: true,
        text,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gemini API调用失败';
      console.error('❌ Gemini API错误:', errorMessage);
      
      return {
        success: false,
        text: '',
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * 获取当前配置的模型信息
   */
  getModelInfo(): { primary: string; fallback?: string } {
    const config = getAIConfig();
    return {
      primary: config.models.primary,
      fallback: config.models.fallback
    };
  }
  
  /**
   * 检查 API 密钥是否配置
   */
  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }
  
  /**
   * 测试模型连接性
   */
  async testConnection(): Promise<{ success: boolean; error?: string; model?: string }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'Gemini API密钥未配置' };
      }
      
      const config = getAIConfig();
      console.log('🧪 测试Gemini连接，模型:', config.models.primary);
      
      const testPrompt = '请简单回答"连接成功"';
      const result = await this.generateText({ prompt: testPrompt });
      
      if (result.success && result.text.trim()) {
        console.log('✅ Gemini连接测试成功');
        return { 
          success: true, 
          model: config.models.primary 
        };
      } else {
        return { 
          success: false, 
          error: result.error || '模型返回空响应',
          model: config.models.primary 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接测试失败';
      console.error('❌ Gemini连接测试失败:', errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
}

// 导出单例实例
export const geminiService = GeminiService.getInstance(); 