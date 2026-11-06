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

The root `vercel.json` builds the CWC web app from this pnpm workspace and serves the static files from `artifacts/cwc-member-profile/dist/public`. Import the Git repository into Vercel with the repository root as the project root; the install, build, and output settings are already specified.

The current Vercel setup deploys the web interface only. Form submissions use the shared `/api/member-profiles` service, so submissions will need a Vercel-compatible API endpoint and Google Sheets configuration before they can be sent from a Vercel deployment. Keep Google credentials and sheet access details in Vercel environment settings, never in Git.
