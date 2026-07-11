import { Controller, Get, Inject } from "@nestjs/common";
import {
  CURRENT_IDENTITY_RESOLVER,
  type CurrentIdentityResolver
} from "./current-identity";

export type MeResponse = {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly activeOrganization: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly role: string;
};

@Controller("api/me")
export class MeController {
  constructor(
    @Inject(CURRENT_IDENTITY_RESOLVER)
    private readonly currentIdentityResolver: CurrentIdentityResolver
  ) {}

  @Get()
  async getMe(): Promise<MeResponse> {
    const identity = await this.currentIdentityResolver.getCurrentIdentity();

    return {
      id: identity.user.id,
      email: identity.user.email,
      displayName: identity.user.displayName,
      activeOrganization: identity.organization,
      role: identity.role
    };
  }
}
