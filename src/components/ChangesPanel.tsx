import { useMemo } from "react";
import { T, useAdwaita } from "adwaita-gpuix";
import { type PublicInstance } from "@gpuix/react";
import type { ProjectRepo, RepoChange } from "../repos";
import { generateGraphData, graphLaneCount } from "../graph";
import { ListPanel } from "./VirtualListPanel";
import { ActivityDashboard } from "./ActivityDashboard";
import { EmptyState } from "./EmptyState";
import { ChangeRow } from "./ChangeRow";

export function ChangesPanel({
  selected,
  changes,
  error,
  rightListRef,
}: {
  selected: ProjectRepo | null;
  changes: RepoChange[];
  error: string | null;
  rightListRef?: { current: PublicInstance | null };
}) {
  const { colors } = useAdwaita();
  const graphData = useMemo(
    () =>
      generateGraphData(
        changes.map((c) => ({ id: c.commit_id, parents: c.parents })),
      ),
    [changes],
  );
  const laneCount = useMemo(() => graphLaneCount(graphData), [graphData]);

  if (error) return <EmptyState message={error} icon="warning" />;
  if (!selected) return <EmptyState message="Select a project" icon="folder" />;
  if (changes.length === 0)
    return <EmptyState message="No changes" icon="gitBranch" />;

  return (
    <ListPanel
      listRef={rightListRef ?? { current: null }}
      estimatedItemHeight={60}
    >
      <ActivityDashboard changes={changes} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <T size="title4" weight={700} color={colors.fg}>
          Changes
        </T>
      </div>
      {changes.slice(0, 25).map((c, i) => (
        <ChangeRow
          key={c.commit_id}
          c={c}
          node={graphData[i]}
          prev={i > 0 ? graphData[i - 1] : null}
          laneCount={laneCount}
          colors={colors}
        />
      ))}
    </ListPanel>
  );
}
