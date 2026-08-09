// gpt-image-2 图像生成/编辑封装
// 仅负责与 OpenAI Images API 的通信：文生图(generate) + 图生图/编辑(edit, 多图)。
// 不含业务逻辑（限额/扣分/存R2/记历史）——那由 generation 编排服务负责。

import { toFile } from 'openai';
import {
  OPENAI_CONFIG,
  type ImageQuality,
  type ImageSize,
} from '@/lib/openai-config';
import { getOpenAIClient, normalizeError } from './client';

export interface ImageGenerateInput {
  prompt: string;
  size?: ImageSize;
  quality?: ImageQuality;
  n?: number;
}

export interface RefImage {
  buffer: Buffer;
  mimeType: string;
}

export interface ImageEditInput {
  prompt: string;
  /** 1~N 张参考图；首张为主图，其余按 prompt 中的顺序引用 */
  images: RefImage[];
  /** 可选 mask（PNG alpha），用于局部编辑 */
  mask?: Buffer;
  size?: ImageSize;
  quality?: ImageQuality;
}

export interface ImageGenOutput {
  /** PNG 二进制 */
  buffer: Buffer;
  mimeType: string;
  model: string;
  /** gpt-image-2 不一定返回 revised_prompt */
  revisedPrompt?: string;
}

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

/**
 * 文生图：images.generate
 * 用于无参考图的纯提示词出图。
 */
export async function generateImage(input: ImageGenerateInput): Promise<ImageGenOutput> {
  const client = getOpenAIClient();
  try {
    const result = await client.images.generate({
      model: OPENAI_CONFIG.imageModel,
      prompt: input.prompt,
      size: input.size ?? OPENAI_CONFIG.defaultSize,
      quality: input.quality ?? OPENAI_CONFIG.defaultQuality,
      n: input.n ?? 1,
    });
    const item = result.data?.[0];
    const b64 = item?.b64_json;
    if (!b64) throw new Error('gpt-image-2 未返回图片数据');
    return {
      buffer: Buffer.from(b64, 'base64'),
      mimeType: 'image/png',
      model: OPENAI_CONFIG.imageModel,
      revisedPrompt: item?.revised_prompt,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * 图生图/编辑：images.edit
 * 多张参考图通过 image[] 有序列表传入，prompt 中按顺序引用("image 1 主角…")。
 */
export async function editImage(input: ImageEditInput): Promise<ImageGenOutput> {
  const client = getOpenAIClient();
  if (!input.images || input.images.length === 0) {
    throw new Error('editImage 至少需要 1 张参考图');
  }
  try {
    const imageFiles = await Promise.all(
      input.images.map((img, i) =>
        toFile(img.buffer, `image-${i + 1}.${extFromMime(img.mimeType)}`, {
          type: img.mimeType,
        })
      )
    );
    const base = {
      model: OPENAI_CONFIG.imageModel,
      image: imageFiles,
      prompt: input.prompt,
      size: input.size ?? OPENAI_CONFIG.defaultSize,
      quality: input.quality ?? OPENAI_CONFIG.defaultQuality,
    };
    // mask 可选：构造不同 params 形状，避免传入 undefined 字段
    const result = input.mask
      ? await client.images.edit({
          ...base,
          mask: await toFile(input.mask, 'mask.png', { type: 'image/png' }),
        })
      : await client.images.edit(base);
    const item = result.data?.[0];
    const b64 = item?.b64_json;
    if (!b64) throw new Error('gpt-image-2 未返回图片数据');
    return {
      buffer: Buffer.from(b64, 'base64'),
      mimeType: 'image/png',
      model: OPENAI_CONFIG.imageModel,
      revisedPrompt: item?.revised_prompt,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * 连通性测试：用最低成本(low/1024)打一次 generate，验证 key 与模型可用。
 */
export async function testImageConnection(): Promise<{
  ok: boolean;
  model: string;
  bytes?: number;
  error?: string;
}> {
  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, model: OPENAI_CONFIG.imageModel, error: 'OPENAI_API_KEY 未配置' };
  }
  try {
    const out = await generateImage({
      prompt: 'a small solid red square centered on a pure white background, flat, minimal',
      size: '1024x1024',
      quality: 'low',
    });
    return { ok: out.buffer.length > 0, model: OPENAI_CONFIG.imageModel, bytes: out.buffer.length };
  } catch (error) {
    return { ok: false, model: OPENAI_CONFIG.imageModel, error: normalizeError(error).message };
  }
}
