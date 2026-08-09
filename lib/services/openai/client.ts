// OpenAI 客户端共享：图像生成(imageService) 与 Prompt 编排(promptOrchestrator) 复用同一实例。

import OpenAI from 'openai';
import { OPENAI_CONFIG } from '@/lib/openai-config';

let _client: OpenAI | null = null;

/** 共享的 OpenAI 客户端（懒加载）。未配置 key 时抛错。 */
export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 未配置，请在 .env.local 设置');
  }
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: OPENAI_CONFIG.baseURL,
      timeout: OPENAI_CONFIG.timeout,
      maxRetries: OPENAI_CONFIG.retryAttempts,
    });
  }
  return _client;
}

/** 归一化未知错误为 Error（openai SDK 的 APIError 已是 Error 子类，保留其 message） */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
