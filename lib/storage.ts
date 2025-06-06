import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import axios from "axios";
import * as fs from "fs";
import crypto from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 初始化 R2 客户端 (兼容 S3 API)
let r2Client: S3Client;

try {
  // 验证必需的环境变量
  if (!process.env.R2_ACCOUNT_ID) {
    throw new Error('R2_ACCOUNT_ID 环境变量未设置');
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error('R2_ACCESS_KEY_ID 环境变量未设置');
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2_SECRET_ACCESS_KEY 环境变量未设置');
  }

  r2Client = new S3Client({
    region: "auto", // R2 要求必须使用 "auto" 区域
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    // 添加一些有用的配置
    forcePathStyle: false, // R2 支持虚拟主机样式
    maxAttempts: 3, // 重试次数
  });
} catch (error) {
  console.error('❌ R2 客户端初始化失败:', error);
  throw error;
}

/**
 * 计算Buffer的MD5哈希值
 */
function calculateMD5(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * 检查R2中是否已存在相同MD5的文件
 */
async function checkFileExists(bucketName: string, md5Hash: string, prefix: string = 'collage-images'): Promise<string | null> {
  try {
    const key = `${prefix}/${md5Hash}`;
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    await r2Client.send(command);
    
    // 文件存在，返回公开URL
    const publicUrl = getR2PublicUrl(key);
    
    console.log(`✅ 发现相同文件已存在: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    // 文件不存在或其他错误
    return null;
  }
}

/**
 * 智能上传Buffer到R2（带MD5去重）
 */
export async function uploadBufferToR2WithDedup(
  buffer: Buffer,
  bucketName: string,
  contentType: string = 'image/jpeg',
  prefix: string = 'collage-images'
): Promise<{
  Location: string;
  Bucket: string;
  Key: string;
  ETag?: string;
  isExisting: boolean;
  md5Hash: string;
}> {
  try {
    // 计算MD5哈希
    const md5Hash = calculateMD5(buffer);
    console.log(`🔍 计算图片MD5: ${md5Hash}`);
    
    // 检查是否已存在相同文件
    const existingUrl = await checkFileExists(bucketName, md5Hash, prefix);
    if (existingUrl) {
      return {
        Location: existingUrl,
        Bucket: bucketName,
        Key: `${prefix}/${md5Hash}`,
        isExisting: true,
        md5Hash
      };
    }
    
    // 文件不存在，进行上传
    const r2Key = `${prefix}/${md5Hash}`;
    console.log(`📤 上传新文件到 R2: ${r2Key}`);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
        source: 'aicollager',
        md5Hash: md5Hash
      }
    });

    const result = await r2Client.send(command);
    
    // 构建公开访问的 URL
    const publicUrl = getR2PublicUrl(r2Key);
    
    console.log(`✅ 新文件上传成功: ${publicUrl}`);
    return {
      Location: publicUrl,
      Bucket: bucketName,
      Key: r2Key,
      ETag: result.ETag,
      isExisting: false,
      md5Hash
    };
  } catch (error) {
    console.error("❌ R2 智能上传失败:", error);
    throw error;
  }
}

/**
 * 下载图片并上传到 Cloudflare R2
 */
export async function downloadAndUploadImage(
  imageUrl: string,
  bucketName: string,
  r2Key: string
) {
  try {
    console.log(`📥 正在下载图片: ${imageUrl}`);
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    console.log(`📤 正在上传到 R2: ${r2Key}`);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: response.data as Readable,
      ContentType: response.headers['content-type'] || 'image/jpeg',
      // R2 默认是私有的，需要通过自定义域名或 R2.dev 域名访问
      Metadata: {
        uploadedAt: new Date().toISOString(),
        source: 'aicollager'
      }
    });

    const result = await r2Client.send(command);
    
    // 构建公开访问的 URL
    const publicUrl = getR2PublicUrl(r2Key);
    
    console.log(`✅ 上传成功: ${publicUrl}`);
    return {
      Location: publicUrl,
      Bucket: bucketName,
      Key: r2Key,
      ETag: result.ETag
    };
  } catch (error) {
    console.error("❌ R2 上传失败:", error);
    throw error;
  }
}

/**
 * 直接上传 Buffer 到 Cloudflare R2
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  bucketName: string,
  r2Key: string,
  contentType: string = 'image/jpeg'
) {
  try {
    console.log(`📤 正在上传 Buffer 到 R2: ${r2Key}`);
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
        source: 'aicollager'
      }
    });

    const result = await r2Client.send(command);
    
    // 构建公开访问的 URL
    const publicUrl = getR2PublicUrl(r2Key);
    
    console.log(`✅ Buffer 上传成功: ${publicUrl}`);
    return {
      Location: publicUrl,
      Bucket: bucketName,
      Key: r2Key,
      ETag: result.ETag
    };
  } catch (error) {
    console.error("❌ R2 Buffer 上传失败:", error);
    throw error;
  }
}

/**
 * 下载图片到本地文件
 */
export async function downloadImage(imageUrl: string, outputPath: string): Promise<void> {
  try {
    console.log(`📥 正在下载图片到本地: ${imageUrl} -> ${outputPath}`);
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      let error: Error | null = null;
      writer.on("error", (err) => {
        error = err;
        writer.close();
        reject(err);
      });

      writer.on("close", () => {
        if (!error) {
          console.log(`✅ 图片下载完成: ${outputPath}`);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error("❌ 图片下载失败:", error);
    throw error;
  }
}

/**
 * 生成 R2 文件的公开访问 URL
 * 
 * 支持以下配置方式：
 * 1. 自定义域名：设置 R2_PUBLIC_URL=https://static.aicollager.com
 * 2. R2.dev 域名：使用默认的 pub-{account_id}.r2.dev
 * 
 * @param r2Key R2 文件键，例如：collage-images/abc123
 * @returns 完整的公开访问 URL
 */
export function getR2PublicUrl(r2Key: string): string {
  // 移除 r2Key 开头的 /，确保路径正确
  const cleanKey = r2Key.startsWith('/') ? r2Key.slice(1) : r2Key;
  
  // 优先使用自定义域名
  if (process.env.R2_PUBLIC_URL) {
    console.log('🔗 使用自定义域名:', process.env.R2_PUBLIC_URL);
    // 确保 R2_PUBLIC_URL 不以 / 结尾
    const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
    const publicUrl = `${baseUrl}/${cleanKey}`;
    return publicUrl;
  }
  
  // 使用默认的 R2.dev 域名
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    throw new Error('R2_ACCOUNT_ID 环境变量未设置');
  }
  
  const publicUrl = `https://pub-${accountId}.r2.dev/${cleanKey}`;
  console.log(`🔗 使用 R2.dev 域名: ${publicUrl}`);
  return publicUrl;
}

/**
 * 检查 R2 公开 URL 是否可访问
 */
export async function checkR2PublicAccess(r2Key: string): Promise<{
  accessible: boolean;
  url: string;
  error?: string;
}> {
  const url = getR2PublicUrl(r2Key);
  
  try {
    // 发送 HEAD 请求检查文件是否可访问
    const response = await fetch(url, { 
      method: 'HEAD',
      // 设置较短的超时时间
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      accessible: response.ok,
      url,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      accessible: false,
      url,
      error: error instanceof Error ? error.message : '网络错误'
    };
  }
}

/**
 * 生成唯一的 R2 Key
 */
export function generateR2Key(prefix: string = 'collage-images', extension: string = 'jpg'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2);
  return `${prefix}/${timestamp}-${randomStr}.${extension}`;
}

/**
 * 验证 R2 配置
 * 
 * 必需的环境变量：
 * - R2_ACCOUNT_ID: Cloudflare 账户 ID
 * - R2_ACCESS_KEY_ID: R2 API Token 的 Access Key ID
 * - R2_SECRET_ACCESS_KEY: R2 API Token 的 Secret Access Key
 * - R2_BUCKET_NAME: R2 存储桶名称
 * 
 * 可选的环境变量：
 * - R2_PUBLIC_URL: 自定义域名，例如 https://static.aicollager.com
 */
export function validateR2Config(): boolean {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID', 
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ 缺少 R2 配置环境变量: ${missing.join(', ')}`);
    return false;
  }
  
  if (!process.env.R2_PUBLIC_URL) {
    console.warn('⚠️  未设置 R2_PUBLIC_URL，将使用默认的 R2.dev 域名');
    console.warn('💡 如需使用自定义域名，请设置 R2_PUBLIC_URL=https://your-domain.com');
  } else {
    console.log(`✅ 使用自定义域名: ${process.env.R2_PUBLIC_URL}`);
  }
  
  return true;
}

/**
 * 生成 R2 文件的预签名 URL（用于私有访问）
 * @param r2Key R2 文件键
 * @param expiresIn 过期时间（秒），默认 1 小时
 * @returns 预签名 URL
 */
export async function getR2PresignedUrl(
  r2Key: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME 环境变量未设置');
    }
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: r2Key
    });
    
    const presignedUrl = await getSignedUrl(r2Client, command, { 
      expiresIn 
    });
    
    return presignedUrl;
  } catch (error) {
    console.error('生成预签名 URL 失败:', error);
    throw error;
  }
}

/**
 * 智能获取 R2 文件 URL（先尝试公开访问，失败则使用预签名 URL）
 * @param r2Key R2 文件键
 * @returns 可访问的 URL
 */
export async function getAccessibleR2Url(r2Key: string): Promise<{
  url: string;
  type: 'public' | 'presigned';
  expiresAt?: Date;
}> {
  // 先尝试公开 URL
  const publicUrl = getR2PublicUrl(r2Key);
  const accessCheck = await checkR2PublicAccess(r2Key);
  
  if (accessCheck.accessible) {
    return {
      url: publicUrl,
      type: 'public'
    };
  }
  
  // 公开访问失败，使用预签名 URL
  console.log(`🔐 公开访问失败 (${accessCheck.error})，使用预签名 URL`);
  const presignedUrl = await getR2PresignedUrl(r2Key, 24 * 3600); // 24小时有效期
  
  return {
    url: presignedUrl,
    type: 'presigned',
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000)
  };
}
