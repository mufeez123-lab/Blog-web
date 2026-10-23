import mongoose, { Schema, Document, Model } from "mongoose";

export type SubscriberStatus = "SUBSCRIBED" | "UNSUBSCRIBED";

export interface ISubscriber extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  status: SubscriberStatus;
  categories: string[];
  unsubscribeToken: string;
  syncedToGoogleForms: boolean;
  welcomeSentAt?: Date | null;
  lastNewsletterSentAt?: Date | null;
  subscribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, "Subscriber email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Valid email address is required"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    status: {
      type: String,
      enum: ["SUBSCRIBED", "UNSUBSCRIBED"],
      default: "SUBSCRIBED",
      required: true,
    },
    categories: {
      type: [String],
      default: ["ALL"],
    },
    unsubscribeToken: {
      type: String,
      required: true,
    },
    syncedToGoogleForms: {
      type: Boolean,
      default: false,
    },
    welcomeSentAt: {
      type: Date,
      default: null,
    },
    lastNewsletterSentAt: {
      type: Date,
      default: null,
    },
    subscribedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

SubscriberSchema.index({ status: 1, subscribedAt: -1 });

export const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
