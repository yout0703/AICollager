import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserInfo } from '@/lib/services/userService';
import { checkAllAILimits, consumeAIUsage, checkSessionTrialLimit, consumeTrialUsage } from '@/lib/services/dailyLimitService';
import { analyzeImages, performCompleteAnalysis } from '@/lib/services/geminiService';
import { preCheckConsumption, consumeCredits } from '@/lib/services/creditService';

// 图片分析API
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { images, complete_analysis = false, preferences, session_id } = body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '请提供要分析的图片' },
        { status: 400 }
      );
    }
    
    // 检查图片数量限制
    if (images.length > 10) {
      return NextResponse.json(
        { error: '一次最多分析10张图片' },
        { status: 400 }
      );
    }
    
    let user = null;
    let usageResult = null;
    
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
      
      // 检查积分（如果不是试用）
      const creditCheck = await preCheckConsumption(user.uuid, 'collage');
      if (!creditCheck.canConsume) {
        return NextResponse.json(
          { 
            error: creditCheck.message,
            credits_info: {
              current: creditCheck.currentBalance,
              required: creditCheck.requiredAmount
            }
          },
          { status: 402 }
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
    
    try {
      // 处理图片数据
      const processedImages = images.map((img: any) => ({
        data: img.data, // base64 string
        mimeType: img.mimeType || 'image/jpeg',
        filename: img.filename
      }));
      
      let result;
      
      if (complete_analysis) {
        // 完整分析（图片分析 + 布局建议 + 配色方案）
        result = await performCompleteAnalysis(processedImages, preferences);
      } else {
        // 仅图片分析
        result = await analyzeImages(processedImages);
      }
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'AI分析失败' },
          { status: 500 }
        );
      }
      
             // 如果是已登录用户且分析成功，扣除积分
       if (user && result.success) {
         const cachedOperations = complete_analysis ? (result as any).performance?.cached_operations : [];
         const creditResult = await consumeCredits({
           userId: user.uuid,
           amount: 5, // AI分析消费5积分
           purpose: 'collage',
           metadata: {
             analysis_type: complete_analysis ? 'complete' : 'basic',
             images_count: images.length,
             cached_operations: cachedOperations || []
           }
         });
         
         if (!creditResult.success) {
           console.warn('Failed to consume credits after successful AI analysis:', creditResult.message);
         }
       }
      
             // 构建响应
       const response: any = {
         success: true,
         analysis_type: complete_analysis ? 'complete' : 'basic',
         remaining_usage: usageResult?.remaining_usage
       };
       
       if (complete_analysis) {
         const completeResult = result as any;
         response.image_analysis = completeResult.imageAnalysis;
         response.layout_suggestion = completeResult.layoutSuggestion;
         response.color_scheme = completeResult.colorScheme;
         response.performance = completeResult.performance;
         response.cached = false; // 完整分析没有单一的缓存状态
         response.response_time = completeResult.performance?.total_time;
       } else {
         const analysisResult = result as any;
         response.results = analysisResult.results;
         response.cached = analysisResult.cached || false;
         response.response_time = analysisResult.response_time;
       }
      
      // 添加用户信息
      if (user) {
        response.user_info = {
          remaining_credits: (await preCheckConsumption(user.uuid, 'collage')).currentBalance,
          daily_usage: usageResult?.remaining_usage
        };
      } else if (session_id) {
        response.trial_info = {
          remaining_usage: usageResult?.remaining_usage
        };
      }
      
      return NextResponse.json(response);
      
    } catch (analysisError) {
      console.error('AI analysis failed:', analysisError);
      return NextResponse.json(
        { error: 'AI服务暂时不可用，请稍后重试' },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('AI analyze API failed:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 