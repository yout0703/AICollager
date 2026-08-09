import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/utils/userResolver';
import { respData, respErr } from '@/lib/resp';
import { generate } from '@/lib/services/generationService';
import { parseQuality } from '@/lib/openai-config';

// 首生成：POST /api/generate
// formData: prompt(必填) + style + scene + aspectRatio + quality + refImages[](可选,>0 走图生图)
export async function POST(request: NextRequest) {
  try {
    const userInfo = await resolveUser();
    if (!userInfo.userId) {
      return respErr('请先登录后再生成');
    }

    const formData = await request.formData();
    const prompt = (formData.get('prompt') as string | null)?.trim();
    if (!prompt) return respErr('请输入提示词');

    const style = (formData.get('style') as string | null) || undefined;
    const scene = (formData.get('scene') as string | null) || undefined;
    const aspectRatio = (formData.get('aspectRatio') as string | null) || undefined;
    const quality = parseQuality(formData.get('quality') as string | null);

    const files = formData.getAll('refImages').filter((f): f is File => f instanceof File);
    const refImages =
      files.length > 0
        ? await Promise.all(
            files.map(async (f) => ({
              buffer: Buffer.from(await f.arrayBuffer()),
              mimeType: f.type || 'image/png',
            }))
          )
        : undefined;

    const result = await generate({
      userId: userInfo.userId,
      prompt,
      style,
      scene,
      aspectRatio,
      quality,
      refImages,
    });

    if (!result.success) return respErr(result.error ?? '生成失败');
    return respData({
      generation: result.generation,
      remainingCredits: result.remainingCredits,
    });
  } catch (e) {
    return respErr(e instanceof Error ? e.message : '服务器错误');
  }
}
