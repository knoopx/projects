import { ProjectsSidebar } from "./ProjectsSidebar";
import { adwaitaTheme } from "../theme";
import {
  META,
  PROJECTS,
  SPARKS,
  visibleWithFilter,
} from "../../scripts/shot-data";

function SidebarCanvas({
  visible,
  filter = "",
  languages = [],
  selectedPath,
  projects = PROJECTS,
  open = false,
}: {
  visible: typeof PROJECTS;
  filter?: string;
  languages?: string[];
  selectedPath: string | null;
  projects?: typeof PROJECTS;
  open?: boolean;
}) {
  return (
    <div
      style={{
        width: 380,
        height: 720,
        display: "flex",
        flexDirection: "column",
        backgroundColor: adwaitaTheme.colors.window_bg,
      }}
    >
      <ProjectsSidebar
        projects={projects}
        visibleProjects={visible}
        filter={filter}
        onFilterChange={() => {}}
        languages={languages}
        onLanguagesChange={() => {}}
        selectedPath={selectedPath}
        onSelect={() => {}}
        sparklines={SPARKS}
        repoMeta={META}
        listRef={{ current: null }}
        shortRoot="~/Projects"
        open={open}
        onOpenChange={() => {}}
      />
    </div>
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";

const PILLS_VISIBLE = visibleWithFilter(PROJECTS, "", ["TypeScript", "Rust"]);

export const ProjectsSidebarShot: ComponentShot = {
  name: "ProjectsSidebar",
  el: (
    <Shot width={380}>
      <SidebarCanvas
        visible={visibleWithFilter(PROJECTS, "", [])}
        selectedPath={PROJECTS[0].path}
      />
    </Shot>
  ),
};

export const SidebarPillsShot: ComponentShot = {
  name: "SidebarPills",
  el: (
    <Shot width={380}>
      <SidebarCanvas
        languages={["TypeScript", "Rust"]}
        visible={PILLS_VISIBLE}
        selectedPath={PILLS_VISIBLE[0]?.path ?? null}
      />
    </Shot>
  ),
};

export const SidebarNoMatchShot: ComponentShot = {
  name: "SidebarNoMatch",
  el: (
    <Shot width={380}>
      <SidebarCanvas visible={[]} filter="zzz" selectedPath={null} />
    </Shot>
  ),
};

export const SidebarEmptyShot: ComponentShot = {
  name: "SidebarEmpty",
  el: (
    <Shot width={380}>
      <SidebarCanvas projects={[]} visible={[]} selectedPath={null} />
    </Shot>
  ),
};

export const SidebarDropdownShot: ComponentShot = {
  name: "SidebarDropdown",
  el: (
    <Shot width={380}>
      <SidebarCanvas
        open
        filter="py"
        visible={visibleWithFilter(PROJECTS, "", [])}
        selectedPath={visibleWithFilter(PROJECTS, "", [])[0]?.path ?? null}
      />
    </Shot>
  ),
};
