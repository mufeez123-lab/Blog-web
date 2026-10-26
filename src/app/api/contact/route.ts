import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validation";
import { checkRateLimit, verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for") || "local";
  const rateLimit = checkRateLimit(`contact:${forwardedFor}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || "Invalid contact form input.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Your inquiry has been received by the FeezMedia editorial desk.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to process contact submission." },
      { status: 400 }
    );
  }
}
