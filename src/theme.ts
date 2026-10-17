import { buildTheme, hexToRgba, type AdwaitaTheme } from "adwaita-gpuix";

export const adwaitaTheme: AdwaitaTheme = buildTheme("nightsky");

export const MONO = adwaitaTheme.typography.fontFamilyMono;
export const SANS = adwaitaTheme.typography.fontFamily;

export function selectionBg(t: AdwaitaTheme): string {
  return t.colors.accentTint;
}

export function rowHoverBg(t: AdwaitaTheme): string {
  return hexToRgba(t.colors.fg, 0.04);
}
