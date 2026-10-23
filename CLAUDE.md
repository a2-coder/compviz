# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

compviz is a minimal app that turns a Docker Compose file into a diagram. Stack: a plain Next.js app (App Router) with Tailwind CSS and shadcn/ui. Keep it minimal: no backend services, database or auth unless asked.

@AGENTS.md

Next.js 16 / React 19: APIs differ from older versions (see AGENTS.md). Notably Cache Components are on, so non-deterministic values in server components (`new Date()`, random) fail the prerender unless wrapped in a `"use cache"` component or moved to the client (see `CopyrightYear` in `app/page.tsx`).

## Commands

Use **bun**, not npm/pnpm/yarn. (`bun build` is Bun's bundler; the package.json build script is `bun run build`.)

- `bun dev`: dev server (Turbopack)
- `bun run build`: production build; also the type check
- `bun run lint`: ESLint
- `bunx --bun shadcn@latest add <component>`: add a shadcn component to `components/ui/`

No test runner is set up yet.

## Structure

- `app/page.tsx`: the whole UI so far: the a2coder labs shell (header / Compose card + Diagram card / footer). The Compose-to-diagram logic isn't built yet; the Diagram card shows an `Empty` placeholder.
- `app/layout.tsx`: loads JetBrains Mono via `next/font` as `--font-jetbrains-mono` and wraps the app in `TooltipProvider`.
- `app/globals.css`: all design tokens (see below).
- `components/ui/`: shadcn components, style `base-lyra` on **Base UI** (`@base-ui/react`), not Radix: custom triggers use the `render` prop, not `asChild`. `cn` comes from the `cn` package (re-exported by `lib/utils.ts`). `buttonVariants()` does not merge classes; wrap it in `cn()` when used on a non-Button element.
- `components/logo.tsx`: inline logo for in-app use.

## Design system: a2coder labs

compviz follows the **A2Coder Labs** design system (claude.ai artifact `https://claude.ai/artifact/HDsBxq9YuzDhUzkdo1ApTb`; read `project/README.md` and `project/tokens.json` from it with the Artifact tool for exact values). Key rules:

- Tokens are the stock shadcn zinc set (oklch values) in `app/globals.css`, with `--radius: 0` and the chart colours restored to the design system's values; dark mode is the `.dark` class. Use the shadcn token pairs (`foreground`/`background`, `card-foreground`/`card`, `primary-foreground`/`primary`, …), never raw colours in chrome.
- Chrome is neutral zinc. Hue appears only in the diagram/plot, from Tailwind's 500 palette; `orange-500` is compviz's accent (the logo's top cube). `emerald-500` is only for success confirmations, always paired with a text change.
- Font: JetBrains Mono for everything (via `next/font/google`; the source playgrounds use `@fontsource-variable/jetbrains-mono`, same face). Small base: 12px body (`text-xs/relaxed`), `text-sm font-medium` card titles, `text-lg font-bold` app title once per screen.
- Square corners everywhere (`rounded-none`); `rounded-full` only for naturally round parts. Cards: no shadow, `ring-1 ring-foreground/10`, `border` rule under the header. Shadows only on floating panels (`shadow-md`, sub-menus `shadow-lg`).
- Icons: Tabler (`@tabler/icons-react`), outline, `size-4` in controls.
- Layout pattern: header (logo in a 40px square with a 2px `primary` border, app name, "by **@a2coder**" byline, GitHub icon button) / two cards (input + preview, side by side from `lg`, `gap-8`) / footer "Copyright © <year> Arjun Palakkazhi. All rights reserved." in `text-xs text-muted-foreground`, sections split by full-width Separators.
- Copy: Title Case names, short imperative labels, no emoji, no "I"/"we"; units directly after numbers (`1250ms`); handle is always lowercase "@a2coder"; browser title "compviz | by @a2coder".

## Brand assets

- `public/logo.svg`: full mark (orange-500 top container linked to two `primary` containers). Its neutral colour switches via `prefers-color-scheme`, not the `.dark` class; in the app use `components/logo.tsx`, whose neutral parts follow `currentColor` (`text-primary`) so they switch with `.dark`. Keep the two in sync.
- `app/icon.svg`: simplified favicon (no door slats or rings) for 16–32px; picked up automatically by the Next.js `app/icon` convention.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for a2-coder/compviz (via `gh`). See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
