import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少图片URL参数' },
        { status: 400 }
      );
    }
    
    // 验证URL是否来自我们的R2存储
    const allowedDomains = [
      'aicollager.your_cloudflare_account_id.r2.cloudflarestorage.com',
      'pub-your_cloudflare_account_id.r2.dev'
    ];
    
    let urlObj;
    try {
      urlObj = new URL(imageUrl);
    } catch (urlError) {
      return NextResponse.json(
        { error: '无效的URL格式' },
        { status: 400 }
      );
    }
    
    const isAllowed = allowedDomains.some(domain => urlObj.hostname.includes(domain));
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: '不允许的图片源' },
        { status: 403 }
      );
    }
    
    // 获取图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'AICollager/1.0',
        'Accept': 'image/*',
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `图片获取失败: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // 返回图片，设置适当的缓存头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: '图片代理失败',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : '未知错误') : undefined
      },
      { status: 500 }
    );
  }
} 