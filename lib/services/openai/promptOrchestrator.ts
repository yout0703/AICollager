// Prompt 智能编排层
// 在「用户输入」与「gpt-image-2 出图」之间，用 vision LLM 做意图理解 + 排布规划 + 风格融合，
// 产出面向 gpt-image-2 的最优英文 prompt。可经 OPENAI_ORCHESTRATOR_ENABLED 关闭，回退到直接拼接。

import { OPENAI_CONFIG } from '@/lib/openai-config';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './orchestratorPrompt';
import { getOpenAIClient, normalizeError } from './client';

export interface OrchestrateRefImage {
  buffer: Buffer;
  mimeType: string;
}

export interface OrchestrateInput {
  /** 用户原始提示词（任意语言，可模糊） */
  rawPrompt: string;
  /** 可选参考图（按顺序对应 image 1..N） */
  refImages?: OrchestrateRefImage[];
  /** 预设风格描述（来自风格库；P2 接入完整库，此处接受描述文本） */
  styleHint?: string;
  /** 场景模板描述 */
  sceneHint?: string;
  /** 目标宽高比：1:1 / 4:3 / 3:4 / 16:9 / 9:16 */
  aspectRatio?: string;
}

export interface OrchestrateOutput {
  /** 面向 gpt-image-2 的最终英文 prompt */
  finalPrompt: string;
  model: string;
  /** true=LLM 编排；false=降级拼接 */
  orchestrated: boolean;
}

function buildUserMessage(input: OrchestrateInput): string {
  const parts: string[] = [`User request: ${input.rawPrompt}`];
  const n = input.refImages?.length ?? 0;
  if (n > 0) {
    parts.push(
      `Reference images provided: ${n} (attached in order; refer to them as image 1..${n}).`
    );
  }
  if (input.styleHint) parts.push(`Chosen style: ${input.styleHint}`);
  if (input.sceneHint) parts.push(`Scene context: ${input.sceneHint}`);
  if (input.aspectRatio) parts.push(`Target aspect ratio: ${input.aspectRatio}`);
  parts.push('Compose the final image-generation prompt now. Output ONLY the prompt.');
  return parts.join('\n');
}

/** 降级：直接拼接用户提示词 + 风格/场景描述 */
function fallbackPrompt(input: OrchestrateInput): string {
  const parts = [input.rawPrompt];
  if (input.styleHint) parts.push(input.styleHint);
  if (input.sceneHint) parts.push(input.sceneHint);
  return parts.join(', ');
}

/**
 * 把用户输入编排为面向 gpt-image-2 的英文 prompt。
 * - orchestratorEnabled=false 或无 key → 降级拼接
 * - 否则调 vision LLM(gpt-4o)，参考图作为 image_url 输入供其理解
 */
export async function orchestrate(input: OrchestrateInput): Promise<OrchestrateOutput> {
  if (!OPENAI_CONFIG.orchestratorEnabled || !process.env.OPENAI_API_KEY) {
    return {
      finalPrompt: fallbackPrompt(input),
      model: OPENAI_CONFIG.orchestratorModel,
      orchestrated: false,
    };
  }

  const client = getOpenAIClient();
  // content part 结构由 chat.completions.create 参数类型推断（官方 vision 写法）
  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [{ type: 'text', text: buildUserMessage(input) }];
  for (const img of input.refImages ?? []) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${img.mimeType};base64,${img.buffer.toString('base64')}` },
    });
  }

  try {
    const resp = await client.chat.completions.create({
      model: OPENAI_CONFIG.orchestratorModel,
      messages: [
        { role: 'system', content: ORCHESTRATOR_SYSTEM_PROMPT },
        { role: 'user', content },
      ],
      temperature: 0.7,
    });
    const finalPrompt = resp.choices?.[0]?.message?.content?.trim();
    if (!finalPrompt) {
      // LLM 空输出时降级，避免阻塞出图
      return {
        finalPrompt: fallbackPrompt(input),
        model: OPENAI_CONFIG.orchestratorModel,
        orchestrated: false,
      };
    }
    return { finalPrompt, model: OPENAI_CONFIG.orchestratorModel, orchestrated: true };
  } catch (error) {
    // 编排失败不应阻断出图：降级拼接，并在 prompt 中保留原始错误信息便于排查
    const err = normalizeError(error);
    return {
      finalPrompt: `${fallbackPrompt(input)}\n[orchestrator fallback: ${err.message}]`,
      model: OPENAI_CONFIG.orchestratorModel,
      orchestrated: false,
    };
  }
}
