# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router code. `app/page.tsx` is the main UI, `app/layout.tsx` defines root metadata/layout, and `app/globals.css` holds global Tailwind/theme styles.
- `public/` stores static assets (SVGs, icons, images) served directly by Next.js.
- Root config files (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`) define build, typing, linting, and CSS behavior.
- The project currently uses a flat structure (no `src/` folder and no dedicated test directory yet).

## Build, Test, and Development Commands
- `npm run dev`: starts the local dev server on `http://localhost:3000` with hot reload.
- `npm run build`: creates the production build; run this before opening a PR.
- `npm run start`: serves the production build after `npm run build`.
- `npm run lint`: runs ESLint with Next.js Core Web Vitals + TypeScript rules.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled; prefer explicit types for non-trivial data structures.

## Security & Configuration Tips
- Never commit secrets. Keep local values in `.env.local` (all `.env*` files are gitignored).
- Review dependency and config changes carefully, especially in `next.config.ts` and auth/runtime-related code.
