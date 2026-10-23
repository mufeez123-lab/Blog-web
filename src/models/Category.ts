import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [60, "Category name cannot exceed 60 characters"],
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-safe kebab-case"],
    },
    description: {
      type: String,
      required: [true, "Category description is required"],
      trim: true,
      maxlength: [320, "Description cannot exceed 320 characters"],
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

CategorySchema.index({ slug: 1 }, { unique: true });

export const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
