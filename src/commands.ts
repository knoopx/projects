import { spawn, spawnSync } from "node:child_process";
import { bindingMatches, type Kbd, type KeyMods } from "./shortcuts";

export interface Command {
  id: string;

  keys: Kbd[];

  cmd?: string;

  args?: string[];

  quit?: boolean;
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

function commandArgs(cmd: Command, path: string): string[] {
  return (cmd.args ?? []).map((a) => a.replace(/\{path\}/g, path));
}

export function runCommand(cmd: Command, path: string): boolean {
  if (!cmd.cmd) return false;
  const r = spawnSync(cmd.cmd, commandArgs(cmd, path), { stdio: "ignore" });
  return r.status === 0;
}

// Launch the command fire-and-forget: the child is detached (its own
// session) so it keeps running after this process exits. Does not wait
// for the child to finish. Returns false if the command has no executable.
export function runCommandDetached(cmd: Command, path: string): boolean {
  if (!cmd.cmd) return false;
  const child = spawn(cmd.cmd, commandArgs(cmd, path), {
    stdio: "ignore",
    detached: true,
  });
  child.unref();
  return true;
}
