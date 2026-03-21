import { describe, it, expect, afterEach } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const CLI_PATH = path.join(PROJECT_ROOT, "bin", "dev-workflow.js");
const SKILL_DIR = ".claude/skills/dev-workflow";

function runCli(args = [], options = {}) {
  return execFileAsync(process.execPath, [CLI_PATH, ...args], {
    timeout: 10_000,
    ...options,
  });
}

let tmpDirs = [];

async function makeTmpDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-cli-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of tmpDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

describe("CLI: dev-workflow", () => {
  it("--version prints the version number", async () => {
    const { stdout } = await runCli(["--version"]);
    expect(stdout.trim()).toContain("1.0.0");
  });

  it("--help prints usage information with available commands", async () => {
    const { stdout } = await runCli(["--help"]);
    expect(stdout).toContain("Usage");
    expect(stdout).toContain("init");
    expect(stdout).toContain("update");
  });

  it("init command creates .claude/skills/dev-workflow/ in cwd", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init"], { cwd: tmpDir });

    const skillDir = path.join(tmpDir, SKILL_DIR);
    const stat = await fs.stat(skillDir);
    expect(stat.isDirectory()).toBe(true);

    const skillMd = path.join(skillDir, "SKILL.md");
    const content = await fs.readFile(skillMd, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("update command creates files in cwd", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["update"], { cwd: tmpDir });

    const skillDir = path.join(tmpDir, SKILL_DIR);
    const stat = await fs.stat(skillDir);
    expect(stat.isDirectory()).toBe(true);

    const skillMd = path.join(skillDir, "SKILL.md");
    const content = await fs.readFile(skillMd, "utf-8");
    expect(content.length).toBeGreaterThan(0);
  });
});
