import mongoose, { Schema, Document, Model } from "mongoose";
import type { UserRole } from "@/types";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  title?: string;
  bio?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Never return password hashes by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ["ADMIN", "EDITOR", "AUTHOR"],
        message: "Role must be ADMIN, EDITOR, or AUTHOR",
      },
      default: "AUTHOR",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
      default: "Staff Writer",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [600, "Bio cannot exceed 600 characters"],
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Unique index on normalized email
UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
