import { Icon, T, useAdwaita } from "adwaita-gpuix";
import { humanizeAgo, tsToMs, type RepoChange } from "../repos";
import type { GraphNode } from "../graph";
import { MONO, SANS } from "../theme";
import { GraphGutter } from "./GraphGutter";
import { ListRow } from "./ListRow";
import { RowShell } from "./RowShell";
import { BookmarkPill } from "./BookmarkPill";

const ROW_HEIGHT = 24;

export function ChangeRow({
  c,
  node,
  prev,
  laneCount,
  colors,
}: {
  c: RepoChange;
  node: GraphNode;
  prev: GraphNode | null;
  laneCount: number;
  colors: ReturnType<typeof useAdwaita>["colors"];
}) {
  const descColor =
    c.description === "(no description)" ? colors.dim_fg : colors.fg;
  return (
    <ListRow height={ROW_HEIGHT}>
      <RowShell>
        <GraphGutter
          node={node}
          prev={prev}
          laneCount={laneCount}
          selected={false}
        />
        <div
          style={{
            width: 72,
            flexShrink: 0,
            fontFamily: MONO,
            fontSize: 11,
            color: colors.dim_fg,
            whiteSpace: "nowrap",
          }}
        >
          {c.change_id.slice(0, 8)}
        </div>
        {c.bookmarks.slice(0, 3).map((b) => (
          <BookmarkPill key={c.commit_id + "-" + b} name={b} />
        ))}
        <T
          size="caption"
          color={descColor}
          style={{
            flexGrow: 1,
            flexShrink: 100,
            minWidth: 0,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {c.description}
        </T>
        {c.has_conflicts && (
          <Icon name="warning" size={12} color={colors.destructive} />
        )}
        <div
          style={{
            width: 80,
            flexShrink: 0,
            textAlign: "right",
            fontFamily: SANS,
            fontSize: 10,
            color: colors.dim_fg,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {humanizeAgo(tsToMs(c.timestamp))}
        </div>
      </RowShell>
    </ListRow>
  );
}
