export type UserRole = "ADMIN" | "EDITOR" | "AUTHOR";

export type ArticleType = "NEWS" | "BLOG";

export type ArticleStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface AuthorDTO {
  _id: string;
  name: string;
  email?: string;
  role: UserRole;
  title?: string;
  bio?: string;
}

export interface CategoryDTO {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagDTO {
  _id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArticleDTO {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: ArticleType;
  status: ArticleStatus;
  coverImage: string;
  imageAlt: string;
  imageCaption?: string;
  author: AuthorDTO;
  category: CategoryDTO;
  tags: TagDTO[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  isSponsored?: boolean;
  sponsorName?: string;
  isEditorsPick?: boolean;
  isDemo?: boolean;
  readingTimeMinutes: number;
  scheduledFor?: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isDemoData: boolean;
}

export interface WebsiteSettingsDTO {
  siteName: string;
  tagline: string;
  logoText: string;
  siteDescription: string;
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    rss?: string;
  };
  adsensePublisherId: string;
  adsEnabled: boolean;
  consentBannerEnabled: boolean;
  contactEmail: string;
  footerText: string;
  operatingDisclosure: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuditLogDTO {
  _id: string;
  user: string;
  userName?: string;
  action: string;
  entityType: "ARTICLE" | "CATEGORY" | "TAG" | "USER" | "SETTINGS" | "AUTH";
  entityId: string;
  details?: string;
  createdAt: string;
}
