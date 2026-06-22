import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import Siswa from "@/models/Siswa";
import bcrypt from "bcryptjs";
import { validateSiswaPayload } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await connectDB();

    const { id } = await params;

    const siswa = await Siswa.findById(id);

    if (!siswa) {
      return NextResponse.json({ message: "Siswa tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(siswa);
  } catch (error) {
    console.error("GET SISWA BY ID ERROR:", error);
    return NextResponse.json({ message: "Gagal mengambil siswa" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await req.json();

    const allowed = ["nama", "kelas", "nisn", "password", "ttl", "jk"] as const;
    const updateData: Partial<Record<typeof allowed[number], string>> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = String(body[key]);
    }

    if (updateData.password === "") {
      delete updateData.password;
    }

    const v = validateSiswaPayload(updateData, true);
    if (!v.ok) {
      return NextResponse.json({ message: v.message }, { status: 400 });
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(String(updateData.password), 10);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "ID siswa tidak valid" }, { status: 400 });
    }

    const updated = await Siswa.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!updated) {
      return NextResponse.json({ message: "Siswa tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("UPDATE SISWA ERROR:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error.code === 11000 && error.keyPattern?.nisn) {
      return NextResponse.json({ message: "NISN sudah terdaftar" }, { status: 409 });
    }

    return NextResponse.json({ message: "Gagal mengupdate siswa" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await connectDB();

    const { id } = await params;

    const deleted = await Siswa.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Siswa tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Siswa dihapus" });
  } catch (error) {
    console.error("DELETE SISWA ERROR:", error);
    return NextResponse.json({ message: "Gagal menghapus siswa" }, { status: 500 });
  }
}
