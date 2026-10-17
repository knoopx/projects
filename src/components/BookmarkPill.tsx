import { Icon, T, useAdwaita } from "adwaita-gpuix";

export function BookmarkPill({ name }: { name: string }) {
  const t = useAdwaita();
  const { colors } = t;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        height: 16,
        paddingLeft: 6,
        paddingRight: 6,
        borderRadius: 8,
        backgroundColor: colors.headerbar_bg,
        borderWidth: 1,
        borderColor: colors.border,
        flexShrink: 0,
      }}
    >
      <Icon name="bookmark" size={10} color={colors.dim_fg} />
      <T size="caption" color={colors.fg} style={{ whiteSpace: "nowrap" }}>
        {name}
      </T>
    </div>
  );
}
