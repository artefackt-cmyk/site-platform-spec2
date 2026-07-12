#!/usr/bin/env node
/* global process, console */
import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [appName, distDir = ".next-dev"] = process.argv.slice(2);

if (appName === undefined) {
  console.error("Usage: clean-next-cache.mjs <app-name> [dist-dir]");
  process.exit(1);
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appCacheDirectory = resolve(repositoryRoot, "apps", appName, distDir);

rmSync(appCacheDirectory, {
  force: true,
  recursive: true
});

console.log(`Removed apps/${appName}/${distDir}`);
