import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const file = path.join(process.cwd(), ".next", "static", "chunks", "webpack.js");
  try {
    const data = await fs.readFile(file, "utf8");
    return new Response(data, {
      headers: { "content-type": "application/javascript; charset=utf-8",
                 "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message ?? "not found", file }, { status: 404 });
  }
}
