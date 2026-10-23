import { NextResponse } from "next/server";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { canManageUsers, getCurrentUser, hashPassword } from "@/lib/auth";
import { createUserSchema, updateUserByAdminSchema } from "@/lib/validation";
import { verifyCsrfOrigin } from "@/lib/security";
import { recordAuditLog } from "@/lib/articles";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageUsers(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ users: [] });
  }

  await connectToDatabase();
  const users = await User.find()
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      title: u.title || "",
      bio: u.bio || "",
      isActive: u.isActive,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageUsers(currentUser.role)) {
    return NextResponse.json(
      { error: "Only Administrators can create user accounts." },
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
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid user input." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await User.findOne({ email: parsed.data.email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "A user with that email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const created = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      title: parsed.data.title,
      bio: parsed.data.bio,
      isActive: true,
    });

    await recordAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "CREATE_USER",
      entityType: "USER",
      entityId: String(created._id),
      details: `Created user ${created.email} with role ${created.role}`,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          _id: String(created._id),
          name: created.name,
          email: created.email,
          role: created.role,
          isActive: created.isActive,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create user account." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || !canManageUsers(currentUser.role)) {
    return NextResponse.json(
      { error: "Only Administrators can modify user roles or status." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateUserByAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid update payload." },
        { status: 400 }
      );
    }

    // Prevent an Admin from accidentally deactivating or demoting their own active session
    if (
      parsed.data.userId === currentUser.id &&
      (parsed.data.isActive === false ||
        (parsed.data.role && parsed.data.role !== "ADMIN"))
    ) {
      return NextResponse.json(
        { error: "Administrators cannot deactivate or demote their own account." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const target = await User.findById(parsed.data.userId);
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (parsed.data.role) target.role = parsed.data.role;
    if (typeof parsed.data.isActive === "boolean") {
      target.isActive = parsed.data.isActive;
    }
    if (typeof parsed.data.title === "string") target.title = parsed.data.title;
    if (typeof parsed.data.bio === "string") target.bio = parsed.data.bio;

    await target.save();

    await recordAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "UPDATE_USER_ROLE_OR_STATUS",
      entityType: "USER",
      entityId: String(target._id),
      details: `Updated user ${target.email} (role=${target.role}, isActive=${target.isActive})`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}
