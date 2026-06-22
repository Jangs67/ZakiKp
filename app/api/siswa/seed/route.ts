import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Siswa from "@/models/Siswa";
import { siswa as siswaData } from "@/data/siswa";

export const runtime = "nodejs";

export async function POST() {
  try {
    await connectDB();

    const results = [] as Array<unknown>;

    for (const s of siswaData) {
      const res = await Siswa.findOneAndUpdate(
        { nisn: s.nisn },
        { $set: s },
        { upsert: true, new: true }
      );
      results.push(res);
    }

    return NextResponse.json({ message: "Seed selesai", count: results.length, results });
  } catch (error) {
    console.error("SEED SISWA ERROR:", error);
    return NextResponse.json({ message: "Gagal melakukan seed siswa" }, { status: 500 });
  }
}
