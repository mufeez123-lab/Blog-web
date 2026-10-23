import { NextResponse } from "next/server";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/lib/validation";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { checkRateLimit, verifyCsrfOrigin } from "@/lib/security";
import { recordAuditLog } from "@/lib/articles";

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin (CSRF check failed)." },
      { status: 403 }
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for") || "local";
  const rateLimit = checkRateLimit(`login:${forwardedFor}`, 6, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password format." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "MONGODB_URI is not configured yet. Configure .env.local and run `npm run create-admin` to initialize your first administrator account.",
        },
        { status: 503 }
      );
    }

    await connectToDatabase();
    const userDoc = await User.findOne({ email }).select("+passwordHash");

    if (!userDoc || !userDoc.isActive) {
      return NextResponse.json(
        { error: "Invalid credentials or inactive account." },
        { status: 401 }
      );
    }

    const passwordMatches = await verifyPassword(
      password,
      userDoc.passwordHash
    );
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid credentials or inactive account." },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: String(userDoc._id),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
    };

    await setSessionCookie(sessionUser);

    await recordAuditLog({
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: "USER_LOGIN",
      entityType: "AUTH",
      entityId: sessionUser.id,
      details: `Authenticated session started (${sessionUser.role})`,
    });

    return NextResponse.json({
      ok: true,
      user: sessionUser,
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication service error. Please verify database connection." },
      { status: 500 }
    );
  }
}
