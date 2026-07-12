import * as React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mercurioLogoAssets } from "@site-platform/ui";
import {
  AuthPage,
  AuthStatusMessages,
  AuthSubmitButton,
  validateAuthForm,
  type AuthStatus
} from "./auth-pages";

describe("AuthPage", () => {
  it("renders the reusable Mercurio auth shell with approved assets", () => {
    const html = renderAuth("register");

    expect(html).toContain("auth-shell");
    expect(html).toContain("auth-brand-panel");
    expect(html).toContain("auth-card");
    expect(html).toContain(mercurioLogoAssets.horizontal);
    expect(html).toContain("Создайте аккаунт Mercurio");
    expect(html).toContain("Запустите компанию и первый проект за несколько минут.");
  });

  it("renders register fields as a vertical field stack with accessible labels", () => {
    const html = renderAuth("register");

    expect(html).toContain("auth-field-stack");
    expect(html).toContain("for=\"auth-displayName\"");
    expect(html).toContain("id=\"auth-displayName\"");
    expect(html).toContain("for=\"auth-email\"");
    expect(html).toContain("type=\"email\"");
    expect(html).toContain("autoComplete=\"email\"");
    expect(html).toContain("for=\"auth-password\"");
    expect(html).toContain("Используйте минимум 8 символов");
    expect(html).toContain("for=\"auth-organizationName\"");
    expect(html).toContain("for=\"auth-projectName\"");
  });

  it("renders login and register secondary links", () => {
    const loginHtml = renderAuth("login");
    const registerHtml = renderAuth("register");

    expect(loginHtml).toContain("href=\"/forgot-password\"");
    expect(loginHtml).toContain("Забыли пароль?");
    expect(loginHtml).toContain("href=\"/register\"");
    expect(loginHtml).toContain("Создать аккаунт");
    expect(registerHtml).toContain("href=\"/login\"");
    expect(registerHtml).toContain("Уже есть аккаунт? Войти");
  });

  it("renders submit loading and disabled state", () => {
    const html = renderToStaticMarkup(
      React.createElement(AuthSubmitButton, {
        kind: "register",
        submitting: true
      })
    );

    expect(html).toContain("disabled=\"\"");
    expect(html).toContain("aria-busy=\"true\"");
    expect(html).toContain("Загрузка...");
  });

  it("renders API error state through an aria-live region", () => {
    const status: AuthStatus = {
      submitting: false,
      fieldErrors: {},
      error: "Email уже используется."
    };
    const html = renderToStaticMarkup(
      React.createElement(AuthStatusMessages, { status })
    );

    expect(html).toContain("aria-live=\"polite\"");
    expect(html).toContain("role=\"alert\"");
    expect(html).toContain("Email уже используется.");
  });

  it("validates register fields inline before sending API payloads", () => {
    const data = new FormData();
    data.set("displayName", "");
    data.set("email", "not-an-email");
    data.set("password", "short");
    data.set("organizationName", "");

    const validation = validateAuthForm("register", data);

    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.fieldErrors.displayName).toContain("Введите имя");
      expect(validation.fieldErrors.email).toContain("корректный email");
      expect(validation.fieldErrors.password).toContain("не короче 8");
      expect(validation.fieldErrors.organizationName).toContain(
        "название компании"
      );
    }
  });

  it("renders onboarding steps without browser alert or prompt UI", () => {
    const html = renderAuth("onboarding");

    expect(html).toContain("auth-onboarding-summary");
    expect(html).toContain("Организация создана");
    expect(html).toContain("Первый проект");
    expect(html).not.toContain("alert(");
    expect(html).not.toContain("prompt(");
  });

  it("ships mobile auth classes without horizontal overflow", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

    expect(css).toContain(".auth-page");
    expect(css).toContain("overflow-x: hidden");
    expect(css).toContain("@media (max-width: 1120px)");
    expect(css).toContain(".auth-shell {\n    grid-template-columns: 1fr;");
    expect(css).toContain("@media (max-width: 860px)");
    expect(css).toContain(".auth-field input,\n  .auth-submit {\n    width: 100%;");
  });

  it("renders dashboard auth pages without console errors", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    renderAuth("forgot-password");
    renderAuth("reset-password");

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

function renderAuth(kind: React.ComponentProps<typeof AuthPage>["kind"]): string {
  return renderToStaticMarkup(
    React.createElement(AuthPage, {
      apiUrl: "http://localhost:4000",
      kind
    })
  );
}
