import { Icon, T, useAdwaita } from "adwaita-gpuix";
import type { IconName } from "adwaita-gpuix";

export function EmptyState({
  message,
  icon = "inbox",
}: {
  message: string;
  icon?: IconName;
}) {
  const t = useAdwaita();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexGrow: 1,
        minHeight: 0,
        gap: 8,
      }}
    >
      <Icon name={icon} size={28} color={t.colors.dim_fg} />
      <T size="body" color={t.colors.dim_fg}>
        {message}
      </T>
    </div>
  );
}

import type { ComponentShot } from "../../scripts/shot";
import { Shot } from "./Shot";

export const EmptyStateShot: ComponentShot = {
  name: "EmptyState",
  el: (
    <Shot width={380}>
      <EmptyState message="No repos found in ~/Projects" icon="folder" />
    </Shot>
  ),
};
