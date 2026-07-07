# Deploy to Vercel

Quickest path:

1. Push this repo to GitHub (see `ops/scripts/init-github.sh`).
2. Go to https://vercel.com/new and import the repo.
3. **Root directory** = `src/`. Vercel will auto-detect it as a static site.
4. Deploy. Done.

Custom domain: Vercel → Project → Settings → Domains.

## Why root = `src/`?

The `src/` folder holds the static site (HTML/CSS/JS/images/sounds).
The rest of the repo is docs, planning, and ops — Vercel should not
build or serve that. By pointing Vercel at `src/`, only the runtime
code ships.
