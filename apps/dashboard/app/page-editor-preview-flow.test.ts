import { describe, expect, it, vi } from "vitest";
import {
  createPagePreviewRoute,
  saveAndOpenPreview,
  shouldWarnBeforePreview
} from "./page-editor-preview-flow";

describe("page editor preview flow", () => {
  it("requires a warning when editor has unsaved changes", () => {
    expect(shouldWarnBeforePreview("dirty")).toBe(true);
    expect(shouldWarnBeforePreview("error")).toBe(true);
    expect(shouldWarnBeforePreview("saved")).toBe(false);
  });

  it("saves before opening preview", async () => {
    const calls: string[] = [];
    const save = vi.fn(async () => {
      calls.push("save");
      return true;
    });
    const navigate = vi.fn((path: string) => {
      calls.push(`navigate:${path}`);
    });

    await expect(
      saveAndOpenPreview({
        projectId: "project-1",
        pageId: "page-1",
        save,
        navigate
      })
    ).resolves.toBe(true);

    expect(calls).toEqual([
      "save",
      "navigate:/projects/project-1/pages/page-1/preview"
    ]);
  });

  it("does not open preview when save fails", async () => {
    const save = vi.fn(async () => false);
    const navigate = vi.fn();

    await expect(
      saveAndOpenPreview({
        projectId: "project-1",
        pageId: "page-1",
        save,
        navigate
      })
    ).resolves.toBe(false);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("builds the preview route", () => {
    expect(createPagePreviewRoute("project-1", "page-1")).toBe(
      "/projects/project-1/pages/page-1/preview"
    );
  });
});
