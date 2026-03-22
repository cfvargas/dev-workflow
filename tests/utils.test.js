import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { resolveGlobalDir, getInstallations, copyTemplates, skillExists } from "../src/utils.js";

const SKILL_DIR = ".claude/skills/dev-workflow";

let tmpDir;
let fakeHome;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-utils-"));
  fakeHome = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-home-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.rm(fakeHome, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("resolveGlobalDir()", () => {
  it("returns ~/.claude/skills/dev-workflow using os.homedir()", () => {
    vi.spyOn(os, "homedir").mockReturnValue("/fake/home");
    const result = resolveGlobalDir();
    expect(result).toBe("/fake/home/.claude/skills/dev-workflow");
  });
});

describe("getInstallations()", () => {
  it("returns { local: false, global: false } when no installation exists", async () => {
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);
    const result = await getInstallations(tmpDir);
    expect(result).toEqual({ local: false, global: false });
  });

  it("returns { local: true, global: false } when only local exists", async () => {
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);
    const localSkillDir = path.join(tmpDir, SKILL_DIR);
    await fs.mkdir(localSkillDir, { recursive: true });
    await fs.writeFile(path.join(localSkillDir, "SKILL.md"), "test");

    const result = await getInstallations(tmpDir);
    expect(result).toEqual({ local: true, global: false });
  });

  it("returns { local: false, global: true } when only global exists", async () => {
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);
    const globalSkillDir = path.join(fakeHome, SKILL_DIR);
    await fs.mkdir(globalSkillDir, { recursive: true });
    await fs.writeFile(path.join(globalSkillDir, "SKILL.md"), "test");

    const result = await getInstallations(tmpDir);
    expect(result).toEqual({ local: false, global: true });
  });

  it("returns { local: true, global: true } when both exist", async () => {
    vi.spyOn(os, "homedir").mockReturnValue(fakeHome);

    const localSkillDir = path.join(tmpDir, SKILL_DIR);
    await fs.mkdir(localSkillDir, { recursive: true });
    await fs.writeFile(path.join(localSkillDir, "SKILL.md"), "test");

    const globalSkillDir = path.join(fakeHome, SKILL_DIR);
    await fs.mkdir(globalSkillDir, { recursive: true });
    await fs.writeFile(path.join(globalSkillDir, "SKILL.md"), "test");

    const result = await getInstallations(tmpDir);
    expect(result).toEqual({ local: true, global: true });
  });
});
