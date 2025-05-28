import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { IconService } from '@/services/iconService';
import { IconRecommendationRequest } from '@/types/icons';
import { checkAllAILimits, checkSessionTrialLimit, consumeAIUsage, consumeTrialUsage } from '@/services/dailyLimitService';
import { getUserInfo } from '@/services/userService';

// AI Icon推荐API
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    
    const {
      context,
      theme,
      mood,
      color_palette,
      existing_icons,
      limit = 6,
      session_id
    } = body;
    
    if (!context) {
      return NextResponse.json(
        { error: '请提供拼图上下文信息' },
        { status: 400 }
      );
    }
    
    let user = null;
    let usageResult = null;
    
    // 验证用户和使用限制
    if (userId) {
      // 已登录用户流程
      user = await getUserInfo(userId, 'clerk_id');
      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }
      
      // 检查AI使用限制
      const limitCheck = await checkAllAILimits(user.uuid);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { 
            error: limitCheck.reason,
            limit_info: {
              user_limit: limitCheck.user_limit,
              global_limit: limitCheck.global_limit
            }
          },
          { status: 429 }
        );
      }
      
      // 消费AI使用次数
      usageResult = await consumeAIUsage(user.uuid);
      if (!usageResult.success) {
        return NextResponse.json(
          { error: usageResult.message },
          { status: 500 }
        );
      }
      
    } else if (session_id) {
      // 试用用户流程
      const limitCheck = await checkSessionTrialLimit(session_id);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { 
            error: limitCheck.reason,
            trial_info: {
              current: limitCheck.user_limit?.current || 0,
              max: limitCheck.user_limit?.max || 3,
              remaining: limitCheck.user_limit?.remaining || 0
            }
          },
          { status: 429 }
        );
      }
      
      // 消费试用次数
      usageResult = await consumeTrialUsage(session_id);
      if (!usageResult.success) {
        return NextResponse.json(
          { error: usageResult.message },
          { status: 500 }
        );
      }
      
    } else {
      return NextResponse.json(
        { error: '请登录或提供会话ID' },
        { status: 401 }
      );
    }
    
    // 构建推荐请求
    const recommendationRequest: IconRecommendationRequest = {
      context,
      theme,
      mood,
      color_palette,
      existing_icons,
      limit
    };
    
    // 执行AI推荐
    const result = await IconService.recommendIcons(recommendationRequest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Icon推荐失败' },
        { status: 500 }
      );
    }
    
    // 记录Icon使用统计（用于推荐的Icons）
    if (result.recommendations) {
      const iconIds = result.recommendations.map(rec => rec.icon.icon_id);
      await IconService.recordIconUsage(iconIds);
    }
    
    // 构建响应
    const response: any = {
      success: true,
      recommendations: result.recommendations,
      performance: result.performance,
      remaining_usage: usageResult?.remaining_usage
    };
    
    // 添加用户信息
    if (user) {
      response.user_info = {
        daily_usage: usageResult?.remaining_usage
      };
    } else if (session_id) {
      response.trial_info = {
        remaining_usage: usageResult?.remaining_usage
      };
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Icon recommendation API failed:', error);
    return NextResponse.json(
      { error: '推荐服务暂时不可用，请稍后重试' },
      { status: 500 }
    );
  }
}

// 获取热门Icons（不需要AI）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : undefined;
    
    const result = await IconService.getPopularIcons({
      category_id: categoryId || undefined,
      limit,
      days
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '获取热门图标失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      icons: result.icons,
      total: result.icons?.length || 0
    });
    
  } catch (error) {
    console.error('Get popular icons failed:', error);
    return NextResponse.json(
      { error: '获取热门图标失败' },
      { status: 500 }
    );
  }
} 