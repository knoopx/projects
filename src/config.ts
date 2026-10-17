import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Command } from "./commands";

export interface Config {
  roots?: string[];
  commands: Command[];
}

const defaultConfig: Config = {
  commands: [],
};

export function loadConfig(): Config {
  const candidates = [join(process.cwd(), "config.json")];
  const home = homedir();
  if (home) candidates.push(join(home, ".config", "projects", "config.json"));

  for (const path of candidates) {
    let text: string;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    try {
      const parsed = JSON.parse(text) as Partial<Config>;
      return { ...defaultConfig, ...parsed };
    } catch {
      return { ...defaultConfig };
    }
  }
  return { ...defaultConfig };
}

export function resolveRoots(config: Config): string[] {
  const home = homedir();
  const expand = (raw: string): string => {
    let p = raw;
    if (p === "~") p = home;
    else if (p.startsWith("~/")) p = join(home, p.slice(2));
    return resolve(p);
  };
  const raws = (config.roots ?? []).filter(
    (r) => typeof r === "string" && r.trim().length > 0,
  );
  if (raws.length === 0) raws.push("~/Projects");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of raws) {
    const p = expand(raw.trim());
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}
