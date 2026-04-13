import { Schema, model, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  plan: string;
  credits: number;
  amountCents: number;
  status: "completed" | "pending" | "failed";
  orderId: string;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: { type: String, required: true },
    credits: { type: Number, required: true },
    amountCents: { type: Number, required: true },
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },
    orderId: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema,
);
