import { spawnSync } from "node:child_process";
import type { AppConfig } from "@site-platform/config";

export function runPrismaCommand(config: AppConfig, args: readonly string[]): never {
  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(pnpmCommand, ["exec", "prisma", ...args], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: config.nodeEnv,
      DATABASE_URL: config.database.url
    }
  });

  if (result.error !== undefined) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

