import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { init, update } from "../src/init.js";

const execFileAsync = promisify(execFile);

const SKILL_DIR = ".claude/skills/dev-workflow";
const EXPECTED_FILES = [
  "SKILL.md",
  "references/phase-1-spec.md",
  "references/phase-2-plan.md",
  "references/phase-3-implement.md",
  "references/phase-4-verify.md",
  "references/inline-execution.md",
  "references/error-handling.md",
  "references/abort-protocol.md",
];

let tmpDir;
let fakeHome;
let extraTmpDirs = [];

async function makeFakeTarball() {
  const pkgDir = await fs.mkdtemp(path.join(os.tmpdir(), "init-test-pkg-"));
  extraTmpDirs.push(pkgDir);
  const templatesDir = path.join(pkgDir, "package", "templates");
  await fs.mkdir(path.join(templatesDir, "references"), { recursive: true });
  await fs.writeFile(path.join(templatesDir, "SKILL.md"), "FROM_REGISTRY");
  for (const f of [
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
  const tarball = path.join(pkgDir, "pkg.tgz");
  await execFileAsync("tar", ["-czf", tarball, "-C", pkgDir, "package"]);
  return tarball;
}

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-test-"));
  fakeHome = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-home-"));
  vi.spyOn(os, "homedir").mockReturnValue(fakeHome);
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.rm(fakeHome, { recursive: true, force: true });
  for (const dir of extraTmpDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
  extraTmpDirs = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("init()", () => {
  it("creates .claude/skills/dev-workflow/ with all expected files when dir doesn't exist", async () => {
    await init(tmpDir);

    const skillDir = path.join(tmpDir, SKILL_DIR);
    for (const file of EXPECTED_FILES) {
      const filePath = path.join(skillDir, file);
      const stat = await fs.stat(filePath);
      expect(stat.isFile()).toBe(true);
      const content = await fs.readFile(filePath, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it("creates nested .claude/ directory structure if it doesn't exist", async () => {
    // Ensure .claude doesn't exist before init
    const claudeDir = path.join(tmpDir, ".claude");
    await expect(fs.access(claudeDir)).rejects.toThrow();

    await init(tmpDir);

    const stat = await fs.stat(path.join(tmpDir, SKILL_DIR));
    expect(stat.isDirectory()).toBe(true);
  });

  it("does NOT overwrite when skill already exists and confirm is false", async () => {
    await init(tmpDir);

    // Write a marker to SKILL.md so we can verify it wasn't overwritten
    const skillMdPath = path.join(tmpDir, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    await init(tmpDir, { confirm: false });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).toBe("ORIGINAL_CONTENT");
  });

  it("does NOT overwrite when skill already exists and confirm is not provided", async () => {
    await init(tmpDir);

    const skillMdPath = path.join(tmpDir, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    await init(tmpDir);

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).toBe("ORIGINAL_CONTENT");
  });

  it("DOES overwrite when skill already exists and confirm is true", async () => {
    await init(tmpDir);

    const skillMdPath = path.join(tmpDir, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    await init(tmpDir, { confirm: true });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).not.toBe("ORIGINAL_CONTENT");
    expect(content.length).toBeGreaterThan(0);
  });
});

describe("init() with scope", () => {
  it("installs to global dir when scope is 'global'", async () => {
    await init(tmpDir, { scope: "global" });

    const globalSkillDir = path.join(fakeHome, SKILL_DIR);
    for (const file of EXPECTED_FILES) {
      const filePath = path.join(globalSkillDir, file);
      const stat = await fs.stat(filePath);
      expect(stat.isFile()).toBe(true);
    }
    // Should NOT exist locally
    await expect(fs.access(path.join(tmpDir, SKILL_DIR))).rejects.toThrow();
  });

  it("installs to local dir when scope is 'local'", async () => {
    await init(tmpDir, { scope: "local" });

    const localSkillDir = path.join(tmpDir, SKILL_DIR);
    for (const file of EXPECTED_FILES) {
      const filePath = path.join(localSkillDir, file);
      const stat = await fs.stat(filePath);
      expect(stat.isFile()).toBe(true);
    }
    // Should NOT exist globally
    await expect(fs.access(path.join(fakeHome, SKILL_DIR))).rejects.toThrow();
  });

  it("does NOT overwrite global when it already exists and confirm is not true", async () => {
    await init(tmpDir, { scope: "global" });

    const skillMdPath = path.join(fakeHome, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    await init(tmpDir, { scope: "global" });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).toBe("ORIGINAL_CONTENT");
  });

  it("DOES overwrite global when confirm is true", async () => {
    await init(tmpDir, { scope: "global" });

    const skillMdPath = path.join(fakeHome, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    await init(tmpDir, { scope: "global", confirm: true });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).not.toBe("ORIGINAL_CONTENT");
  });
});

describe("update()", () => {
  it("creates files when skill doesn't exist (behaves like init)", async () => {
    await update(tmpDir);

    const skillDir = path.join(tmpDir, SKILL_DIR);
    for (const file of EXPECTED_FILES) {
      const filePath = path.join(skillDir, file);
      const stat = await fs.stat(filePath);
      expect(stat.isFile()).toBe(true);
      const content = await fs.readFile(filePath, "utf-8");
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it("overwrites existing files when skill already exists", async () => {
    await init(tmpDir);

    const skillMdPath = path.join(tmpDir, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    await update(tmpDir);

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).not.toBe("ORIGINAL_CONTENT");
    expect(content.length).toBeGreaterThan(0);
  });
});

describe("update() with scope", () => {
  it("updates global installation when scope is 'global'", async () => {
    await init(tmpDir, { scope: "global" });

    const skillMdPath = path.join(fakeHome, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    const tarball = await makeFakeTarball();
    const tarballBuf = await fs.readFile(tarball);
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            version: "1.0.0",
            dist: { tarball: "https://example.com/pkg.tgz" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => toArrayBuffer(tarballBuf),
        })
    );

    await update(tmpDir, { scope: "global" });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).not.toBe("ORIGINAL_CONTENT");
    expect(content.length).toBeGreaterThan(0);
  });

  it("updates local installation when scope is 'local'", async () => {
    await init(tmpDir, { scope: "local" });

    const skillMdPath = path.join(tmpDir, SKILL_DIR, "SKILL.md");
    await fs.writeFile(skillMdPath, "ORIGINAL_CONTENT");

    const tarball = await makeFakeTarball();
    const tarballBuf = await fs.readFile(tarball);
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            version: "1.0.0",
            dist: { tarball: "https://example.com/pkg.tgz" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => toArrayBuffer(tarballBuf),
        })
    );

    await update(tmpDir, { scope: "local" });

    const content = await fs.readFile(skillMdPath, "utf-8");
    expect(content).not.toBe("ORIGINAL_CONTENT");
    expect(content.length).toBeGreaterThan(0);
  });

  it("throws error when no installation exists", async () => {
    await expect(update(tmpDir, { scope: "global" })).rejects.toThrow(
      "No installation found"
    );
  });
});
