import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import WebsiteSettings from "@/models/WebsiteSettings";
import { canManageSettings, getCurrentUser } from "@/lib/auth";
import { websiteSettingsSchema } from "@/lib/validation";
import { verifyCsrfOrigin } from "@/lib/security";
import { getWebsiteSettings, recordAuditLog } from "@/lib/articles";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getWebsiteSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const user = await getCurrentUser();
  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json(
      { error: "Only Administrators can modify global website settings." },
      { status: 403 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = websiteSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message || "Invalid settings configuration.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const updated = await WebsiteSettings.findOneAndUpdate(
      { singletonKey: "GLOBAL_SETTINGS" },
      {
        $set: {
          ...parsed.data,
          singletonKey: "GLOBAL_SETTINGS",
          updatedBy: mongoose.Types.ObjectId.isValid(user.id)
            ? new mongoose.Types.ObjectId(user.id)
            : undefined,
        },
      },
      { upsert: true, new: true }
    );

    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_WEBSITE_SETTINGS",
      entityType: "SETTINGS",
      entityId: String(updated._id),
      details: `Updated WebsiteSettings (adsEnabled=${updated.adsEnabled})`,
    });

    return NextResponse.json({ ok: true, settings: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to save website settings." },
      { status: 500 }
    );
  }
}
