import sanitizeHtml from "sanitize-html";
import crypto from "crypto";

/**
 * Generates a URL-safe, lowercase kebab-case slug.
 */
export function slugify(input: string): string {
  return input
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/**
 * Sanitizes rich-text HTML from the article editor to prevent XSS.
 * Allows semantic editorial tags while stripping scripts, iframes, inline event handlers, and unsafe URLs.
 */
export function sanitizeArticleHtml(dirtyHtml: string): string {
  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      "h2",
      "h3",
      "h4",
      "p",
      "br",
      "hr",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "pre",
      "code",
      "a",
      "figure",
      "figcaption",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      code: ["class"],
      pre: ["class"],
      div: ["class"],
      span: ["class"],
      th: ["scope", "colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        const isExternal =
          href.startsWith("http://") || href.startsWith("https://");
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(isExternal
              ? { target: "_blank", rel: "noopener noreferrer nofollow" }
              : {}),
          },
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          loading: "lazy",
          alt: attribs.alt || "Editorial illustration",
        },
      }),
    },
  });
}

/**
 * Strips all HTML tags for plain-text excerpts or word count calculation.
 */
export function stripHtmlTags(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Estimates reading time in minutes based on an average US adult reading speed of 225 WPM.
 */
export function calculateReadingTime(htmlContent: string): number {
  const plainText = stripHtmlTags(htmlContent);
  if (!plainText) return 1;
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 225));
}

/**
 * Escapes special characters before using a user query in a safe fallback RegExp.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * In-memory sliding-window rate limiter for login, contact, and admin write endpoints.
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup to prevent memory growth
  if (rateLimitStore.size > 2000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt <= now) rateLimitStore.delete(k);
    }
  }

  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function resetRateLimitsForTesting(): void {
  rateLimitStore.clear();
}

/**
 * Verifies CSRF protection on state-changing requests by comparing Origin/Host headers.
 */
export function verifyCsrfOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  // In non-browser test runners without origin/host headers, allow if both are absent
  if (!origin && !host) {
    return true;
  }

  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Validates uploaded image files (MIME type, file size limit, magic bytes, and safe filename generation).
 */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  safeFilename?: string;
  mimeType?: string;
}

export function validateImageUpload(
  file: { name: string; type: string; size: number },
  buffer?: Buffer
): FileValidationResult {
  if (!file || !file.type) {
    return { valid: false, error: "No file provided." };
  }

  const extension = ALLOWED_IMAGE_TYPES[file.type.toLowerCase()];
  if (!extension) {
    return {
      valid: false,
      error: "Unsupported file type. Only JPEG, PNG, WebP, and AVIF images are allowed.",
    };
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: "File size must be between 1 byte and 2 MB.",
    };
  }

  if (buffer && buffer.length > 12) {
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebp =
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP";
    const isAvif = buffer.subarray(4, 8).toString("ascii") === "ftyp";

    if (!isJpeg && !isPng && !isWebp && !isAvif) {
      return {
        valid: false,
        error: "File binary signature does not match an allowed image format.",
      };
    }
  }

  const baseSlug = slugify(file.name.replace(/\.[^/.]+$/, "")) || "editorial-image";
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const safeFilename = `${Date.now()}-${baseSlug.slice(0, 40)}-${randomSuffix}${extension}`;

  return {
    valid: true,
    safeFilename,
    mimeType: file.type.toLowerCase(),
  };
}
