import type { ReactNode } from "react";
import { useAdwaita } from "adwaita-gpuix";
import { rowHoverBg, selectionBg } from "../theme";

export function ListRow({
  selected = false,
  onClick,
  children,
  height = 28,
  style = {},
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  height?: number;
  style?: Record<string, unknown>;
}) {
  const t = useAdwaita();
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        height,
        paddingLeft: 12,
        paddingRight: 12,
        width: "100%",
        backgroundColor: selected ? selectionBg(t) : "transparent",
        cursor: "pointer",
        hover: { backgroundColor: selected ? selectionBg(t) : rowHoverBg(t) },
        ...style,
      }}
    >
      {children}
    </div>
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";
import { RowShell } from "./RowShell";
import { T } from "adwaita-gpuix";
import { adwaitaTheme } from "../theme";

export const ListRowShot: ComponentShot = {
  name: "ListRow",
  el: (
    <Shot>
      <ListRow height={28} selected>
        <RowShell>
          <T size="caption" color={adwaitaTheme.colors.fg}>
            Row content
          </T>
        </RowShell>
      </ListRow>
    </Shot>
  ),
};
