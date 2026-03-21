#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { init, update } from "../src/init.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const command = process.argv[2];

if (command === "--version" || command === "-v") {
  const pkg = JSON.parse(
    await readFile(path.resolve(__dirname, "../package.json"), "utf-8")
  );
  console.log(pkg.version);
} else if (command === "--help" || command === "-h" || !command) {
  console.log(`Usage: dev-workflow <command>

Commands:
  init      Install the SDD workflow skill into the current project
  update    Update the skill files to the latest version

Options:
  --version  Show version number
  --help     Show this help message`);
} else if (command === "init") {
  await init(process.cwd());
} else if (command === "update") {
  await update(process.cwd());
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Run "dev-workflow --help" for usage information.');
  process.exit(1);
}
