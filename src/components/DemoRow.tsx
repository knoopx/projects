import { T } from "adwaita-gpuix";
import { ListRow } from "./ListRow";
import { RowShell } from "./RowShell";

export function DemoRow({ name }: { name: string }) {
  return (
    <ListRow height={28}>
      <RowShell>
        <T size="caption">{name}</T>
      </RowShell>
    </ListRow>
  );
}
