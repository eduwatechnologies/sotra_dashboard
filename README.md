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

The dashboard server proxies same-origin requests to protected Sotra endpoints for status, pause/resume, settings, and manual scans. The bot remains the source of truth and persists dashboard overrides in its shared state store. Markets, candle interval, scan cadence, and minimum reward/risk apply to future scans; reset restores the bot's environment-configured defaults. Paused scheduled alerts do not send Telegram notifications, and manual scans while paused still analyze without sending. On Vercel, changing the displayed scan cadence does not modify cron-job.org; update the external cron schedule separately. No broker connection, order execution, market quote feed, or signal history is implemented; the chart is explicitly illustrative.

## Dashboard pages

- `/`: overview, service status, summary metrics, and manual scan.
- `/markets`: configured watchlist and illustrative chart.
- `/signals`: latest detected setup; no signal history is claimed.
- `/alerts`: pause/resume Telegram delivery and alert behavior.
- `/settings`: markets, candle interval, and scan cadence.
- `/strategy`: create named profiles for the existing strategy, activate one for future scans, and compare parameter configurations. This is not a historical backtest or a performance comparison; adding a distinct strategy requires bot-side strategy logic.

The sidebar and page header live in the shared App Router layout; mobile navigation links to the same pages.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Motion for React for reduced-motion-aware transitions
- Lucide React icons
# sotra_dashboard
