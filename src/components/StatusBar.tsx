import { Kbd, KbdGroup, useAdwaita } from "adwaita-gpuix";

export function StatusBar({
  hints,
}: {
  hints?: Array<{ keys: Array<string | string[]>; desc: string }>;
}) {
  const t = useAdwaita();
  const { colors } = t;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 32,
        paddingLeft: 12,
        paddingRight: 12,
        backgroundColor: colors.headerbar_bg,
        borderTopWidth: 1,
        borderColor: colors.border,
        minWidth: 0,
      }}
    >
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "flex-end",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {hints && hints.length > 0 ? (
          <KbdGroup style={{ overflow: "hidden" }}>
            {hints.map((h) => (
              <div
                key={h.desc}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                {h.keys.map((k) => (
                  <Kbd key={String(k)}>{k}</Kbd>
                ))}
                <div style={{ color: colors.dim_fg, fontSize: 12 }}>
                  {h.desc}
                </div>
              </div>
            ))}
          </KbdGroup>
        ) : null}
      </div>
    </div>
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";
import { STATUS_HINTS } from "../../scripts/shot-data";

export const StatusBarShot: ComponentShot = {
  name: "StatusBar",
  el: (
    <Shot width={1280}>
      <StatusBar hints={STATUS_HINTS} />
    </Shot>
  ),
};
