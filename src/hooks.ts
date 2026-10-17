import { useCallback, useEffect, useRef, useState } from "react";
import { readFileSync, statSync } from "node:fs";
import type { NativeRenderer } from "@gpuix/native/host";
import type { PublicInstance } from "@gpuix/react";
import { keyHandler, keyOf, type WindowKeyEvent } from "./keybus";
import { findCommandBinding, runCommand } from "./commands";
import type { Config } from "./config";
import { matchShortcut, SIDEBAR } from "./shortcuts";
import {
  lastTouched,
  loadChanges,
  loadSparkline,
  opHeadTargets,
  readRepoMeta,
  scanProjects,
  type ProjectMeta,
  type ProjectRepo,
  type RepoChange,
} from "./repos";
import { PROJECT_ROW_HEIGHT } from "./components/ProjectRow";

const POLL_MS = 1500;
const DEBOUNCE_MS = 300;
const TOUCH_CONCURRENCY = 4;

function useListFollow(
  listRef: { current: PublicInstance | null },
  renderer: NativeRenderer,
  rowHeight: number,
) {
  const scrollTarget = (
    anchor: number[],
    index: number,
  ): number | null => {
    const [item, off, vh] = anchor;
    const H = vh ?? 0;
    const T = item * rowHeight + (off ?? 0);
    const rowTop = index * rowHeight;
    const rowBottom = (index + 1) * rowHeight;
    if (rowTop >= T && rowBottom <= T + H) return null;
    return rowBottom > T + H ? rowBottom - H : rowTop;
  };

  const ensureVisible = useCallback(
    (index: number) => {
      const id = listRef.current?.id;
      if (id === undefined) return;
      const anchor = renderer.getListScrollTop?.(id);
      if (!anchor) return;
      const targetY = scrollTarget(anchor, index);
      if (targetY === null) return;
      const ti = Math.max(0, Math.floor(targetY / rowHeight));
      const toff = Math.max(0, targetY - ti * rowHeight);
      renderer.scrollToItem?.(id, ti, toff);
    },
    [renderer, listRef, rowHeight],
  );
  return ensureVisible;
}

function sortProjectsByLastTouched(projects: ProjectRepo[]): ProjectRepo[] {
  return [...projects].sort((a, b) => {
    if (a.lastTouchedMs === null && b.lastTouchedMs === null) return 0;
    if (a.lastTouchedMs === null) return 1;
    if (b.lastTouchedMs === null) return -1;
    return b.lastTouchedMs - a.lastTouchedMs;
  });
}

export function useProjectScan(roots: string[]) {
  const [projects, setProjects] = useState<ProjectRepo[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [repoMeta, setRepoMeta] = useState<Record<string, ProjectMeta>>({});

  const selectedPathRef = useRef(selectedPath);
  selectedPathRef.current = selectedPath;
  const projectsRef = useRef<ProjectRepo[]>(projects);
  projectsRef.current = projects;

  const leftRef = useRef<PublicInstance | null>(null);

  useEffect(() => {
    const found = scanProjects(roots);
    setProjects(found);
    setSelectedPath(found[0]?.path ?? null);

    void (async () => {
      let next = 0;
      const workers = Array.from(
        { length: Math.min(TOUCH_CONCURRENCY, found.length) },
        async () => {
          for (;;) {
            const i = next++;
            if (i >= found.length) break;
            const [last, spark] = await Promise.all([
              lastTouched(found[i].path),
              loadSparkline(found[i].path),
            ]);
            const meta = readRepoMeta(found[i].path);
            setProjects((prev) =>
              prev.map((p, j) => (j === i ? { ...p, lastTouchedMs: last } : p)),
            );
            setSparklines((prev) => ({ ...prev, [found[i].path]: spark }));
            setRepoMeta((prev) => ({ ...prev, [found[i].path]: meta }));
          }
        },
      );
      await Promise.all(workers);

      const selPath = selectedPathRef.current;
      const sorted = sortProjectsByLastTouched(projectsRef.current);
      setProjects(sorted);
      const idx = selPath ? sorted.findIndex((p) => p.path === selPath) : -1;
      setSelectedPath(idx >= 0 ? selPath : (sorted[0]?.path ?? null));
    })();
  }, [roots]);

  return {
    projects,
    selectedPath,
    setSelectedPath,
    sparklines,
    repoMeta,
    leftRef,
  };
}

export function useSelectionFallback(
  visibleProjects: ProjectRepo[],
  selectedPath: string | null,
  setSelectedPath: (path: string | null) => void,
) {
  useEffect(() => {
    if (visibleProjects.length === 0) return;
    if (selectedPath && visibleProjects.some((p) => p.path === selectedPath))
      return;
    const first = visibleProjects[0];
    setSelectedPath(first.path);
  }, [visibleProjects, selectedPath]);
}

export function useChanges(repo: ProjectRepo | null) {
  const [changes, setChanges] = useState<RepoChange[]>([]);
  const [changesLoading, setChangesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (r: ProjectRepo) => {
    setChangesLoading(true);
    setError(null);
    try {
      setChanges(await loadChanges(r.path, "ancestors(@) ~ root()"));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setChanges([]);
    } finally {
      setChangesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (repo) void refresh(repo);
    else setChanges([]);
  }, [repo, refresh]);

  return { changes, changesLoading, error, refresh };
}

export function useOpHeadPolling(
  repo: ProjectRepo | null,
  refresh: (repo: ProjectRepo) => void,
) {
  const repoRef = useRef(repo);
  repoRef.current = repo;

  useEffect(() => {
    if (!repo) return;
    const target = opHeadTargets(repo.path);
    if (!target) return;
    let lastSeen: string | number | null = null;
    let baseline = false;
    let stopped = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const sample = (): string | number | null => {
      try {
        try {
          return readFileSync(target, "utf8");
        } catch {
          return statSync(target).mtimeMs;
        }
      } catch {
        return null;
      }
    };
    const tick = () => {
      const v = sample();
      if (v === null) return;
      if (!baseline) {
        baseline = true;
        lastSeen = v;
        return;
      }
      if (v === lastSeen) return;
      lastSeen = v;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        if (!stopped && repoRef.current) void refresh(repoRef.current);
      }, DEBOUNCE_MS);
    };
    const interval = setInterval(tick, POLL_MS);
    tick();
    return () => {
      stopped = true;
      clearInterval(interval);
      if (debounce) clearTimeout(debounce);
    };
  }, [repo, refresh]);
}

export function useListNavigation({
  visibleProjects,
  selectedPath,
  setSelectedPath,
  listRef,
  renderer,
}: {
  visibleProjects: ProjectRepo[];
  selectedPath: string | null;
  setSelectedPath: (path: string | null) => void;
  listRef: { current: PublicInstance | null };
  renderer: NativeRenderer;
}) {
  const ensureVisible = useListFollow(listRef, renderer, PROJECT_ROW_HEIGHT);

  const stepSelectedIndex = useCallback(
    (step: number): { idx: number; ns: number } => {
      let idx = visibleProjects.findIndex((p) => p.path === selectedPath);
      if (idx < 0) idx = step > 0 ? -1 : visibleProjects.length;
      const ns = Math.max(0, Math.min(idx + step, visibleProjects.length - 1));
      return { idx, ns };
    },
    [visibleProjects, selectedPath],
  );

  const moveSel = useCallback(
    (dir: number) => {
      if (visibleProjects.length === 0) return;
      const { idx, ns } = stepSelectedIndex(dir);
      const p = visibleProjects[ns];
      if (!p || (idx >= 0 && ns === idx)) return;
      setSelectedPath(p.path);
    },
    [visibleProjects, selectedPath, stepSelectedIndex],
  );

  const pageSel = useCallback(
    (dir: number) => {
      if (visibleProjects.length === 0) return;

      const id = listRef.current?.id;
      const vh =
        id === undefined ? 0 : (renderer.getListScrollTop?.(id)?.[2] ?? 0);
      const page = Math.max(1, Math.floor(vh / PROJECT_ROW_HEIGHT));
      const { ns } = stepSelectedIndex(dir * page);
      const p = visibleProjects[ns];
      if (!p) return;
      setSelectedPath(p.path);
    },
    [visibleProjects, selectedPath, renderer, stepSelectedIndex],
  );

  useEffect(() => {
    if (selectedPath === null) return;
    const idx = visibleProjects.findIndex((p) => p.path === selectedPath);
    if (idx < 0) return;
    ensureVisible(idx);
  }, [selectedPath, visibleProjects, ensureVisible]);

  return { moveSel, pageSel };
}

export function useSidebarKeyboard({
  config,
  selectedRef,
  dropdownVisibleRef,
  visibleProjects,
  setSelectedPath,
  moveSel,
  pageSel,
  refresh,
}: {
  config: Config;
  selectedRef: { current: ProjectRepo | null };
  dropdownVisibleRef: { current: boolean };
  visibleProjects: ProjectRepo[];
  setSelectedPath: (path: string | null) => void;
  moveSel: (dir: number) => void;
  pageSel: (dir: number) => void;
  refresh: (repo: ProjectRepo) => void;
}) {
  useEffect(() => {
    const selectEdge = (i: number) => {
      const p = visibleProjects[i];
      if (p) setSelectedPath(p.path);
    };
    const actions: Record<string, () => void> = {
      up: () => moveSel(-1),
      down: () => moveSel(1),
      "page-up": () => pageSel(-1),
      "page-down": () => pageSel(1),
      home: () => selectEdge(0),
      end: () => selectEdge(visibleProjects.length - 1),
      refresh: () => {
        if (selectedRef.current) void refresh(selectedRef.current);
      },
    };

    keyHandler.current = (e: WindowKeyEvent) => {
      const key = keyOf(e);
      const mods = e.modifiers ?? {};

      const cmd = findCommandBinding(config.commands, key, mods);
      if (cmd) {
        const sel = selectedRef.current;
        if (sel) runCommand(cmd, sel.path);
        return;
      }

      if (dropdownVisibleRef.current) return;
      const m = matchShortcut(SIDEBAR, key, mods);
      const act = m ? actions[m.id] : undefined;
      if (act) act();
    };
    return () => {
      keyHandler.current = null;
    };
  }, [
    moveSel,
    pageSel,
    visibleProjects,
    refresh,
    config.commands,
    selectedRef,
    dropdownVisibleRef,
    setSelectedPath,
  ]);
}
