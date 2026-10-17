import { spawnSync } from "node:child_process";
import { bindingMatches, type Kbd, type KeyMods } from "./shortcuts";

export interface Command {
  id: string;

  keys: Kbd[];

  cmd: string;

  args: string[];
}

export function findCommandBinding(
  commands: Command[],
  key: string,
  mods: KeyMods = {},
): Command | null {
  let best: Command | null = null;
  let bestScore = -1;
  for (const c of commands) {
    for (const b of c.keys) {
      if (!bindingMatches(b, key, mods)) continue;
      const score = (Array.isArray(b) ? b : [b]).length - 1;
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
  }
  return best;
}

export function runCommand(cmd: Command, path: string): boolean {
  const args = cmd.args.map((a) => a.replace(/\{path\}/g, path));
  const r = spawnSync(cmd.cmd, args, { stdio: "ignore" });
  return r.status === 0;
}
