/**
 * 将R2图片URL转换为代理URL，解决CORS问题
 * @param originalUrl 原始R2图片URL
 * @returns 代理URL
 */
export function getProxiedImageUrl(originalUrl: string): string {
  // 检查是否是R2 URL
  const r2Domains = [
    'aicollager.your_cloudflare_account_id.r2.cloudflarestorage.com',
    'pub-your_cloudflare_account_id.r2.dev'
  ];
  
  try {
    const urlObj = new URL(originalUrl);
    const needsProxy = r2Domains.some(domain => urlObj.hostname.includes(domain));
    
    if (needsProxy) {
      // 构建代理URL
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
      return proxyUrl;
    }
    
    // 不需要代理的URL直接返回
    return originalUrl;
  } catch (error) {
    console.error('❌ URL转换失败:', error);
    return originalUrl;
  }
}

/**
 * 批量转换图片URL
 * @param urls 图片URL数组
 * @returns 代理URL数组
 */
export function getProxiedImageUrls(urls: string[]): string[] {
  return urls.map(url => getProxiedImageUrl(url));
} 