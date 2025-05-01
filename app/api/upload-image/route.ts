import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { join } from "path";
import { stat, mkdir, writeFile } from "fs/promises";
import { v4 as uuidv4 } from 'uuid';

// 配置上传目录
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// 确保上传目录存在
async function ensureUploadDir() {
  try {
    await stat(UPLOAD_DIR);
  } catch (e) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. 解析FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { code: -1, message: "No file provided" }, 
        { status: 400 }
      );
    }

    // 2. 检查文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { code: -1, message: "File must be an image" },
        { status: 400 }
      );
    }

    // 3. 确保上传目录存在
    await ensureUploadDir();

    // 4. 创建唯一文件名
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // 5. 读取文件数据
    const fileData = await file.arrayBuffer();
    const buffer = Buffer.from(fileData);

    // 6. 写入文件
    await writeFile(filePath, buffer);

    // 7. 返回文件URL
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      code: 0,
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { code: -1, message: "Server error" },
      { status: 500 }
    );
  }
} 