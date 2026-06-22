import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const nama = formData.get("nama")?.toString() || "";
    const kelas = formData.get("kelas")?.toString() || "";
    const nisn = formData.get("nisn")?.toString() || "";
    const bulan = formData.get("bulan")?.toString() || "";
    const status = formData.get("status")?.toString() || "pending";
    const bank = formData.get("bank")?.toString() || "";
    const nominal = formData.get("nominal")?.toString() || "0";

    if (!file) {
      return NextResponse.json(
        { message: "File bukti pembayaran tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!nama || !kelas || !nisn || !bulan) {
      return NextResponse.json(
        { message: "Data siswa belum lengkap" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}-${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    await connectDB();

    const bill = await Bill.findOneAndUpdate(
      { nisn, bulan },
      {
        nama,
        kelas,
        nisn,
        bulan,
        status,
        bank,
        nominal: Number(nominal),
        proof: fileName,
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      message: "Upload berhasil",
      bill,
      proof: fileName,
    });
  } catch (error) {
    console.error("UPLOAD API ERROR:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat upload bukti pembayaran" },
      { status: 500 }
    );
  }
}