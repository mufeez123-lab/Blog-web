import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebsiteSettings extends Document {
  _id: mongoose.Types.ObjectId;
  singletonKey: string;
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
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSettingsSchema = new Schema<IWebsiteSettings>(
  {
    singletonKey: {
      type: String,
      default: "GLOBAL_SETTINGS",
      unique: true,
      required: true,
    },
    siteName: {
      type: String,
      required: true,
      default: "TechLedger",
      trim: true,
      maxlength: 80,
    },
    tagline: {
      type: String,
      default: "US Technology News, Artificial Intelligence & Engineering Briefings",
      trim: true,
      maxlength: 160,
    },
    logoText: {
      type: String,
      default: "TechLedger",
      trim: true,
      maxlength: 40,
    },
    siteDescription: {
      type: String,
      default:
        "Independent digital publication delivering US technology journalism, artificial intelligence analysis, business explainers, and practical software engineering guides.",
      trim: true,
      maxlength: 360,
    },
    defaultMetaTitle: {
      type: String,
      default: "TechLedger | US Technology News, AI Analysis & Developer Guides",
      trim: true,
      maxlength: 100,
    },
    defaultMetaDescription: {
      type: String,
      default:
        "Read in-depth reporting on US technology, enterprise AI, business explainers, and full-stack software engineering tutorials.",
      trim: true,
      maxlength: 200,
    },
    socialLinks: {
      twitter: { type: String, trim: true, default: "" },
      linkedin: { type: String, trim: true, default: "" },
      github: { type: String, trim: true, default: "" },
      rss: { type: String, trim: true, default: "/sitemap.xml" },
    },
    adsensePublisherId: {
      type: String,
      trim: true,
      default: "",
    },
    adsEnabled: {
      type: Boolean,
      default: false,
    },
    consentBannerEnabled: {
      type: Boolean,
      default: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      default: "editorial@techledger.us",
    },
    footerText: {
      type: String,
      trim: true,
      default:
        "TechLedger is an independent digital publication covering US technology, artificial intelligence, business explainers, and software engineering.",
    },
    operatingDisclosure: {
      type: String,
      trim: true,
      default:
        "Published for readers in the United States and worldwide by an independent editorial and engineering team operating from India.",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

export const WebsiteSettings: Model<IWebsiteSettings> =
  mongoose.models.WebsiteSettings ||
  mongoose.model<IWebsiteSettings>("WebsiteSettings", WebsiteSettingsSchema);

export default WebsiteSettings;
