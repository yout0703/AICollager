import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/utils/userResolver';
import { respData, respErr } from '@/lib/resp';
import { GenerationRepository } from '@/lib/repositories/generation';

// 作品列表：GET /api/generations?page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const userInfo = await resolveUser();
    if (!userInfo.userId) return respErr('请先登录');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '10') || 10));

    const items = await GenerationRepository.findByUser(userInfo.userId, { page, limit });
    return respData({ items, page, limit });
  } catch (e) {
    return respErr(e instanceof Error ? e.message : '服务器错误');
  }
}
