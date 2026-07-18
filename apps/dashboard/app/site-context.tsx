"use client";

import * as React from "react";
import type {
  CurrentUserResponse,
  ProjectSummary,
  SiteSummary
} from "./dashboard-types";

export type SitePermissions = {
  readonly canManageSites: boolean;
  readonly canEditPages: boolean;
};

export type SiteRouteContextValue = {
  readonly project: ProjectSummary;
  readonly user: CurrentUserResponse;
  readonly sites: readonly SiteSummary[];
  readonly currentSite: SiteSummary | null;
  readonly permissions: SitePermissions;
};

const SiteRouteContext = React.createContext<SiteRouteContextValue | null>(null);

export function SiteRouteContextProvider({
  value,
  children
}: {
  readonly value: SiteRouteContextValue;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <SiteRouteContext.Provider value={value}>{children}</SiteRouteContext.Provider>
  );
}

export function useSiteRouteContext(): SiteRouteContextValue {
  const context = React.useContext(SiteRouteContext);

  if (context === null) {
    throw new Error("useSiteRouteContext must be used within SiteRouteContextProvider.");
  }

  return context;
}
