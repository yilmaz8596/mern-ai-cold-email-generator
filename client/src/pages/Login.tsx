import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import useStore from "../store/useStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 28,
      delay: i * 0.07,
    },
  }),
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const login = useStore((s) => s.login);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/otp-verification", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen text-left"
      style={{ width: "100%", textAlign: "left" }}
    >
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 flex-col justify-between border-r border-border bg-card p-12"
      >
        <Link
          to="/"
          className="font-bold text-xl tracking-tight text-foreground"
        >
          Mailify
        </Link>
        <div>
          <blockquote className="text-2xl font-medium leading-snug tracking-tight text-foreground">
            "Cold outreach used to take hours. Now it takes seconds."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">
            — happy early adopter
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Mailify</p>
      </motion.div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
        <motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm"
        >
          <motion.div variants={fadeUp} className="mb-8">
            <Link
              to="/"
              className="mb-8 block font-bold text-xl tracking-tight text-foreground lg:hidden"
            >
              Mailify
            </Link>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your credentials to continue.
            </p>
          </motion.div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <motion.div
              variants={fadeUp}
              custom={1}
              className="flex flex-col gap-1.5"
            >
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-col gap-1.5"
            >
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <motion.div variants={fadeUp} custom={3}>
              <Button
                type="submit"
                className="w-full shadow-sm"
                size="lg"
                disabled={loading}
              >
                {loading ? "Sending OTP…" : "Send OTP"}
              </Button>
            </motion.div>
          </form>

          <motion.p
            variants={fadeUp}
            custom={4}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
