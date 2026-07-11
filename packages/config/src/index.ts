import { resolve } from "node:path";
import { config as loadDotenvFile } from "dotenv";
import { z } from "zod";

export type NodeEnvironment = "development" | "test" | "production";
export type ActiveDatabaseUrlKind = "development" | "test";

export type AppConfig = {
  readonly nodeEnv: NodeEnvironment;
  readonly ports: {
    readonly api: number;
    readonly dashboard: number;
    readonly storefront: number;
  };
  readonly database: {
    readonly url: string;
    readonly activeUrlKind: ActiveDatabaseUrlKind;
    readonly developmentUrl?: string;
    readonly testUrl?: string;
  };
};

export type EnvironmentInput = Record<string, string | undefined>;

export type ConfigValidationIssue = {
  readonly variable: string;
  readonly message: string;
  readonly secret: boolean;
};

export type LoadConfigOptions = {
  readonly env?: EnvironmentInput;
  readonly dotenvPath?: string | false;
  readonly overrides?: EnvironmentInput;
};

export type LoadConfigResult =
  | {
      readonly ok: true;
      readonly config: AppConfig;
    }
  | {
      readonly ok: false;
      readonly error: ConfigValidationError;
    };

const SECRET_VARIABLES = new Set(["DATABASE_URL", "TEST_DATABASE_URL"]);

const portSchema = z.coerce
  .number()
  .int("Port must be an integer")
  .min(1, "Port must be greater than or equal to 1")
  .max(65535, "Port must be less than or equal to 65535");

const databaseUrlSchema = z.string().trim().url("Database URL must be a valid URL");

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: databaseUrlSchema.optional(),
    TEST_DATABASE_URL: databaseUrlSchema.optional(),
    API_PORT: portSchema.default(3002),
    DASHBOARD_PORT: portSchema.default(3000),
    STOREFRONT_PORT: portSchema.default(3001)
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === "test" && env.TEST_DATABASE_URL === undefined) {
      context.addIssue({
        code: "custom",
        path: ["TEST_DATABASE_URL"],
        message: "TEST_DATABASE_URL is required when NODE_ENV is test"
      });
    }

    if (env.NODE_ENV !== "test" && env.DATABASE_URL === undefined) {
      context.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required when NODE_ENV is not test"
      });
    }
  });

type ParsedEnvironment = z.infer<typeof environmentSchema>;

export class ConfigValidationError extends Error {
  readonly issues: readonly ConfigValidationIssue[];

  constructor(issues: readonly ConfigValidationIssue[]) {
    super(createSafeErrorMessage(issues));
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}

export function loadConfig(options: LoadConfigOptions = {}): AppConfig {
  const env = resolveEnvironment(options);
  const parsed = environmentSchema.safeParse(env);

  if (!parsed.success) {
    throw new ConfigValidationError(toSafeIssues(parsed.error));
  }

  return toAppConfig(parsed.data);
}

export function loadConfigSafe(options: LoadConfigOptions = {}): LoadConfigResult {
  try {
    return {
      ok: true,
      config: loadConfig(options)
    };
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return {
        ok: false,
        error
      };
    }

    throw error;
  }
}

function resolveEnvironment(options: LoadConfigOptions): EnvironmentInput {
  if (options.env === undefined && options.dotenvPath !== false) {
    loadDotenvFile({
      path: options.dotenvPath ?? resolve(process.cwd(), ".env"),
      quiet: true
    });
  }

  return {
    ...(options.env ?? process.env),
    ...(options.overrides ?? {})
  };
}

function toAppConfig(env: ParsedEnvironment): AppConfig {
  const activeUrlKind: ActiveDatabaseUrlKind =
    env.NODE_ENV === "test" ? "test" : "development";
  const databaseUrl =
    activeUrlKind === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

  if (databaseUrl === undefined) {
    throw new ConfigValidationError([
      {
        variable: activeUrlKind === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL",
        message: "Database URL is required",
        secret: true
      }
    ]);
  }

  return {
    nodeEnv: env.NODE_ENV,
    ports: {
      api: env.API_PORT,
      dashboard: env.DASHBOARD_PORT,
      storefront: env.STOREFRONT_PORT
    },
    database: {
      url: databaseUrl,
      activeUrlKind,
      ...(env.DATABASE_URL === undefined ? {} : { developmentUrl: env.DATABASE_URL }),
      ...(env.TEST_DATABASE_URL === undefined ? {} : { testUrl: env.TEST_DATABASE_URL })
    }
  };
}

function toSafeIssues(error: z.ZodError): readonly ConfigValidationIssue[] {
  return error.issues.map((issue) => {
    const variable = issue.path.join(".") || "ENV";

    return {
      variable,
      message: issue.message,
      secret: SECRET_VARIABLES.has(variable)
    };
  });
}

function createSafeErrorMessage(issues: readonly ConfigValidationIssue[]): string {
  const details = issues
    .map((issue) => `${issue.variable}: ${issue.message}`)
    .join("; ");

  return `Invalid environment configuration: ${details}`;
}
