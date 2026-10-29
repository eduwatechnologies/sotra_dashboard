# Sotra Signals Dashboard

A responsive Next.js dashboard for the private Sotra Signals market-analysis service.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `SOTRA_API_URL` to the Sotra bot deployment origin and `SOTRA_DASHBOARD_API_SECRET` to the same dashboard-only secret configured as `DASHBOARD_API_SECRET` on the bot.
3. Install packages and start the app:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Use this local server only on a trusted machine; the production dashboard must be protected with Vercel Deployment Protection.

## Deploy

Deploy this folder as a separate Vercel project. Enable Vercel Deployment Protection for production and preview deployments. Configure:

- `SOTRA_API_URL`: origin of the Sotra bot Vercel deployment, without a path.
- `SOTRA_DASHBOARD_API_SECRET`: a strong random secret, matching `DASHBOARD_API_SECRET` on the bot deployment.

The secret is used only by Next.js server routes and is never exposed to browser code. Do not reuse the cron or Telegram webhook secrets.

The dashboard server proxies same-origin requests to protected Sotra endpoints for status, pause/resume, and manual scans. The bot remains the source of truth and continues to own all state and scanning behavior. Manual scans can send Telegram alerts when scheduled alerts are active. No broker connection, order execution, market quote feed, or signal history is implemented; the chart is explicitly illustrative.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Motion for React for reduced-motion-aware transitions
- Lucide React icons
# sotra_dashboard
