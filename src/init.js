import path from "node:path";
import { copyTemplates, skillExists } from "./utils.js";

const SKILL_DIR = ".claude/skills/dev-workflow";

export async function init(projectDir, options = {}) {
  const targetDir = path.join(projectDir, SKILL_DIR);
  const exists = await skillExists(projectDir);

  if (!exists) {
    await copyTemplates(targetDir);
    return;
  }

  if (options.confirm === true) {
    await copyTemplates(targetDir);
  }
}

export async function update(projectDir) {
  const targetDir = path.join(projectDir, SKILL_DIR);
  await copyTemplates(targetDir);
}
