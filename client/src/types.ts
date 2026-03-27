// ---------------------------------------------------------------------------
// Shared application types
// ---------------------------------------------------------------------------

/** Authenticated user returned by POST /api/auth/verify-otp */
export type User = {
  id: string;
  name: string;
  email: string;
};

/** A generated email item stored in history */
export type EmailItem = {
  id: string;
  subject: string;
  emailBody: string;
  linkedInDM?: string;
  followUpEmail?: string;
  chars: number;
  creditsUsed: number;
  date: string;
};

/** A billing / credit-purchase transaction */
export type BillingTransaction = {
  id: string;
  plan: string;
  credits: number;
  amount: string;
  date: string;
  status: "completed" | "pending" | "failed";
};

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export type ApiMessageResponse = {
  message: string;
};

export type VerifyOtpResponse = {
  message: string;
  user: User;
};

/** Response from POST /api/ai/generate-email */
export type GenerateEmailResponse = {
  subject: string;
  emailBody: string;
  linkedInDM: string;
  followUpEmail: string;
};

// ---------------------------------------------------------------------------
// Error thrown by store auth actions on non-2xx responses
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
