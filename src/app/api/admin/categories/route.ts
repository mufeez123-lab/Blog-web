import { NextResponse } from "next/server";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import Category from "@/models/Category";
import { canManageTaxonomies, getCurrentUser } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { slugify, verifyCsrfOrigin } from "@/lib/security";
import { getAllCategories, recordAuditLog } from "@/lib/articles";

export async function GET() {
  const categories = await getAllCategories();
  return NextResponse.json({ categories });
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
      { error: "Only Editors and Administrators can manage categories." },
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
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid category data." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const slug = parsed.data.slug
      ? slugify(parsed.data.slug)
      : slugify(parsed.data.name);

    const existing = await Category.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json(
        { error: `Category with slug "${slug}" already exists.` },
        { status: 409 }
      );
    }

    const created = await Category.create({
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
    });

    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      action: "CREATE_CATEGORY",
      entityType: "CATEGORY",
      entityId: String(created._id),
      details: `Created category "${created.name}" (${created.slug})`,
    });

    return NextResponse.json({ ok: true, category: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create category." },
      { status: 500 }
    );
  }
}
