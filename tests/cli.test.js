import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const execFileAsync = promisify(execFile);

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const CLI_PATH = path.join(PROJECT_ROOT, "bin", "dev-workflow.js");
const SKILL_DIR = ".claude/skills/dev-workflow";
const PKG = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, "package.json"), "utf-8"));

let tmpDirs = [];
let fakeHome;

function runCli(args = [], options = {}) {
  return execFileAsync(process.execPath, [CLI_PATH, ...args], {
    timeout: 10_000,
    env: { ...process.env, HOME: fakeHome },
    ...options,
  });
}

async function makeTmpDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-cli-"));
  tmpDirs.push(dir);
  return dir;
}

beforeEach(async () => {
  fakeHome = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-home-"));
  tmpDirs.push(fakeHome);
});

afterEach(async () => {
  for (const dir of tmpDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

describe("CLI: dev-workflow", () => {
  it("--version prints the version number", async () => {
    const { stdout } = await runCli(["--version"]);
    expect(stdout.trim()).toContain(PKG.version);
  });

  it("--help prints usage information with available commands", async () => {
    const { stdout } = await runCli(["--help"]);
    expect(stdout).toContain("Usage");
    expect(stdout).toContain("init");
    expect(stdout).toContain("update");
    expect(stdout).toContain("status");
    expect(stdout).toContain("--local");
  });

  it("unknown command exits with error", async () => {
    await expect(runCli(["foobar"])).rejects.toThrow();
  });
});

describe("CLI: init", () => {
  it("installs to global dir by default", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init"], { cwd: tmpDir });

    const globalSkillDir = path.join(fakeHome, SKILL_DIR);
    const stat = await fs.stat(globalSkillDir);
    expect(stat.isDirectory()).toBe(true);

    const skillMd = path.join(globalSkillDir, "SKILL.md");
    const content = await fs.readFile(skillMd, "utf-8");
    expect(content.length).toBeGreaterThan(0);

    // Should NOT exist locally
    await expect(fs.access(path.join(tmpDir, SKILL_DIR))).rejects.toThrow();
  });

  it("installs to local dir with --local flag", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init", "--local"], { cwd: tmpDir });

    const localSkillDir = path.join(tmpDir, SKILL_DIR);
    const stat = await fs.stat(localSkillDir);
    expect(stat.isDirectory()).toBe(true);

    // Should NOT exist globally
    await expect(fs.access(path.join(fakeHome, SKILL_DIR))).rejects.toThrow();
  });
});

describe("CLI: update", () => {
  it("updates global when only global exists", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init"], { cwd: tmpDir });

    const skillMdPath = path.join(fakeHome, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "OLD_CONTENT");

    const { stdout } = await runCli(["update", "--from", PROJECT_ROOT], { cwd: tmpDir });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).not.toBe("OLD_CONTENT");
    expect(content.length).toBeGreaterThan(0);
    expect(stdout).toContain("updated");
    expect(stdout).toContain("global");
  });

  it("updates local when only local exists", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init", "--local"], { cwd: tmpDir });

    const skillMdPath = path.join(tmpDir, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "OLD_CONTENT");

    const { stdout } = await runCli(["update", "--from", PROJECT_ROOT], { cwd: tmpDir });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).not.toBe("OLD_CONTENT");
    expect(content.length).toBeGreaterThan(0);
    expect(stdout).toContain("updated");
    expect(stdout).toContain("local");
  });

  it("shows error when no installation exists", async () => {
    const tmpDir = await makeTmpDir();
    await expect(runCli(["update", "--from", PROJECT_ROOT], { cwd: tmpDir })).rejects.toThrow();
  });

  it("--from copies templates from the specified path, not the bundled package", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init"], { cwd: tmpDir });

    // Build a custom templates source with a unique marker
    const fromDir = await makeTmpDir();
    const templatesDir = path.join(fromDir, "templates");
    await fs.mkdir(path.join(templatesDir, "references"), { recursive: true });
    await fs.writeFile(path.join(templatesDir, "SKILL.md"), "CUSTOM_FROM_PATH");
    for (const f of [
      "codebase-analysis.md",
      "phase-1-spec.md",
      "phase-2-plan.md",
      "phase-3-implement.md",
      "phase-4-verify.md",
      "inline-execution.md",
      "error-handling.md",
      "abort-protocol.md",
    ]) {
      await fs.writeFile(path.join(templatesDir, "references", f), `# ${f}`);
    }

    const { stdout } = await runCli(["update", "--from", fromDir], { cwd: tmpDir });

    const content = await fs.readFile(
      path.join(fakeHome, SKILL_DIR, "SKILL.md"),
      "utf-8"
    );
    expect(content).toBe("CUSTOM_FROM_PATH");
    expect(stdout).toContain("updated");
    expect(stdout).toContain("global");
  });

  it("--from exits with non-zero when the path has no templates directory", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init"], { cwd: tmpDir });

    const emptyDir = await makeTmpDir();
    await expect(
      runCli(["update", "--from", emptyDir], { cwd: tmpDir })
    ).rejects.toThrow();
  });
});

describe("CLI: status", () => {
  it("shows 'none' when no installation exists", async () => {
    const tmpDir = await makeTmpDir();
    const { stdout } = await runCli(["status"], { cwd: tmpDir });
    expect(stdout).toContain("not installed");
  });

  it("shows global when only global exists", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init"], { cwd: tmpDir });

    const { stdout } = await runCli(["status"], { cwd: tmpDir });
    expect(stdout).toContain("global");
    expect(stdout).toContain("active");
  });

  it("shows local when only local exists", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init", "--local"], { cwd: tmpDir });

    const { stdout } = await runCli(["status"], { cwd: tmpDir });
    expect(stdout).toContain("local");
    expect(stdout).toContain("active");
  });

  it("shows both and marks local as active when both exist", async () => {
    const tmpDir = await makeTmpDir();
    await runCli(["init"], { cwd: tmpDir });
    await runCli(["init", "--local"], { cwd: tmpDir });

    const { stdout } = await runCli(["status"], { cwd: tmpDir });
    expect(stdout).toContain("local");
    expect(stdout).toContain("global");
    expect(stdout).toContain("precedence");
  });
});
