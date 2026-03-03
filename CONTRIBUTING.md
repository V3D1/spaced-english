# Contributing to Spaced English

Thanks for your interest in contributing! Here's how to get started.

## Local Development

1. Fork and clone the repo
2. Run `pnpm setup` (requires Docker for PostgreSQL)
3. Start the dev server: `pnpm dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Code Style

- TypeScript strict mode
- Functional components with Server Components by default
- `'use client'` only when needed (interactivity, hooks)
- Tailwind CSS for styling — no CSS modules
- Zod for all validation (forms, env vars, API inputs)

## Making Changes

1. Create a branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run `pnpm build` to verify no errors
4. Run `pnpm test` to verify tests pass
5. Commit with a descriptive message
6. Open a Pull Request

## What to Contribute

**Great first contributions:**
- Add new collocations to `lib/learning/content.ts`
- Improve UI/UX of existing components
- Add unit tests for utility functions
- Fix typos or improve documentation

**Larger contributions (open an issue first):**
- New learning modes (listening, pronunciation)
- i18n support for non-English native languages
- Import/export functionality
- Mobile app (React Native)

## Pull Request Process

1. Ensure `pnpm build` and `pnpm test` pass
2. Update documentation if you changed behavior
3. Keep PRs focused — one feature/fix per PR
4. Describe what changed and why in the PR description

## Reporting Bugs

Open a GitHub issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS version
- Screenshots if applicable
