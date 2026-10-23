# TechLedger — US-Focused Digital News Portal, AI Publication & Engineering Blog

**TechLedger** is a full-stack, production-oriented digital news portal and technology blog targeting readers in the United States, engineered to operate on a **$0 initial budget** from India while preparing for organic Google Search growth and a future **Google AdSense** application.

---

## 1. Architecture Summary

- **Frontend & Routing**: Next.js 15 App Router, React 19 Server & Client Components, TypeScript, Tailwind CSS editorial design system (`src/app/*`, `src/components/*`).
- **Database Layer**: MongoDB Atlas + Mongoose ODM (`src/lib/mongodb.ts`, `src/models/*`) with global serverless connection caching, `.lean()` read queries, pagination, and compound ESR indexes.
- **Security & Auth**:
  - `bcryptjs` (cost factor 12) password hashing (`passwordHash` excluded from queries via `select: false` and JSON transforms).
  - `jose` HMAC-SHA256 HTTP-only session cookies (`techledger_session`).
  - Role-Based Access Control (`ADMIN`, `EDITOR`, `AUTHOR`) enforced in both Next.js Middleware (`src/middleware.ts`) and server-side Route Handlers (`src/app/api/admin/*`).
  - Publishing Workflow (`DRAFT -> REVIEW -> PUBLISHED -> ARCHIVED`): Authors can draft and submit for review; only Editors and Administrators can approve/publish or archive.
  - Strict input validation with **Zod** (`src/lib/validation.ts`) and server-side HTML sanitization with **sanitize-html** (`src/lib/security.ts`).
  - Sliding-window rate limiting and CSRF Origin/Host header verification on sensitive endpoints.
- **SEO & Discovery**:
  - Dynamic `generateMetadata` with Open Graph, Twitter cards, and canonical URLs (`src/lib/seo.ts`).
  - Schema.org JSON-LD (`NewsArticle`, `BlogPosting`, `NewsMediaOrganization`, `BreadcrumbList`).
  - Dynamic XML Sitemap (`src/app/sitemap.ts`) and `src/app/robots.ts` that strictly exclude drafts, review items, admin pages, and API routes.
- **Google AdSense Readiness**:
  - Policy-compliant `AdSlot` component (`src/components/AdSlot.tsx`) with configuration toggle, format validation (`^ca-pub-\d{10,20}$`), clear `Advertisement` labels, and layout shift protection. Renders nothing when unconfigured or disabled.

---

## 2. Local Setup & Testing Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
> **Zero-Config Evaluation Mode**: If you leave `MONGODB_URI` empty in `.env.local`, TechLedger automatically runs in **Demonstration Content Mode**, rendering 5 clearly labeled demonstration articles across all US categories (`Technology News`, `Artificial Intelligence`, `Business & Markets`, `Programming Tutorials`, and `Career Guides`) so you can inspect the entire UI immediately.

### Step 3: Connect MongoDB Atlas & Create Your First Administrator
1. Create a free **MongoDB Atlas M0** cluster (select a US region such as `us-east-1` N. Virginia for low latency to US readers and Vercel).
2. In Atlas **Database Access**, create a least-privilege database user with `readWrite` permissions strictly on the `techledger` database.
3. In Atlas **Network Access**, allow your local development IP (and `0.0.0.0/0` if deploying on Vercel serverless functions, which use dynamic egress IPs, paired with a strong 32+ character database password).
4. Set `MONGODB_URI`, `SESSION_SECRET`, `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, and `INITIAL_ADMIN_PASSWORD` in `.env.local`.
5. Run the controlled bootstrap script:
```bash
npm run create-admin
```
6. Optionally seed the demonstration articles into your MongoDB cluster so you can edit them in the Admin Dashboard:
```bash
npm run seed-demo
```

### Step 4: Run Automated Tests & Start Development Server
```bash
npm test
npm run dev
```
Open `http://localhost:3000` for the public publication and `http://localhost:3000/admin` for the Editorial CMS.

---

## 3. Free-Tier Service Limits & Cost Transparency

Do not assume free tiers have unlimited resources. Monitor these operational thresholds as traffic grows:

| Service | Free-Tier Allocation | Key Limitations & When Costs Begin |
| :--- | :--- | :--- |
| **Vercel (Hobby Plan)** | $0 / month | 100 GB bandwidth/month, 100,000 serverless function invocations, max 1 daily Cron Job. **Note**: Commercial/monetized sites eventually require upgrading to **Vercel Pro ($20/mo)** per Vercel's Terms of Service once monetized, or you can deploy to **Cloudflare Pages / Render / Railway**. |
| **MongoDB Atlas (M0 Free)** | 512 MB storage | Shared RAM/vCPU, max 500 concurrent connections, ~100 ops/sec throughput. Cached connections in `src/lib/mongodb.ts` and `.lean()` queries minimize usage. Upgrade to Flex/M10 when storage exceeds 400 MB. |
| **Image Hosting** | `/public` or Cloudinary Free | Serverless filesystems on Vercel are ephemeral/read-only at runtime. Store static assets in `/public` via Git or use a free CDN tier (Cloudinary 25 monthly credits / Cloudflare R2 10 GB free) and store only the HTTPS URL in MongoDB. |
| **Custom Domain** | ~$10–$14 / year | While `*.vercel.app` is free for development and testing, Google AdSense and strong US search trust generally require a custom top-level domain (`.com` or `.us`). |

---

## 4. Google Search Console & Google AdSense Launch Checklist

1. **Original Editorial Archive First**: Publish 25–40 thoroughly researched, original, human-verified articles and tutorials before applying for Google AdSense. Remove or archive any `[Demonstration]` articles once real articles are live.
2. **Google Search Console**:
   - Verify domain ownership using `GOOGLE_SITE_VERIFICATION` in `.env.local` or DNS TXT record.
   - Submit `https://yourdomain.com/sitemap.xml`.
   - Monitor Core Web Vitals and Page Indexing reports.
3. **Google AdSense Application (Only When Ready)**:
   - Verify that `/about`, `/contact`, `/editorial-policy`, `/corrections-policy`, `/privacy-policy`, and `/terms` are live and accurate.
   - Apply at `https://www.google.com/adsense` using your real identity and address in India (Google AdSense pays Indian publishers in INR via wire transfer/NEFT while serving US ads to US visitors).
   - Once approved, copy your real `ca-pub-XXXXXXXXXXXXXXXX` ID into `/admin/settings` (or `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`), rename `/public/ads.txt.example` to `/public/ads.txt` with your real publisher line, and toggle **Enable AdSlot Placements Globally**.
