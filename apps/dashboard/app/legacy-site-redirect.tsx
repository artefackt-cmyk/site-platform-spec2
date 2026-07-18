import * as React from "react";
import { cookies } from "next/headers";
import { ErrorState } from "@site-platform/ui";
import type { SitesListResponse } from "./dashboard-types";
import { MercurioAppShell } from "./mercurio-shell";
import {
  createSitePageEditorRoute,
  createSitePagePreviewRoute,
  createSiteRoute,
  type SiteSection
} from "./site-routes";

export type LegacySiteRedirectTarget =
  | {
      readonly type: "section";
      readonly section: SiteSection;
    }
  | {
      readonly type: "page-editor";
      readonly pageId: string;
    }
  | {
      readonly type: "page-preview";
      readonly pageId: string;
    };

export type LegacySiteRedirectResult =
  | {
      readonly status: "redirect";
      readonly href: string;
    }
  | {
      readonly status: "error";
      readonly message: string;
    };

export async function resolveLegacySiteRedirect(input: {
  readonly apiUrl: string;
  readonly projectId: string;
  readonly target: LegacySiteRedirectTarget;
}): Promise<LegacySiteRedirectResult> {
  const normalizedApiUrl = input.apiUrl.replace(/\/$/, "");
  const cookieHeader = (await cookies()).toString();
  let response: Response;

  try {
    response = await fetch(
      `${normalizedApiUrl}/api/projects/${encodeURIComponent(input.projectId)}/sites`,
      {
        cache: "no-store",
        headers: cookieHeader === "" ? {} : { cookie: cookieHeader }
      }
    );
  } catch {
    return {
      status: "error",
      message: "Не удалось связаться с API для определения default Site."
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      status: "error",
      message: "У пользователя нет доступа к Site context этого проекта."
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: "Не удалось загрузить сайты проекта для legacy redirect."
    };
  }

  const payload = (await response.json()) as SitesListResponse;
  const defaultSite = payload.sites.find(
    (site) => site.isDefault && site.status === "ACTIVE"
  );

  if (defaultSite === undefined) {
    return {
      status: "error",
      message: "Активный default Site не найден для этого проекта."
    };
  }

  return {
    status: "redirect",
    href: createLegacyTargetHref(input.projectId, defaultSite.id, input.target)
  };
}

export function LegacySiteRedirectError({
  message
}: {
  readonly message: string;
}): React.ReactElement {
  return (
    <MercurioAppShell activeArea="project">
      <main className="site-dashboard-page">
        <ErrorState title="Не удалось открыть Site" description={message} />
      </main>
    </MercurioAppShell>
  );
}

function createLegacyTargetHref(
  projectId: string,
  siteId: string,
  target: LegacySiteRedirectTarget
): string {
  if (target.type === "section") {
    return createSiteRoute(projectId, siteId, target.section);
  }

  if (target.type === "page-preview") {
    return createSitePagePreviewRoute(projectId, siteId, target.pageId);
  }

  return createSitePageEditorRoute(projectId, siteId, target.pageId);
}
