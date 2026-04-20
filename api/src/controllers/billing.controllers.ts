import crypto from "crypto";
import { Request, Response } from "express";
import { tryCatch } from "../util/tryCatch";
import {
  lemonSqueezySetup,
  createCheckout as lsCreateCheckout,
} from "@lemonsqueezy/lemonsqueezy.js";
import User from "../models/user.model";
import { Transaction } from "../models/transaction.model";

lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
});

const getVariantCredits = (): Record<string, number> => ({
  [process.env.LS_VARIANT_STARTER!]: 5000,
  [process.env.LS_VARIANT_PRO!]: 20000,
});

export const createCheckout = tryCatch(async (req: Request, res: Response) => {
  const { variantId, redirectUrl } = req.body;
  const user = (req as any).user;

  // Defensive checks and logging to aid debugging on 500s
  if (!variantId) {
    console.warn("[createCheckout] missing variantId in request body", {
      body: req.body,
    });
    return res.status(400).json({ message: "variantId is required" });
  }
  if (!process.env.LEMONSQUEEZY_STORE_ID) {
    console.error("[createCheckout] MISSING LEMONSQUEEZY_STORE_ID env var");
    return res
      .status(500)
      .json({ message: "Server not configured: missing store id" });
  }

  const { data, error } = await lsCreateCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutData: { custom: { userId: user.userId } },
      productOptions: {
        ...(redirectUrl && { redirectUrl }),
      },
    },
  );

  if (error) {
    console.error(
      "[LS checkout error] storeId=%s variantId=%s error=%s cause=%j",
      process.env.LEMONSQUEEZY_STORE_ID,
      variantId,
      error.message,
      (error as any).cause,
    );
    return res
      .status(502)
      .json({ message: "Payment provider error", details: error.message });
  }
  res.json({ url: data.data.attributes.url });
});

export const handleWebhook = tryCatch(async (req: Request, res: Response) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const signature = req.headers["x-signature"] as string;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(req.body) // raw Buffer
    .digest("hex");

  const signaturesMatch =
    signature &&
    digest.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));

  if (!signaturesMatch) {
    console.warn(
      "[LS webhook] signature mismatch — digest=%s received=%s",
      digest,
      signature,
    );
    return res.status(401).json({ message: "Invalid signature" });
  }

  const payload = JSON.parse(req.body.toString());
  if (payload.meta.event_name !== "order_created") return res.sendStatus(200);
  if (payload.data.attributes.status !== "paid") return res.sendStatus(200);

  const variantId = String(payload.data.attributes.first_order_item.variant_id);
  const userId =
    payload.meta.custom_data?.user_id ?? payload.meta.custom_data?.userId;
  const credits = getVariantCredits()[variantId];

  if (userId && credits) {
    const planName =
      credits === 5000 ? "Starter" : credits === 20000 ? "Pro" : "Unknown";
    const amountCents = Math.round(payload.data.attributes.total ?? 0);
    const orderId = String(payload.data.id);
    await Promise.all([
      User.findByIdAndUpdate(userId, { $inc: { credits } }),
      Transaction.findOneAndUpdate(
        { orderId },
        {
          userId,
          plan: planName,
          credits,
          amountCents,
          status: "completed",
          orderId,
        },
        { upsert: true, new: true },
      ),
    ]);
  }
  res.sendStatus(200);
});

export const getCredits = tryCatch(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const dbUser = await User.findById(user.userId).select("credits");
  if (!dbUser) return res.status(404).json({ message: "User not found" });
  res.json({ credits: dbUser.credits ?? 0 });
});

export const getTransactions = tryCatch(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const txs = await Transaction.find({ userId: user.userId }).sort({
    createdAt: -1,
  });
  const result = txs.map((t) => ({
    id: t._id.toString(),
    plan: t.plan,
    credits: t.credits,
    amount: `$${(t.amountCents / 100).toFixed(2)}`,
    date: t.createdAt.toISOString(),
    status: t.status,
  }));
  res.json({ transactions: result });
});
