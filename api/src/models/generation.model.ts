import { Schema, model, Document, Types } from "mongoose";

export interface IGeneration extends Document {
  userId: Types.ObjectId;
  subject: string;
  emailBody: string;
  linkedInDM: string;
  followUpEmail: string;
  chars: number;
  creditsUsed: number;
  inputs: {
    product: string;
    audience: string;
    tone: string;
    length: string;
  };
  createdAt: Date;
}

const generationSchema = new Schema<IGeneration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    emailBody: { type: String, required: true },
    linkedInDM: { type: String, default: "" },
    followUpEmail: { type: String, default: "" },
    chars: { type: Number, required: true },
    creditsUsed: { type: Number, required: true },
    inputs: {
      product: { type: String, default: "" },
      audience: { type: String, default: "" },
      tone: { type: String, default: "professional" },
      length: { type: String, default: "medium" },
    },
  },
  { timestamps: true },
);

export const Generation = model<IGeneration>("Generation", generationSchema);
