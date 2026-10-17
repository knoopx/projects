import { Separator, useAdwaita } from "adwaita-gpuix";
import { type PublicInstance } from "@gpuix/react";
import type { ProjectMeta, ProjectRepo, RepoChange } from "../repos";
import { StatusBar } from "../components/StatusBar";
import { ProjectsSidebar } from "../components/ProjectsSidebar";
import { ChangesPanel } from "../components/ChangesPanel";

export function Screen({
  projects,
  visibleProjects,
  filter,
  languages,
  selectedPath,
  sparklines,
  repoMeta,
  changes,
  error,
  hints,
  shortRoot,
  onFilterChange,
  onLanguagesChange,
  onSelect,
  dropdownOpen,
  onDropdownOpenChange,
  onDropdownVisibleChange,
  leftListRef,
  rightListRef,
}: {
  projects: ProjectRepo[];
  visibleProjects: ProjectRepo[];
  filter: string;
  languages: string[];
  selectedPath: string | null;
  sparklines: Record<string, number[]>;
  repoMeta: Record<string, ProjectMeta>;
  changes: RepoChange[];
  error: string | null;
  hints?: Array<{ keys: Array<string | string[]>; desc: string }>;
  shortRoot: string;
  onFilterChange?: (value: string) => void;
  onLanguagesChange?: (languages: string[]) => void;
  onSelect?: (repo: ProjectRepo, visibleIndex: number) => void;
  dropdownOpen?: boolean;
  onDropdownOpenChange?: (open: boolean) => void;
  onDropdownVisibleChange?: (visible: boolean) => void;
  leftListRef?: { current: PublicInstance | null };
  rightListRef?: { current: PublicInstance | null };
}) {
  const { colors } = useAdwaita();
  const selected = projects.find((p) => p.path === selectedPath) ?? null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: colors.window_bg,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <ProjectsSidebar
          projects={projects}
          visibleProjects={visibleProjects}
          filter={filter}
          onFilterChange={onFilterChange ?? (() => {})}
          languages={languages}
          onLanguagesChange={onLanguagesChange ?? (() => {})}
          selectedPath={selectedPath}
          onSelect={onSelect ?? (() => {})}
          sparklines={sparklines}
          repoMeta={repoMeta}
          listRef={leftListRef ?? { current: null }}
          shortRoot={shortRoot}
          open={dropdownOpen}
          onOpenChange={onDropdownOpenChange}
          onVisibleChange={onDropdownVisibleChange}
        />
        <Separator orientation="vertical" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 70,
            flexBasis: 0,
            minWidth: 0,
          }}
        >
          <ChangesPanel
            selected={selected}
            changes={changes}
            error={error}
            rightListRef={rightListRef}
          />
        </div>
      </div>
      <StatusBar hints={hints} />
    </div>
  );
}

import type { ComponentProps } from "react";
import type { ComponentShot } from "../../scripts/shot";
import {
  CHANGES,
  META,
  PROJECTS,
  SPARKS,
  STATUS_HINTS_WITH_COMMANDS,
  visibleWithFilter,
} from "../../scripts/shot-data";
import { ScreenCanvas } from "./ScreenCanvas";

const SCREEN_PROPS = {
  sparklines: SPARKS,
  repoMeta: META,
  shortRoot: "~/Projects",
};

function screenShot(
  name: string,
  overrides: Partial<ComponentProps<typeof Screen>> = {},
): ComponentShot {
  return {
    name,
    el: (
      <ScreenCanvas>
        <Screen
          projects={PROJECTS}
          visibleProjects={visibleWithFilter(PROJECTS, "", [])}
          filter=""
          languages={[]}
          selectedPath={PROJECTS[1].path}
          changes={[]}
          error={null}
          hints={STATUS_HINTS_WITH_COMMANDS}
          {...SCREEN_PROPS}
          {...overrides}
        />
      </ScreenCanvas>
    ),
  };
}

export const AppScreenShot: ComponentShot = screenShot("Screen", {
  selectedPath: PROJECTS[0].path,
  changes: CHANGES,
});

export const AppScreenEmptyShot: ComponentShot = screenShot("ScreenEmpty", {
  projects: [],
  visibleProjects: [],
  selectedPath: null,
});

export const AppScreenNoChangesShot: ComponentShot =
  screenShot("ScreenNoChanges");

export const AppScreenErrorShot: ComponentShot = screenShot("ScreenError", {
  error: "jj: command not found (is jj installed?)",
});
