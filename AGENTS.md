# AGENTS.md

Guidance for AI agents working in this repo. Read this before making changes.

## What this is

`projects` — a native GPUix desktop app (no DOM, no browser) that shows a
filterable project sidebar next to a jj changes graph for the selected repo.
It scans `~/Projects` for jj repos, lists them by last-touched order, and
shows per-repo activity, metadata, and the change log. Built on React 19 +
`@gpuix/react` + `@gpuix/native`, styled with the `adwaita-gpuix` component
library (a symlinked local dependency in `node_modules/`).

## Commands

```sh
bun install              # install deps
bun run typecheck        # tsc --noEmit  (the only static gate)
bun scripts/shot.tsx <name>   # one niri-captured PNG → next to the rendered source file
bun run build            # compile the native binary → dist/projects
bun run dev              # live app — USER command (needs a display); not an agent command
```

## Visual verification — Niri-capture

- **Verify UI changes on demand with `bun scripts/shot.tsx <name>`.** The
  harness (`scripts/shot.tsx`) renders one real GPUix window and captures it
  via `niri msg action screenshot-window`; the PNG lands **next to the
  rendered source file and is named after it** (PascalCase; e.g.
  `EmptyState.png` beside `src/components/EmptyState.tsx`; screen shots
  beside `src/screens/Screen.tsx`) —
  gitignored except the co-located ones.
  On-demand only: no render-all, no `ONLY=` env var, no `shots/` folder.
  Inspect the PNG next to the component.
- **Shots are isolated per component** — each component shot renders
  exactly one instance of that component; only screen shots may compose.
- **NEVER launch the app binary (`dist/projects`) or the dev server
  (`bun run dev`) to probe the UI.** The shots harness is the only
  sanctioned window path — no live screenshots, no runtime/interaction
  probes. Running the app is the user's domain.
- If a behaviour can't be seen in a static shot, say so — don't fabricate a
  probe and don't launch the app to check.

## Working-directory hygiene

- Keep `scripts/` to production tooling (`shot.tsx` + `shot-data.ts`).
  No probe files, test fixtures, or scratch dirs.
- Generated PNGs land **next to the rendered source file, named after it**
  (e.g. `src/components/EmptyState.png` beside `EmptyState.tsx`); they are
  gitignored except the co-located ones — never a central `shots/` folder.
- No scratch artifacts in the working directory; clean up before finishing.

## Definition of done

A UI change is complete when:

1. `bun run typecheck` passes.
2. `bun scripts/shot.tsx <name>` produces a clean PNG next to the rendered
   source file (inspect it).
3. No probe / scratch / generated artifacts are left in the working
   directory.

## Layout

- `src/app.tsx` — the split view: left sidebar + right changes panel,
  keyboard shortcuts, polling.
- `src/screens/` — the full app screen (Screen.tsx, ScreenCanvas.tsx);
  screen shot PNGs live here (Screen.png, ScreenEmpty.png,
  ScreenNoChanges.png, ScreenError.png).
- `src/components/` — one PascalCase file per component (EmptyState.tsx,
  ListRow.tsx, ProjectRow.tsx, ProjectsSidebar.tsx, ActivityDashboard.tsx,
  ContributionHeatmap.tsx, StatusBar.tsx, Sparkline.tsx, GraphGutter.tsx,
  VirtualListPanel.tsx, …).
- `src/repos.ts` — jj repo scanning, metadata, change-log and sparkline
  data (spawns `jj` CLI).
- `src/graph.ts` — commit-graph lane layout for the changes view.
- `src/keybus.ts` — global key-handler plumbing.
- `src/theme.ts` — adwaita theme instance (`nightsky`) + font tokens.

GPUix JSX conventions (host elements, no `<button>`, `<virtual-list>`
scroller, explicit text colours, number px values) are documented in
`adwaita-gpuix/AGENTS.md` — read it before writing or verifying UI.
