export type User = {
  id: string;
  name: string;
  email: string;
};

export type GenerateInputs = {
  product: string;
  audience: string;
  tone: string;
  length: string;
};

export type EmailItem = {
  id: string;
  subject: string;
  emailBody: string;
  linkedInDM?: string;
  followUpEmail?: string;
  chars: number;
  creditsUsed: number;
  date: string;
  inputs?: GenerateInputs;
};

export type BillingTransaction = {
  id: string;
  plan: string;
  credits: number;
  amount: string;
  date: string;
  status: "completed" | "pending" | "failed";
};

export type ApiMessageResponse = {
  message: string;
};

export type VerifyOtpResponse = {
  message: string;
  user: User;
  credits: number;
};

export type GenerateEmailResponse = {
  subject: string;
  emailBody: string;
  linkedInDM: string;
  followUpEmail: string;
};

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
