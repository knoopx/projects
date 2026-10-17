import { Icon, T, useAdwaita } from "adwaita-gpuix";
import {
  humanizeAgo,
  LANGUAGE_COLORS,
  type ProjectMeta,
  type ProjectRepo,
} from "../repos";
import { ListRow } from "./ListRow";
import { RowShell } from "./RowShell";
import { Sparkline } from "./Sparkline";

export const PROJECT_ROW_HEIGHT = 64;

export function ProjectRow({
  repo,
  selected,
  spark,
  meta,
  onClick,
}: {
  repo: ProjectRepo;
  selected: boolean;
  spark: number[] | null;
  meta?: ProjectMeta;
  onClick: () => void;
}) {
  const t = useAdwaita();
  const { colors } = t;
  const language = meta?.language ?? null;
  const license = meta?.license ?? null;
  const metaSegments: string[] = [];
  if (language) metaSegments.push(language);
  if (license) metaSegments.push(license);
  metaSegments.push(
    repo.lastTouchedMs !== null
      ? `Updated ${humanizeAgo(repo.lastTouchedMs)}`
      : "never",
  );
  return (
    <ListRow
      selected={selected}
      height={PROJECT_ROW_HEIGHT}
      onClick={onClick}
      style={{ paddingTop: 6, paddingBottom: 6 }}
    >
      <RowShell>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            flexGrow: 1,
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            <Icon
              name="folder"
              size={15}
              color={selected ? colors.accent : colors.dim_fg}
            />
            <T
              size="body"
              weight={700}
              color={selected ? colors.accent : colors.fg}
              style={{
                lineHeight: 18,
                whiteSpace: "nowrap",
                minWidth: 0,
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {repo.name}
            </T>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            {language ? (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: LANGUAGE_COLORS[language] ?? colors.dim_fg,
                  flexShrink: 0,
                }}
              />
            ) : null}
            <T
              size="caption"
              color={colors.dim_fg}
              style={{
                fontSize: 11,
                lineHeight: 14,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {metaSegments.join(" · ")}
            </T>
          </div>
        </div>
        <Sparkline values={spark} color={colors.success} />
      </RowShell>
    </ListRow>
  );
}
