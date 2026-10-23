import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { validateImageUpload, verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = validateImageUpload(
      {
        name: fileEntry.name,
        type: fileEntry.type,
        size: fileEntry.size,
      },
      buffer
    );

    if (!validation.valid || !validation.safeFilename) {
      return NextResponse.json(
        { error: validation.error || "Invalid image upload." },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const destinationPath = path.join(uploadsDir, validation.safeFilename);
    await fs.writeFile(destinationPath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${validation.safeFilename}`,
      filename: validation.safeFilename,
      size: fileEntry.size,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Local file write is unavailable on read-only serverless filesystems; use external HTTPS image URLs or configure CDN storage in production.",
      },
      { status: 500 }
    );
  }
}
