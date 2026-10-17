import type { ReactNode } from "react";

export function Shot({
  children,
  width = 528,
}: {
  children: ReactNode;
  width?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width }}>
      {children}
    </div>
  );
}
