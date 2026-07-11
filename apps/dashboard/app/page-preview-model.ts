import { validatePageDocument, type PageDocumentV1 } from "@site-platform/editor-core";
import type { PageDocumentResponse } from "./dashboard-types";

export const PREVIEW_VIEWPORT_MODES = ["desktop", "tablet", "mobile"] as const;

export type PreviewViewportMode = (typeof PREVIEW_VIEWPORT_MODES)[number];

export type PreviewDocumentValidationResult =
  | {
      readonly ok: true;
      readonly document: PageDocumentV1;
    }
  | {
      readonly ok: false;
      readonly message: string;
    };

export function createPagePreviewRoute(
  projectId: string,
  pageId: string
): string {
  return `/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
    pageId
  )}/preview`;
}

export function createPageEditorRoute(projectId: string, pageId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/pages/${encodeURIComponent(
    pageId
  )}`;
}

export function getPreviewCanvasWidth(mode: PreviewViewportMode): string {
  switch (mode) {
    case "desktop":
      return "100%";
    case "tablet":
      return "768px";
    case "mobile":
      return "390px";
  }
}

export function getPreviewCanvasMaxWidth(mode: PreviewViewportMode): string {
  return mode === "desktop" ? "1440px" : getPreviewCanvasWidth(mode);
}

export function validatePreviewDocument(
  response: PageDocumentResponse | null
): PreviewDocumentValidationResult {
  if (response === null) {
    return {
      ok: false,
      message: "Документ страницы отсутствует."
    };
  }

  const validation = validatePageDocument(response.document);

  if (!validation.ok) {
    return {
      ok: false,
      message: "Документ страницы невалиден."
    };
  }

  return {
    ok: true,
    document: validation.document
  };
}
