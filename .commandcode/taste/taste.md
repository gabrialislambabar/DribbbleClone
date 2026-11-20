# Taste

## Architecture & stack

- Prefers a single-framework stack for full web apps: Next.js App Router with TypeScript plus Supabase (Postgres, Auth, Storage) handling server-side logic — explicitly no separate Express/backend server. Confidence: 0.7
- Wants a server-first access pattern: Server Components for reads, Server Actions for mutations from their own UI, Route Handlers only for webhooks/external HTTP endpoints. Confidence: 0.65

## Database workflow

- Treats SQL migration files as the official, reviewable record of schema changes (over ad-hoc dashboard edits). Confidence: 0.65
