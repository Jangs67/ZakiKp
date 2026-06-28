// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const nama = formData.get("nama")?.toString() || "";
    const kelas = formData.get("kelas")?.toString() || "";
    const nisn = formData.get("nisn")?.toString() || "";
    const bulanValues = formData
      .getAll("bulan")
      .map((value) => value?.toString() || "")
      .filter(Boolean);
    const status = formData.get("status")?.toString() || "pending";
    const bank = formData.get("bank")?.toString() || "";
    const nominal = formData.get("nominal")?.toString() || "0";

    if (!file) {
      return NextResponse.json(
        { message: "File bukti pembayaran tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!nama || !kelas || !nisn || bulanValues.length === 0) {
      return NextResponse.json(
        { message: "Data siswa belum lengkap" },
        { status: 400 }
      );
    }

    // ✅ Convert file ke base64 dan upload ke Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder: "bukti-pembayaran",
      resource_type: "image",
    });

    const imageUrl = uploadResult.secure_url; // URL permanen dari Cloudinary

    await connectDB();

    const bills = await Promise.all(
      bulanValues.map(async (bulanValue) => {
        return await Bill.findOneAndUpdate(
          { nisn, bulan: bulanValue },
          {
            nama,
            kelas,
            nisn,
            bulan: bulanValue,
            status,
            bank,
            nominal: Number(nominal),
            proof: imageUrl,
          },
          {
            upsert: true,
            new: true,
          }
        );
      })
    );

    return NextResponse.json({
      message: "Upload berhasil",
      bills,
      proof: imageUrl,
    });

  } catch (error) {
    console.error("UPLOAD API ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat upload bukti pembayaran" },
      { status: 500 }
    );
  }
}