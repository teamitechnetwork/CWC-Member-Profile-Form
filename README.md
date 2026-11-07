# CWC Member Profile

A responsive Columbus Women Connect member profile form built with React, Vite, and pnpm.

## Local development

```sh
pnpm install
pnpm --filter @workspace/cwc-member-profile run dev
```

## Checks

```sh
pnpm --filter @workspace/cwc-member-profile run typecheck
pnpm --filter @workspace/cwc-member-profile run build
```

## Vercel

The root `vercel.json` builds the CWC web app from this pnpm workspace and serves the static files from `artifacts/cwc-member-profile/dist/public`. The root `api/members.ts` file provides the Vercel serverless `POST /api/members` endpoint used by the form.

Import the Git repository into Vercel with the repository root as the project root. Set `SHEET_URL` and `SHEET_SECRET` in the Vercel project's environment settings for each environment that should accept submissions. Replit Secrets do not automatically populate Vercel's environment. Never put either value in Git or browser code.
