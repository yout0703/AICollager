import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  
  // 生成不同可能的 URL 格式
  const testKey = 'test/sample-image.jpg';
  const possibleUrls = [
    // 当前配置的 URL
    publicUrl ? `${publicUrl}/${testKey}` : null,
    
    // 标准 R2.dev 格式
    `https://pub-${accountId}.r2.dev/${testKey}`,
    
    // 可能的其他格式
    `https://${bucketName}.pub-${accountId}.r2.dev/${testKey}`,
    `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${testKey}`,
  ].filter(Boolean);
  
  return NextResponse.json({
    success: true,
    config: {
      accountId,
      bucketName,
      publicUrl,
      hasPublicUrl: !!publicUrl
    },
    possibleUrls,
    instructions: [
      '1. 在 Cloudflare Dashboard 中检查你的 R2 存储桶设置',
      '2. 确认公开访问已启用',
      '3. 复制正确的公开 URL 格式',
      '4. 更新 .env.local 中的 R2_PUBLIC_URL',
      '5. 重启开发服务器'
    ]
  });
}

export async function POST(req: NextRequest) {
  try {
    const { testUrl } = await req.json();
    
    if (!testUrl) {
      return NextResponse.json(
        { error: '请提供要测试的 URL' },
        { status: 400 }
      );
    }
    
    // 测试 URL 是否可访问
    try {
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      return NextResponse.json({
        success: true,
        url: testUrl,
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        url: testUrl,
        accessible: false,
        error: error instanceof Error ? error.message : '网络错误'
      });
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
} 