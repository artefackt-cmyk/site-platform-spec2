import { loadConfig } from "@site-platform/config";
import { assertSafeTestDatabaseConfig } from "../test-database-safety";
import { runPrismaCommand } from "./database-command";

const config = loadConfig({
  overrides: {
    NODE_ENV: "test"
  }
});

assertSafeTestDatabaseConfig(config);

runPrismaCommand(config, [
  "migrate",
  "dev",
  "--schema",
  "prisma/schema.prisma"
]);

