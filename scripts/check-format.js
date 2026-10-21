import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const isWrite = args.includes("--write");
const isAll = args.includes("--all");

const SUPPORTED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".yaml",
  ".yml",
]);

function getBaseRef() {
  if (process.env.GITHUB_BASE_REF) {
    return `origin/${process.env.GITHUB_BASE_REF}`;
  }
  return "origin/main";
}

function isFormattedFile(filePath) {
  if (!filePath || !existsSync(filePath)) return false;
  const ext = filePath.slice(filePath.lastIndexOf("."));
  return SUPPORTED_EXTENSIONS.has(ext);
}

function getChangedFiles() {
  try {
    const res = spawnSync(
      "git",
      ["diff", "--name-only", "--diff-filter=d", getBaseRef()],
      {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    if (res.status !== 0 || !res.stdout) return [];
    return res.stdout
      .split("\n")
      .map((f) => f.trim())
      .filter(isFormattedFile);
  } catch {
    return [];
  }
}

const targetFiles = isAll ? ["."] : getChangedFiles();

if (!isAll && targetFiles.length === 0) {
  console.log("No supported changed files to check for formatting.");
  process.exit(0);
}

const prettierArgs = [isWrite ? "--write" : "--check", ...targetFiles];
const prettierBin = resolve(
  import.meta.dirname,
  "../node_modules/.bin/prettier",
);
const run = spawnSync(process.execPath, [prettierBin, ...prettierArgs], {
  stdio: "inherit",
});

process.exit(run.status ?? 0);
