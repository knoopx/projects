import { Icon, T, useAdwaita } from "adwaita-gpuix";
import { LANGUAGE_COLORS } from "../repos";

export function LanguagePill({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  const t = useAdwaita();
  const { colors } = t;
  return (
    <div
      onClick={onRemove}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        height: 20,
        paddingLeft: 5,
        paddingRight: 4,
        borderRadius: 10,
        backgroundColor: colors.button_bg,
        borderWidth: 1,
        borderColor: colors.border,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: LANGUAGE_COLORS[name] ?? colors.dim_fg,
          pointerEvents: "none",
        }}
      />
      <T
        size="caption"
        color={colors.fg}
        style={{ whiteSpace: "nowrap", pointerEvents: "none" }}
      >
        {name}
      </T>
      <Icon
        name="close"
        size={10}
        color={colors.dim_fg}
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
