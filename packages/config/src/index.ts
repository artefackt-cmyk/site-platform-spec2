import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
  readonly web: {
    readonly dashboardOrigin: string;
    readonly publicApiUrl: string;
  };
  readonly development: {
    readonly devUserEmail?: string;
  };
  readonly database: {
    readonly url: string;
    readonly activeUrlKind: ActiveDatabaseUrlKind;
    readonly developmentUrl?: string;
    readonly testUrl?: string;
  };
  readonly media: {
    readonly storageDir: string;
    readonly publicBaseUrl: string;
  };
};

export type PublicAppConfig = {
  readonly apiUrl: string;
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
const publicUrlSchema = z.string().trim().url("URL must be a valid URL");
const optionalEmailSchema = z
  .string()
  .trim()
  .email("DEV_USER_EMAIL must be a valid email")
  .optional();

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: databaseUrlSchema.optional(),
    TEST_DATABASE_URL: databaseUrlSchema.optional(),
    DEV_USER_EMAIL: optionalEmailSchema,
    DASHBOARD_ORIGIN: publicUrlSchema.default("http://localhost:3000"),
    NEXT_PUBLIC_API_URL: publicUrlSchema.default("http://localhost:3002"),
    MEDIA_STORAGE_DIR: z.string().trim().min(1).default(".local-media"),
    MEDIA_PUBLIC_BASE_URL: publicUrlSchema.default("http://localhost:3002"),
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

    if (env.NODE_ENV === "production" && env.DEV_USER_EMAIL !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["DEV_USER_EMAIL"],
        message: "DEV_USER_EMAIL is development-only and must not be set in production"
      });
    }
  });

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_URL: publicUrlSchema.default("http://localhost:3002")
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

export function loadPublicConfig(
  options: LoadConfigOptions = {}
): PublicAppConfig {
  const env = resolveEnvironment(options);
  const parsed = publicEnvironmentSchema.safeParse(env);

  if (!parsed.success) {
    throw new ConfigValidationError(toSafeIssues(parsed.error));
  }

  return {
    apiUrl: parsed.data.NEXT_PUBLIC_API_URL
  };
}

function resolveEnvironment(options: LoadConfigOptions): EnvironmentInput {
  if (options.env === undefined && options.dotenvPath !== false) {
    loadDotenvFile({
      path: options.dotenvPath ?? findWorkspaceDotenvPath(process.cwd()),
      quiet: true
    });
  }

  return {
    ...(options.env ?? process.env),
    ...(options.overrides ?? {})
  };
}

function findWorkspaceDotenvPath(startDirectory: string): string {
  let currentDirectory = startDirectory;

  while (true) {
    const dotenvPath = resolve(currentDirectory, ".env");

    if (existsSync(dotenvPath)) {
      return dotenvPath;
    }

    if (existsSync(resolve(currentDirectory, "pnpm-workspace.yaml"))) {
      return dotenvPath;
    }

    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return dotenvPath;
    }

    currentDirectory = parentDirectory;
  }
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
    web: {
      dashboardOrigin: env.DASHBOARD_ORIGIN,
      publicApiUrl: env.NEXT_PUBLIC_API_URL
    },
    development:
      env.DEV_USER_EMAIL === undefined
        ? {}
        : {
            devUserEmail: env.DEV_USER_EMAIL
          },
    database: {
      url: databaseUrl,
      activeUrlKind,
      ...(env.DATABASE_URL === undefined ? {} : { developmentUrl: env.DATABASE_URL }),
      ...(env.TEST_DATABASE_URL === undefined ? {} : { testUrl: env.TEST_DATABASE_URL })
    },
    media: {
      storageDir: env.MEDIA_STORAGE_DIR,
      publicBaseUrl: env.MEDIA_PUBLIC_BASE_URL
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
