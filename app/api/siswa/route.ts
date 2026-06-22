import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Siswa from "@/models/Siswa";
import bcrypt from "bcryptjs";
import { validateSiswaPayload } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const list = await Siswa.find().sort({ createdAt: -1 });

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET SISWA ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil data siswa" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const v = validateSiswaPayload(body, false);
    if (!v.ok) {
      return NextResponse.json({ message: v.message }, { status: 400 });
    }

    const { nama, kelas, nisn, password, ttl, jk } = body;

    const exists = await Siswa.findOne({ nisn });
    if (exists) {
      return NextResponse.json({ message: "NISN sudah terdaftar" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const created = await Siswa.create({
      nama,
      kelas,
      nisn,
      password: hashed,
      ttl: typeof ttl === "string" ? ttl : "",
      jk: typeof jk === "string" ? jk : "",
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("CREATE SISWA ERROR:", error);
    return NextResponse.json(
      { message: error?.message || "Gagal membuat siswa" },
      { status: 500 }
    );
  }
}
