export type Kbd = string | string[];

export interface Shortcut {
  id: string;

  kbds: Kbd[];

  desc: string;

  hint?: boolean;
}

export interface KeyMods {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  cmd?: boolean;
}

const MODIFIER_IDS: Record<string, keyof KeyMods> = {
  ctrl: "ctrl",
  shift: "shift",
  alt: "alt",
  cmd: "cmd",
};

export function bindingMatches(
  binding: Kbd,
  key: string,
  mods: KeyMods,
): boolean {
  const codes = Array.isArray(binding) ? binding : [binding];
  const code = codes[codes.length - 1];
  if (code !== key) return false;
  for (let i = 0; i < codes.length - 1; i++) {
    const m = MODIFIER_IDS[codes[i]];
    if (m && !mods[m]) return false;
  }
  return true;
}

export function matchShortcut(
  set: Shortcut[],
  key: string,
  mods: KeyMods = {},
): Shortcut | null {
  let best: Shortcut | null = null;
  let bestScore = -1;
  for (const s of set) {
    for (const b of s.kbds) {
      if (!bindingMatches(b, key, mods)) continue;
      const score = (Array.isArray(b) ? b : [b]).length - 1;
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    }
  }
  return best;
}

function hints(set: Shortcut[]): Shortcut[] {
  return set.filter((s) => s.hint !== false);
}

const KBD_LABELS: Record<string, string> = {
  up: "↑",
  down: "↓",
  pageup: "pgup",
  pagedown: "pgdn",
};

function kbdLabel(code: string): string {
  return KBD_LABELS[code] ?? code;
}

export interface StatusHint {
  keys: string[];
  desc: string;
}

export function statusHints(
  set: Shortcut[],
  extra: StatusHint[] = [],
): StatusHint[] {
  const mapped: StatusHint[] = [
    ...hints(set).map((s) => ({
      keys: s.kbds.flat().map(kbdLabel),
      desc: s.desc,
    })),
    ...extra,
  ];
  const groups: StatusHint[] = [];
  for (const h of mapped) {
    const last = groups[groups.length - 1];
    if (last && last.desc === h.desc) last.keys.push(...h.keys);
    else groups.push({ keys: [...h.keys], desc: h.desc });
  }
  return groups;
}

export const SIDEBAR: Shortcut[] = [
  { id: "up", kbds: ["up"], desc: "select" },
  { id: "down", kbds: ["down"], desc: "select" },
  { id: "home", kbds: ["home"], desc: "select", hint: false },
  { id: "end", kbds: ["end"], desc: "select", hint: false },
  { id: "page-up", kbds: ["pageup"], desc: "page" },
  { id: "page-down", kbds: ["pagedown"], desc: "page" },
  { id: "refresh", kbds: [["ctrl", "r"]], desc: "refresh" },
];
