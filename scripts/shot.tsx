import {
  createRoot,
  flushSync,
  createRenderer,
  startFrameLoop,
} from "@gpuix/react";
import type { ReactNode } from "react";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { AdwaitaContext } from "adwaita-gpuix";
import { adwaitaTheme } from "../src/theme";
import { EmptyStateShot } from "../src/components/EmptyState";
import { ListRowShot } from "../src/components/ListRow";
import { SparklineShot } from "../src/components/Sparkline";
import { GraphGutterShot } from "../src/components/GraphGutter";
import { VirtualListPanelShot } from "../src/components/VirtualListPanel";
import {
  ActivityDashboardShot,
  ActivityDashboardEmptyShot,
} from "../src/components/ActivityDashboard";
import { StatusBarShot } from "../src/components/StatusBar";
import { ContributionHeatmapShot } from "../src/components/ContributionHeatmap";
import {
  ProjectsSidebarShot,
  SidebarPillsShot,
  SidebarNoMatchShot,
  SidebarEmptyShot,
  SidebarDropdownShot,
} from "../src/components/SidebarCanvas";
import {
  AppScreenShot,
  AppScreenEmptyShot,
  AppScreenNoChangesShot,
  AppScreenErrorShot,
} from "../src/screens/Screen";

export interface ComponentShot {
  name: string;
  el: ReactNode;
}

interface ShotEntry extends ComponentShot {
  file: string;
  out: string;
}

const entry = (file: string, shot: ComponentShot, out: string): ShotEntry => ({
  ...shot,
  file,
  out,
});

const COMPONENT_SHOTS: ShotEntry[] = [
  entry("src/components/EmptyState.tsx", EmptyStateShot, "EmptyState"),
  entry("src/components/ListRow.tsx", ListRowShot, "ListRow"),
  entry("src/components/Sparkline.tsx", SparklineShot, "Sparkline"),
  entry("src/components/GraphGutter.tsx", GraphGutterShot, "GraphGutter"),
  entry(
    "src/components/VirtualListPanel.tsx",
    VirtualListPanelShot,
    "VirtualListPanel",
  ),
  entry(
    "src/components/ActivityDashboard.tsx",
    ActivityDashboardShot,
    "ActivityDashboard",
  ),
  entry(
    "src/components/ActivityDashboard.tsx",
    ActivityDashboardEmptyShot,
    "ActivityDashboardEmpty",
  ),
  entry("src/components/StatusBar.tsx", StatusBarShot, "StatusBar"),
  entry(
    "src/components/ContributionHeatmap.tsx",
    ContributionHeatmapShot,
    "ContributionHeatmap",
  ),
  entry(
    "src/components/ProjectsSidebar.tsx",
    ProjectsSidebarShot,
    "ProjectsSidebar",
  ),
  entry(
    "src/components/ProjectsSidebar.tsx",
    SidebarPillsShot,
    "ProjectsSidebarPills",
  ),
  entry(
    "src/components/ProjectsSidebar.tsx",
    SidebarNoMatchShot,
    "ProjectsSidebarNoMatch",
  ),
  entry(
    "src/components/ProjectsSidebar.tsx",
    SidebarEmptyShot,
    "ProjectsSidebarEmpty",
  ),
  entry(
    "src/components/ProjectsSidebar.tsx",
    SidebarDropdownShot,
    "ProjectsSidebarDropdown",
  ),
];

const SCREEN_SHOTS: ShotEntry[] = [
  entry("src/screens/Screen.tsx", AppScreenShot, "Screen"),
  entry("src/screens/Screen.tsx", AppScreenEmptyShot, "ScreenEmpty"),
  entry("src/screens/Screen.tsx", AppScreenNoChangesShot, "ScreenNoChanges"),
  entry("src/screens/Screen.tsx", AppScreenErrorShot, "ScreenError"),
];

const ALL_SHOTS: ShotEntry[] = [...COMPONENT_SHOTS, ...SCREEN_SHOTS];

const SIZES: Record<string, { w: number; h: number }> = {
  EmptyState: { w: 412, h: 680 },
  ListRow: { w: 560, h: 320 },
  Sparkline: { w: 560, h: 300 },
  GraphGutter: { w: 560, h: 520 },
  VirtualListPanel: { w: 560, h: 520 },
  ActivityDashboard: { w: 792, h: 480 },
  ActivityDashboardEmpty: { w: 792, h: 320 },
  StatusBar: { w: 1312, h: 240 },
  ContributionHeatmap: { w: 792, h: 560 },
  ProjectsSidebar: { w: 412, h: 752 },
  SidebarPills: { w: 412, h: 752 },
  SidebarNoMatch: { w: 412, h: 752 },
  SidebarEmpty: { w: 412, h: 752 },
  SidebarDropdown: { w: 412, h: 752 },
  Screen: { w: 1312, h: 752 },
  ScreenEmpty: { w: 1312, h: 752 },
  ScreenNoChanges: { w: 1312, h: 752 },
  ScreenError: { w: 1312, h: 752 },
};

const DEFAULT_SIZE = { w: 560, h: 480 };
const PAD = 16;

function wrap(shot: ComponentShot): ReactNode {
  const { w, h } = SIZES[shot.name] ?? DEFAULT_SIZE;
  return (
    <AdwaitaContext.Provider value={adwaitaTheme}>
      <div
        style={{
          width: w,
          height: h,
          padding: PAD,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          backgroundColor: adwaitaTheme.colors.window_bg,
        }}
      >
        {shot.el}
      </div>
    </AdwaitaContext.Provider>
  );
}

const WINDOW_TITLE = "gpuix-shot-projects";
const SCREENSHOT_DIR = join(process.env.HOME ?? "", "Pictures", "Screenshots");

function newestScreenshot(): string | null {
  if (!existsSync(SCREENSHOT_DIR)) return null;
  const files = readdirSync(SCREENSHOT_DIR)
    .filter((f) => f.endsWith(".png"))
    .map((f) => join(SCREENSHOT_DIR, f))
    .map((p) => ({ p, m: statSync(p).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  return files[0]?.p ?? null;
}

function findWindowId(title: string): number | null {
  const out = execFileSync("niri", ["msg", "--json", "windows"], {
    encoding: "utf8",
  });
  const windows = JSON.parse(out) as Array<{ id: number; title: string }>;
  const w = windows.find((x) => x.title === title);
  return w ? w.id : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

async function renderAndCapture(name: string): Promise<void> {
  const shot = ALL_SHOTS.find((s) => s.name === name);
  if (!shot) {
    console.error(`✗ unknown shot: ${name}`);
    process.exit(1);
  }

  const { w, h } = SIZES[shot.name] ?? DEFAULT_SIZE;
  const r = createRenderer();
  r.init({ title: WINDOW_TITLE, width: w, height: h });
  startFrameLoop(r);
  const root = createRoot(r, {});
  flushSync(() => {
    root.render(wrap(shot));
  });

  for (let i = 0; i < 25 && r.tick(); i++) await sleep(16);

  const id = findWindowId(WINDOW_TITLE);
  if (id == null) {
    console.error(`✗ ${name}: no niri window titled "${WINDOW_TITLE}"`);
    process.exit(1);
  }

  execFileSync("niri", ["msg", "action", "focus-window", "--id", String(id)]);
  execFileSync("niri", ["msg", "action", "move-window-to-floating"]);
  await sleep(250);

  const before = newestScreenshot();
  execFileSync(
    "niri",
    ["msg", "action", "screenshot-window", "--id", String(id), "-d", "true"],
    { encoding: "utf8" },
  );
  let after = before;
  for (let i = 0; i < 40; i++) {
    const c = newestScreenshot();
    if (c && c !== before) {
      after = c;
      break;
    }
    await sleep(50);
  }
  if (!after || after === before) {
    console.error(`✗ ${name}: no new screenshot appeared`);
    process.exit(1);
  }

  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const outDir = join(repoRoot, dirname(shot.file));
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `${shot.out}.png`);
  copyFileSync(after, out);
  console.log(`  ✓ ${shot.out}.png (${statSync(out).size} bytes)`);

  process.exit(0);
}

const arg = process.argv[2];
if (arg) {
  renderAndCapture(arg);
} else {
  console.error("usage: bun scripts/shot.tsx <shot-name>");
  console.error(`available shots: ${ALL_SHOTS.map((s) => s.name).join(", ")}`);
  process.exit(1);
}
