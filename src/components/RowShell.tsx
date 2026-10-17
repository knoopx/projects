import type { ReactNode } from "react";

export function RowShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0,
        flexGrow: 1,
      }}
    >
      {children}
    </div>
  );
}
