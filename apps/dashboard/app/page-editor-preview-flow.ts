import type { SaveStatus } from "./page-editor-state";
import { createPagePreviewRoute } from "./page-preview-model";

export { createPagePreviewRoute };

export type NavigateToPreview = (path: string) => void;
export type SaveBeforePreview = () => Promise<boolean>;

export function shouldWarnBeforePreview(saveStatus: SaveStatus): boolean {
  return saveStatus !== "saved";
}

export function openSavedPreview(
  projectId: string,
  pageId: string,
  navigate: NavigateToPreview
): void {
  navigate(createPagePreviewRoute(projectId, pageId));
}

export async function saveAndOpenPreview(input: {
  readonly projectId: string;
  readonly pageId: string;
  readonly save: SaveBeforePreview;
  readonly navigate: NavigateToPreview;
}): Promise<boolean> {
  const saved = await input.save();

  if (!saved) {
    return false;
  }

  openSavedPreview(input.projectId, input.pageId, input.navigate);

  return true;
}
