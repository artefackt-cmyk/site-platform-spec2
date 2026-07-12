#!/usr/bin/env node
/* global process, console */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [appName, portText, distDir = ".next-dev"] = process.argv.slice(2);

if (appName === undefined || portText === undefined) {
  console.error("Usage: next-dev-safe.mjs <app-name> <port> [dist-dir]");
  process.exit(1);
}

const port = Number(portText);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid port: ${portText}`);
  process.exit(1);
}

await assertPortIsFree(port);

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDirectory = resolve(repositoryRoot, "apps", appName);
const nextCommand = resolve(
  appDirectory,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next"
);

const child = spawn(nextCommand, ["dev", "--port", String(port)], {
  cwd: appDirectory,
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir
  },
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal !== null) {
    process.kill(process.pid, signal);

    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

function assertPortIsFree(portNumber) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${portNumber} is already in use. Stop the existing dev server before starting another one.`
        );
        process.exit(1);
      }

      rejectPromise(error);
    });

    server.once("listening", () => {
      server.close(() => {
        resolvePromise();
      });
    });

    server.listen(portNumber);
  });
}
