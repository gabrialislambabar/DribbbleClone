# Taste
- Prefers a single-framework stack for full web apps: Next.js App Router with TypeScript plus Supabase (Postgres, Auth, Storage) handling server-side logic — explicitly no separate Express/backend server. Confidence: 0.7
- Wants a server-first access pattern: Server Components for reads, Server Actions for mutations from their own UI, Route Handlers only for webhooks/external HTTP endpoints. Confidence: 0.65
- Wants a full planning phase before implementation, driven by clarifying/design questions asked before each new step of work begins (not after code is written), and prefers the work proceeds step by step in the existing project. Confidence: 0.85
- Wants each planning question to come with recommended/most-suitable options to pick from, rather than open-ended questions. Confidence: 0.6
- When asking to fix problems, wants minimal surgical changes: keep existing code, structure, and behavior exactly as-is and only remove the error — no refactoring, renaming, or redesign mixed in. Confidence: 0.7
- Treats SQL migration files as the official, reviewable record of schema changes (over ad-hoc dashboard edits). Confidence: 0.65
- When getting a project running, wants explicit step-by-step setup instructions that enumerate every required key/env variable rather than a high-level summary. Confidence: 0.55
