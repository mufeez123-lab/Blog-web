import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import connectToDatabase, { isDatabaseConfigured } from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import WebsiteSettings from "@/models/WebsiteSettings";
import { getPublishedArticles } from "@/lib/articles";
import { getSiteUrl } from "@/lib/seo";
import type { ArticleDTO } from "@/types";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export interface NewsletterConfig {
  googleFormUrl: string;
  googleFormActionUrl: string;
  googleFormEmailEntryId: string;
  googleFormCategoriesEntryId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  hasSmtpCredentials: boolean;
  hasGoogleFormsConfig: boolean;
}

export async function resolveNewsletterConfig(): Promise<NewsletterConfig> {
  let dbSettings: Record<string, unknown> | null = null;
  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      dbSettings = (await WebsiteSettings.findOne({
        singletonKey: "GLOBAL_SETTINGS",
      }).lean()) as Record<string, unknown> | null;
    } catch {
      // Ignore DB lookup errors
    }
  }

  const googleFormUrl =
    String(dbSettings?.googleFormUrl || "").trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_FORM_URL?.trim() ||
    process.env.GOOGLE_FORM_URL?.trim() ||
    "";

  let googleFormActionUrl =
    String(dbSettings?.googleFormActionUrl || "").trim() ||
    process.env.GOOGLE_FORM_ACTION_URL?.trim() ||
    "";

  // Automatically derive /formResponse URL if user pasted a standard Google Form /viewform URL
  if (!googleFormActionUrl && googleFormUrl.includes("docs.google.com/forms")) {
    googleFormActionUrl = googleFormUrl
      .replace(/\/viewform.*$/i, "/formResponse")
      .replace(/\/edit.*$/i, "/formResponse");
  }

  const googleFormEmailEntryId =
    String(dbSettings?.googleFormEmailEntryId || "").trim() ||
    process.env.GOOGLE_FORM_EMAIL_ENTRY_ID?.trim() ||
    "emailAddress";

  const googleFormCategoriesEntryId =
    String(dbSettings?.googleFormCategoriesEntryId || "").trim() ||
    process.env.GOOGLE_FORM_CATEGORIES_ENTRY_ID?.trim() ||
    "";

  const smtpHost =
    String(dbSettings?.smtpHost || "").trim() ||
    process.env.SMTP_HOST?.trim() ||
    "smtp.gmail.com";

  const smtpPort =
    Number(dbSettings?.smtpPort) || Number(process.env.SMTP_PORT) || 587;

  const smtpUser =
    String(dbSettings?.smtpUser || "").trim() ||
    process.env.SMTP_USER?.trim() ||
    process.env.EMAIL_USER?.trim() ||
    "";

  const smtpPass =
    String(dbSettings?.smtpPass || "").trim() ||
    process.env.SMTP_PASS?.trim() ||
    process.env.EMAIL_PASS?.trim() ||
    "";

  const smtpFrom =
    String(dbSettings?.smtpFrom || "").trim() ||
    process.env.SMTP_FROM?.trim() ||
    smtpUser ||
    "FeezMedia Circuit Briefing <mufizmalar@gmail.com>";

  return {
    googleFormUrl,
    googleFormActionUrl,
    googleFormEmailEntryId,
    googleFormCategoriesEntryId,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpFrom,
    hasSmtpCredentials: Boolean(smtpUser && smtpPass),
    hasGoogleFormsConfig: Boolean(googleFormUrl || googleFormActionUrl),
  };
}

/**
 * Submits subscriber email & topic preferences directly to a Google Form (`formResponse`)
 * when Google Forms integration is configured.
 */
export async function syncSubscriberToGoogleForms(params: {
  email: string;
  categories: string[];
  config?: NewsletterConfig;
}): Promise<{ synced: boolean; googleFormUrl: string }> {
  const config = params.config || (await resolveNewsletterConfig());
  if (!config.googleFormActionUrl) {
    return { synced: false, googleFormUrl: config.googleFormUrl };
  }

  try {
    const formData = new URLSearchParams();
    const emailKey = config.googleFormEmailEntryId.startsWith("entry.")
      ? config.googleFormEmailEntryId
      : config.googleFormEmailEntryId === "emailAddress"
      ? "emailAddress"
      : `entry.${config.googleFormEmailEntryId}`;

    formData.append(emailKey, params.email);
    // Also include standard Google Forms emailAddress collection field
    if (emailKey !== "emailAddress") {
      formData.append("emailAddress", params.email);
    }

    if (config.googleFormCategoriesEntryId) {
      const catKey = config.googleFormCategoriesEntryId.startsWith("entry.")
        ? config.googleFormCategoriesEntryId
        : `entry.${config.googleFormCategoriesEntryId}`;
      formData.append(catKey, params.categories.join(", "));
    }

    const res = await fetch(config.googleFormActionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(6000),
    });

    return {
      synced: res.ok || res.status === 200 || res.status === 302,
      googleFormUrl: config.googleFormUrl || config.googleFormActionUrl,
    };
  } catch {
    return { synced: false, googleFormUrl: config.googleFormUrl };
  }
}

/**
 * Builds the HTML & plain-text newsletter body featuring the latest published FeezMedia articles.
 */
export function buildNewsletterEmailContent(params: {
  subscriberEmail: string;
  unsubscribeToken: string;
  articles: ArticleDTO[];
  customSubject?: string;
  customIntro?: string;
  isWelcome?: boolean;
  alreadySubscribed?: boolean;
}): { subject: string; html: string; text: string } {
  const siteUrl = getSiteUrl();
  const unsubscribeUrl = `${siteUrl}/api/newsletter?unsubscribe=${encodeURIComponent(
    params.unsubscribeToken
  )}&email=${encodeURIComponent(params.subscriberEmail)}`;

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const subject =
    params.customSubject?.trim() ||
    (params.isWelcome
      ? `Welcome to FeezMedia Circuit Briefing — Latest Tech & AI Digest (${dateLabel})`
      : `FeezMedia Weekly Circuit Briefing: ${
          params.articles[0]?.title || `Latest Tech & AI (${dateLabel})`
        }`);

  const introParagraph =
    params.customIntro?.trim() ||
    (params.isWelcome
      ? `Thank you for subscribing to The Daily Circuit Briefing (${params.subscriberEmail}). Below is your immediate edition featuring our latest US technology reporting, enterprise AI analysis, and software engineering guides.`
      : params.alreadySubscribed
      ? `You are an active subscriber to The Daily Circuit Briefing (${params.subscriberEmail}). Here is the latest edition of our top published stories and engineering guides.`
      : `Here are the latest original articles, enterprise AI analyses, and engineering guides published on FeezMedia for ${dateLabel}.`);

  const articlesHtml = params.articles
    .map((art) => {
      const articleUrl = `${siteUrl}/article/${art.slug}`;
      return `
        <tr>
          <td style="padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #1d4ed8; margin-bottom: 6px;">
              ${art.category.name} &bull; ${art.type} &bull; ${art.readingTimeMinutes} MIN READ
            </div>
            <h3 style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 19px; line-height: 1.35;">
              <a href="${articleUrl}" style="color: #0f172a; text-decoration: none;">${art.title}</a>
            </h3>
            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #475569;">
              ${art.excerpt}
            </p>
            <a href="${articleUrl}" style="display: inline-block; padding: 8px 14px; background-color: #1d4ed8; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 5px;">
              Read Full Article &rarr;
            </a>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #0f172a; color: #ffffff; padding: 28px 32px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #60a5fa; margin-bottom: 6px;">
          The Daily Circuit Briefing &bull; ${dateLabel}
        </div>
        <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #ffffff;">
          FeezMedia
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">
          Technology News, Artificial Intelligence &amp; Full-Stack Engineering Briefings
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 32px;">
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.65; color: #334155;">
          ${introParagraph}
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${articlesHtml}
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f1f5f9; padding: 20px 32px; font-size: 12px; color: #64748b; line-height: 1.6;">
        <div>Sent to <strong>${params.subscriberEmail}</strong> because you subscribed to FeezMedia's Weekly Circuit Briefing.</div>
        <div style="margin-top: 8px;">
          <a href="${siteUrl}" style="color: #1d4ed8; text-decoration: underline;">Visit FeezMedia</a>
          &nbsp;&bull;&nbsp;
          <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe instantly</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `FeezMedia — THE WEEKLY CIRCUIT BRIEFING (${dateLabel})`,
    "",
    introParagraph,
    "",
    ...params.articles.map(
      (a, idx) =>
        `${idx + 1}. [${a.category.name}] ${a.title}\n   ${a.excerpt}\n   Read: ${siteUrl}/article/${a.slug}\n`
    ),
    "---",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Sends an email via configured SMTP (`SMTP_HOST` / `SMTP_USER` / `SMTP_PASS`)
 * and also saves a local preview copy in `/uploads/newsletters/` so the user can inspect sent emails anytime.
 */
export async function sendNewsletterEmail(params: {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  config?: NewsletterConfig;
}): Promise<{
  sent: boolean;
  provider: "smtp" | "ethereal" | "local-preview";
  previewUrl?: string;
  error?: string;
}> {
  const config = params.config || (await resolveNewsletterConfig());

  // Always save a browser-viewable preview of the dispatched newsletter in /public/uploads/newsletters
  let localPreviewUrl = "";
  try {
    const previewDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "newsletters"
    );
    await fs.mkdir(previewDir, { recursive: true });
    const fileName = `newsletter-${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")}.html`;
    await fs.writeFile(path.join(previewDir, fileName), params.html, "utf8");
    localPreviewUrl = `/uploads/newsletters/${fileName}`;
  } catch {
    // Ignore on read-only serverless
  }

  // 1. If real SMTP credentials are configured, send directly to the subscriber's email inbox
  if (config.hasSmtpCredentials) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: config.smtpFrom,
        to: params.toEmail,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });

      return {
        sent: true,
        provider: "smtp",
        previewUrl: localPreviewUrl || undefined,
      };
    } catch (err) {
      return {
        sent: false,
        provider: "smtp",
        previewUrl: localPreviewUrl || undefined,
        error:
          err instanceof Error
            ? err.message
            : "SMTP delivery failed. Check SMTP_USER / SMTP_PASS.",
      };
    }
  }

  // 2. If SMTP credentials are not yet configured, try Nodemailer Ethereal test inbox + local preview URL
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: config.smtpFrom,
      to: params.toEmail,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    const etherealUrl = nodemailer.getTestMessageUrl(info);
    return {
      sent: true,
      provider: "ethereal",
      previewUrl:
        (typeof etherealUrl === "string" && etherealUrl) ||
        localPreviewUrl ||
        undefined,
    };
  } catch {
    return {
      sent: Boolean(localPreviewUrl),
      provider: "local-preview",
      previewUrl: localPreviewUrl || undefined,
    };
  }
}

/**
 * Dynamic subscription handler:
 * - Checks if the email is already subscribed
 * - Saves/updates the subscriber in MongoDB
 * - Syncs with Google Forms (`syncSubscriberToGoogleForms`)
 * - Fetches the latest articles matching their preferences and sends the newsletter to their email ID!
 */
export async function subscribeAndSendNewsletter(params: {
  email: string;
  name?: string;
  categories?: string[];
}) {
  const normalizedEmail = params.email.trim().toLowerCase();
  const chosenCategories =
    Array.isArray(params.categories) && params.categories.length > 0
      ? params.categories
      : ["ALL"];

  const config = await resolveNewsletterConfig();
  let alreadySubscribed = false;
  let unsubscribeToken = crypto.randomBytes(16).toString("hex");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const existing = await Subscriber.findOne({
      email: normalizedEmail,
    }).lean();

    if (existing) {
      alreadySubscribed = existing.status === "SUBSCRIBED";
      unsubscribeToken = existing.unsubscribeToken || unsubscribeToken;

      await Subscriber.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: "SUBSCRIBED",
            categories: chosenCategories,
            ...(params.name ? { name: params.name.trim() } : {}),
            lastNewsletterSentAt: new Date(),
            ...(!existing.welcomeSentAt ? { welcomeSentAt: new Date() } : {}),
          },
        }
      );
    } else {
      await Subscriber.create({
        email: normalizedEmail,
        name: params.name?.trim() || "",
        status: "SUBSCRIBED",
        categories: chosenCategories,
        unsubscribeToken,
        syncedToGoogleForms: false,
        welcomeSentAt: new Date(),
        lastNewsletterSentAt: new Date(),
        subscribedAt: new Date(),
      });
    }
  }

  // Sync to Google Forms if configured
  const googleFormResult = await syncSubscriberToGoogleForms({
    email: normalizedEmail,
    categories: chosenCategories,
    config,
  });

  if (googleFormResult.synced && isDatabaseConfigured()) {
    await Subscriber.updateOne(
      { email: normalizedEmail },
      { $set: { syncedToGoogleForms: true } }
    );
  }

  // Fetch latest published articles to include in the newsletter sent to their email ID
  const published = await getPublishedArticles({ page: 1, pageSize: 6 });
  let relevantArticles = published.items;
  if (
    !chosenCategories.includes("ALL") &&
    chosenCategories.length > 0
  ) {
    const filtered = published.items.filter((a) =>
      chosenCategories.includes(a.category.slug.toLowerCase())
    );
    if (filtered.length > 0) {
      relevantArticles = filtered;
    }
  }

  const emailContent = buildNewsletterEmailContent({
    subscriberEmail: normalizedEmail,
    unsubscribeToken,
    articles: relevantArticles.slice(0, 5),
    isWelcome: !alreadySubscribed,
    alreadySubscribed,
  });

  const delivery = await sendNewsletterEmail({
    toEmail: normalizedEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    config,
  });

  return {
    ok: true,
    email: normalizedEmail,
    status: "SUBSCRIBED" as const,
    alreadySubscribed,
    categories: chosenCategories,
    emailSent: delivery.sent,
    emailProvider: delivery.provider,
    emailPreviewUrl: delivery.previewUrl,
    emailError: delivery.error,
    syncedToGoogleForms: googleFormResult.synced,
    googleFormUrl: config.googleFormUrl,
    articlesIncludedCount: Math.min(5, relevantArticles.length),
  };
}

/**
 * Broadcasts the latest FeezMedia newsletter to all active subscribers (`status === "SUBSCRIBED"`).
 */
export async function broadcastNewsletterToSubscribers(options?: {
  customSubject?: string;
  customIntro?: string;
  targetEmail?: string;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  await connectToDatabase();
  const config = await resolveNewsletterConfig();
  const published = await getPublishedArticles({ page: 1, pageSize: 6 });
  const latestArticles = published.items.slice(0, 5);

  const filter: Record<string, unknown> = { status: "SUBSCRIBED" };
  if (options?.targetEmail?.trim()) {
    filter.email = options.targetEmail.trim().toLowerCase();
  }

  const subscribers = await Subscriber.find(filter).lean();
  let sentCount = 0;
  let lastPreviewUrl: string | undefined;

  for (const sub of subscribers) {
    let articlesForSub = latestArticles;
    if (
      Array.isArray(sub.categories) &&
      !sub.categories.includes("ALL") &&
      sub.categories.length > 0
    ) {
      const matched = published.items.filter((a) =>
        sub.categories.includes(a.category.slug.toLowerCase())
      );
      if (matched.length > 0) articlesForSub = matched.slice(0, 5);
    }

    const content = buildNewsletterEmailContent({
      subscriberEmail: sub.email,
      unsubscribeToken: sub.unsubscribeToken || "unsubscribe",
      articles: articlesForSub,
      customSubject: options?.customSubject,
      customIntro: options?.customIntro,
    });

    const res = await sendNewsletterEmail({
      toEmail: sub.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      config,
    });

    if (res.sent) {
      sentCount += 1;
      if (res.previewUrl) lastPreviewUrl = res.previewUrl;
      await Subscriber.updateOne(
        { _id: sub._id },
        { $set: { lastNewsletterSentAt: new Date() } }
      );
    }
  }

  return {
    ok: true,
    totalSubscribersTargeted: subscribers.length,
    sentCount,
    provider: config.hasSmtpCredentials ? "smtp" : "preview",
    previewUrl: lastPreviewUrl,
  };
}
