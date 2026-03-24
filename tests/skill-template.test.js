import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_MD_PATH = path.join(__dirname, "..", "templates", "SKILL.md");

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns { frontmatter: string, body: string, description: string }.
 */
function parseFrontmatter(content) {
  const lines = content.split("\n");
  if (lines[0].trim() !== "---") {
    throw new Error("Missing opening --- in YAML frontmatter");
  }

  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    throw new Error("Missing closing --- in YAML frontmatter");
  }

  const frontmatterLines = lines.slice(1, closingIndex);
  const body = lines.slice(closingIndex + 1).join("\n");

  // Extract the description field (handles multi-line YAML scalars with > or |)
  let description = "";
  let inDescription = false;
  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i];
    if (line.match(/^description:\s*/)) {
      inDescription = true;
      // Check for inline value after "description:"
      const inlineValue = line.replace(/^description:\s*>?\s*/, "").trim();
      if (inlineValue && !inlineValue.startsWith(">") && !inlineValue.startsWith("|")) {
        description += inlineValue + " ";
      }
      continue;
    }
    if (inDescription) {
      // Continuation lines are indented
      if (line.match(/^\s+/)) {
        description += line.trim() + " ";
      } else {
        // Hit a new top-level key, stop collecting description
        break;
      }
    }
  }

  return {
    frontmatter: frontmatterLines.join("\n"),
    body,
    description: description.trim(),
  };
}

describe("templates/SKILL.md", () => {
  let content;
  let parsed;

  // Read the file once before all tests
  it("can be read from disk", async () => {
    content = await fs.readFile(SKILL_MD_PATH, "utf-8");
    expect(content).toBeTruthy();
    parsed = parseFrontmatter(content);
  });

  describe("description field — implicit development triggers", () => {
    const devActionVerbs = ["build", "add", "fix", "implement", "refactor", "create"];

    it("contains implicit development action trigger language", async () => {
      if (!parsed) {
        content = await fs.readFile(SKILL_MD_PATH, "utf-8");
        parsed = parseFrontmatter(content);
      }
      const desc = parsed.description.toLowerCase();

      // The description must contain language that indicates the skill activates
      // for general development tasks — at least some of these action verbs
      const matchedVerbs = devActionVerbs.filter((verb) => desc.includes(verb));
      expect(
        matchedVerbs.length,
        `Expected description to contain development action verbs (e.g., ${devActionVerbs.join(", ")}), but found: [${matchedVerbs.join(", ")}]. Description: "${parsed.description}"`,
      ).toBeGreaterThanOrEqual(3);
    });

    it("does NOT restrict triggering to only explicit workflow mentions", async () => {
      if (!parsed) {
        content = await fs.readFile(SKILL_MD_PATH, "utf-8");
        parsed = parseFrontmatter(content);
      }
      const desc = parsed.description.toLowerCase();

      // The description should NOT contain language that limits activation to explicit requests only
      expect(desc).not.toMatch(/only when.*explicitly/i);
      expect(desc).not.toMatch(/explicitly asks/i);
      expect(desc).not.toMatch(/unless they explicitly/i);
    });
  });

  describe("description field — explicit trigger phrases preserved", () => {
    const explicitTriggers = ["dev-workflow", "SDD", "workflow"];

    for (const trigger of explicitTriggers) {
      it(`contains explicit trigger phrase: "${trigger}"`, async () => {
        if (!parsed) {
          content = await fs.readFile(SKILL_MD_PATH, "utf-8");
          parsed = parseFrontmatter(content);
        }
        const desc = parsed.description.toLowerCase();
        expect(desc).toContain(trigger.toLowerCase());
      });
    }
  });

  describe("description field — exclusion language for read-only requests", () => {
    it("contains exclusion language for explaining/summarizing/reviewing", async () => {
      if (!parsed) {
        content = await fs.readFile(SKILL_MD_PATH, "utf-8");
        parsed = parseFrontmatter(content);
      }
      const desc = parsed.description.toLowerCase();

      // The description must tell Claude Code NOT to trigger for read-only requests.
      // It should mention at least some of: explain, summarize, review, "what does"
      const exclusionTerms = ["explain", "summarize", "review"];
      const matchedTerms = exclusionTerms.filter((term) => desc.includes(term));
      expect(
        matchedTerms.length,
        `Expected description to contain exclusion language for read-only requests (e.g., ${exclusionTerms.join(", ")}), but found: [${matchedTerms.join(", ")}]. Description: "${parsed.description}"`,
      ).toBeGreaterThanOrEqual(2);
    });
  });

  describe("body content — unchanged", () => {
    // Snapshot of the current body content (everything after the closing ---)
    // This ensures R6: body content is unchanged when the description is updated.
    const EXPECTED_BODY_SNAPSHOT = `
# Spec Driven Development Workflow

You are orchestrating a structured development cycle based on Spec Driven Development (SDD). The core idea: define WHAT you want before writing code, then implement from structured specifications. Each phase produces a persistent artifact that the next session consumes — the files travel, not the context.

## Project Detection

Before starting, read the project's \`CLAUDE.md\` (or \`AGENTS.md\`) to determine:

| Setting | Examples | Default |
|---------|----------|---------|
| Base branch | \`develop\`, \`main\`, \`master\` | \`main\` |
| Test command | \`npm test\`, \`pytest\`, \`cargo test\` | \`npm test\` |
| Lint command | \`npm run lint\`, \`ruff check\` | \`npm run lint\` |
| Type check | \`npm run typescript\`, \`mypy .\` | Skip if N/A |
| Test runner (watch) | \`vitest\`, \`jest --watch\` | \`vitest\` |
| Commit format | conventional, project-specific | conventional |
| Versioning | semver, calver, none | none |
| Milestones | per-version, per-sprint, none | none |
| Releases | GitHub releases, tags only, none | none |
| Project skills | \`.claude/skills/\` entries | — |`;

    it("body content matches the current snapshot (no accidental changes)", async () => {
      if (!parsed) {
        content = await fs.readFile(SKILL_MD_PATH, "utf-8");
        parsed = parseFrontmatter(content);
      }

      // Compare the beginning of the body to ensure it hasn't changed.
      // We check a meaningful prefix rather than the entire body to keep the test maintainable,
      // but it's enough to catch accidental edits.
      const bodyTrimmed = parsed.body.trim();
      const snapshotTrimmed = EXPECTED_BODY_SNAPSHOT.trim();

      expect(
        bodyTrimmed.startsWith(snapshotTrimmed),
        "Body content has changed — only the description field should be modified, not the body",
      ).toBe(true);
    });
  });
});
