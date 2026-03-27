import { Request, Response } from "express";
import { tryCatch } from "../util/tryCatch";

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

  // Strip markdown code fences (```json ... ``` or ``` ... ```) if present
  const jsonString = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

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

  return res
    .status(200)
    .json({ subject, emailBody, linkedInDM, followUpEmail });
});
