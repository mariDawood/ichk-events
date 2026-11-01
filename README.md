# H. Remigiuskerk — activiteiten

One page for activities at the H. Remigiuskerk in Duiven. Dutch is the default (`/`). English is `/en`. Arabic is `/ar`.

When an activity has not ended yet, the page shows it. Otherwise it asks people to look again later.

## Add an activity

Edit `src/content/events.ts`. Give the activity an `id`, a `start`, and an `end`, and write the text in Dutch, English, and Arabic. Times use the Dutch offset: `+01:00` in winter and `+02:00` in summer.

The page hides the activity as soon as `end` has passed. No redeploy is required for that.

Labels such as “Wanneer” and the empty-state text live in `messages/nl.json`, `messages/en.json`, and `messages/ar.json`.

## Run it locally

```bash
npm install
npm run dev
```

## Put it on Vercel

Import this GitHub repository in Vercel. The framework is Next.js. After the first deploy, attach the domain in the Vercel project settings.

Signups, tickets, and bingo numbers are stored in Supabase. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`, the admin session values, and, when you are ready to take payment and send mail, the Stripe and Resend values. People sign up on the activity page. After payment, each person gets a ticket number and a barcode. The link in the email opens their page. Beheer is at `/admin`. There is no link to it on the public page.
