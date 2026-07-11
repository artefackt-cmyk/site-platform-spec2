import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  InvalidStorageKeyError,
  LocalMediaStorage,
  UploadValidationError,
  detectImageMetadata,
  validateImageUpload
} from "./index";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, {
        recursive: true,
        force: true
      })
    )
  );
});

describe("@site-platform/media-storage", () => {
  it("detects and stores a valid PNG upload", async () => {
    const baseDirectory = await createTemporaryDirectory();
    const storage = new LocalMediaStorage({
      baseDirectory,
      publicBaseUrl: "http://localhost:3002"
    });
    const content = createPng({ width: 2, height: 3 });

    expect(detectImageMetadata(content)).toMatchObject({
      mimeType: "image/png",
      width: 2,
      height: 3
    });

    const result = await storage.put({
      organizationId: "org-a",
      projectId: "project-a",
      content,
      mimeType: "image/png"
    });

    await expect(storage.exists(result.storageKey)).resolves.toBe(true);
    expect(result.storageKey).toMatch(
      /^organizations\/org-a\/projects\/project-a\/[0-9a-f-]{36}\.png$/
    );
  });

  it("rejects declared MIME that does not match image content", () => {
    expect(() => validateImageUpload(createPng({ width: 1, height: 1 }), "image/jpeg"))
      .toThrow(UploadValidationError);
  });

  it("rejects SVG-like content even when declared as PNG", () => {
    const content = new TextEncoder().encode("<svg></svg>");

    expect(() => validateImageUpload(content, "image/png")).toThrow(
      UploadValidationError
    );
  });

  it("rejects traversal storage keys", async () => {
    const baseDirectory = await createTemporaryDirectory();
    const storage = new LocalMediaStorage({
      baseDirectory,
      publicBaseUrl: "http://localhost:3002"
    });

    expect(() =>
      storage.resolveLocalPath("organizations/org-a/projects/project-a/../bad.png")
    ).toThrow(InvalidStorageKeyError);
  });
});

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "site-platform-media-"));

  temporaryDirectories.push(directory);

  return directory;
}

function createPng(input: {
  readonly width: number;
  readonly height: number;
}): Uint8Array {
  const content = new Uint8Array(24);

  content.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  writeUInt32BE(content, input.width, 16);
  writeUInt32BE(content, input.height, 20);

  return content;
}

function writeUInt32BE(content: Uint8Array, value: number, offset: number): void {
  content[offset] = (value >>> 24) & 0xff;
  content[offset + 1] = (value >>> 16) & 0xff;
  content[offset + 2] = (value >>> 8) & 0xff;
  content[offset + 3] = value & 0xff;
}
