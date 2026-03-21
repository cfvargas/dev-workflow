import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { init, update } from "../src/init.js";

const SKILL_DIR = ".claude/skills/dev-workflow";
const EXPECTED_FILES = [
  "SKILL.md",
  "references/phase-1-spec.md",
  "references/phase-2-plan.md",
  "references/phase-3-implement.md",
  "references/phase-4-verify.md",
];

let tmpDir;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-test-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
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
