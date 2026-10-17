import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const pExecFile = promisify(execFile);

const JJ = "jj";

export interface ProjectRepo {
  path: string;
  name: string;
  relPath: string;
  lastTouchedMs: number | null;
}

export interface RepoChange {
  change_id: string;
  commit_id: string;
  description: string;
  author: string;
  timestamp: string;
  has_conflicts: boolean;
  bookmarks: string[];
  parents: string[];
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".jj",
  "dist",
  "target",
  ".venv",
  "venv",
  "hf-cache",
  ".next",
  "build",
]);

const MAX_DEPTH = 4;

export function scanProjects(roots: string[]): ProjectRepo[] {
  const out: ProjectRepo[] = [];
  for (const root of roots) {
    const walk = (dir: string, depth: number) => {
      let entries: string[];
      try {
        entries = readdirSync(dir);
      } catch {
        return;
      }
      for (const entry of entries) {
        if (SKIP_DIRS.has(entry)) continue;
        const full = join(dir, entry);
        try {
          if (!existsSync(join(full, ".jj"))) continue;
        } catch {
          continue;
        }
        out.push({
          path: full,
          name: entry,
          relPath: relative(root, full) || entry,
          lastTouchedMs: null,
        });
        continue;
      }
      if (depth >= MAX_DEPTH) return;
      for (const entry of entries) {
        if (SKIP_DIRS.has(entry) || entry.startsWith(".")) continue;
        const full = join(dir, entry);
        try {
          if (!existsSync(full)) continue;
        } catch {
          continue;
        }
        walk(full, depth + 1);
      }
    };
    walk(root, 0);
  }

  const seen = new Set<string>();
  const deduped = out.filter((p) => {
    if (seen.has(p.path)) return false;
    seen.add(p.path);
    return true;
  });
  deduped.sort((a, b) => activityMtime(b.path) - activityMtime(a.path));
  return deduped;
}

function activityMtime(dir: string): number {
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
      .filter((e) => !e.name.startsWith("."))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    if (entries.length === 0) return statSync(dir).mtimeMs;
    return statSync(join(dir, entries[0])).mtimeMs;
  } catch {
    return 0;
  }
}

export function tsToMs(ts: string): number {
  const m = ts.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return 0;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    0,
  ).getTime();
}

export function humanizeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000) return "just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  if (d < 7 * 86_400_000) return `${Math.floor(d / 86_400_000)}d ago`;
  if (d < 35 * 86_400_000) return `${Math.floor(d / (7 * 86_400_000))}w ago`;
  return new Date(ms).toISOString().slice(0, 10);
}

export interface ProjectMeta {
  description: string | null;
  license: string | null;
  language: string | null;
}

export function filterProjects(
  projects: ProjectRepo[],
  filter: string,
  languages: string[],
  meta: Record<string, ProjectMeta>,
): ProjectRepo[] {
  const q = filter.trim().toLowerCase();
  const hasLangs = languages.length > 0;
  return projects.filter((p) => {
    if (
      q &&
      !(p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q))
    )
      return false;
    if (hasLangs) {
      const lang = meta[p.path]?.language ?? null;
      if (!lang || !languages.includes(lang)) return false;
    }
    return true;
  });
}

const LANG_EXT: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  rs: "Rust",
  py: "Python",
  go: "Go",
  nix: "Nix",
  jsx: "JavaScript",
  c: "C/C++",
  cpp: "C/C++",
  zig: "Zig",
  svelte: "Svelte",
  md: "Markdown",
};

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Rust: "#dea584",
  Python: "#3572A5",
  Go: "#00ADD8",
  Nix: "#5276af",
  "C/C++": "#599eff",
  Zig: "#ec915a",
  Svelte: "#ff3e00",
  Markdown: "#083fa1",
};

const META_FILE_LIMIT = 200;
const META_MAX_DEPTH = 4;

function readDescription(repoPath: string): string | null {
  let text: string;
  try {
    text = readFileSync(join(repoPath, "README.md"), "utf8");
  } catch {
    return null;
  }
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.length === 0) continue;
    const stripped = t.replace(/^#{1,6}\s*/, "").trim();
    return stripped.length > 0 ? stripped : null;
  }
  return null;
}

function licenseLabelFromName(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("mit")) return "MIT";
  if (n.includes("apache")) return "Apache-2.0";
  if (n.includes("lgpl")) return "LGPL";
  if (n.includes("gpl"))
    return n.includes("3") ? "GPL-3.0" : n.includes("2") ? "GPL-2.0" : "GPL";
  if (n.includes("bsd")) return "BSD";
  return null;
}

function licenseLabelFromText(text: string): string | null {
  const head = text.slice(0, 4000);
  if (/apache (software )?license/i.test(head)) return "Apache-2.0";
  if (/gnu general public license/i.test(head)) {
    if (/lesser/i.test(head)) return "LGPL";
    if (/version 3/i.test(head)) return "GPL-3.0";
    if (/version 2/i.test(head)) return "GPL-2.0";
    return "GPL";
  }
  if (/bsd license/i.test(head)) return "BSD";
  if (
    /\bmit license\b/i.test(head) ||
    /permission is hereby granted, free of charge/i.test(head)
  )
    return "MIT";
  return null;
}

function detectLicense(repoPath: string): string | null {
  for (const name of ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING"]) {
    const byName = licenseLabelFromName(name);
    if (byName) return byName;
    let text: string;
    try {
      text = readFileSync(join(repoPath, name), "utf8");
    } catch {
      continue;
    }
    const byText = licenseLabelFromText(text);
    if (byText) return byText;
  }
  return null;
}

function detectLanguage(repoPath: string): string | null {
  const counts = new Map<string, number>();
  let visited = 0;
  const walk = (dir: string, depth: number): void => {
    if (visited >= META_FILE_LIMIT || depth > META_MAX_DEPTH) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (visited >= META_FILE_LIMIT) return;
      if (entry.startsWith(".") || SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      visited += 1;
      const dot = entry.lastIndexOf(".");
      if (dot <= 0) continue;
      const lang = LANG_EXT[entry.slice(dot + 1).toLowerCase()];
      if (lang) counts.set(lang, (counts.get(lang) ?? 0) + 1);
    }
  };
  walk(repoPath, 0);
  let best: string | null = null;
  let bestCount = 0;
  for (const [lang, c] of counts) {
    if (c > bestCount) {
      best = lang;
      bestCount = c;
    }
  }
  return best;
}

export function readRepoMeta(repoPath: string): ProjectMeta {
  const language = detectLanguage(repoPath);
  return {
    description: readDescription(repoPath),
    license: detectLicense(repoPath),
    language,
  };
}

interface CliResult {
  stdout: string;
  stderr: string;
  code: number;
}

async function jjIn(args: string[], cwd: string): Promise<CliResult> {
  try {
    const { stdout, stderr } = await pExecFile(JJ, args, {
      cwd,
      maxBuffer: 16 * 1024 * 1024,
    });
    return { stdout, stderr, code: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? String(e),
      code: err.code ?? 1,
    };
  }
}

const CHANGES_TEMPLATE =
  'change_id ++ "\t" ++ commit_id ++ "\t" ++ author.name() ++ "\t" ++ ' +
  'author.timestamp().format("%Y-%m-%d %H:%M") ++ "\t" ++ ' +
  'description.first_line() ++ "\t" ++ ' +
  'if(conflict, "true", "false") ++ "\t" ++ ' +
  'parents.map(|p| p.commit_id()).join(",") ++ "\t" ++ ' +
  'bookmarks.map(|b| b.name()).join(", ") ++ "\n"';

function sanitizeDescription(raw: string): string {
  const ascii = raw.replace(/[^\u0000-\u007f]/g, "");
  const normalized = ascii.split(/\s+/).filter(Boolean).join(" ");
  return normalized.length > 0 ? normalized : "(no description)";
}

const DEFAULT_CHANGE_REVSET = "::";

export async function loadChanges(
  repoPath: string,
  revsetStr: string = DEFAULT_CHANGE_REVSET,
): Promise<RepoChange[]> {
  const revset =
    revsetStr.trim().length > 0 ? revsetStr : DEFAULT_CHANGE_REVSET;
  const res = await jjIn(
    [
      "log",
      "-r",
      revset,
      "--no-graph",
      "--color",
      "never",
      "-T",
      CHANGES_TEMPLATE,
    ],
    repoPath,
  );
  if (res.code !== 0) {
    throw new Error(res.stderr.trim() || `jj log failed in ${repoPath}`);
  }
  const changes: RepoChange[] = [];
  for (const line of res.stdout.split("\n")) {
    if (line.trim().length === 0) continue;
    const parts = line.split("\t");
    if (parts.length < 8) continue;
    const [
      change_id,
      commit_id,
      author,
      timestamp,
      desc,
      has_conflicts,
      parentsRaw,
      bookmarksRaw,
    ] = parts;
    changes.push({
      change_id,
      commit_id,
      description: sanitizeDescription(desc ?? ""),
      author: (author ?? "").trim(),
      timestamp: timestamp ?? "",
      has_conflicts: has_conflicts === "true",
      bookmarks: [
        ...new Set(
          (bookmarksRaw ?? "")
            .split(",")
            .map((b) => b.trim())
            .filter((b) => b.length > 0),
        ),
      ],
      parents: (parentsRaw ?? "")
        .split(",")
        .filter((p) => p.length > 0 && !/^0+$/.test(p)),
    });
  }
  return changes;
}

export async function lastTouched(repoPath: string): Promise<number | null> {
  const res = await jjIn(
    [
      "log",
      "-r",
      "@",
      "--no-graph",
      "--color",
      "never",
      "-T",
      'author.timestamp().format("%s")',
    ],
    repoPath,
  );
  if (res.code !== 0) return null;
  const v = res.stdout.trim();
  if (v.length === 0) return null;
  const seconds = Number(v);
  if (!Number.isFinite(seconds)) return null;
  return seconds * 1000;
}

export async function loadSparkline(
  repoPath: string,
  weeks = 12,
): Promise<number[]> {
  const out = new Array<number>(weeks).fill(0);

  const cutoff = new Date(Date.now() - weeks * 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const revset = `author_date(after:${cutoff})`;
  const res = await jjIn(
    [
      "log",
      "-r",
      revset,
      "--no-graph",
      "--color",
      "never",
      "-T",
      'author.timestamp().format("%s") ++ "\\n"',
    ],
    repoPath,
  );
  if (res.code !== 0) return out;

  const now = new Date();
  const thisWeekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  thisWeekStart.setDate(now.getDate() - now.getDay());
  for (const line of res.stdout.split("\n")) {
    const seconds = Number(line.trim());
    if (!Number.isFinite(seconds)) continue;
    const d = new Date(seconds * 1000);
    const wk = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    wk.setDate(d.getDate() - d.getDay());
    const weeksAgo = Math.round(
      (thisWeekStart.getTime() - wk.getTime()) / (7 * 86_400_000),
    );
    const idx = weeks - 1 - weeksAgo;
    if (idx >= 0 && idx < weeks) out[idx] += 1;
  }
  return out;
}

export function opHeadTargets(repoPath: string): string | null {
  const repo = join(repoPath, ".jj", "repo");
  const candidates = [
    join(repo, "op_head"),
    join(repo, "op_meta", "head"),
    join(repo, "op_heads", "heads"),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  return existsSync(repo) ? repo : null;
}
