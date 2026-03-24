import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import { copyTemplates } from "./utils.js";

const execFileAsync = promisify(execFile);
const REGISTRY_URL = "https://registry.npmjs.org/dev-workflow/latest";

/**
 * Downloads the latest templates from the npm registry and copies them to targetDir.
 * Returns the version string that was installed.
 */
export async function fetchLatestTemplates(targetDir) {
  const metaRes = await fetch(REGISTRY_URL).catch((err) => {
    throw new Error(`Could not reach npm registry: ${err.message}`);
  });
  if (!metaRes.ok) {
    throw new Error(`Failed to fetch package metadata: HTTP ${metaRes.status}`);
  }
  const meta = await metaRes.json();
  const version = meta.version;
  const tarballUrl = meta.dist.tarball;

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dev-workflow-"));
  try {
    const tarballPath = path.join(tmpDir, "pkg.tgz");
    const tarRes = await fetch(tarballUrl).catch((err) => {
      throw new Error(`Failed to download tarball: ${err.message}`);
    });
    if (!tarRes.ok) {
      throw new Error(`Failed to download tarball: HTTP ${tarRes.status}`);
    }
    const buffer = await tarRes.arrayBuffer();
    await fs.writeFile(tarballPath, Buffer.from(buffer));

    await execFileAsync("tar", ["-xzf", tarballPath, "-C", tmpDir]);

    await copyTemplates(targetDir, path.join(tmpDir, "package", "templates"));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }

  return version;
}
