import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_DIRECT;

    if (!uri) {
      return NextResponse.json(
        { success: false, message: "MONGODB_URI tidak ditemukan" },
        { status: 500 }
      );
    }

    const client = new MongoClient(uri);
    await client.connect();
    await client.db().admin().ping();
    await client.close();

    return NextResponse.json({
      success: true,
      message: "Database berhasil connect",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Database gagal connect",
        error: error.message,
      },
      { status: 500 }
    );
  }
}