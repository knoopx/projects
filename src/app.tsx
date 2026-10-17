import { homedir } from "node:os";
import { useMemo, useRef, useState } from "react";
import { useGpuixRequired, type PublicInstance } from "@gpuix/react";
import type { Config } from "./config";
import { resolveRoots } from "./config";
import { filterProjects, type ProjectRepo } from "./repos";
import { SIDEBAR, statusHints } from "./shortcuts";
import {
  useChanges,
  useListNavigation,
  useOpHeadPolling,
  useProjectScan,
  useSelectionFallback,
  useSidebarKeyboard,
} from "./hooks";
import { Screen } from "./screens/Screen";

export function App({ config }: { config: Config }) {
  const renderer = useGpuixRequired();

  const roots = useMemo(() => resolveRoots(config), [config]);

  const {
    projects,
    selectedPath,
    setSelectedPath,
    sparklines,
    repoMeta,
    leftRef,
  } = useProjectScan(roots);

  const [filter, setFilter] = useState("");
  const [langSel, setLangSel] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const visibleProjects = useMemo(
    () => filterProjects(projects, filter, langSel, repoMeta),
    [projects, filter, langSel, repoMeta],
  );

  useSelectionFallback(visibleProjects, selectedPath, setSelectedPath);

  const selected = projects.find((p) => p.path === selectedPath) ?? null;

  const { changes, error, refresh } = useChanges(selected);

  useOpHeadPolling(selected, refresh);

  const selectedRef = useRef<ProjectRepo | null>(null);
  selectedRef.current = selected;
  const dropdownVisibleRef = useRef(false);
  dropdownVisibleRef.current = dropdownVisible;

  const { moveSel, pageSel } = useListNavigation({
    visibleProjects,
    selectedPath,
    setSelectedPath,
    listRef: leftRef,
    renderer,
  });

  useSidebarKeyboard({
    config,
    selectedRef,
    dropdownVisibleRef,
    visibleProjects,
    setSelectedPath,
    moveSel,
    pageSel,
    refresh,
  });

  const rightRef = useRef<PublicInstance | null>(null);

  const home = homedir();
  const shortRoot = roots
    .map((p) => (p.startsWith(home + "/") ? `~${p.slice(home.length)}` : p))
    .join(", ");

  return (
    <Screen
      projects={projects}
      visibleProjects={visibleProjects}
      filter={filter}
      languages={langSel}
      selectedPath={selectedPath}
      sparklines={sparklines}
      repoMeta={repoMeta}
      changes={changes}
      error={error}
      hints={statusHints(
        SIDEBAR,
        config.commands.map((c) => ({ keys: c.keys.flat(), desc: c.id })),
      )}
      shortRoot={shortRoot}
      onFilterChange={setFilter}
      onLanguagesChange={setLangSel}
      onSelect={(repo) => {
        setSelectedPath(repo.path);
      }}
      dropdownOpen={dropdownOpen}
      onDropdownOpenChange={setDropdownOpen}
      onDropdownVisibleChange={setDropdownVisible}
      leftListRef={leftRef}
      rightListRef={rightRef}
    />
  );
}
