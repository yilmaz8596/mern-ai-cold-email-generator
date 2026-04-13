import { Request, Response } from "express";
import User from "../models/user.model";
import { Generation } from "../models/generation.model";
import { Transaction } from "../models/transaction.model";
import logger from "../config/logger";

export const getStats = async (_req: Request, res: Response) => {
  try {
    const [totalUsers, verifiedUsers, totalEmails, creditsSoldAgg] =
      await Promise.all([
        User.countDocuments({ isAdmin: { $ne: true } }),
        User.countDocuments({ isVerified: true, isAdmin: { $ne: true } }),
        Generation.countDocuments(),
        Transaction.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$credits" } } },
        ]),
      ]);

    return res.json({
      totalUsers,
      verifiedUsers,
      totalEmails,
      creditsSold: creditsSoldAgg[0]?.total ?? 0,
    });
  } catch (error) {
    logger.error(`Admin getStats error: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const [users, emailCounts] = await Promise.all([
      User.find({ isAdmin: { $ne: true } })
        .select("name email credits isVerified isAdmin createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Generation.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
      ]),
    ]);

    const countMap: Record<string, number> = Object.fromEntries(
      emailCounts.map((e) => [e._id.toString(), e.count]),
    );

    const result = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      credits: u.credits,
      verified: u.isVerified,
      isAdmin: u.isAdmin ?? false,
      joined: (u as any).createdAt
        ? new Date((u as any).createdAt).toISOString().split("T")[0]
        : "-",
      emails: countMap[u._id.toString()] ?? 0,
    }));

    return res.json(result);
  } catch (error) {
    logger.error(`Admin getUsers error: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTransactions = async (_req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate("userId", "email")
      .lean();

    const result = transactions.map((t) => ({
      id: t._id.toString(),
      user: (t.userId as any)?.email ?? "—",
      plan: t.plan,
      amount: `$${Math.round(t.amountCents / 100)}`,
      credits: t.credits,
      date: new Date(t.createdAt).toISOString().split("T")[0],
      status: t.status,
    }));

    return res.json(result);
  } catch (error) {
    logger.error(`Admin getTransactions error: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getRevenue = async (_req: Request, res: Response) => {
  try {
    const [monthly, byPlan] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            revenue: { $sum: "$amountCents" },
            count: { $sum: 1 },
            credits: { $sum: "$credits" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: "$plan",
            revenue: { $sum: "$amountCents" },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyFormatted = monthly.map((m) => ({
      month: `${MONTHS[m._id.month - 1]} ${String(m._id.year).slice(2)}`,
      revenue: +(m.revenue / 100).toFixed(2),
      count: m.count,
      credits: m.credits,
    }));

    const byPlanFormatted = byPlan.map((p) => ({
      plan: p._id,
      revenue: +(p.revenue / 100).toFixed(2),
      count: p.count,
    }));

    const totalRevenue = byPlanFormatted.reduce((s, p) => s + p.revenue, 0);
    const totalTransactions = byPlanFormatted.reduce((s, p) => s + p.count, 0);

    return res.json({
      monthly: monthlyFormatted,
      byPlan: byPlanFormatted,
      totals: {
        revenue: +totalRevenue.toFixed(2),
        transactions: totalTransactions,
        avgOrder: totalTransactions > 0 ? +(totalRevenue / totalTransactions).toFixed(2) : 0,
      },
    });
  } catch (error) {
    logger.error(`Admin getRevenue error: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};
