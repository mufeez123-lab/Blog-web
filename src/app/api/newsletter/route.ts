import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import WebsiteSettings from "@/models/WebsiteSettings";
import { getCurrentUser } from "@/lib/auth";
import { emailSchema } from "@/lib/validation";
import { checkRateLimit, verifyCsrfOrigin } from "@/lib/security";
import {
  broadcastNewsletterToSubscribers,
  resolveNewsletterConfig,
  subscribeAndSendNewsletter,
} from "@/lib/newsletter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unsubscribeToken = searchParams.get("unsubscribe");
  const emailParam = searchParams.get("email")?.trim().toLowerCase();
  const isAdminQuery = searchParams.get("admin") === "true";

  // 1. One-click email unsubscribe link handler
  if (unsubscribeToken && emailParam) {
    if (isDatabaseConfigured()) {
      try {
        await connectToDatabase();
        await Subscriber.findOneAndUpdate(
          { email: emailParam },
          { $set: { status: "UNSUBSCRIBED" } }
        );
      } catch {
        // Ignore
      }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Unsubscribed | TechLedger</title>
</head>
<body style="font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 48px 16px; text-align: center;">
  <div style="max-width: 460px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px;">
    <h1 style="font-family: Georgia, serif; font-size: 22px; margin-top: 0;">You have been unsubscribed</h1>
    <p style="font-size: 14px; color: #475569; line-height: 1.6;">
      <strong>${emailParam}</strong> will no longer receive The Weekly Circuit Briefing.
    </p>
    <a href="/" style="display: inline-block; margin-top: 12px; padding: 10px 18px; background: #1d4ed8; color: #fff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">
      Return to TechLedger
    </a>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const config = await resolveNewsletterConfig();

  // 2. Admin dashboard query: list all subscribers + config
  if (isAdminQuery) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let subscribers: {
      _id: string;
      email: string;
      name: string;
      status: string;
      categories: string[];
      syncedToGoogleForms: boolean;
      subscribedAt: string;
      lastNewsletterSentAt: string | null;
    }[] = [];

    if (isDatabaseConfigured()) {
      await connectToDatabase();
      const docs = await Subscriber.find()
        .sort({ subscribedAt: -1 })
        .limit(200)
        .lean();
      subscribers = docs.map((d) => ({
        _id: String(d._id),
        email: d.email,
        name: d.name || "",
        status: d.status,
        categories: d.categories || ["ALL"],
        syncedToGoogleForms: Boolean(d.syncedToGoogleForms),
        subscribedAt: d.subscribedAt
          ? new Date(d.subscribedAt).toISOString()
          : new Date().toISOString(),
        lastNewsletterSentAt: d.lastNewsletterSentAt
          ? new Date(d.lastNewsletterSentAt).toISOString()
          : null,
      }));
    }

    return NextResponse.json({
      ok: true,
      config: {
        googleFormUrl: config.googleFormUrl,
        googleFormActionUrl: config.googleFormActionUrl,
        googleFormEmailEntryId: config.googleFormEmailEntryId,
        googleFormCategoriesEntryId: config.googleFormCategoriesEntryId,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpUser: config.smtpUser,
        smtpFrom: config.smtpFrom,
        hasSmtpCredentials: config.hasSmtpCredentials,
        hasGoogleFormsConfig: config.hasGoogleFormsConfig,
      },
      subscribers,
    });
  }

  // 3. Check subscription status for a specific email
  if (emailParam) {
    const parsedEmail = emailSchema.safeParse(emailParam);
    if (!parsedEmail.success) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (isDatabaseConfigured()) {
      await connectToDatabase();
      const sub = await Subscriber.findOne({ email: parsedEmail.data }).lean();
      if (sub) {
        return NextResponse.json({
          ok: true,
          subscribed: sub.status === "SUBSCRIBED",
          status: sub.status,
          email: sub.email,
          categories: sub.categories || ["ALL"],
          subscribedAt: sub.subscribedAt,
          lastNewsletterSentAt: sub.lastNewsletterSentAt,
          googleFormUrl: config.googleFormUrl,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      subscribed: false,
      status: "NOT_SUBSCRIBED",
      email: parsedEmail.data,
      googleFormUrl: config.googleFormUrl,
    });
  }

  return NextResponse.json({
    ok: true,
    googleFormUrl: config.googleFormUrl,
    hasGoogleFormsConfig: config.hasGoogleFormsConfig,
  });
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const mode = body.mode || "subscribe";

    // Mode 1: Admin Save Google Forms & SMTP Newsletter Settings
    if (mode === "save_config") {
      const user = await getCurrentUser();
      if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const updateFields: Record<string, unknown> = {
        googleFormUrl: String(body.googleFormUrl || "").trim(),
        googleFormActionUrl: String(body.googleFormActionUrl || "").trim(),
        googleFormEmailEntryId:
          String(body.googleFormEmailEntryId || "").trim() || "emailAddress",
        googleFormCategoriesEntryId: String(
          body.googleFormCategoriesEntryId || ""
        ).trim(),
        smtpHost: String(body.smtpHost || "smtp.gmail.com").trim(),
        smtpPort: Number(body.smtpPort) || 587,
        smtpUser: String(body.smtpUser || "").trim(),
        smtpFrom: String(body.smtpFrom || "").trim(),
      };

      if (typeof body.smtpPass === "string" && body.smtpPass.trim().length > 0) {
        updateFields.smtpPass = body.smtpPass.trim();
      }

      if (isDatabaseConfigured()) {
        await connectToDatabase();
        await WebsiteSettings.findOneAndUpdate(
          { singletonKey: "GLOBAL_SETTINGS" },
          { $set: updateFields },
          { upsert: true }
        );
      }

      // Persist in .env.local for local dev convenience
      try {
        const envPath = path.join(process.cwd(), ".env.local");
        let envContent = "";
        try {
          envContent = await fs.readFile(envPath, "utf8");
        } catch {
          envContent = "";
        }
        const setEnvVar = (key: string, val: string) => {
          if (!val) return;
          process.env[key] = val;
          const regex = new RegExp(`^${key}=.*$`, "m");
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          } else {
            envContent = `${envContent.trimEnd()}\n${key}=${val}\n`;
          }
        };
        setEnvVar(
          "NEXT_PUBLIC_GOOGLE_FORM_URL",
          String(updateFields.googleFormUrl || "")
        );
        setEnvVar(
          "GOOGLE_FORM_ACTION_URL",
          String(updateFields.googleFormActionUrl || "")
        );
        setEnvVar(
          "GOOGLE_FORM_EMAIL_ENTRY_ID",
          String(updateFields.googleFormEmailEntryId || "")
        );
        setEnvVar("SMTP_HOST", String(updateFields.smtpHost || ""));
        setEnvVar("SMTP_PORT", String(updateFields.smtpPort || "587"));
        setEnvVar("SMTP_USER", String(updateFields.smtpUser || ""));
        if (typeof updateFields.smtpPass === "string") {
          setEnvVar("SMTP_PASS", updateFields.smtpPass);
        }
        await fs.writeFile(envPath, envContent, "utf8");
      } catch {
        // Ignore on read-only serverless
      }

      return NextResponse.json({
        ok: true,
        message: "Newsletter Google Forms & SMTP configuration saved.",
      });
    }

    // Mode 2: Admin Broadcast Latest Newsletter to All Subscribed Emails
    if (mode === "broadcast") {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const summary = await broadcastNewsletterToSubscribers({
        customSubject:
          typeof body.customSubject === "string"
            ? body.customSubject
            : undefined,
        customIntro:
          typeof body.customIntro === "string" ? body.customIntro : undefined,
        targetEmail:
          typeof body.targetEmail === "string" ? body.targetEmail : undefined,
      });

      return NextResponse.json(summary);
    }

    // Mode 3: Unsubscribe by Email
    if (mode === "unsubscribe") {
      const parsedEmail = emailSchema.safeParse(body.email);
      if (!parsedEmail.success) {
        return NextResponse.json(
          { error: "Please provide a valid email address." },
          { status: 400 }
        );
      }

      if (isDatabaseConfigured()) {
        await connectToDatabase();
        await Subscriber.findOneAndUpdate(
          { email: parsedEmail.data },
          { $set: { status: "UNSUBSCRIBED" } }
        );
      }

      return NextResponse.json({
        ok: true,
        status: "UNSUBSCRIBED",
        message: `${parsedEmail.data} has been unsubscribed from the newsletter.`,
      });
    }

    // Mode 4: Public Subscribe & Immediately Send Latest Newsletter to Mail ID + Sync to Google Forms
    const forwardedFor = request.headers.get("x-forwarded-for") || "local";
    const rateLimit = checkRateLimit(
      `newsletter_${forwardedFor}`,
      15,
      60_000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please try again in ${rateLimit.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const parsedEmail = emailSchema.safeParse(body.email);
    if (!parsedEmail.success) {
      return NextResponse.json(
        {
          error:
            parsedEmail.error.issues[0]?.message ||
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    const categories = Array.isArray(body.categories)
      ? body.categories.map((c: unknown) => String(c).trim()).filter(Boolean)
      : ["ALL"];

    const result = await subscribeAndSendNewsletter({
      email: parsedEmail.data,
      name: typeof body.name === "string" ? body.name : undefined,
      categories,
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to process newsletter subscription.",
      },
      { status: 500 }
    );
  }
}
