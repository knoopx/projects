import type { ReactNode } from "react";
import { Icon, T, useAdwaita } from "adwaita-gpuix";
import type { RepoChange } from "../repos";
import { buildActivityModel, type ActivityModel } from "../activity";
import { ContributionHeatmap } from "./ContributionHeatmap";
import { StatCell } from "./StatCell";

export function ActivityDashboard({ changes }: { changes: RepoChange[] }) {
  const t = useAdwaita();
  const { colors } = t;
  const model: ActivityModel = buildActivityModel(changes);
  const { weeks, dayLabels, monthly, stats } = model;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderColor: colors.border,
          width: "100%",
        }}
      >
        <StatCell label="Commits">
          <T
            size="title3"
            color={colors.fg}
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <T size="caption">{String(stats.total)}</T>
            <Icon
              name="gitBranch"
              size={16}
              color={colors.accent}
              style={{ marginLeft: 8 }}
            />
          </T>
        </StatCell>

        <StatCell label="Contributors">
          <T
            size="title3"
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <T size="caption">{String(stats.contributors)}</T>
            <Icon
              name="user"
              size={15}
              color={colors.accent}
              style={{ marginLeft: 8 }}
            />
          </T>
        </StatCell>
        <StatCell label="Most active day">
          <T
            size="title3"
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {stats.mostActiveDay ? (
              <>
                <T size="caption" style={{ whiteSpace: "nowrap" }}>
                  {stats.mostActiveDay.label}
                </T>
                <Icon
                  name="clock"
                  size={15}
                  color={colors.accent}
                  style={{ marginLeft: 8 }}
                />
              </>
            ) : (
              "-"
            )}
          </T>
        </StatCell>
        <StatCell label="Best streak" bordered={false}>
          <T
            size="caption"
            color={colors.dim_fg}
            style={{
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            }}
          >
            <T
              size="caption"
              color={colors.fg}
              style={{ marginRight: 8 }}
            >{`${stats.longestStreak}d`}</T>

            <Icon name="sparkles" size={15} color={colors.accent} />
          </T>
        </StatCell>
      </div>

      <div
        style={{
          width: "100%",
          paddingLeft: 12,
          paddingRight: 12,
          paddingBottom: 12,
          paddingTop: 12,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
        <ContributionHeatmap weeks={weeks} dayLabels={dayLabels} />
      </div>
    </>
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";
import { CHANGES } from "../../scripts/shot-data";

export const ActivityDashboardShot: ComponentShot = {
  name: "ActivityDashboard",
  el: (
    <Shot width={760}>
      <ActivityDashboard changes={CHANGES} />
    </Shot>
  ),
};

export const ActivityDashboardEmptyShot: ComponentShot = {
  name: "ActivityDashboardEmpty",
  el: (
    <Shot width={760}>
      <ActivityDashboard changes={[]} />
    </Shot>
  ),
};
