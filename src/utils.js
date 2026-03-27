import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../templates");
const SKILL_DIR = ".claude/skills/dev-workflow";

const TEMPLATE_FILES = [
  "SKILL.md",
  "references/codebase-analysis.md",
  "references/phase-1-spec.md",
  "references/phase-2-plan.md",
  "references/phase-3-implement.md",
  "references/phase-4-verify.md",
  "references/inline-execution.md",
  "references/error-handling.md",
  "references/abort-protocol.md",
];

export async function copyTemplates(targetDir, sourceDir = TEMPLATES_DIR) {
  for (const file of TEMPLATE_FILES) {
    const src = path.join(sourceDir, file);
    const dest = path.join(targetDir, file);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

export function resolveGlobalDir() {
  return path.join(os.homedir(), SKILL_DIR);
}

export async function getInstallations(projectDir) {
  const localPath = path.join(projectDir, SKILL_DIR, "SKILL.md");
  const globalPath = path.join(resolveGlobalDir(), "SKILL.md");

  const [local, global] = await Promise.all([
    fs.access(localPath).then(() => true, () => false),
    fs.access(globalPath).then(() => true, () => false),
  ]);

  return { local, global };
}

export async function skillExists(targetDir) {
  try {
    await fs.access(path.join(targetDir, SKILL_DIR, "SKILL.md"));
    return true;
  } catch {
    return false;
  }
}
