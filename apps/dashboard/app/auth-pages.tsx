"use client";

import * as React from "react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button, MercurioLogo } from "@site-platform/ui";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";

export type AuthPageKind =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "onboarding";

type FormFieldName =
  | "displayName"
  | "email"
  | "password"
  | "organizationName"
  | "projectName"
  | "token"
  | "newPassword"
  | "repeatedPassword";

type FieldErrors = Partial<Record<FormFieldName, string>>;

export type AuthStatus = {
  readonly submitting: boolean;
  readonly message?: string | undefined;
  readonly error?: string | undefined;
  readonly developmentResetToken?: string | undefined;
  readonly fieldErrors: FieldErrors;
};

type AuthFieldConfig = {
  readonly name: FormFieldName;
  readonly label: string;
  readonly type?: string;
  readonly autoComplete?: string;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly required?: boolean;
};

export function AuthPage({
  apiUrl,
  kind
}: {
  readonly apiUrl: string;
  readonly kind: AuthPageKind;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const copy = getAuthCopy(kind);
  const fields = getAuthFields(kind);
  const [status, setStatus] = useState<AuthStatus>({
    submitting: false,
    fieldErrors: {}
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const validation = validateAuthForm(kind, data);

    if (!validation.ok) {
      setStatus({
        submitting: false,
        error: "Проверьте поля формы.",
        fieldErrors: validation.fieldErrors
      });
      return;
    }

    setStatus({
      submitting: true,
      fieldErrors: {}
    });

    try {
      if (kind === "login") {
        await apiClient.login({
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? "")
        });
        window.location.assign("/");
        return;
      }

      if (kind === "register") {
        const projectName = optionalValue(data.get("projectName"));

        await apiClient.register({
          displayName: String(data.get("displayName") ?? ""),
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
          organizationName: String(data.get("organizationName") ?? ""),
          ...(projectName === undefined ? {} : { projectName })
        });
        window.location.assign("/onboarding");
        return;
      }

      if (kind === "forgot-password") {
        const response = await apiClient.requestPasswordReset({
          email: String(data.get("email") ?? "")
        });
        setStatus({
          submitting: false,
          fieldErrors: {},
          message:
            "Если аккаунт существует, мы подготовили ссылку для восстановления пароля.",
          ...(response.developmentResetToken === undefined
            ? {}
            : { developmentResetToken: response.developmentResetToken })
        });
        return;
      }

      if (kind === "reset-password") {
        await apiClient.confirmPasswordReset({
          token: String(data.get("token") ?? ""),
          newPassword: String(data.get("newPassword") ?? "")
        });
        window.location.assign("/");
        return;
      }

      const projectName = optionalValue(data.get("projectName"));

      await apiClient.completeOnboarding({
        ...(projectName === undefined ? {} : { projectName })
      });
      window.location.assign("/");
    } catch (error) {
      setStatus({
        submitting: false,
        fieldErrors: {},
        error: toAuthErrorMessage(error)
      });
    }
  };

  const clearFieldError = (fieldName: FormFieldName) => {
    if (status.fieldErrors[fieldName] === undefined) {
      return;
    }

    setStatus((currentStatus) => ({
      ...currentStatus,
      error: undefined,
      fieldErrors: {
        ...currentStatus.fieldErrors,
        [fieldName]: undefined
      }
    }));
  };

  return (
    <AuthShell kind={kind}>
      <AuthBrandPanel />
      <AuthCard
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <form className="auth-form" onSubmit={submit} noValidate>
          {kind === "onboarding" ? <OnboardingSummary /> : null}
          <div className="auth-field-stack">
            {fields.map((field) => (
              <AuthField
                key={field.name}
                field={field}
                error={status.fieldErrors[field.name]}
                onInput={() => clearFieldError(field.name)}
              />
            ))}
          </div>
          <AuthStatusMessages status={status} />
          <AuthSubmitButton kind={kind} submitting={status.submitting} />
        </form>
        <AuthLinks kind={kind} />
      </AuthCard>
    </AuthShell>
  );
}

export function AuthShell({
  kind,
  children
}: {
  readonly kind: AuthPageKind;
  readonly children: ReactNode;
}) {
  return (
    <main className="auth-page" data-auth-kind={kind}>
      <section className="auth-shell" aria-label="Mercurio authentication">
        {children}
      </section>
    </main>
  );
}

export function AuthBrandPanel() {
  return (
    <aside className="auth-brand-panel" aria-label="Mercurio">
      <MercurioLogo
        className="auth-brand-logo"
        variant="compact"
        surface="dark"
      />
      <div className="auth-brand-copy">
        <p className="eyebrow">Mercurio dashboard</p>
        <h2>Управляйте витриной, проектами и контентом в одном рабочем пространстве.</h2>
        <p>
          Стальной интерфейс для команд, которые запускают storefront без лишней
          операционной суеты.
        </p>
      </div>
      <div className="auth-brand-points" aria-label="Mercurio workflow">
        <span>Компания</span>
        <span>Проект</span>
        <span>Витрина</span>
      </div>
    </aside>
  );
}

export function AuthCard({
  eyebrow,
  title,
  description,
  children
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-mobile-brand" aria-hidden="true">
        <MercurioLogo variant="icon" size={40} />
      </div>
      <header className="auth-card-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="auth-title">{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </section>
  );
}

function AuthField({
  field,
  error,
  onInput
}: {
  readonly field: AuthFieldConfig;
  readonly error?: string | undefined;
  readonly onInput: () => void;
}) {
  const fieldId = `auth-${field.name}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [
    field.hint === undefined ? undefined : hintId,
    error === undefined ? undefined : errorId
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="auth-field">
      <label htmlFor={fieldId}>{field.label}</label>
      <input
        id={fieldId}
        name={field.name}
        type={field.type ?? "text"}
        autoComplete={field.autoComplete}
        placeholder={field.placeholder}
        required={field.required ?? true}
        aria-invalid={error === undefined ? undefined : "true"}
        aria-describedby={describedBy.length === 0 ? undefined : describedBy}
        onInput={onInput}
      />
      {field.hint === undefined ? null : (
        <p className="auth-hint" id={hintId}>
          {field.hint}
        </p>
      )}
      {error === undefined ? null : (
        <p className="auth-field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthSubmitButton({
  kind,
  submitting
}: {
  readonly kind: AuthPageKind;
  readonly submitting: boolean;
}) {
  return (
    <Button
      className="auth-submit"
      loading={submitting}
      disabled={submitting}
      type="submit"
      variant="primary"
    >
      {submitLabel(kind)}
    </Button>
  );
}

export function AuthStatusMessages({ status }: { readonly status: AuthStatus }) {
  return (
    <div className="auth-status-region" aria-live="polite">
      {status.error === undefined ? null : (
        <p className="auth-message auth-message-error" role="alert">
          {status.error}
        </p>
      )}
      {status.message === undefined ? null : (
        <p className="auth-message auth-message-success">{status.message}</p>
      )}
      {status.developmentResetToken === undefined ? null : (
        <p className="auth-message auth-message-success">
          Development token: {status.developmentResetToken}
        </p>
      )}
    </div>
  );
}

function AuthLinks({ kind }: { readonly kind: AuthPageKind }) {
  if (kind === "login") {
    return (
      <nav className="auth-links" aria-label="Дополнительные действия">
        <a href="/forgot-password">Забыли пароль?</a>
        <a href="/register">Создать аккаунт</a>
      </nav>
    );
  }

  if (kind === "register") {
    return (
      <nav className="auth-links" aria-label="Дополнительные действия">
        <a href="/login">Уже есть аккаунт? Войти</a>
      </nav>
    );
  }

  return (
    <nav className="auth-links" aria-label="Дополнительные действия">
      <a href="/login">Вернуться ко входу</a>
    </nav>
  );
}

function OnboardingSummary() {
  return (
    <div className="auth-onboarding-summary">
      <div>
        <span>Шаг 1</span>
        <strong>Организация создана</strong>
        <p>Команда уже привязана к вашему аккаунту.</p>
      </div>
      <div>
        <span>Шаг 2</span>
        <strong>Первый проект</strong>
        <p>Назовите стартовый проект или завершите настройку без него.</p>
      </div>
    </div>
  );
}

function getAuthCopy(kind: AuthPageKind): {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
} {
  const copyByKind = {
    login: {
      eyebrow: "Mercurio dashboard",
      title: "Войти в Mercurio",
      description: "Продолжите работу с проектами, страницами и каталогом."
    },
    register: {
      eyebrow: "Новый аккаунт",
      title: "Создайте аккаунт Mercurio",
      description: "Запустите компанию и первый проект за несколько минут."
    },
    "forgot-password": {
      eyebrow: "Восстановление",
      title: "Восстановить пароль",
      description: "Мы не раскрываем, зарегистрирован ли email."
    },
    "reset-password": {
      eyebrow: "Безопасность",
      title: "Новый пароль",
      description: "Введите токен восстановления и новый пароль."
    },
    onboarding: {
      eyebrow: "Первый запуск",
      title: "Завершите onboarding",
      description: "Проверьте организацию и подготовьте первый проект."
    }
  } as const;

  return copyByKind[kind];
}

function getAuthFields(kind: AuthPageKind): readonly AuthFieldConfig[] {
  if (kind === "register") {
    return [
      {
        name: "displayName",
        label: "Имя",
        autoComplete: "name",
        placeholder: "Анна Иванова"
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        autoComplete: "email",
        placeholder: "name@company.com"
      },
      {
        name: "password",
        label: "Пароль",
        type: "password",
        autoComplete: "new-password",
        placeholder: "Минимум 8 символов",
        hint: "Используйте минимум 8 символов, буквы и цифры."
      },
      {
        name: "organizationName",
        label: "Название компании",
        autoComplete: "organization",
        placeholder: "Mercurio Studio"
      },
      {
        name: "projectName",
        label: "Название первого проекта",
        autoComplete: "off",
        placeholder: "Spring launch",
        required: false
      }
    ];
  }

  if (kind === "login") {
    return [
      {
        name: "email",
        label: "Email",
        type: "email",
        autoComplete: "email",
        placeholder: "name@company.com"
      },
      {
        name: "password",
        label: "Пароль",
        type: "password",
        autoComplete: "current-password",
        placeholder: "Ваш пароль"
      }
    ];
  }

  if (kind === "forgot-password") {
    return [
      {
        name: "email",
        label: "Email",
        type: "email",
        autoComplete: "email",
        placeholder: "name@company.com"
      }
    ];
  }

  if (kind === "reset-password") {
    return [
      {
        name: "token",
        label: "Токен восстановления",
        autoComplete: "one-time-code",
        placeholder: "Вставьте токен из письма"
      },
      {
        name: "newPassword",
        label: "Новый пароль",
        type: "password",
        autoComplete: "new-password",
        placeholder: "Минимум 8 символов",
        hint: "Если токен истек или уже использован, запросите новую ссылку."
      },
      {
        name: "repeatedPassword",
        label: "Повтор пароля",
        type: "password",
        autoComplete: "new-password",
        placeholder: "Повторите новый пароль"
      }
    ];
  }

  return [
    {
      name: "projectName",
      label: "Название первого проекта",
      autoComplete: "off",
      placeholder: "Spring launch",
      required: false
    }
  ];
}

function submitLabel(kind: AuthPageKind): string {
  if (kind === "login") {
    return "Войти";
  }

  if (kind === "register") {
    return "Создать аккаунт";
  }

  if (kind === "forgot-password") {
    return "Отправить ссылку";
  }

  if (kind === "reset-password") {
    return "Сохранить пароль";
  }

  return "Завершить onboarding";
}

export function validateAuthForm(
  kind: AuthPageKind,
  data: FormData
):
  | { readonly ok: true }
  | { readonly ok: false; readonly fieldErrors: FieldErrors } {
  const fieldErrors: FieldErrors = {};

  if (kind === "login" || kind === "register" || kind === "forgot-password") {
    validateEmail(data.get("email"), fieldErrors);
  }

  if (kind === "login") {
    if (requiredText(data.get("password")).length === 0) {
      fieldErrors.password = "Введите пароль.";
    }
  }

  if (kind === "register") {
    if (requiredText(data.get("displayName")).length === 0) {
      fieldErrors.displayName = "Введите имя.";
    }

    validatePassword(data.get("password"), "password", fieldErrors);

    if (requiredText(data.get("organizationName")).length === 0) {
      fieldErrors.organizationName = "Введите название компании.";
    }
  }

  if (kind === "reset-password") {
    if (requiredText(data.get("token")).length === 0) {
      fieldErrors.token = "Введите токен восстановления.";
    }

    validatePassword(data.get("newPassword"), "newPassword", fieldErrors);

    if (
      requiredText(data.get("newPassword")) !==
      requiredText(data.get("repeatedPassword"))
    ) {
      fieldErrors.repeatedPassword = "Пароли должны совпадать.";
    }
  }

  return Object.values(fieldErrors).some(Boolean)
    ? { ok: false, fieldErrors }
    : { ok: true };
}

function validateEmail(value: FormDataEntryValue | null, fieldErrors: FieldErrors) {
  const email = requiredText(value);

  if (email.length === 0) {
    fieldErrors.email = "Введите email.";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Введите корректный email.";
  }
}

function validatePassword(
  value: FormDataEntryValue | null,
  fieldName: "password" | "newPassword",
  fieldErrors: FieldErrors
) {
  const password = requiredText(value);

  if (password.length < 8) {
    fieldErrors[fieldName] = "Пароль должен быть не короче 8 символов.";
    return;
  }

  if (!/[A-Za-zА-Яа-я]/.test(password) || !/\d/.test(password)) {
    fieldErrors[fieldName] = "Добавьте в пароль буквы и цифры.";
  }
}

function requiredText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalValue(value: FormDataEntryValue | null): string | undefined {
  const trimmed = requiredText(value);

  return trimmed.length === 0 ? undefined : trimmed;
}

function toAuthErrorMessage(error: unknown): string {
  if (error instanceof DashboardApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие.";
}
