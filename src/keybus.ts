export interface WindowKeyEvent {
  key: string;
  keyChar?: string;
  isHeld?: boolean;
  modifiers?: { cmd?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean };
}

export type KeyHandler = (event: WindowKeyEvent) => boolean | void;

export const keyHandler: { current: KeyHandler | null } = { current: null };

const KEY_ALIASES: Record<string, string> = {
  prior: "pageup",
  page_up: "pageup",
  pgup: "pageup",
  next: "pagedown",
  page_down: "pagedown",
  pgdn: "pagedown",

  begin: "home",
  start: "home",
};

export function keyOf(event: WindowKeyEvent): string {
  const k = (event.key ?? "").toLowerCase();
  if (k === " ") return "space";
  return KEY_ALIASES[k] ?? k;
}
