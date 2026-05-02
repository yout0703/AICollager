import { NextRequest, NextResponse } from 'next/server';
import { CollageService } from '@/lib/services/collage';
import { resolveUser } from '@/lib/utils/userResolver';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await resolveUser(); // userId 是内部 UUID 或 undefined
    const { id: collageId } = await params;

    if (!collageId) {
      return NextResponse.json(
        { error: '拼图ID不能为空' },
        { status: 400 }
      );
    }

    const collageService = new CollageService();
    const collage = await collageService.getCollageById(collageId, userId);

    if (!collage) {
      return NextResponse.json(
        { error: '拼图不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collage: collage
    });

  } catch (error) {
    console.error('获取拼图详情错误:', error);

    if (error instanceof Error) {
      if (error.message.includes('无权访问')) {
        // 检查具体的权限错误类型
        if (error.message.includes('需要登录')) {
          return NextResponse.json(
            { error: '请先登录后访问此拼图' },
            { status: 401 }
          );
        } else {
          return NextResponse.json(
            { error: '无权访问此拼图，您不是拼图所有者' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        error: '获取拼图详情失败',
        details: process.env.NODE_ENV === 'development' ?
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await resolveUser();
    const { id: collageId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    if (!collageId) {
      return NextResponse.json(
        { error: '拼图ID不能为空' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, visibility, canvas_config, elements } = body;

    // 验证canvas_config和elements的数据类型（如果提供的话）
    if (canvas_config && typeof canvas_config !== 'object') {
      return NextResponse.json(
        { error: '无效的画布配置数据' },
        { status: 400 }
      );
    }

    if (elements && !Array.isArray(elements)) {
      return NextResponse.json(
        { error: '无效的元素数据' },
        { status: 400 }
      );
    }

    const collageService = new CollageService();
    const updatedCollage = await collageService.updateCollage(collageId, userId, {
      title,
      description,
      visibility,
      canvas_config,
      elements
    });

    return NextResponse.json({
      success: true,
      collage: updatedCollage
    });

  } catch (error) {
    console.error('更新拼图错误:', error);

    if (error instanceof Error && error.message.includes('无权')) {
      return NextResponse.json(
        { error: '无权修改此拼图' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: '更新拼图失败',
        details: process.env.NODE_ENV === 'development' ?
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await resolveUser();
    const { id: collageId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      );
    }

    if (!collageId) {
      return NextResponse.json(
        { error: '拼图ID不能为空' },
        { status: 400 }
      );
    }

    const collageService = new CollageService();
    await collageService.deleteCollage(collageId, userId);

    return NextResponse.json({
      success: true,
      message: '拼图已删除'
    });

  } catch (error) {
    console.error('删除拼图错误:', error);

    if (error instanceof Error && error.message.includes('无权')) {
      return NextResponse.json(
        { error: '无权删除此拼图' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: '删除拼图失败',
        details: process.env.NODE_ENV === 'development' ?
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
}
