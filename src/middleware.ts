import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "techledger_session";

function getEdgeJwtSecretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev_only_fallback_secret_key_must_be_at_least_32_bytes_long"
      : "");
  return new TextEncoder().encode(secret);
}

async function verifyEdgeSessionToken(
  token: string
): Promise<{ id: string; role: string } | null> {
  try {
    const secretKey = getEdgeJwtSecretKey();
    if (secretKey.byteLength < 32) return null;
    const { payload } = await jwtVerify(token, secretKey);
    if (
      !payload.sub ||
      !["ADMIN", "EDITOR", "AUTHOR"].includes(String(payload.role))
    ) {
      return null;
    }
    return {
      id: payload.sub,
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optional Maintenance Mode for public pages
  if (
    process.env.MAINTENANCE_MODE === "true" &&
    !pathname.startsWith("/maintenance") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next")
  ) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const sessionUser = await verifyEdgeSessionToken(token);
    if (!sessionUser) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route guards for Admin-only sections
    if (
      (pathname.startsWith("/admin/users") ||
        pathname.startsWith("/admin/settings")) &&
      sessionUser.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
