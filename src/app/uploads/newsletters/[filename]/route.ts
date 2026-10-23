import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    const safeName = path.basename(filename);
    if (!safeName || safeName.startsWith(".") || !safeName.endsWith(".html")) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "newsletters",
      safeName
    );
    const htmlContent = await fs.readFile(filePath, "utf8");

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch {
    return new NextResponse("Newsletter Preview Not Found", { status: 404 });
  }
}
