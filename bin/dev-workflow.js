#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { init, update } from "../src/init.js";
import { getInstallations, resolveGlobalDir } from "../src/utils.js";
import { askInstallScope, formatWarning } from "../src/prompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const command = args[0];
const restArgs = args.slice(1);
const isLocal = restArgs.includes("--local");
const fromIndex = restArgs.indexOf("--from");
const fromPath = fromIndex !== -1 ? restArgs[fromIndex + 1] : undefined;

if (command === "--version" || command === "-v") {
  const pkg = JSON.parse(
    await readFile(path.resolve(__dirname, "../package.json"), "utf-8")
  );
  console.log(pkg.version);
} else if (command === "--help" || command === "-h" || !command) {
  console.log(`Usage: dev-workflow <command> [options]

Commands:
  init      Install the SDD workflow skill (global by default)
  update    Update the skill files to the latest version
  status    Show where the skill is installed

Options:
  --local          Install/update in the current project instead of globally
  --from <path>    Update from a local path instead of the npm registry
  --version        Show version number
  --help           Show this help message`);
} else if (command === "init") {
  await handleInit();
} else if (command === "update") {
  await handleUpdate();
} else if (command === "status") {
  await handleStatus();
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Run "dev-workflow --help" for usage information.');
  process.exit(1);
}

async function handleInit() {
  const cwd = process.cwd();
  const installations = await getInstallations(cwd);
  const scope = isLocal ? "local" : "global";

  if (installations.local && installations.global) {
    console.log(formatWarning());
    const chosen = await askInstallScope();
    if (chosen === "both") {
      await init(cwd, { scope: "local", confirm: true });
      await init(cwd, { scope: "global", confirm: true });
      console.log("Skill installed (local + global).");
    } else {
      await init(cwd, { scope: chosen, confirm: true });
      console.log(`Skill installed (${chosen}).`);
    }
  } else {
    await init(cwd, { scope });
    console.log(`Skill installed (${scope}).`);
    if (scope === "local" && installations.global) {
      console.log(formatWarning());
    }
  }
}

function formatUpdateMessage(scope, version) {
  if (version) return `Skill updated to v${version} (${scope}).`;
  return `Skill updated (${scope}).`;
}

async function handleUpdate() {
  const cwd = process.cwd();
  const installations = await getInstallations(cwd);

  if (!installations.local && !installations.global) {
    console.error("No installation found. Run `dev-workflow init` first.");
    process.exit(1);
  }

  if (installations.local && installations.global) {
    console.log(formatWarning());
    const chosen = await askInstallScope();
    if (chosen === "both") {
      const { version } = await update(cwd, { scope: "local", from: fromPath });
      await update(cwd, { scope: "global", from: fromPath });
      console.log(formatUpdateMessage("local + global", version));
    } else {
      const { version } = await update(cwd, { scope: chosen, from: fromPath });
      console.log(formatUpdateMessage(chosen, version));
    }
  } else if (installations.local) {
    const { version } = await update(cwd, { scope: "local", from: fromPath });
    console.log(formatUpdateMessage("local", version));
  } else {
    const { version } = await update(cwd, { scope: "global", from: fromPath });
    console.log(formatUpdateMessage("global", version));
  }
}

async function handleStatus() {
  const cwd = process.cwd();
  const installations = await getInstallations(cwd);
  const globalDir = resolveGlobalDir();
  const localDir = path.join(cwd, ".claude/skills/dev-workflow");

  if (!installations.local && !installations.global) {
    console.log("dev-workflow is not installed.");
    return;
  }

  if (installations.local && installations.global) {
    console.log(`Installations found:`);
    console.log(`  local:  ${localDir} (active — local takes precedence)`);
    console.log(`  global: ${globalDir}`);
  } else if (installations.local) {
    console.log(`Installed locally (active): ${localDir}`);
  } else {
    console.log(`Installed globally (active): ${globalDir}`);
  }
}
