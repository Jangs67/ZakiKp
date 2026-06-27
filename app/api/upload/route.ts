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

    const files = formData
      .getAll("file")
      .filter((value) => value instanceof File) as File[];
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

    if (!files || files.length === 0) {
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

    const uploadedUrls = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        const uploadResult = await cloudinary.uploader.upload(base64, {
          folder: "bukti-pembayaran",
          resource_type: "image",
        });

        return uploadResult.secure_url;
      })
    );

    const proofUrls = uploadedUrls.filter(Boolean);
    if (proofUrls.length === 0) {
      return NextResponse.json(
        { message: "Gagal upload bukti pembayaran." },
        { status: 500 }
      );
    }

    await connectDB();

    const bills = await Promise.all(
      bulanValues.map(async (bulanValue) => {
        return await Bill.findOneAndUpdate(
          { nisn, bulan: bulanValue },
          {
            $set: {
              nama,
              kelas,
              nisn,
              bulan: bulanValue,
              status,
              bank,
              nominal: Number(nominal),
              proof: proofUrls[proofUrls.length - 1],
            },
            $push: {
              proofs: { $each: proofUrls },
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      })
    );

    return NextResponse.json({
      message: "Upload berhasil",
      bills,
      proofs: proofUrls,
    });

  } catch (error) {
    console.error("UPLOAD API ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat upload bukti pembayaran" },
      { status: 500 }
    );
  }
}