import type { ReactNode } from "react";
import type { PublicInstance } from "@gpuix/react";

export function ListPanel({
  listRef,
  estimatedItemHeight = 24,
  children,
}: {
  listRef: { current: PublicInstance | null };
  estimatedItemHeight?: number;
  children: ReactNode;
}) {
  return (
    <virtual-list
      ref={listRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
      }}
      estimatedItemHeight={estimatedItemHeight}
    >
      {children}
    </virtual-list>
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";
import { PROJECTS } from "../../scripts/shot-data";
import { DemoRow } from "./DemoRow";

export const VirtualListPanelShot: ComponentShot = {
  name: "VirtualListPanel",
  el: (
    <Shot>
      <div style={{ width: 320 }}>
        <ListPanel listRef={{ current: null }} estimatedItemHeight={28}>
          {PROJECTS.map((p) => (
            <DemoRow key={p.path} name={p.name} />
          ))}
        </ListPanel>
      </div>
    </Shot>
  ),
};
