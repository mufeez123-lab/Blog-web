import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { ArticleStatus, SessionUser, UserRole } from "@/types";

export const SESSION_COOKIE_NAME = "techledger_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev_only_fallback_secret_key_must_be_at_least_32_bytes_long"
      : "");

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable must be set and at least 32 characters long."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Hashes a plain-text password using bcrypt with cost factor 12 (Node.js runtime).
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(password, 12);
}

/**
 * Verifies a plain-text password against a bcrypt password hash (Node.js runtime).
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(password, hash);
}

/**
 * Signs an encrypted/HMAC-authenticated JWT session token.
 */
export async function signSessionToken(user: SessionUser): Promise<string> {
  const secretKey = getJwtSecretKey();
  return new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

/**
 * Verifies a session JWT and extracts the SessionUser payload.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    if (
      !payload.sub ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      !["ADMIN", "EDITOR", "AUTHOR"].includes(payload.role as string)
    ) {
      return null;
    }
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

/**
 * Sets an HTTP-only, SameSite=Lax, Secure (in production) session cookie.
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clears the session cookie upon logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieves the currently authenticated user from the HTTP-only session cookie.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Role-based access control helpers.
 * Hierarchy: ADMIN > EDITOR > AUTHOR
 */
export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const weights: Record<UserRole, number> = {
    AUTHOR: 1,
    EDITOR: 2,
    ADMIN: 3,
  };
  return weights[userRole] >= weights[requiredRole];
}

/**
 * Determines whether a user role is permitted to set or transition an article to the target status.
 * Workflow: DRAFT -> REVIEW -> PUBLISHED -> ARCHIVED
 * - AUTHOR can only save as DRAFT or submit for REVIEW. Authors CANNOT publish or archive directly.
 * - EDITOR and ADMIN can approve/publish (PUBLISHED) and archive (ARCHIVED).
 */
export function canUserSetArticleStatus(
  role: UserRole,
  targetStatus: ArticleStatus
): boolean {
  if (role === "ADMIN" || role === "EDITOR") {
    return true;
  }
  if (role === "AUTHOR") {
    return targetStatus === "DRAFT" || targetStatus === "REVIEW";
  }
  return false;
}

export function canManageUsers(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageSettings(role: UserRole): boolean {
  return role === "ADMIN";
}

export function canManageTaxonomies(role: UserRole): boolean {
  return role === "ADMIN" || role === "EDITOR";
}
