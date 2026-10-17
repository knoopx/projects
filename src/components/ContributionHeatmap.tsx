import { T, useAdwaita, hexToRgba } from "adwaita-gpuix";
import type { HeatWeek } from "../activity";

const GAP = 2;
const CELL = 12;
const DAY_LABEL_W = 16;

interface MonthRegion {
  label: string;
  n: number;
}

function monthRegions(weeks: HeatWeek[]): MonthRegion[] {
  const regions: MonthRegion[] = [];
  for (const w of weeks) {
    if (w.monthLabel) regions.push({ label: w.monthLabel, n: 0 });
    if (regions.length > 0) regions[regions.length - 1].n += 1;
  }
  return regions;
}

export function ContributionHeatmap({
  weeks,
  dayLabels,
}: {
  weeks: HeatWeek[];
  dayLabels: string[];
}) {
  const t = useAdwaita();
  const { colors } = t;

  const regions = monthRegions(weeks);

  const green = colors.success;
  const ramp = [
    hexToRgba(colors.fg, 0.06),
    hexToRgba(green, 0.35),
    hexToRgba(green, 0.6),
    hexToRgba(green, 0.85),
    green,
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        width: "100%",
      }}
    >
      {}
      {}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: GAP,
          width: "100%",
        }}
      >
        <div style={{ width: DAY_LABEL_W, flexShrink: 0 }} />
        {regions.map((r, i) => (
          <div key={i} style={{ flexGrow: r.n, flexBasis: 0, minWidth: 0 }}>
            {r.n >= 3 ? (
              <T
                size="caption"
                color={colors.dim_fg}
                style={{ whiteSpace: "nowrap" }}
              >
                {r.label}
              </T>
            ) : null}
          </div>
        ))}
      </div>

      {}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: GAP,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: GAP,
            width: DAY_LABEL_W,
            flexShrink: 0,
          }}
        >
          {dayLabels.map((l, i) => (
            <div
              key={i}
              style={{
                height: CELL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T size="caption" color={colors.dim_fg} style={{ fontSize: 9 }}>
                {l}
              </T>
            </div>
          ))}
        </div>
        {weeks.map((w, wi) => (
          <div
            key={wi}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: GAP,
              flexGrow: 1,
              flexBasis: 0,
              minWidth: 0,
            }}
          >
            {w.cells.map((c, ci) => (
              <div
                key={ci}
                style={{
                  height: CELL,
                  borderRadius: 2,
                  backgroundColor: ramp[c.level],
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";
import { buildActivityModel } from "../activity";
import { CHANGES } from "../../scripts/shot-data";

const MODEL = buildActivityModel(CHANGES);

export const ContributionHeatmapShot: ComponentShot = {
  name: "ContributionHeatmap",
  el: (
    <Shot width={760}>
      <ContributionHeatmap weeks={MODEL.weeks} dayLabels={MODEL.dayLabels} />
    </Shot>
  ),
};
