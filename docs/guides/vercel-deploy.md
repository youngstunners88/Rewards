# Deploying to Vercel

The app is a pure static site. No build step. Vercel serves the files
straight from `src/`.

## First deploy

1. Push this repo to GitHub (see `/ops/scripts/init-github.sh` for a one-shot script).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. In the project setup:
   - **Root Directory** → `src`
   - **Framework Preset** → `Other`
4. Click **Deploy**.

Vercel gives you a `*.vercel.app` URL within ~30 seconds.

## Subsequent deploys

Every push to `main` triggers a new deployment automatically. No extra
config needed.

## Custom domain

In Vercel → Project → **Settings** → **Domains** → add your domain. Vercel
will show the DNS records to add at your registrar. Save them there.
