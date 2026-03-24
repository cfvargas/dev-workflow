import { describe, it, expect, afterEach, vi } from "vitest";
import { fetchLatestTemplates } from "../src/registry.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const TEMPLATE_FILES = [
  "SKILL.md",
  "references/phase-1-spec.md",
  "references/phase-2-plan.md",
  "references/phase-3-implement.md",
  "references/phase-4-verify.md",
];

let tmpDirs = [];

async function makeTmpDir(prefix = "reg-test-") {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tmpDirs.push(dir);
  return dir;
}

async function makeFakeTarball() {
  const pkgDir = await makeTmpDir("reg-pkg-");
  const templatesDir = path.join(pkgDir, "package", "templates");
  await fs.mkdir(path.join(templatesDir, "references"), { recursive: true });
  await fs.writeFile(path.join(templatesDir, "SKILL.md"), "FROM_REGISTRY");
  for (const f of [
    "phase-1-spec.md",
    "phase-2-plan.md",
    "phase-3-implement.md",
    "phase-4-verify.md",
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

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const dir of tmpDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

describe("fetchLatestTemplates", () => {
  it("throws 'Could not reach npm registry' when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ENOTFOUND")));
    const targetDir = await makeTmpDir();
    await expect(fetchLatestTemplates(targetDir)).rejects.toThrow(
      "Could not reach npm registry"
    );
  });

  it("throws with HTTP status when metadata fetch returns non-200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const targetDir = await makeTmpDir();
    await expect(fetchLatestTemplates(targetDir)).rejects.toThrow("HTTP 503");
  });

  it("throws with HTTP status when tarball fetch returns non-200", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            version: "1.6.0",
            dist: { tarball: "https://example.com/pkg.tgz" },
          }),
        })
        .mockResolvedValueOnce({ ok: false, status: 404 })
    );
    const targetDir = await makeTmpDir();
    await expect(fetchLatestTemplates(targetDir)).rejects.toThrow("HTTP 404");
  });

  it("copies templates from the tarball and returns the version on success", async () => {
    const tarball = await makeFakeTarball();
    const tarballBuf = await fs.readFile(tarball);

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            version: "1.6.0",
            dist: { tarball: "https://example.com/pkg.tgz" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => toArrayBuffer(tarballBuf),
        })
    );

    const targetDir = await makeTmpDir();
    const version = await fetchLatestTemplates(targetDir);

    expect(version).toBe("1.6.0");
    const skillMd = await fs.readFile(
      path.join(targetDir, "SKILL.md"),
      "utf-8"
    );
    expect(skillMd).toBe("FROM_REGISTRY");
  });

  it("cleans up temp files even when an error occurs", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            version: "1.6.0",
            dist: { tarball: "https://example.com/pkg.tgz" },
          }),
        })
        .mockResolvedValueOnce({ ok: false, status: 500 })
    );
    const targetDir = await makeTmpDir();
    const tmpRoot = os.tmpdir();
    const beforeEntries = await fs.readdir(tmpRoot);

    await expect(fetchLatestTemplates(targetDir)).rejects.toThrow();

    const afterEntries = await fs.readdir(tmpRoot);
    const leaked = afterEntries.filter(
      (e) => e.startsWith("dev-workflow-") && !beforeEntries.includes(e)
    );
    expect(leaked).toHaveLength(0);
  });
});
