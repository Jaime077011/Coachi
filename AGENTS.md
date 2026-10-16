<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

## Progress log

Daily progress lives in `progress/`, one file per day named `YYYY-MM-DD.md` (see `progress/README.md` for the template).

- At the start of a session, read the newest file in `progress/` to see where things stand and what is next.
- When asked to log the day, create or update today's file. Never edit past days' files; add a new day instead.
- Steps refer to the 6-step plan in `Coachi Starter Kit.md`.

## Coach and admin screens (decided 2026-10-16)

- No split screens: every section is full width, one under another. When a page has a lot, use tabs to switch between sections (e.g. Today: Needs attention / Activity).
- No pop-ups (dialogs, drawers, sheets): every form, picker, and confirmation is its own screen, built with `ScreenPanel` (`components/coachi/screen-panel.tsx`) and a `?back=` link (`useBack`). Plan builders open their pickers as a full-screen view on the same route (`?pick=`) so the unsaved draft stays in memory.
- Dropdown menus and select lists are fine. The client app is not covered by this rule.
