import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/utils/userResolver';
import { respData, respErr } from '@/lib/resp';
import { edit } from '@/lib/services/generationService';
import { parseQuality } from '@/lib/openai-config';

// 多轮编辑：POST /api/edit
// formData: generationUuid(必填) + prompt(必填,本轮新指令) + style + aspectRatio + quality + fromTurnIndex(可选,回退基准)
export async function POST(request: NextRequest) {
  try {
    const userInfo = await resolveUser();
    if (!userInfo.userId) return respErr('请先登录');

    const formData = await request.formData();
    const generationUuid = (formData.get('generationUuid') as string | null)?.trim();
    if (!generationUuid) return respErr('缺少作品 ID');

    const prompt = (formData.get('prompt') as string | null)?.trim();
    if (!prompt) return respErr('请输入调整指令');

    const style = (formData.get('style') as string | null) || undefined;
    const aspectRatio = (formData.get('aspectRatio') as string | null) || undefined;
    const quality = parseQuality(formData.get('quality') as string | null);

    const fromTurnRaw = formData.get('fromTurnIndex') as string | null;
    const parsedTurn = fromTurnRaw ? Number(fromTurnRaw) : NaN;
    const fromTurnIndex = Number.isFinite(parsedTurn) ? parsedTurn : undefined;

    const result = await edit(generationUuid, {
      userId: userInfo.userId,
      prompt,
      style,
      aspectRatio,
      quality,
      fromTurnIndex,
    });

    if (!result.success) return respErr(result.error ?? '编辑失败');
    return respData({
      generation: result.generation,
      remainingCredits: result.remainingCredits,
    });
  } catch (e) {
    return respErr(e instanceof Error ? e.message : '服务器错误');
  }
}
