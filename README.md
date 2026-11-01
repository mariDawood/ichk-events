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

Import this GitHub repository in Vercel. The framework is Next.js. There are no environment variables. After the first deploy, attach the domain in the Vercel project settings.
