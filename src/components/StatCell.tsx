import type { ReactNode } from "react";
import { T, useAdwaita } from "adwaita-gpuix";

export function StatCell({
  label,
  bordered = true,
  gap,
  children,
}: {
  label: string;
  bordered?: boolean;
  gap?: number;
  children: ReactNode;
}) {
  const { colors } = useAdwaita();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 12,
        paddingRight: 12,
        ...(gap !== undefined ? { gap } : {}),
        ...(bordered
          ? { borderRightWidth: 1, borderColor: colors.border }
          : {}),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <T size="caption" color={colors.dim_fg}>
          {label}
        </T>
      </div>
      {children}
    </div>
  );
}
