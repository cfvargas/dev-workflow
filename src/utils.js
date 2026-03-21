import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../templates");
const SKILL_DIR = ".claude/skills/dev-workflow";

const TEMPLATE_FILES = [
  "SKILL.md",
  "references/phase-1-spec.md",
  "references/phase-2-plan.md",
  "references/phase-3-implement.md",
  "references/phase-4-verify.md",
];

export async function copyTemplates(targetDir) {
  for (const file of TEMPLATE_FILES) {
    const src = path.join(TEMPLATES_DIR, file);
    const dest = path.join(targetDir, file);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

export async function skillExists(targetDir) {
  try {
    await fs.access(path.join(targetDir, SKILL_DIR, "SKILL.md"));
    return true;
  } catch {
    return false;
  }
}
