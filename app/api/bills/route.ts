import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const bills = await Bill.find().sort({ createdAt: -1 });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("GET BILLS ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data pembayaran" },
      { status: 500 }
    );
  }
}