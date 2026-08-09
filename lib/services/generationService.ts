// Generation 编排服务：提示词驱动出图的核心业务流程
// 首生成(generate)：校验限额/积分 → 创建作品 → 编排 prompt → 出图 → 存R2 → 记turn → 更新作品 → 扣分
// 多轮编辑(edit)：取基准轮输出图 → 编排新指令 → editImage → 存R2 → 记turn → 更新作品 → 扣分

import { GenerationRepository } from '@/lib/repositories/generation'
import type { Generation } from '@/lib/repositories/generation'
import { generateImage, editImage } from '@/lib/services/openai/imageService'
import { orchestrate } from '@/lib/services/openai/promptOrchestrator'
import {
  OPENAI_CONFIG,
  resolveSize,
  creditsForQuality,
  type ImageQuality,
} from '@/lib/openai-config'
import { getStyleHint, getSceneHint } from '@/lib/presets'
import {
  uploadBufferToR2,
  generateR2Key,
  getR2PublicUrl,
  validateR2Config,
} from '@/lib/storage'
import { checkAllAILimits, consumeAIUsage } from '@/lib/services/dailyLimitService'
import { checkCreditsAvailable } from '@/lib/services/creditService'
import { deductUserCredits, createCreditTransaction } from '@/lib/repositories/credits'

export interface RefImageInput {
  buffer: Buffer
  mimeType: string
}

export interface GenerateRequest {
  userId?: string
  sessionId?: string
  prompt: string
  style?: string // 风格 key
  scene?: string // 场景 key
  aspectRatio?: string // 1:1 / 4:3 / 3:4 / 16:9 / 9:16
  quality?: ImageQuality
  /** 参考图（>0 走图生图 editImage） */
  refImages?: RefImageInput[]
}

export interface EditRequest {
  userId?: string
  prompt: string // 本轮新指令
  style?: string
  aspectRatio?: string
  quality?: ImageQuality
  /** 回退到指定历史轮次作为编辑基准；缺省=最新轮 */
  fromTurnIndex?: number
}

export interface GenerateResult {
  success: boolean
  generation?: Generation
  error?: string
  remainingCredits?: number
}

/** 下载 R2 公开图为 buffer（多轮编辑取基准图用） */
async function downloadToBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`下载基准图失败: HTTP ${resp.status}`)
  return Buffer.from(await resp.arrayBuffer())
}

/** 上传出图到 R2，返回公开 URL */
async function uploadOutputImage(buffer: Buffer): Promise<string> {
  if (!validateR2Config()) throw new Error('R2 存储未配置')
  const bucket = process.env.R2_BUCKET_NAME!
  const key = generateR2Key('generations', 'png')
  await uploadBufferToR2(buffer, bucket, key, 'image/png')
  return getR2PublicUrl(key)
}

/** 扣分 + 写积分流水（复用底层 repository，purpose=generation，与 collage 隔离） */
async function chargeCredits(
  userId: string,
  amount: number,
  generationUuid: string,
  quality: ImageQuality
): Promise<number> {
  const ded = await deductUserCredits(userId, amount, 'generation')
  if (ded.success) {
    await createCreditTransaction({
      userId,
      amount: -amount,
      transactionType: 'spent',
      title: 'AI图像生成',
      description: `gpt-image-2 ${quality} 出图`,
      relatedEntityType: 'generation',
      relatedEntityId: generationUuid,
      metadata: { quality },
    })
  }
  return ded.newBalance
}

/** 前置校验：登录用户检查每日限额 + 积分余额 */
async function preflight(
  userId: string | undefined,
  credits: number
): Promise<string | undefined> {
  if (!userId) return undefined
  const limit = await checkAllAILimits(userId)
  if (!limit.allowed) return limit.reason ?? '已达每日使用上限'
  const credit = await checkCreditsAvailable(userId, credits)
  if (!credit.available) return '积分余额不足'
  return undefined
}

/**
 * 首生成：无参考图走文生图，有参考图走图生图
 */
export async function generate(request: GenerateRequest): Promise<GenerateResult> {
  const t0 = Date.now()
  const aspectRatio = request.aspectRatio ?? '1:1'
  const quality = request.quality ?? OPENAI_CONFIG.defaultQuality
  const size = resolveSize(aspectRatio)
  const credits = creditsForQuality(quality)
  const hasRef = (request.refImages?.length ?? 0) > 0

  const blocked = await preflight(request.userId, credits)
  if (blocked) return { success: false, error: blocked }

  const generation = await GenerationRepository.create({
    userId: request.userId,
    sessionId: request.sessionId,
    title: request.prompt.slice(0, 50) || '未命名作品',
    prompt: request.prompt,
    style: request.style,
    scene: request.scene,
    aspectRatio,
    quality,
    generationStatus: 'processing',
  })

  try {
    const orch = await orchestrate({
      rawPrompt: request.prompt,
      refImages: request.refImages,
      styleHint: getStyleHint(request.style),
      sceneHint: getSceneHint(request.scene),
      aspectRatio,
    })

    const out = hasRef
      ? await editImage({
          prompt: orch.finalPrompt,
          images: request.refImages!,
          size,
          quality,
        })
      : await generateImage({ prompt: orch.finalPrompt, size, quality })

    const url = await uploadOutputImage(out.buffer)

    await GenerationRepository.addTurn({
      generationId: generation.uuid,
      turnIndex: 0,
      type: 'generate',
      userPrompt: request.prompt,
      builtPrompt: orch.finalPrompt,
      // 参考图 URL 持久化为增强项，P2 暂不存（buffer 已用于出图）
      refImageUrls: [],
      imageUrl: url,
      size,
      quality,
      style: request.style,
      orchestrated: orch.orchestrated,
      durationMs: Date.now() - t0,
      creditsUsed: credits,
      revisedPrompt: out.revisedPrompt,
    })

    const updated = await GenerationRepository.update(generation.uuid, {
      imageUrl: url,
      thumbnailUrl: url,
      finalPrompt: orch.finalPrompt,
      turnCount: 1,
      generationStatus: 'completed',
      aiModel: out.model,
      creditsUsed: credits,
    })

    let remainingCredits: number | undefined
    if (request.userId) {
      remainingCredits = await chargeCredits(request.userId, credits, generation.uuid, quality)
      await consumeAIUsage(request.userId).catch(() => {
        /* 限额计数失败不阻断已完成的出图 */
      })
    }

    return { success: true, generation: updated, remainingCredits }
  } catch (error) {
    await GenerationRepository.update(generation.uuid, {
      generationStatus: 'failed',
    }).catch(() => {})
    return {
      success: false,
      error: error instanceof Error ? error.message : '生成失败',
    }
  }
}

/**
 * 多轮编辑：基于某历史轮次的输出图 + 新指令，产出新一轮
 * fromTurnIndex 指定基准轮（回退）；缺省用最新轮
 */
export async function edit(
  generationUuid: string,
  request: EditRequest
): Promise<GenerateResult> {
  const t0 = Date.now()
  const generation = await GenerationRepository.findByUuid(generationUuid, request.userId)
  if (!generation) return { success: false, error: '作品不存在或无权访问' }

  const baseTurn =
    request.fromTurnIndex !== undefined
      ? await GenerationRepository.getTurnByIndex(generationUuid, request.fromTurnIndex)
      : await GenerationRepository.getLatestTurn(generationUuid)
  if (!baseTurn?.imageUrl) return { success: false, error: '未找到可编辑的基准图' }

  const quality = (request.quality ?? (generation.quality as ImageQuality)) ?? OPENAI_CONFIG.defaultQuality
  const aspectRatio = request.aspectRatio ?? generation.aspectRatio
  const size = resolveSize(aspectRatio)
  const credits = creditsForQuality(quality)

  const blocked = await preflight(request.userId, credits)
  if (blocked) return { success: false, error: blocked }

  try {
    const baseBuffer = await downloadToBuffer(baseTurn.imageUrl)

    const orch = await orchestrate({
      rawPrompt: request.prompt,
      refImages: [{ buffer: baseBuffer, mimeType: 'image/png' }],
      styleHint: getStyleHint(request.style ?? generation.style),
      sceneHint: getSceneHint(generation.scene),
      aspectRatio,
    })

    const out = await editImage({
      prompt: orch.finalPrompt,
      images: [{ buffer: baseBuffer, mimeType: 'image/png' }],
      size,
      quality,
    })

    const url = await uploadOutputImage(out.buffer)
    const turnIndex = generation.turnCount

    await GenerationRepository.addTurn({
      generationId: generationUuid,
      turnIndex,
      type: 'edit',
      userPrompt: request.prompt,
      builtPrompt: orch.finalPrompt,
      refImageUrls: [baseTurn.imageUrl],
      imageUrl: url,
      size,
      quality,
      style: request.style ?? generation.style,
      orchestrated: orch.orchestrated,
      durationMs: Date.now() - t0,
      creditsUsed: credits,
      revisedPrompt: out.revisedPrompt,
    })

    const updated = await GenerationRepository.update(generationUuid, {
      imageUrl: url,
      thumbnailUrl: url,
      turnCount: turnIndex + 1,
      creditsUsed: generation.creditsUsed + credits,
    })

    let remainingCredits: number | undefined
    if (request.userId) {
      remainingCredits = await chargeCredits(request.userId, credits, generationUuid, quality)
      await consumeAIUsage(request.userId).catch(() => {})
    }

    return { success: true, generation: updated, remainingCredits }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '编辑失败',
    }
  }
}
