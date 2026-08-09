import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/utils/userResolver';
import { respData, respErr } from '@/lib/resp';
import { GenerationRepository } from '@/lib/repositories/generation';

// 作品详情(含轮次历史) + 软删除：GET/DELETE /api/generations/[uuid]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const userInfo = await resolveUser();
    if (!userInfo.userId) return respErr('请先登录');

    const { uuid } = await params;
    const generation = await GenerationRepository.findByUuid(uuid, userInfo.userId);
    if (!generation) return respErr('作品不存在或无权访问');

    const turns = await GenerationRepository.getTurns(uuid);
    return respData({ generation, turns });
  } catch (e) {
    return respErr(e instanceof Error ? e.message : '服务器错误');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const userInfo = await resolveUser();
    if (!userInfo.userId) return respErr('请先登录');

    const { uuid } = await params;
    const ok = await GenerationRepository.softDelete(uuid, userInfo.userId);
    if (!ok) return respErr('删除失败');
    return respData({ ok: true });
  } catch (e) {
    return respErr(e instanceof Error ? e.message : '服务器错误');
  }
}
