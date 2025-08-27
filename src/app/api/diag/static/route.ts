import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const root = process.cwd();
  const chunksDir = path.join(root, ".next", "static", "chunks");

  let exists = true;
  let entries: string[] = [];
  try {
    entries = await fs.readdir(chunksDir);
  } catch (e) {
    exists = false;
  }

  return NextResponse.json({
    root,
    chunksDir,
    exists,
    entries,
  });
}
