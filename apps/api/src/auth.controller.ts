import { Body, Controller, Get, Inject, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import type { AppConfig } from "@site-platform/config";
import { APP_CONFIG } from "./app-config.provider";
import {
  AuthService,
  type AuthSessionDto,
  type PasswordResetRequestResponse
} from "./auth.service";
import { createSessionCookieOptions } from "./cookie-utils";

@Controller("api/auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {}

  @Post("register")
  async register(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionDto> {
    const result = await this.authService.register(body, request);
    this.setSessionCookie(response, result.sessionToken);

    return result.body;
  }

  @Post("login")
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionDto> {
    const result = await this.authService.login(body, request);
    this.setSessionCookie(response, result.sessionToken);

    return result.body;
  }

  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<{ readonly ok: true }> {
    const result = await this.authService.logout(request);
    response.clearCookie(this.config.auth.sessionCookieName, {
      path: "/"
    });

    return result;
  }

  @Get("session")
  async getSession(): Promise<AuthSessionDto> {
    return this.authService.getSession();
  }

  @Post("password-reset/request")
  async requestPasswordReset(
    @Body() body: unknown,
    @Req() request: Request
  ): Promise<PasswordResetRequestResponse> {
    return this.authService.requestPasswordReset(body, request);
  }

  @Post("password-reset/confirm")
  async confirmPasswordReset(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionDto> {
    const result = await this.authService.confirmPasswordReset(body, request);
    this.setSessionCookie(response, result.sessionToken);

    return result.body;
  }

  @Post("onboarding/complete")
  async completeOnboarding(@Body() body: unknown): Promise<AuthSessionDto> {
    return this.authService.completeOnboarding(body);
  }

  private setSessionCookie(response: Response, sessionToken: string): void {
    response.cookie(
      this.config.auth.sessionCookieName,
      sessionToken,
      createSessionCookieOptions(this.config)
    );
  }
}
