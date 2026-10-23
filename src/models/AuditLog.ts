import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  userName?: string;
  action: string;
  entityType: "ARTICLE" | "CATEGORY" | "TAG" | "USER" | "SETTINGS" | "AUTH";
  entityId: string;
  details?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    entityType: {
      type: String,
      enum: ["ARTICLE", "CATEGORY", "TAG", "USER", "SETTINGS", "AUTH"],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
