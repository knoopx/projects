import type { PublicInstance } from "@gpuix/react";
import type { ProjectMeta, ProjectRepo } from "../repos";
import { EmptyState } from "./EmptyState";
import { FilterCombobox, useLanguageSuggestions } from "./FilterCombobox";
import { ListPanel } from "./VirtualListPanel";
import { ProjectRow, PROJECT_ROW_HEIGHT } from "./ProjectRow";

export interface ProjectsSidebarProps {
  projects: ProjectRepo[];
  visibleProjects: ProjectRepo[];
  filter: string;
  onFilterChange: (value: string) => void;
  languages: string[];
  onLanguagesChange: (languages: string[]) => void;
  selectedPath: string | null;
  onSelect: (repo: ProjectRepo, visibleIndex: number) => void;
  sparklines: Record<string, number[]>;
  repoMeta: Record<string, ProjectMeta>;
  listRef: { current: PublicInstance | null };
  shortRoot: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onVisibleChange?: (visible: boolean) => void;
}

export function ProjectsSidebar({
  projects,
  visibleProjects,
  filter,
  onFilterChange,
  languages,
  onLanguagesChange,
  selectedPath,
  onSelect,
  sparklines,
  repoMeta,
  listRef,
  shortRoot,
  open,
  onOpenChange,
  onVisibleChange,
}: ProjectsSidebarProps) {
  const { allLanguages, suggestions } = useLanguageSuggestions(
    repoMeta,
    filter,
    open,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 30,
        flexBasis: 0,
        minWidth: 0,
      }}
    >
      {projects.length === 0 ? (
        <EmptyState message={`No repos found in ${shortRoot}`} icon="folder" />
      ) : (
        <>
          <FilterCombobox
            filter={filter}
            languages={languages}
            onFilterChange={onFilterChange}
            onLanguagesChange={onLanguagesChange}
            open={open}
            onOpenChange={onOpenChange}
            onVisibleChange={onVisibleChange}
            allLanguages={allLanguages}
            suggestions={suggestions}
          />
          <ListPanel listRef={listRef} estimatedItemHeight={PROJECT_ROW_HEIGHT}>
            {visibleProjects.map((p, i) => (
              <ProjectRow
                key={p.path}
                repo={p}
                selected={p.path === selectedPath}
                spark={sparklines[p.path] ?? null}
                meta={repoMeta[p.path]}
                onClick={() => onSelect(p, i)}
              />
            ))}
          </ListPanel>
        </>
      )}
    </div>
  );
}
