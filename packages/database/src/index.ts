export {
  checkDatabaseConnection,
  createPrismaClient,
  disconnectPrismaClient,
  getPrismaClient,
  type DatabaseConnectionResult
} from "./prisma";
export {
  assertSafeTestDatabaseConfig,
  isRecognizedTestDatabaseUrl,
  type TestDatabaseSafetyErrorCode
} from "./test-database-safety";

