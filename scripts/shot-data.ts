import {
  filterProjects,
  type ProjectMeta,
  type ProjectRepo,
  type RepoChange,
} from "../src/repos";
import { SIDEBAR, statusHints } from "../src/shortcuts";
import {
  generateGraphData,
  graphLaneCount,
  type GraphNode,
} from "../src/graph";

const now = Date.now();
const MIN = 60_000;
const DAY = 86_400_000;

export const PROJECTS: ProjectRepo[] = [
  {
    path: "/home/knoopx/Projects/gpuix-apps",
    name: "gpuix-apps",
    relPath: "gpuix-apps",
    lastTouchedMs: now - 2 * 3600 * 1000,
  },
  {
    path: "/home/knoopx/Projects/gpuix-apps/projects",
    name: "projects",
    relPath: "gpuix-apps/projects",
    lastTouchedMs: now - 15 * MIN,
  },
  {
    path: "/home/knoopx/Projects/knoopx",
    name: "knoopx",
    relPath: "knoopx",
    lastTouchedMs: now - 3 * DAY,
  },
  {
    path: "/home/knoopx/Projects/mockups",
    name: "mockups",
    relPath: "mockups",
    lastTouchedMs: null,
  },
  {
    path: "/home/knoopx/Projects/takumi",
    name: "takumi",
    relPath: "takumi",
    lastTouchedMs: now - 5 * DAY,
  },
  {
    path: "/home/knoopx/Projects/pipelines",
    name: "pipelines",
    relPath: "pipelines",
    lastTouchedMs: now - 2 * DAY,
  },
];

export const META: Record<string, ProjectMeta> = {
  "/home/knoopx/Projects/gpuix-apps": {
    description: "GPUix desktop apps",
    license: "MIT",
    language: "TypeScript",
  },
  "/home/knoopx/Projects/gpuix-apps/projects": {
    description:
      "Track projects in ~/Projects: flat split view, last-touched order + change status",
    license: null,
    language: "TypeScript",
  },
  "/home/knoopx/Projects/knoopx": {
    description: "Dotfiles and configuration",
    license: null,
    language: "Nix",
  },
  "/home/knoopx/Projects/mockups": {
    description: "UI mockups and prototypes",
    license: null,
    language: "Rust",
  },
  "/home/knoopx/Projects/takumi": {
    description: "Static rasterizer",
    license: "MIT",
    language: "Go",
  },
  "/home/knoopx/Projects/pipelines": {
    description: "Data pipelines",
    license: "MIT",
    language: "Python",
  },
};

export const SPARKS: Record<string, number[]> = {
  "/home/knoopx/Projects/gpuix-apps": [1, 2, 4, 3, 6, 2, 8, 5, 3, 9, 4, 7],
  "/home/knoopx/Projects/gpuix-apps/projects": [
    0, 1, 1, 3, 2, 4, 2, 5, 3, 6, 2, 4,
  ],
  "/home/knoopx/Projects/knoopx": [2, 0, 1, 0, 3, 1, 0, 2, 1, 0, 1, 0],
  "/home/knoopx/Projects/mockups": [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
  "/home/knoopx/Projects/takumi": [4, 3, 2, 2, 1, 1, 0, 0, 1, 0, 0, 0],
  "/home/knoopx/Projects/pipelines": [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1],
};

export function visibleWithFilter(
  projects: ProjectRepo[],
  filter: string,
  languages: string[],
): ProjectRepo[] {
  return filterProjects(projects, filter, languages, META);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex8 = (n: number): string => (n >>> 0).toString(16).padStart(8, "0");

const CHANGES_SEED = 0x5eed2026;
const CHANGES_COUNT = 120;
const CHANGES_SPAN_DAYS = 170;

const pickAuthor = (rand: () => number): string => {
  const r = rand();
  return r < 0.72 ? "knoopx" : r < 0.88 ? "ada" : "victor";
};

const DESCRIPTIONS = [
  "add jj repo scanner and metadata cache",
  "wire op-head polling with a debounce",
  "fix sparkline baseline on empty weeks",
  "virtual list panel for the change log",
  "activity dashboard stats row",
  "contribution heatmap for the right pane",
  "branching gutter with lane layout",
  "humanize change timestamps",
  "bookmark pills on change rows",
  "conflict markers from jj status",
  "keyboard shortcuts for select, page, refresh",
  "status bar with configurable command hints",
  "adwaita theme tokens and font scale",
  "contrast pass on the nightsky theme",
  "move the shot harness to niri capture",
  "skip node_modules when scanning repos",
  "cache repo metadata in memory",
  "sort the sidebar by last touched",
  "language filter pills for the sidebar",
  "filter input with a suggestion dropdown",
  "per-repo commit sparklines",
  "poll repo state on an interval",
  "refresh changes on demand",
  "virtualize the changes feed",
  "row shell with fixed column widths",
  "mono font for change ids",
  "ellipsize long descriptions",
  "right-align the timestamp column",
  "empty state for missing repos",
  "warning icon for conflicting changes",
  "merge the activity dashboard into the right pane",
  "merge the gutter lane layout",
  "merge the niri capture harness",
  "merge the sidebar language filter",
  "merge changes feed virtualization",
  "tweak gutter curve control points",
  "trim the heatmap to 26 weeks",
  "dedupe bookmark pills per row",
  "clamp sparkline peak to the viewport",
  "reuse the list panel for both panes",
];

const isoAt = (ms: number): string => new Date(ms).toISOString().slice(0, 19);

const changeTimestamps = (rand: () => number): number[] => {
  const nowMs = Date.now();
  const out: number[] = [];
  let t = nowMs - 40 * 60_000;
  while (out.length < CHANGES_COUNT) {
    out.push(t);
    const r = rand();
    const gap =
      r < 0.05
        ? (3 + rand() * 8) * DAY
        : r < 0.3
          ? (2 + rand() * 22) * 3600_000
          : (0.5 + rand() * 1.8) * DAY;
    t -= Math.max(gap, 45 * 60_000);
  }
  return out;
};

export const CHANGES: RepoChange[] = (() => {
  const rand = mulberry32(CHANGES_SEED);
  const ts = changeTimestamps(rand);
  let tsIdx = CHANGES_COUNT - 1;
  const nextTs = () => ts[tsIdx--];

  let lastDesc = -1;
  const pickDesc = (): string => {
    let i = Math.floor(rand() * DESCRIPTIONS.length);
    if (i === lastDesc) i = (i + 1) % DESCRIPTIONS.length;
    lastDesc = i;
    return DESCRIPTIONS[i];
  };

  const out: RepoChange[] = [];
  let prevMain: string | null = null;
  const pushChange = (
    parents: string[],
    desc?: string,
    rollConflicts = false,
  ): string => {
    const id = hex8(Math.floor(rand() * 0x100000000));
    out.push({
      change_id: hex8(Math.floor(rand() * 0x100000000)),
      commit_id: id,
      description: desc ?? pickDesc(),
      author: pickAuthor(rand),
      timestamp: isoAt(nextTs()),
      has_conflicts: rollConflicts ? rand() < 0.2 : false,
      bookmarks: [],
      parents,
    });
    return id;
  };
  let mainSinceEpisode = 0;
  let episode = 0;
  const EPISODES = 8;
  const every = Math.floor((CHANGES_COUNT - 40) / EPISODES);
  const pushEpisode = (): void => {
    const k = 2 + Math.floor(rand() * 3);
    let sidePrev: string | null = null;
    for (let s = 0; s < k; s++) {
      sidePrev = pushChange(sidePrev == null ? [prevMain ?? ""] : [sidePrev]);
    }
    prevMain = pushChange(
      prevMain == null ? [sidePrev!] : [prevMain, sidePrev!],
      DESCRIPTIONS[30 + (episode % 5)],
      true,
    );
    mainSinceEpisode = 0;
    episode++;
  };

  while (out.length < CHANGES_COUNT) {
    const room = CHANGES_COUNT - out.length;
    if (episode < EPISODES && mainSinceEpisode >= every && room >= 7) {
      pushEpisode();
    } else {
      prevMain = pushChange(prevMain == null ? [] : [prevMain]);
      mainSinceEpisode++;
    }
  }

  out[out.length - 1].bookmarks = ["main"];
  out[Math.floor(out.length * 0.55)].bookmarks = ["release-1.0"];
  return out.reverse();
})();

export const GRAPH_NODES: GraphNode[] = generateGraphData(
  CHANGES.map((c) => ({ id: c.commit_id, parents: c.parents })),
);

export const GRAPH_LANE_COUNT = graphLaneCount(GRAPH_NODES);

export const STATUS_HINTS: Array<{ keys: string[]; desc: string }> =
  statusHints(SIDEBAR);

export const STATUS_HINTS_WITH_COMMANDS: Array<{
  keys: string[];
  desc: string;
}> = [...STATUS_HINTS];
