import { Request, Response } from "express";
import { Resend } from "resend";
import { tryCatch } from "../util/tryCatch";
import { Generation } from "../models/generation.model";

export const generateEmail = tryCatch(async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  const systemPrompt = `Generate a cold email based on the following prompt: "${prompt}". The email should be concise, engaging, and tailored to the target audience. Include a clear call-to-action and maintain a professional tone. Avoid using overly technical language or jargon. The email should be suitable for a business context and aim to capture the recipient's interest effectively. The response should be in JSON format with the following structure: { "subject": "Email subject", "emailBody": "Email body content", linkedInDM: "LinkedIn direct message content", "followUpEmail": "Follow-up email content" }`;

  const options = {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 1000,
    temperature: 0.7,
    response_format: { type: "json_object" },
  };

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(options),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Groq API error:", errorText);
    return res.status(500).json({ message: "Failed to generate email" });
  }

  const data = await resp.json();

  const raw: string = data.choices[0]?.message?.content || "";

  let jsonString = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  if (!jsonString.startsWith("{")) {
    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) jsonString = match[0];
  }

  let subject: string,
    emailBody: string,
    linkedInDM: string,
    followUpEmail: string;
  try {
    ({ subject, emailBody, linkedInDM, followUpEmail } =
      JSON.parse(jsonString));
  } catch {
    console.error("Failed to parse Groq response as JSON:", jsonString);
    return res.status(500).json({ message: "Failed to parse generated email" });
  }

  const user = (req as any).user;
  const chars =
    subject.length +
    emailBody.length +
    linkedInDM.length +
    followUpEmail.length;
  const creditsUsed = Math.ceil(chars / 100);

  const {
    product = "",
    audience = "",
    tone = "professional",
    length: emailLength = "medium",
  } = req.body;
  await Generation.create({
    userId: user.userId,
    subject,
    emailBody,
    linkedInDM,
    followUpEmail,
    chars,
    creditsUsed,
    inputs: { product, audience, tone, length: emailLength },
  });

  return res
    .status(200)
    .json({ subject, emailBody, linkedInDM, followUpEmail });
});

export const getHistory = tryCatch(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const generations = await Generation.find({ userId: user.userId })
    .sort({ createdAt: -1 })
    .lean();

  const history = generations.map((g) => ({
    id: (g._id as any).toString(),
    subject: g.subject,
    emailBody: g.emailBody,
    linkedInDM: g.linkedInDM,
    followUpEmail: g.followUpEmail,
    chars: g.chars,
    creditsUsed: g.creditsUsed,
    date: g.createdAt.toISOString(),
    inputs: g.inputs,
  }));

  return res.json({ history });
});

export const deleteGeneration = tryCatch(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;

    const deleted = await Generation.findOneAndDelete({
      _id: id,
      userId: user.userId,
    });
    if (!deleted) return res.status(404).json({ message: "Not found" });

    return res.json({ message: "Deleted" });
  },
);

export const sendEmail = tryCatch(async (req: Request, res: Response) => {
  const { to, subject, body } = req.body as {
    to: string;
    subject: string;
    body: string;
  };

  if (!to || !subject || !body) {
    return res
      .status(400)
      .json({ message: "to, subject and body are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ message: "Invalid recipient email address" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Email sending is not configured" });
  }

  const resend = new Resend(apiKey);
  const from = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    text: body,
  });

  if (error) {
    console.error("Resend error:", error);
    return res
      .status(502)
      .json({ message: error.message ?? "Failed to send email" });
  }

  return res.json({ message: "Email sent", id: data?.id });
});
