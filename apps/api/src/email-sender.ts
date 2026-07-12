import type { AppConfig } from "@site-platform/config";

export type PasswordResetEmailInput = {
  readonly email: string;
  readonly resetUrl: string;
  readonly developmentToken?: string | undefined;
};

export type EmailSender = {
  readonly sendPasswordReset: (input: PasswordResetEmailInput) => Promise<void>;
};

export const EMAIL_SENDER = Symbol("EMAIL_SENDER");

export function createEmailSender(config: AppConfig): EmailSender {
  if (config.nodeEnv === "production") {
    return new ProductionEmailSender();
  }

  return new DevelopmentEmailSender();
}

class DevelopmentEmailSender implements EmailSender {
  async sendPasswordReset(input: PasswordResetEmailInput): Promise<void> {
    const event = {
      event: "password_reset_requested",
      email: input.email,
      ...(input.developmentToken === undefined
        ? { resetUrl: "[redacted]" }
        : {
            resetUrl: input.resetUrl,
            developmentToken: input.developmentToken
          })
    };

    console.info(JSON.stringify(event));
  }
}

class ProductionEmailSender implements EmailSender {
  async sendPasswordReset(): Promise<void> {
    throw new Error("Production password reset email sender is not configured.");
  }
}
