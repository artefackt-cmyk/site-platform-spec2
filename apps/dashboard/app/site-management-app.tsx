"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";
import type { OrganizationRole } from "@site-platform/domain";
import {
  DashboardApiError,
  createDashboardApiClient
} from "./dashboard-api-client";
import type {
  CreatePageFormValues,
  CreateSiteFormValues,
  SiteSummary,
} from "./dashboard-types";
import { validateCreatePageForm } from "./page-form-model";
import { createSlugFromName, validateSiteForm } from "./site-form-model";
import {
  createSiteRoute,
  type SiteSection
} from "./site-routes";
import {
  SiteManagementView,
  type ConfirmSiteAction,
  type PageFormState,
  type PublicationFormState,
  type SiteDetailsFormState,
  type SiteFormState,
  type SiteManagementLoadState
} from "./site-management-view";

const emptyCreateSiteValues: CreateSiteFormValues = {
  name: "",
  slug: ""
};

const emptyPageValues: CreatePageFormValues = {
  title: "",
  slug: "",
  isHome: false
};

export function SiteManagementApp({
  apiUrl,
  projectId,
  siteId,
  section
}: {
  readonly apiUrl: string;
  readonly projectId: string;
  readonly siteId?: string;
  readonly section: SiteSection | "project-sites";
}) {
  const apiClient = useMemo(() => createDashboardApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<SiteManagementLoadState>({
    status: "loading"
  });
  const [createSiteForm, setCreateSiteForm] = useState<SiteFormState>({
    open: false,
    values: emptyCreateSiteValues,
    slugEdited: false,
    submitting: false,
    errorMessage: undefined
  });
  const [siteDetailsForm, setSiteDetailsForm] = useState<SiteDetailsFormState>({
    values: emptyCreateSiteValues,
    submitting: false,
    errorMessage: undefined,
    successMessage: undefined
  });
  const [pageForm, setPageForm] = useState<PageFormState>({
    open: false,
    values: emptyPageValues,
    submitting: false,
    errorMessage: undefined
  });
  const [publicationForm, setPublicationForm] = useState<PublicationFormState>({
    publicHandle: "",
    submitting: false,
    errorMessage: undefined,
    successMessage: undefined
  });
  const [confirmAction, setConfirmAction] = useState<ConfirmSiteAction>(null);

  const loadSiteContext = useCallback(async () => {
    setState({
      status: "loading"
    });

    try {
      const [project, user, sitesResponse] = await Promise.all([
        apiClient.getProject(projectId),
        apiClient.getCurrentUser(),
        apiClient.listProjectSites(projectId)
      ]);
      const sites = sitesResponse.sites;
      const selectedSite =
        siteId === undefined
          ? null
          : sites.find((site) => site.id === siteId) ?? null;
      const shouldLoadSite = selectedSite !== null;
      const [pagesResponse, siteSettings, publicationSettings] = shouldLoadSite
        ? await Promise.all([
            apiClient.listSitePages(projectId, selectedSite.id),
            apiClient.getSiteSettings(projectId, selectedSite.id),
            apiClient.getSitePublicationSettings(projectId, selectedSite.id)
          ])
        : [
            { pages: [] },
            null,
            null
          ] as const;
      const homePage = pagesResponse.pages.find((page) => page.isHome) ?? pagesResponse.pages[0];
      const publicationStatus =
        shouldLoadSite && homePage !== undefined
          ? await apiClient.getSitePagePublicationStatus(
              projectId,
              selectedSite.id,
              homePage.id
            )
          : null;

      setState({
        status: "ready",
        project,
        user,
        sites,
        currentSite: selectedSite,
        pages: siteId === undefined ? await loadAllSitePages(projectId, sites, apiClient) : pagesResponse.pages,
        siteSettings,
        publicationSettings,
        publicationStatus
      });

      if (selectedSite !== null) {
        setSiteDetailsForm({
          values: {
            name: selectedSite.name,
            slug: selectedSite.slug
          },
          submitting: false,
          errorMessage: undefined,
          successMessage: undefined
        });
      }

      if (publicationSettings !== null) {
        setPublicationForm({
          publicHandle: publicationSettings.publicHandle,
          submitting: false,
          errorMessage: undefined,
          successMessage: undefined
        });
      }
    } catch (error) {
      setState({
        status: "error",
        message: toUserFacingError(error)
      });
    }
  }, [apiClient, projectId, siteId]);

  useEffect(() => {
    void loadSiteContext();
  }, [loadSiteContext]);

  const canManageSites =
    state.status === "ready" ? canManageSiteRole(state.user.role) : false;
  const canEditPages =
    state.status === "ready" ? canEditPageRole(state.user.role) : false;

  const closeCreateSite = useCallback(() => {
    setCreateSiteForm({
      open: false,
      values: emptyCreateSiteValues,
      slugEdited: false,
      submitting: false,
      errorMessage: undefined
    });
  }, []);

  const changeCreateSite = useCallback(
    (values: CreateSiteFormValues, slugEdited: boolean) => {
      setCreateSiteForm((current) => {
        const nextSlugEdited = current.slugEdited || slugEdited;
        const nextSlug = nextSlugEdited ? values.slug : createSlugFromName(values.name);

        return {
          ...current,
          values: {
            name: values.name,
            slug: nextSlug
          },
          slugEdited: nextSlugEdited,
          errorMessage: undefined
        };
      });
    },
    []
  );

  const submitCreateSite = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const validation = validateSiteForm(createSiteForm.values);

      if (!validation.ok) {
        setCreateSiteForm((current) => ({
          ...current,
          errorMessage: validation.message
        }));
        return;
      }

      setCreateSiteForm((current) => ({
        ...current,
        submitting: true,
        errorMessage: undefined
      }));

      try {
        const response = await apiClient.createProjectSite(projectId, validation.values);

        window.location.assign(createSiteRoute(projectId, response.site.id));
      } catch (error) {
        setCreateSiteForm((current) => ({
          ...current,
          submitting: false,
          errorMessage: toUserFacingError(error)
        }));
      }
    },
    [apiClient, createSiteForm.values, projectId]
  );

  const submitSiteDetails = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (state.status !== "ready" || state.currentSite === null) {
        return;
      }

      const validation = validateSiteForm(siteDetailsForm.values);

      if (!validation.ok) {
        setSiteDetailsForm((current) => ({
          ...current,
          errorMessage: validation.message,
          successMessage: undefined
        }));
        return;
      }

      setSiteDetailsForm((current) => ({
        ...current,
        submitting: true,
        errorMessage: undefined,
        successMessage: undefined
      }));

      try {
        const response = await apiClient.updateProjectSite(
          projectId,
          state.currentSite.id,
          validation.values
        );

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                currentSite: response.site,
                sites: current.sites.map((site) =>
                  site.id === response.site.id ? response.site : site
                )
              }
        );
        setSiteDetailsForm({
          values: {
            name: response.site.name,
            slug: response.site.slug
          },
          submitting: false,
          errorMessage: undefined,
          successMessage: "Настройки сайта сохранены."
        });
      } catch (error) {
        setSiteDetailsForm((current) => ({
          ...current,
          submitting: false,
          errorMessage: toUserFacingError(error),
          successMessage: undefined
        }));
      }
    },
    [apiClient, projectId, siteDetailsForm.values, state]
  );

  const openCreatePage = useCallback(() => {
    setPageForm((current) => ({
      ...current,
      open: true,
      errorMessage: undefined
    }));
  }, []);

  const closeCreatePage = useCallback(() => {
    setPageForm({
      open: false,
      values: emptyPageValues,
      submitting: false,
      errorMessage: undefined
    });
  }, []);

  const submitCreatePage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (state.status !== "ready" || state.currentSite === null) {
        return;
      }

      const validation = validateCreatePageForm(pageForm.values);

      if (!validation.ok) {
        setPageForm((current) => ({
          ...current,
          errorMessage: validation.message
        }));
        return;
      }

      setPageForm((current) => ({
        ...current,
        submitting: true,
        errorMessage: undefined
      }));

      try {
        await apiClient.createSitePage(
          projectId,
          state.currentSite.id,
          validation.values
        );
        const pagesResponse = await apiClient.listSitePages(
          projectId,
          state.currentSite.id
        );

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                pages: pagesResponse.pages
              }
        );
        closeCreatePage();
      } catch (error) {
        setPageForm((current) => ({
          ...current,
          submitting: false,
          errorMessage: toUserFacingError(error)
        }));
      }
    },
    [apiClient, closeCreatePage, pageForm.values, projectId, state]
  );

  const submitPublicationSettings = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (state.status !== "ready" || state.currentSite === null) {
        return;
      }

      setPublicationForm((current) => ({
        ...current,
        submitting: true,
        errorMessage: undefined,
        successMessage: undefined
      }));

      try {
        const settings = await apiClient.updateSitePublicationSettings(
          projectId,
          state.currentSite.id,
          {
            publicHandle: publicationForm.publicHandle.trim()
          }
        );

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                publicationSettings: settings
              }
        );
        setPublicationForm({
          publicHandle: settings.publicHandle,
          submitting: false,
          errorMessage: undefined,
          successMessage: "Публикация сайта сохранена."
        });
      } catch (error) {
        setPublicationForm((current) => ({
          ...current,
          submitting: false,
          errorMessage: toUserFacingError(error),
          successMessage: undefined
        }));
      }
    },
    [apiClient, projectId, publicationForm.publicHandle, state]
  );

  const confirmSiteAction = useCallback(async () => {
    if (state.status !== "ready" || confirmAction === null) {
      return;
    }

    try {
      if (confirmAction.type === "set-default") {
        const response = await apiClient.setDefaultProjectSite(
          projectId,
          confirmAction.site.id
        );

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                currentSite:
                  current.currentSite?.id === response.site.id
                    ? response.site
                    : current.currentSite,
                sites: current.sites.map((site) => ({
                  ...site,
                  isDefault: site.id === response.site.id
                }))
              }
        );
      } else {
        await apiClient.archiveProjectSite(projectId, confirmAction.site.id);
        const sitesResponse = await apiClient.listProjectSites(projectId);
        const defaultSite = sitesResponse.sites.find((site) => site.isDefault);

        if (siteId === confirmAction.site.id && defaultSite !== undefined) {
          window.location.assign(createSiteRoute(projectId, defaultSite.id));
          return;
        }

        setState((current) =>
          current.status !== "ready"
            ? current
            : {
                ...current,
                sites: sitesResponse.sites
              }
        );
      }

      setConfirmAction(null);
    } catch (error) {
      window.alert(toUserFacingError(error));
      setConfirmAction(null);
    }
  }, [apiClient, confirmAction, projectId, siteId, state]);

  return (
    <SiteManagementView
      state={state}
      section={section}
      createSiteForm={createSiteForm}
      siteDetailsForm={siteDetailsForm}
      pageForm={pageForm}
      publicationForm={publicationForm}
      confirmAction={confirmAction}
      canManageSites={canManageSites}
      canEditPages={canEditPages}
      onOpenCreateSite={() =>
        setCreateSiteForm({
          open: true,
          values: emptyCreateSiteValues,
          slugEdited: false,
          submitting: false,
          errorMessage: undefined
        })
      }
      onCloseCreateSite={closeCreateSite}
      onCreateSiteChange={changeCreateSite}
      onSubmitCreateSite={submitCreateSite}
      onSiteDetailsChange={(values) =>
        setSiteDetailsForm((current) => ({
          ...current,
          values,
          errorMessage: undefined,
          successMessage: undefined
        }))
      }
      onSubmitSiteDetails={submitSiteDetails}
      onOpenCreatePage={openCreatePage}
      onCloseCreatePage={closeCreatePage}
      onPageFormChange={(values) =>
        setPageForm((current) => ({
          ...current,
          values,
          errorMessage: undefined
        }))
      }
      onSubmitCreatePage={submitCreatePage}
      onPublicationHandleChange={(value) =>
        setPublicationForm((current) => ({
          ...current,
          publicHandle: value,
          errorMessage: undefined,
          successMessage: undefined
        }))
      }
      onSubmitPublicationSettings={submitPublicationSettings}
      onRequestArchiveSite={(site) => setConfirmAction({ type: "archive", site })}
      onRequestSetDefaultSite={(site) =>
        setConfirmAction({ type: "set-default", site })
      }
      onCancelConfirmAction={() => setConfirmAction(null)}
      onConfirmSiteAction={confirmSiteAction}
    />
  );
}

async function loadAllSitePages(
  projectId: string,
  sites: readonly SiteSummary[],
  apiClient: ReturnType<typeof createDashboardApiClient>
) {
  const pagesBySite = await Promise.all(
    sites.map(async (site) => {
      try {
        const response = await apiClient.listSitePages(projectId, site.id);
        return response.pages;
      } catch {
        return [];
      }
    })
  );

  return pagesBySite.flat();
}

function canManageSiteRole(role: OrganizationRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

function canEditPageRole(role: OrganizationRole): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "EDITOR";
}

function toUserFacingError(error: unknown): string {
  if (error instanceof DashboardApiError) {
    if (error.code === "SITE_SLUG_ALREADY_EXISTS") {
      return "Сайт с таким slug уже существует в проекте.";
    }

    if (error.code === "SITE_CANNOT_ARCHIVE_ONLY_ACTIVE") {
      return "Нельзя архивировать единственный активный сайт проекта.";
    }

    if (error.code === "SITE_CANNOT_ARCHIVE_DEFAULT") {
      return "Сначала сделайте основным другой сайт, затем архивируйте этот.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить действие.";
}
