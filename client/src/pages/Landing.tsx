import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

/* ─── animation variants ─────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 220,
      damping: 26,
      delay: i * 0.09,
    },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const charStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.1 } },
};

const charReveal = {
  hidden: { opacity: 0, y: 36, rotateX: -25, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 280, damping: 28 },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -32 },
  show: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 200, damping: 24, delay: i * 0.1 },
  }),
};

/* ─── word-by-word animated headline ─────────────────────── */
function AnimatedHeadline({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.055, delayChildren: delay } },
      }}
      initial="hidden"
      animate="show"
      className={`inline ${className}`}
      style={{ perspective: 700 }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={charReveal}
          className="inline-block mr-[0.26em] last:mr-0"
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ─── word-by-word subheadline (softer reveal) ───────────── */
function AnimatedSubheadline({
  text,
  delay = 0.8,
}: {
  text: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <motion.span
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.045, delayChildren: delay } },
      }}
      initial="hidden"
      animate="show"
      className="inline"
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", stiffness: 200, damping: 22 },
            },
          }}
          className="inline-block mr-[0.25em] last:mr-0"
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ─── count-up number ────────────────────────────────────── */
function CountUp({
  to,
  suffix = "",
  duration = 1.2,
  active,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  active: boolean;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const totalFrames = Math.round(duration * 60);
    const timer = setInterval(() => {
      frame++;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setCount(Math.round(to * progress));
      if (frame >= totalFrames) {
        setCount(to);
        clearInterval(timer);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [active, to, duration]);
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

/* ─── scroll-triggered section wrapper ───────────────────── */
function Section({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-72px" });
  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.1, delayChildren: delay } },
      }}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── data ────────────────────────────────────────────────── */
const steps = [
  {
    n: "01",
    icon: "📝",
    title: "Describe your offer",
    body: "Enter your product or service, target audience, and desired tone. No templates, no guesswork.",
  },
  {
    n: "02",
    icon: "⚙️",
    title: "AI writes in seconds",
    body: "Groq's ultra-fast LLM generates a polished cold email, LinkedIn DM, and follow-up simultaneously.",
  },
  {
    n: "03",
    icon: "📤",
    title: "Copy and send",
    body: "One click to copy any output. Every generation is saved to your history for future reference.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    credits: "1 000",
    features: [
      "1 000 credits on signup",
      "All output formats",
      "History access",
      "Community support",
    ],
    highlight: false,
  },
  {
    name: "Starter",
    price: "$9",
    credits: "5 000",
    features: [
      "5 000 credits",
      "All output formats",
      "History access",
      "Email support",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    credits: "20 000",
    features: [
      "20 000 credits",
      "All output formats",
      "History access",
      "Priority support",
      "Bulk generation",
    ],
    highlight: true,
  },
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "SDR @ TechCorp",
    quote:
      "I went from spending an hour on outreach to 5 minutes. The emails feel genuinely personalised — my reply rate jumped from 4% to 11% in two weeks.",
    avatar: "S",
  },
  {
    name: "Marcus T.",
    role: "Founder, Launchpad",
    quote:
      "The LinkedIn DM output alone is worth it. I used to blank out on how to start — now I just describe my offer and hit generate. Game changer.",
    avatar: "M",
  },
  {
    name: "Priya R.",
    role: "Growth Lead @ Scales",
    quote:
      "Having the follow-up email ready alongside the cold email saves me so much context-switching. I send three-touch sequences in minutes now.",
    avatar: "P",
  },
];

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-8 py-4 backdrop-blur"
    >
      <motion.span
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-lg font-bold tracking-tight text-foreground"
      >
        Mailify
      </motion.span>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <Link to="/login">
          <Button variant="ghost" size="sm">
            Login
          </Button>
        </Link>
        <Link to="/register">
          <Button size="sm">Get started free</Button>
        </Link>
      </motion.div>
    </motion.nav>
  );
}

/* ─── page ────────────────────────────────────────────────── */
export default function Landing() {
  const [statsActive, setStatsActive] = useState(false);
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ width: "100%" }}
    >
      <Navbar />

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-6 pb-24 pt-28">
        {/* ambient glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 size-[700px] rounded-full bg-primary blur-[130px]"
        />

        {/* centred column */}
        <div className="relative flex flex-col items-center text-center">
          {/* badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
            className="mb-7"
          >
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
              ✦ AI-powered cold outreach
            </Badge>
          </motion.div>

          {/* headline */}
          <h1 className="mb-6 w-full max-w-2xl text-5xl font-bold leading-[1.1] tracking-tighter text-foreground md:text-6xl lg:text-[4.5rem]">
            <AnimatedHeadline text="Write better" delay={0.1} />
            <br />
            <AnimatedHeadline
              text="cold emails, faster."
              className="text-primary"
              delay={0.4}
            />
          </h1>

          {/* sub-headline */}
          <p className="mb-4 max-w-md text-base text-muted-foreground md:text-lg">
            <AnimatedSubheadline
              text="Generate personalised cold emails, LinkedIn DMs and follow-ups in under 3 seconds."
              delay={0.9}
            />
          </p>

          {/* stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }}
            onAnimationComplete={() => setStatsActive(true)}
            className="flex w-full max-w-xs divide-x divide-border border border-border bg-card"
          >
            {[
              { to: 3, suffix: "s", l: "generation" },
              { to: 3, suffix: "×", l: "formats" },
              { to: 11, suffix: "%", l: "reply rate" },
            ].map((s) => (
              <div
                key={s.l}
                className="flex flex-1 flex-col items-center px-3 py-4"
              >
                <span className="text-xl font-bold text-foreground">
                  <CountUp to={s.to} suffix={s.suffix} active={statsActive} />
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {s.l}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-muted/20 px-6 py-24">
        <Section className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              From idea to inbox in three steps
            </h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                variants={fadeUp}
                custom={i}
                whileHover={{
                  y: -5,
                  transition: { type: "spring", stiffness: 380, damping: 22 },
                }}
                className="relative border border-border bg-card p-8 shadow-[3px_3px_0px_0px_var(--border)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-4xl font-black text-border">
                    {step.n}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* connecting line accent */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="mx-auto mt-12 flex items-center justify-center gap-3 text-sm text-muted-foreground"
          >
            <span className="h-px w-12 bg-border" />
            Each step takes seconds, not hours.
            <span className="h-px w-12 bg-border" />
          </motion.div>
        </Section>
      </section>

      {/* ════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════ */}
      <section className="border-t border-border px-6 py-24">
        <Section className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Pricing
            </p>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Pay only for what you use
            </h2>
            <p className="text-muted-foreground">
              Credits never expire. Top up any time.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                custom={i}
                whileHover={{
                  y: -6,
                  transition: { type: "spring", stiffness: 360, damping: 20 },
                }}
                className={`relative flex flex-col border p-8 transition-shadow hover:shadow-md ${
                  plan.highlight
                    ? "border-primary shadow-[3px_3px_0px_0px_var(--primary)] bg-card"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs">
                    Most popular
                  </Badge>
                )}
                <div className="mb-6">
                  <p className="mb-1 font-semibold text-foreground">
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    <span className="mb-1 text-sm text-muted-foreground">
                      / {plan.credits} credits
                    </span>
                  </div>
                </div>

                <Separator className="mb-6" />

                <ul className="mb-8 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="text-primary">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/register">
                  <Button
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full"
                  >
                    Get started
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      </section>

      {/* ════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-muted/20 px-6 py-24">
        <Section className="mx-auto max-w-5xl">
          <motion.div variants={fadeUp} className="mb-14 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              Testimonials
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Trusted by sales professionals
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={slideLeft}
                custom={i}
                whileHover={{
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 340, damping: 22 },
                }}
                className="flex flex-col gap-5 border border-border bg-card p-7 shadow-[3px_3px_0px_0px_var(--border)]"
              >
                {/* quote mark */}
                <span className="text-3xl font-black leading-none text-primary/30">
                  "
                </span>

                <p className="flex-1 text-sm leading-relaxed text-foreground">
                  {t.quote}
                </p>

                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="flex size-9 items-center justify-center border border-border bg-muted text-sm font-bold text-foreground">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      </section>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-background px-6 py-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Mailify
          </p>
          <p className="text-xs text-muted-foreground">
            © 2026 Mailify · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
