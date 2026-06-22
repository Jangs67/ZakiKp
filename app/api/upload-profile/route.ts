import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "File harus berupa gambar" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "Ukuran file terlalu besar (max 5MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `school-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      message: "Upload berhasil",
      fileName,
      path: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error("UPLOAD PROFILE API ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat upload gambar" },
      { status: 500 }
    );
  }
}
