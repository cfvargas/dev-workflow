import path from "node:path";
import fs from "node:fs/promises";
import { copyTemplates, resolveGlobalDir } from "./utils.js";
import { fetchLatestTemplates } from "./registry.js";

const SKILL_DIR = ".claude/skills/dev-workflow";

function resolveTargetDir(projectDir, scope) {
  if (scope === "global") return resolveGlobalDir();
  return path.join(projectDir, SKILL_DIR);
}

async function exists(targetDir) {
  try {
    await fs.access(path.join(targetDir, "SKILL.md"));
    return true;
  } catch {
    return false;
  }
}

export async function init(projectDir, options = {}) {
  const scope = options.scope || "local";
  const targetDir = resolveTargetDir(projectDir, scope);
  const alreadyExists = await exists(targetDir);

  if (!alreadyExists) {
    await copyTemplates(targetDir);
    return;
  }

  if (options.confirm === true) {
    await copyTemplates(targetDir);
  }
}

export async function update(projectDir, options = {}) {
  const scope = options?.scope;

  if (scope) {
    const targetDir = resolveTargetDir(projectDir, scope);
    const alreadyExists = await exists(targetDir);
    if (!alreadyExists) {
      throw new Error(
        "No installation found. Run `dev-workflow init` first."
      );
    }
    if (options.from) {
      await copyTemplates(targetDir, path.join(options.from, "templates"));
      return {};
    }
    const version = await fetchLatestTemplates(targetDir);
    return { version };
  }

  // Legacy behavior: update local
  const targetDir = path.join(projectDir, SKILL_DIR);
  await copyTemplates(targetDir);
  return {};
}
