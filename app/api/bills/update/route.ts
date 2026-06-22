import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function POST(req: Request) {
  await connectDB();

  const { id, status } = await req.json();

  await Bill.findByIdAndUpdate(id, { status });

  return NextResponse.json({ message: "Status diupdate" });
}