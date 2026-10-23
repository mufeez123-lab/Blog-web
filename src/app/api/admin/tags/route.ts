import { NextResponse } from "next/server";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import Tag from "@/models/Tag";
import { canManageTaxonomies, getCurrentUser } from "@/lib/auth";
import { tagSchema } from "@/lib/validation";
import { slugify, verifyCsrfOrigin } from "@/lib/security";
import { getAllTags, recordAuditLog } from "@/lib/articles";

export async function GET() {
  const tags = await getAllTags();
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const user = await getCurrentUser();
  if (!user || !canManageTaxonomies(user.role)) {
    return NextResponse.json(
      { error: "Only Editors and Administrators can manage tags." },
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
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid tag data." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const slug = parsed.data.slug
      ? slugify(parsed.data.slug)
      : slugify(parsed.data.name);

    const existing = await Tag.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json(
        { error: `Tag with slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    const created = await Tag.create({
      name: parsed.data.name,
      slug,
    });

    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      action: "CREATE_TAG",
      entityType: "TAG",
      entityId: String(created._id),
      details: `Created tag "${created.name}" (${created.slug})`,
    });

    return NextResponse.json({ ok: true, tag: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create tag." },
      { status: 500 }
    );
  }
}
