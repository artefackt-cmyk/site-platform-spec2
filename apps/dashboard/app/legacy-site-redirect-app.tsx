"use client";

import { useEffect, useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@site-platform/ui";
import { createDashboardApiClient } from "./dashboard-api-client";
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

export function LegacySiteRedirectApp({
  apiUrl,
  projectId,
  target
}: {
  readonly apiUrl: string;
  readonly projectId: string;
  readonly target: LegacySiteRedirectTarget;
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function redirectToDefaultSite() {
      try {
        const sitesResponse = await apiClient.listProjectSites(projectId);
        const defaultSite = sitesResponse.sites.find(
          (site) => site.isDefault && site.status === "ACTIVE"
        );

        if (defaultSite === undefined) {
          throw new Error("Default Site не найден для этого проекта.");
        }

        const nextPath =
          target.type === "section"
            ? createSiteRoute(projectId, defaultSite.id, target.section)
            : target.type === "page-preview"
              ? createSitePagePreviewRoute(projectId, defaultSite.id, target.pageId)
              : createSitePageEditorRoute(projectId, defaultSite.id, target.pageId);

        if (!cancelled) {
          window.location.replace(nextPath);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Не удалось найти default Site проекта."
          );
        }
      }
    }

    void redirectToDefaultSite();

    return () => {
      cancelled = true;
    };
  }, [apiClient, projectId, target]);

  return (
    <MercurioAppShell activeArea={target.type === "section" ? "project" : "editor"}>
      <main className="site-dashboard-page">
        {errorMessage === null ? (
          <LoadingState label="Открываем default Site" />
        ) : (
          <ErrorState title="Не удалось открыть Site" description={errorMessage} />
        )}
      </main>
    </MercurioAppShell>
  );
}

