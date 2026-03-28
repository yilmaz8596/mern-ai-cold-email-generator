# Mailify — AI Cold Email Generator

A full-stack SaaS application that generates personalised cold emails, LinkedIn DMs, and follow-up emails using Groq's LLM. Built with the MERN stack, Docker, and a credit-based billing system.

---

## Features

- **AI Email Generation** — cold email, LinkedIn DM, and follow-up in one click using `llama-3.3-70b-versatile` via Groq
- **Bulk CSV Generation** — upload a CSV of prospects and generate emails for every row sequentially
- **Direct Email Sending** — send generated emails to recipients via Resend
- **Credit System** — credits deducted per generation; top up via LemonSqueezy checkout
- **OTP Authentication** — register/login with email-based one-time password (Nodemailer SMTP)
- **JWT Auth** — access + refresh tokens in `httpOnly` cookies, auto-rotated on 401
- **Generation History** — all generations persisted to MongoDB; inline editing and deletion
- **Regenerate from History** — pre-fill the generator form from any past generation
- **Admin Dashboard** — overview, user management, and transaction tables (UI prototype)
- **Dark / Light theme** — system-aware theme toggle
- **Fully Dockerised** — hot-reload dev environment for both API and client

---

## Tech Stack

| Layer                | Technology                                                                     |
| -------------------- | ------------------------------------------------------------------------------ |
| **Frontend**         | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Zustand, shadcn/ui |
| **Backend**          | Express 5, TypeScript, Node 22                                                 |
| **Database**         | MongoDB 7 (Mongoose)                                                           |
| **Cache / Sessions** | Redis 7                                                                        |
| **AI**               | Groq API — `llama-3.3-70b-versatile`                                           |
| **Email (OTP)**      | Nodemailer (SMTP)                                                              |
| **Email (Sending)**  | Resend SDK                                                                     |
| **Billing**          | LemonSqueezy                                                                   |
| **Auth**             | JWT (access 15 min / refresh 7 d), bcryptjs, httpOnly cookies                  |
| **Infrastructure**   | Docker, Docker Compose                                                         |

---

## Project Structure

```
mern-ai-cold-email-generator/
├── api/                        # Express API
│   ├── src/
│   │   ├── index.ts            # App entry point
│   │   ├── controllers/        # ai, auth, billing
│   │   ├── routes/             # aiRoutes, authRoutes, billingRoutes
│   │   ├── models/             # User, Generation (Mongoose)
│   │   ├── middleware/         # verifyAuth (JWT guard)
│   │   ├── config/             # db.ts (MongoDB), redis.ts, logger.ts
│   │   └── util/               # generateTokens, sendEmail, verifyOtp
│   ├── Dockerfile
│   └── package.json
├── client/                     # React SPA
│   ├── src/
│   │   ├── App.tsx             # Router + route definitions
│   │   ├── pages/              # Landing, Login, Register, OtpVerification
│   │   │   ├── dashboard/      # Generate, History, HistoryDetail, Bulk, Billing, Settings
│   │   │   └── admin/          # Overview, Users, Transactions, Layout
│   │   ├── components/         # GeneratorForm, Layout (Sidebar, Topbar), history/
│   │   ├── store/              # useStore (auth + credits), useAiStore (history)
│   │   ├── lib/                # utils.ts (fetchWithAuth)
│   │   └── types.ts
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/) (included with Docker Desktop)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/mern-ai-cold-email-generator.git
cd mern-ai-cold-email-generator
```

### 2. Configure environment variables

Create `api/.env`:

```env
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# MongoDB (pre-configured for Docker Compose)
MONGO_URI=mongodb://admin:admin123@db:27017/ai-cold-email-dev?authSource=admin

# Redis (pre-configured for Docker Compose)
REDIS_URL=redis://redis:6379

# JWT secrets — use long random strings
JWT_ACCESS_TOKEN_SECRET=your_access_secret_here
JWT_REFRESH_TOKEN_SECRET=your_refresh_secret_here

# SMTP — for OTP delivery
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your@gmail.com

# Resend — for sending cold emails
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Groq — AI generation
GROQ_API_KEY=gsk_xxxxxxxxxxxx

# LemonSqueezy — billing
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LS_VARIANT_STARTER=
LS_VARIANT_PRO=
```

Create `client/.env`:

```env
VITE_API_TARGET=http://api:5000
VITE_LS_VARIANT_STARTER=your_ls_starter_variant_id
VITE_LS_VARIANT_PRO=your_ls_pro_variant_id
```

### 3. Start the app

```bash
docker compose up -d --build
```

| Service      | URL                          |
| ------------ | ---------------------------- |
| Client       | http://localhost:5173        |
| API          | http://localhost:5000        |
| Health check | http://localhost:5000/health |

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint                  | Auth   | Description                         |
| ------ | ------------------------- | ------ | ----------------------------------- |
| `POST` | `/api/auth/register`      | Public | Create account, send OTP            |
| `POST` | `/api/auth/login`         | Public | Validate credentials, send OTP      |
| `POST` | `/api/auth/verify-otp`    | Public | Verify OTP, issue JWT cookies       |
| `POST` | `/api/auth/refresh-token` | Cookie | Rotate access + refresh tokens      |
| `POST` | `/api/auth/logout`        | Cookie | Revoke refresh token, clear cookies |

### AI — `/api/ai`

| Method   | Endpoint                 | Auth | Description                         |
| -------- | ------------------------ | ---- | ----------------------------------- |
| `POST`   | `/api/ai/generate-email` | JWT  | Generate email via Groq, save to DB |
| `GET`    | `/api/ai/history`        | JWT  | Fetch all generations for user      |
| `DELETE` | `/api/ai/history/:id`    | JWT  | Delete a generation                 |
| `POST`   | `/api/ai/send-email`     | JWT  | Send email via Resend               |

### Billing — `/api/billing`

| Method | Endpoint                | Auth | Description                           |
| ------ | ----------------------- | ---- | ------------------------------------- |
| `GET`  | `/api/billing/credits`  | JWT  | Get current credit balance            |
| `POST` | `/api/billing/checkout` | JWT  | Create LemonSqueezy checkout URL      |
| `POST` | `/api/billing/webhook`  | HMAC | Handle payment events, top up credits |

---

## Bulk CSV Generation

1. Download the CSV template from the **Bulk** page
2. Fill in your prospects — required: `product`, `audience`; optional: `tone`, `length`, `email`
3. Upload the CSV
4. Click **Generate** — emails are produced one by one (~7 credits each)
5. Optionally send each email directly to the recipient using the **Send** button (requires `email` column and a configured Resend domain)

Example CSV:

```csv
product,audience,tone,length,email
Project Management SaaS,Series-A startup CTOs,professional,medium,cto@example.com
HR Automation Tool,HR managers at mid-size companies,friendly,short,hr@example.com
```

---

## Credits System

| Action            | Cost                              |
| ----------------- | --------------------------------- |
| Single generation | `ceil(total_chars / 100)` credits |
| Bulk row          | ~7 credits per row                |

New accounts start with **1,000 free credits**. Top up via the Billing page.

---

## Resend Domain Setup

To send cold emails from your own domain:

1. Go to [resend.com](https://resend.com) → **Domains** → Add your domain
2. Add the DNS records Resend provides to your domain registrar:
   - **TXT** record for SPF
   - **CNAME** records for DKIM
   - **TXT** record for DMARC (optional)
3. Set `FROM_EMAIL=noreply@yourdomain.com` in `api/.env`
4. DNS propagation can take up to 48 hours

---

## LemonSqueezy Webhook (local dev)

To test billing locally, expose your API with a tunnel:

```bash
# Using Pinggy
ssh -p 443 -R0:localhost:5000 a.pinggy.io
```

Set the tunnel URL as your LemonSqueezy webhook endpoint:

```
https://your-tunnel-url.a.pinggy.online/api/billing/webhook
```

---

## Environment Variables Reference

### `api/.env`

| Variable                      | Required | Description                                  |
| ----------------------------- | -------- | -------------------------------------------- |
| `PORT`                        | Yes      | API port (default `5000`)                    |
| `MONGO_URI`                   | Yes      | MongoDB connection string                    |
| `REDIS_URL`                   | No       | Redis URL (defaults to `redis://redis:6379`) |
| `JWT_ACCESS_TOKEN_SECRET`     | Yes      | Secret for access tokens                     |
| `JWT_REFRESH_TOKEN_SECRET`    | Yes      | Secret for refresh tokens                    |
| `EMAIL_HOST`                  | Yes      | SMTP host for OTP emails                     |
| `EMAIL_PORT`                  | Yes      | SMTP port                                    |
| `EMAIL_USER`                  | Yes      | SMTP username                                |
| `EMAIL_PASS`                  | Yes      | SMTP password / app password                 |
| `EMAIL_FROM`                  | Yes      | From address for OTP emails                  |
| `RESEND_API_KEY`              | Yes      | Resend API key                               |
| `FROM_EMAIL`                  | Yes      | From address for cold emails                 |
| `GROQ_API_KEY`                | Yes      | Groq API key                                 |
| `LEMONSQUEEZY_API_KEY`        | Billing  | LemonSqueezy API key                         |
| `LEMONSQUEEZY_STORE_ID`       | Billing  | LemonSqueezy store ID                        |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Billing  | Webhook signing secret                       |
| `LS_VARIANT_STARTER`          | Billing  | Starter plan variant ID                      |
| `LS_VARIANT_PRO`              | Billing  | Pro plan variant ID                          |

### `client/.env`

| Variable                  | Required | Description                              |
| ------------------------- | -------- | ---------------------------------------- |
| `VITE_API_TARGET`         | Yes      | API URL for Vite proxy (Docker internal) |
| `VITE_LS_VARIANT_STARTER` | Billing  | Starter variant ID shown on billing page |
| `VITE_LS_VARIANT_PRO`     | Billing  | Pro variant ID shown on billing page     |

---

## License

MIT
