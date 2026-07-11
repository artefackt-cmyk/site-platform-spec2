import { loadConfig } from "@site-platform/config";
import { runPrismaCommand } from "./database-command";

const config = loadConfig();

runPrismaCommand(config, [
  "studio",
  "--schema",
  "prisma/schema.prisma"
]);

