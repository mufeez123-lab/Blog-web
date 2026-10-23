import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      minlength: [2, "Tag name must be at least 2 characters"],
      maxlength: [50, "Tag name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      required: [true, "Tag slug is required"],
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe kebab-case"],
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

TagSchema.index({ slug: 1 }, { unique: true });

export const Tag: Model<ITag> =
  mongoose.models.Tag || mongoose.model<ITag>("Tag", TagSchema);

export default Tag;
