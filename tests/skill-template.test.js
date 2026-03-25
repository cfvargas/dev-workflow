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

  describe("body content — compressed form", () => {
    it("body starts with the expected title", async () => {
      if (!parsed) {
        content = await fs.readFile(SKILL_MD_PATH, "utf-8");
        parsed = parseFrontmatter(content);
      }

      const bodyTrimmed = parsed.body.trim();
      expect(
        bodyTrimmed.startsWith("# Spec Driven Development Workflow"),
        "Body should start with '# Spec Driven Development Workflow'",
      ).toBe(true);
    });

    it("does NOT contain the verbose Project Detection table", async () => {
      if (!parsed) {
        content = await fs.readFile(SKILL_MD_PATH, "utf-8");
        parsed = parseFrontmatter(content);
      }

      // The old verbose table had this header row; the compressed form should not.
      expect(parsed.body).not.toContain("| Setting | Examples | Default |");
    });
  });

  describe("line count — slim orchestrator target (R14)", () => {
    it("SKILL.md is between 190 and 230 lines", async () => {
      if (!content) {
        content = await fs.readFile(SKILL_MD_PATH, "utf-8");
      }

      const lineCount = content.split("\n").length;
      expect(
        lineCount,
        `Expected SKILL.md to be between 190 and 230 lines, but got ${lineCount}`,
      ).toBeGreaterThanOrEqual(190);
      expect(
        lineCount,
        `Expected SKILL.md to be between 190 and 230 lines, but got ${lineCount}`,
      ).toBeLessThanOrEqual(230);
    });
  });
});
