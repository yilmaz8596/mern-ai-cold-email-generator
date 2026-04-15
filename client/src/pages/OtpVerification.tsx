import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp";
import useStore from "../store/useStore";
import { Button } from "../components/ui/button";

export default function OtpVerification() {
  const [value, setValue] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const pendingEmail = useStore((s) => s.pendingEmail);
  const verifyOtp = useStore((s) => s.verifyOtp);
  const resendOtp = useStore((s) => s.resendOtp);
  const navigate = useNavigate();

  useEffect(() => {
    if (!pendingEmail) navigate("/login");
  }, [pendingEmail]);

  useEffect(() => {
    setSeconds(60);
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const onResend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    setError("");
    try {
      await resendOtp();
      setSeconds(60);
      setValue("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail) return;
    setError("");
    setLoading(true);
    try {
      await verifyOtp(pendingEmail, value);
      const updatedUser = useStore.getState().user;
      navigate(
        updatedUser?.isAdmin ? "/admin/overview" : "/dashboard/generate",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid or expired code. Please try again.",
      );
      setValue("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 text-left"
      style={{ width: "100%", textAlign: "left" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Link
          to="/"
          className="mb-6 block font-bold text-xl tracking-tight text-foreground"
        >
          Mailify
        </Link>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Verify your email
        </h2>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{pendingEmail}</span>.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={value}
              onChange={(v) => {
                setValue(v);
                setError("");
              }}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={value.length < 6 || loading}
            className="w-full shadow-sm"
          >
            {loading ? "Verifying…" : "Verify code"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {seconds > 0 ? `Resend in ${seconds}s` : "Didn't receive it?"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={seconds > 0 || resending}
          >
            {resending ? "Sending…" : "Resend"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
