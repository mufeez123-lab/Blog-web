import type {
  ArticleDTO,
  CategoryDTO,
  TagDTO,
  WebsiteSettingsDTO,
} from "@/types";

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettingsDTO = {
  siteName: "FeezMedia",
  tagline: "Technology News, Artificial Intelligence & Engineering Briefings",
  logoText: "FeezMedia",
  siteDescription:
    "Independent digital publication delivering technology journalism, artificial intelligence analysis, business explainers, and practical software engineering guides.",
  defaultMetaTitle:
    "FeezMedia | Technology News, AI Analysis & Developer Guides",
  defaultMetaDescription:
    "Read in-depth reporting on technology, enterprise AI, business explainers, and full-stack software engineering tutorials.",
  socialLinks: {
    twitter: "https://x.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
    rss: "/sitemap.xml",
  },
  adsensePublisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "",
  adsEnabled: process.env.NEXT_PUBLIC_ENABLE_ADS === "true",
  consentBannerEnabled: true,
  contactEmail: "mufizmalar@gmail.com",
  footerText:
    "FeezMedia is an independent digital publication covering US technology, artificial intelligence, business explainers, and software engineering.",
  operatingDisclosure:
    "Published for readers in the  and worldwide by an independent editorial and engineering team operating from India.",
};

export const DEMO_CATEGORIES: CategoryDTO[] = [
  {
    _id: "cat-tech-news",
    name: "Technology News",
    slug: "technology",
    description:
      "Enterprise infrastructure, US software and hardware architecture, cybersecurity posture, and digital privacy policy.",
  },
  {
    _id: "cat-ai",
    name: "Artificial Intelligence",
    slug: "ai",
    description:
      "Practical enterprise AI workflows, model evaluations, responsible governance, and applied developer tooling.",
  },
  {
    _id: "cat-business",
    name: "Business & Markets",
    slug: "business",
    description:
      "US technology business explainers, cloud unit economics, SaaS metrics, and industry structure analysis.",
  },
  {
    _id: "cat-programming",
    name: "Programming Tutorials",
    slug: "programming",
    description:
      "Production-grade TypeScript, React, Next.js App Router, Node.js, and MongoDB architecture tutorials.",
  },
  {
    _id: "cat-career",
    name: "Career Guides",
    slug: "career",
    description:
      "US software engineering interview preparation, system design roadmaps, resume strategy, and distributed team practices.",
  },
];

export const DEMO_TAGS: TagDTO[] = [
  { _id: "tag-nextjs", name: "Next.js", slug: "nextjs" },
  { _id: "tag-mongodb", name: "MongoDB", slug: "mongodb" },
  { _id: "tag-typescript", name: "TypeScript", slug: "typescript" },
  { _id: "tag-cloud", name: "Cloud Infrastructure", slug: "cloud-infrastructure" },
  { _id: "tag-cybersecurity", name: "Cybersecurity", slug: "cybersecurity" },
  { _id: "tag-llm", name: "Enterprise AI", slug: "enterprise-ai" },
  { _id: "tag-saas", name: "SaaS Economics", slug: "saas-economics" },
  { _id: "tag-interviews", name: "System Design", slug: "system-design" },
];

/**
 * Clearly labeled demonstration articles used ONLY when MongoDB has not yet been seeded
 * or during local zero-config evaluation. None of these articles fabricate breaking news,
 * quotes, or unverified claims; they are evergreen reference explainers and technical guides.
 */
export const DEMO_ARTICLES: ArticleDTO[] = [
  {
    _id: "demo-art-1",
    title:
      "[Demonstration] How US Engineering Teams Evaluate Zero-Trust Identity Architecture in Cloud-Native Systems",
    slug: "evaluating-zero-trust-identity-architecture-cloud-native-systems",
    excerpt:
      "Demonstration Explainer: A technical overview of how US enterprise security teams implement short-lived credentials, workload identity federation, and continuous verification across multi-cloud environments.",
    content: `
      <p><strong>Editorial Notice:</strong> <em>This article is clearly labeled demonstration content provided to illustrate FeezMedia's layout, typography, and structured metadata before live database articles are published.</em></p>
      <h2>Why Perimeter-Only Security No Longer Suffices</h2>
      <p>Modern distributed engineering organizations across the  rarely operate within a single static network perimeter. Microservices deployed across containerized clusters, serverless runtimes, and managed database platforms require identity-centric access controls at every network hop.</p>
      <p>Zero-trust architecture replaces implicit network trust with explicit cryptographic verification. Every service-to-service request must authenticate its workload identity and pass fine-grained policy checks before accessing downstream data stores.</p>
      <h2>Core Pillars of Workload Identity Federation</h2>
      <ul>
        <li><strong>Short-Lived Ephemeral Tokens:</strong> Replace static API keys with automatically rotated OIDC or SPIFFE/SPIRE tokens that expire within minutes.</li>
        <li><strong>Least-Privilege Role Scoping:</strong> Bind database and storage permissions to the exact collection or bucket prefix required by a specific service.</li>
        <li><strong>Continuous Audit Telemetry:</strong> Record administrative and schema-level operations in immutable audit logs without capturing sensitive credentials.</li>
      </ul>
      <blockquote>
        <p>"Security architecture succeeds when the safest path for developers is also the most automated path in the deployment pipeline."</p>
      </blockquote>
      <h2>Practical Checklist for Full-Stack Platforms</h2>
      <p>Even small engineering teams operating on free-tier infrastructure can adopt zero-trust fundamentals immediately: enforce HTTPS everywhere, store connection strings strictly in server-side environment variables, validate all incoming payloads with schema validators such as Zod, and restrict MongoDB Atlas database users to read/write privileges on a single application database.</p>
    `,
    type: "NEWS",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Server racks illuminated in a modern data center corridor",
    imageCaption:
      "Illustration: Cloud infrastructure security relies on workload identity and least-privilege access controls.",
    author: {
      _id: "demo-author-1",
      name: "FeezMedia Editorial Desk",
      role: "EDITOR",
      title: "Infrastructure & Security Desk",
      bio: "Demonstration editorial profile for FeezMedia's US technology and security analysis desk.",
    },
    category: DEMO_CATEGORIES[0],
    tags: [DEMO_TAGS[3], DEMO_TAGS[4]],
    metaTitle:
      "Zero-Trust Identity Architecture in Cloud-Native Systems (Demo)",
    metaDescription:
      "An architectural explainer on workload identity federation, short-lived tokens, and least-privilege access controls for US cloud teams.",
    sourceName: "NIST SP 800-207 Zero Trust Architecture Reference",
    sourceUrl: "https://csrc.nist.gov/publications/detail/sp/800-207/final",
    isSponsored: false,
    isEditorsPick: true,
    isDemo: true,
    readingTimeMinutes: 5,
    publishedAt: "2025-02-15T14:00:00.000Z",
    createdAt: "2025-02-15T12:00:00.000Z",
    updatedAt: "2025-02-15T14:00:00.000Z",
  },
  {
    _id: "demo-art-2",
    title:
      "[Demonstration] Designing Deterministic Retrieval-Augmented Generation (RAG) Pipelines for Enterprise Documentation",
    slug: "designing-deterministic-rag-pipelines-enterprise-documentation",
    excerpt:
      "Demonstration Analysis: How software teams ground large language models using chunking strategies, hybrid lexical-vector search, and strict citation verification.",
    content: `
      <p><strong>Editorial Notice:</strong> <em>This article is demonstration content illustrating FeezMedia's Artificial Intelligence coverage format.</em></p>
      <h2>Moving Beyond Unverified Prompting</h2>
      <p>When software teams deploy AI assistants for internal documentation or customer support, ungrounded generation poses a significant reliability risk. Retrieval-Augmented Generation (RAG) mitigates hallucinations by restricting responses to verified passages retrieved from an authoritative knowledge base.</p>
      <h2>Three Architectural Decisions That Determine Accuracy</h2>
      <h3>1. Semantic and Structural Document Chunking</h3>
      <p>Splitting technical documentation at arbitrary character counts often separates code blocks from their surrounding explanation. Splitting by Markdown or HTML section headers preserves context boundaries.</p>
      <h3>2. Hybrid Search (BM25 + Vector Embeddings)</h3>
      <p>Pure vector similarity search frequently misses exact error codes, package versions, or environment variable names. Combining keyword indexes with dense embeddings delivers higher recall for technical queries.</p>
      <h3>3. Mandatory Source Attribution</h3>
      <p>Every generated paragraph should cite the exact document slug and section heading from which the underlying facts were retrieved, allowing human engineers to verify claims in seconds.</p>
    `,
    type: "NEWS",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Abstract visualization of interconnected neural network nodes",
    imageCaption:
      "Illustration: Grounding AI assistants requires hybrid retrieval and verifiable source citations.",
    author: {
      _id: "demo-author-1",
      name: "FeezMedia Editorial Desk",
      role: "EDITOR",
      title: "Applied AI & Systems Desk",
      bio: "Demonstration editorial profile for FeezMedia's US technology and AI analysis desk.",
    },
    category: DEMO_CATEGORIES[1],
    tags: [DEMO_TAGS[5], DEMO_TAGS[2]],
    metaTitle:
      "Designing Deterministic RAG Pipelines for Enterprise Docs (Demo)",
    metaDescription:
      "Learn how hybrid search, structural chunking, and strict citation checks improve reliability in enterprise RAG systems.",
    isSponsored: false,
    isEditorsPick: true,
    isDemo: true,
    readingTimeMinutes: 4,
    publishedAt: "2025-02-14T15:30:00.000Z",
    createdAt: "2025-02-14T13:00:00.000Z",
    updatedAt: "2025-02-14T15:30:00.000Z",
  },
  {
    _id: "demo-art-3",
    title:
      "[Demonstration] Understanding Cloud Unit Economics: Gross Margin, Reserved Capacity, and Egress Costs Explained",
    slug: "understanding-cloud-unit-economics-gross-margin-egress-explained",
    excerpt:
      "Demonstration Business Explainer: How technology companies measure infrastructure cost per customer, optimize compute utilization, and evaluate cloud FinOps trade-offs.",
    content: `
      <p><strong>Editorial Notice:</strong> <em>This article is demonstration content for the Business &amp; Markets section. It is for educational purposes only and does not constitute financial or investment advice.</em></p>
      <h2>Why Cloud Cost Per Unit Matters More Than Total Spend</h2>
      <p>A rising monthly cloud bill can signal healthy customer growth or inefficient architecture. To distinguish between the two, US software executives track <strong>unit economics</strong>—such as infrastructure cost per thousand API requests, per active tenant, or per gigabyte processed.</p>
      <h2>Key Metrics Tracked by Engineering and Finance Leaders</h2>
      <ul>
        <li><strong>Cloud Gross Margin:</strong> Revenue minus Cost of Goods Sold (COGS), which includes production hosting, database clusters, third-party APIs, and support personnel.</li>
        <li><strong>Compute Commitment Coverage:</strong> The percentage of predictable baseline workloads covered by 1-year or 3-year reserved instances or savings plans.</li>
        <li><strong>Data Transfer and Egress Overhead:</strong> Cross-availability-zone and internet egress charges that can silently erode margins on media-heavy platforms.</li>
      </ul>
      <h2>Practical Optimization Without Sacrificing Reliability</h2>
      <p>Right-sizing database indexes, caching read-heavy public pages at the CDN edge, and compressing images into modern WebP or AVIF formats routinely reduce bandwidth and database CPU utilization by 30% to 50%.</p>
    `,
    type: "NEWS",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Financial and operational metrics displayed on a laptop screen",
    imageCaption:
      "Illustration: Aligning software architecture with cloud unit economics.",
    author: {
      _id: "demo-author-1",
      name: "FeezMedia Editorial Desk",
      role: "EDITOR",
      title: "Business & Cloud Economics Desk",
      bio: "Demonstration editorial profile for FeezMedia.",
    },
    category: DEMO_CATEGORIES[2],
    tags: [DEMO_TAGS[6], DEMO_TAGS[3]],
    metaTitle:
      "Cloud Unit Economics: Gross Margin & Egress Costs Explained (Demo)",
    metaDescription:
      "A practical business explainer on SaaS gross margins, cloud FinOps, compute commitments, and bandwidth optimization.",
    isSponsored: false,
    isEditorsPick: false,
    isDemo: true,
    readingTimeMinutes: 4,
    publishedAt: "2025-02-13T16:00:00.000Z",
    createdAt: "2025-02-13T14:00:00.000Z",
    updatedAt: "2025-02-13T16:00:00.000Z",
  },
  {
    _id: "demo-art-4",
    title:
      "[Demonstration] Production Mongoose Indexing and Connection Pooling in Next.js App Router Applications",
    slug: "production-mongoose-indexing-connection-pooling-nextjs-app-router",
    excerpt:
      "Demonstration Tutorial: Step-by-step guide to caching Mongoose connections across serverless invocations, designing compound indexes, and using .lean() for fast Server Component queries.",
    content: `
      <p><strong>Editorial Notice:</strong> <em>This programming tutorial is demonstration content illustrating code blocks and technical blog formatting.</em></p>
      <h2>1. Preventing Connection Exhaustion in Serverless Functions</h2>
      <p>In traditional Express servers, <code>mongoose.connect()</code> runs once at process startup. In Next.js App Router serverless environments, each cold start or hot reload can spawn a new connection unless you cache the connection promise on the global object.</p>
      <pre><code>// Cached connection pattern in src/lib/mongodb.ts
const cached = global.mongooseCache ?? { conn: null, promise: null };
if (!cached.promise) {
  cached.promise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
  });
}
cached.conn = await cached.promise;</code></pre>
      <h2>2. Designing Compound Indexes following the ESR Rule</h2>
      <p>When querying published articles sorted by publication date, follow MongoDB's <strong>Equality, Sort, Range (ESR)</strong> guideline:</p>
      <pre><code>// Equality on status &amp; type, Sort descending on publishedAt
ArticleSchema.index({ status: 1, type: 1, publishedAt: -1 });</code></pre>
      <h2>3. Using <code>.lean()</code> for Read-Only Server Components</h2>
      <p>Hydrating full Mongoose documents with change tracking and getters adds unnecessary memory and CPU overhead when rendering read-only HTML in React Server Components. Calling <code>.lean()</code> returns plain JavaScript objects directly from the MongoDB driver.</p>
    `,
    type: "BLOG",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "TypeScript code displayed in a dark-themed code editor",
    imageCaption:
      "Illustration: Optimizing MongoDB queries and connection pooling in Next.js.",
    author: {
      _id: "demo-author-1",
      name: "FeezMedia Editorial Desk",
      role: "EDITOR",
      title: "Full-Stack Engineering Desk",
      bio: "Demonstration editorial profile for FeezMedia's software engineering tutorials.",
    },
    category: DEMO_CATEGORIES[3],
    tags: [DEMO_TAGS[0], DEMO_TAGS[1], DEMO_TAGS[2]],
    metaTitle:
      "Mongoose Indexing & Connection Pooling in Next.js App Router (Demo)",
    metaDescription:
      "Learn how to cache Mongoose connections, design ESR compound indexes, and optimize read performance with .lean() in Next.js.",
    isSponsored: false,
    isEditorsPick: true,
    isDemo: true,
    readingTimeMinutes: 6,
    publishedAt: "2025-02-12T11:00:00.000Z",
    createdAt: "2025-02-12T09:00:00.000Z",
    updatedAt: "2025-02-12T11:00:00.000Z",
  },
  {
    _id: "demo-art-5",
    title:
      "[Demonstration] System Design Interview Guide: Structuring Read-Heavy Content Publishing Architectures",
    slug: "system-design-interview-guide-read-heavy-content-publishing",
    excerpt:
      "Demonstration Career Guide: A practical framework for software engineers preparing for US technical interviews—covering requirements scoping, database indexing, caching layers, and trade-off articulation.",
    content: `
      <p><strong>Editorial Notice:</strong> <em>This career guide is demonstration content for the Career section.</em></p>
      <h2>How Interviewers Evaluate System Design Candidates</h2>
      <p>In US software engineering interviews for mid-level and senior roles, system design questions test your ability to clarify ambiguous requirements, estimate workload characteristics, and justify architectural trade-offs rather than memorize a single diagram.</p>
      <h2>Step 1: Quantify Read-to-Write Ratios</h2>
      <p>Digital news portals and technical blogs typically experience a <strong>100:1 to 1,000:1 read-to-write ratio</strong>. Editors publish dozens of articles per week, while readers request hundreds of thousands of article pages.</p>
      <h2>Step 2: Separate Public Read Paths from Editorial Write Paths</h2>
      <ul>
        <li><strong>Write Path:</strong> Authenticated role-based mutations, strict schema validation, HTML sanitization, and audit logging.</li>
        <li><strong>Read Path:</strong> Compound database indexes on <code>(status, publishedAt)</code>, selective projection, pagination, and HTTP cache headers.</li>
      </ul>
      <h2>Step 3: Discuss Operational Failure Modes</h2>
      <p>Always explain how your design handles database timeouts, invalid user input, rate limiting on authentication endpoints, and safe rollback of configuration changes.</p>
    `,
    type: "BLOG",
    status: "PUBLISHED",
    coverImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Engineers collaborating over an architecture diagram on a desk",
    imageCaption:
      "Illustration: Structuring system design discussions around concrete read/write trade-offs.",
    author: {
      _id: "demo-author-1",
      name: "FeezMedia Editorial Desk",
      role: "EDITOR",
      title: "Engineering Careers Desk",
      bio: "Demonstration editorial profile for FeezMedia's career and interview guides.",
    },
    category: DEMO_CATEGORIES[4],
    tags: [DEMO_TAGS[7], DEMO_TAGS[1]],
    metaTitle:
      "System Design Interview Guide: Read-Heavy Publishing Systems (Demo)",
    metaDescription:
      "Prepare for US software engineering system design interviews by analyzing read-heavy content architectures, indexing, and caching.",
    isSponsored: false,
    isEditorsPick: false,
    isDemo: true,
    readingTimeMinutes: 5,
    publishedAt: "2025-02-10T10:00:00.000Z",
    createdAt: "2025-02-10T08:00:00.000Z",
    updatedAt: "2025-02-10T10:00:00.000Z",
  },
];
