import { NextRequest, NextResponse } from "next/server";
import { join, extname } from "path";
import { stat, mkdir, writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@clerk/nextjs/server";
import { isLocalUploadAllowed } from "@/lib/config";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

async function ensureUploadDir() {
  try {
    await stat(UPLOAD_DIR);
  } catch {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Local-disk image upload for development only.
 * Production uploads should go through R2 via collage generation APIs.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isLocalUploadAllowed()) {
      return NextResponse.json(
        {
          code: -1,
          message:
            "Local disk upload is disabled. Configure R2 and use the collage upload flow, or set ALLOW_LOCAL_UPLOAD=true only for trusted environments.",
        },
        { status: 403 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { code: -1, message: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { code: -1, message: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { code: -1, message: "File must be an image" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { code: -1, message: `File too large (max ${MAX_BYTES / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    const rawExt = extname(file.name || "").toLowerCase() || ".jpg";
    if (!ALLOWED_EXT.has(rawExt)) {
      return NextResponse.json(
        { code: -1, message: "Unsupported image extension" },
        { status: 400 }
      );
    }

    await ensureUploadDir();

    const fileName = `${uuidv4()}${rawExt}`;
    const filePath = join(UPLOAD_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({
      code: 0,
      message: "File uploaded successfully",
      data: {
        url: `/uploads/${fileName}`,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { code: -1, message: "Server error" },
      { status: 500 }
    );
  }
}
