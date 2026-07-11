import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";

export const packageName = "@site-platform/media-storage" as const;

export const MEDIA_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];

export type MediaStoragePutInput = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly content: Uint8Array;
  readonly mimeType: SupportedImageMimeType;
};

export type MediaStoragePutResult = {
  readonly storageKey: string;
};

export type MediaStorage = {
  readonly put: (input: MediaStoragePutInput) => Promise<MediaStoragePutResult>;
  readonly delete: (storageKey: string) => Promise<void>;
  readonly exists: (storageKey: string) => Promise<boolean>;
  readonly getPublicUrl: (storageKey: string) => string;
  readonly resolveLocalPath: (storageKey: string) => string;
};

export type LocalMediaStorageOptions = {
  readonly baseDirectory: string;
  readonly publicBaseUrl: string;
};

export type ImageMetadata = {
  readonly mimeType: SupportedImageMimeType;
  readonly extension: "jpg" | "png" | "webp";
  readonly width: number;
  readonly height: number;
};

export type UploadValidationErrorCode =
  | "MEDIA_FILE_EMPTY"
  | "MEDIA_FILE_TOO_LARGE"
  | "MEDIA_FILE_UNSUPPORTED_TYPE"
  | "MEDIA_FILE_CORRUPT";

export class UploadValidationError extends Error {
  readonly code: UploadValidationErrorCode;

  constructor(code: UploadValidationErrorCode, message: string) {
    super(message);
    this.name = "UploadValidationError";
    this.code = code;
  }
}

export class InvalidStorageKeyError extends Error {
  constructor(storageKey: string) {
    super(`Invalid media storage key: ${storageKey}`);
    this.name = "InvalidStorageKeyError";
  }
}

export class LocalMediaStorage implements MediaStorage {
  private readonly baseDirectory: string;

  constructor(private readonly options: LocalMediaStorageOptions) {
    this.baseDirectory = resolve(options.baseDirectory);
  }

  async put(input: MediaStoragePutInput): Promise<MediaStoragePutResult> {
    const metadata = validateImageUpload(input.content, input.mimeType);
    const storageKey = createStorageKey({
      organizationId: input.organizationId,
      projectId: input.projectId,
      extension: metadata.extension
    });
    const destinationPath = this.resolveLocalPath(storageKey);
    const temporaryPath = `${destinationPath}.${randomUUID()}.tmp`;

    await mkdir(dirname(destinationPath), {
      recursive: true
    });
    await writeFile(temporaryPath, input.content, {
      flag: "wx"
    });
    await rename(temporaryPath, destinationPath);

    return {
      storageKey
    };
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.resolveLocalPath(storageKey), {
      force: true
    });
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await access(this.resolveLocalPath(storageKey), constants.F_OK);

      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(storageKey: string): string {
    assertValidStorageKey(storageKey);

    const encoded = encodeURIComponent(Buffer.from(storageKey).toString("base64url"));

    return `${this.options.publicBaseUrl.replace(/\/$/, "")}/api/media/storage/${encoded}`;
  }

  resolveLocalPath(storageKey: string): string {
    assertValidStorageKey(storageKey);

    const resolvedPath = resolve(this.baseDirectory, storageKey);

    if (
      resolvedPath !== this.baseDirectory &&
      !resolvedPath.startsWith(`${this.baseDirectory}${sep}`)
    ) {
      throw new InvalidStorageKeyError(storageKey);
    }

    return resolvedPath;
  }
}

export function createStorageKey(input: {
  readonly organizationId: string;
  readonly projectId: string;
  readonly extension: ImageMetadata["extension"];
}): string {
  const generatedId = randomUUID();

  return [
    "organizations",
    sanitizeServerId(input.organizationId),
    "projects",
    sanitizeServerId(input.projectId),
    `${generatedId}.${input.extension}`
  ].join("/");
}

export function validateImageUpload(
  content: Uint8Array,
  declaredMimeType: string
): ImageMetadata {
  if (content.byteLength === 0) {
    throw new UploadValidationError("MEDIA_FILE_EMPTY", "Uploaded file is empty.");
  }

  if (content.byteLength > MEDIA_UPLOAD_MAX_BYTES) {
    throw new UploadValidationError(
      "MEDIA_FILE_TOO_LARGE",
      "Uploaded file exceeds 10 MB."
    );
  }

  if (!isSupportedImageMimeType(declaredMimeType)) {
    throw new UploadValidationError(
      "MEDIA_FILE_UNSUPPORTED_TYPE",
      "Only JPEG, PNG and WebP images are supported."
    );
  }

  const metadata = detectImageMetadata(content);

  if (metadata === null || metadata.mimeType !== declaredMimeType) {
    throw new UploadValidationError(
      "MEDIA_FILE_UNSUPPORTED_TYPE",
      "Image MIME type does not match the uploaded content."
    );
  }

  return metadata;
}

export function isSupportedImageMimeType(
  mimeType: string
): mimeType is SupportedImageMimeType {
  return SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType);
}

export function detectImageMetadata(content: Uint8Array): ImageMetadata | null {
  return detectPng(content) ?? detectJpeg(content) ?? detectWebp(content);
}

export function assertValidStorageKey(storageKey: string): void {
  if (
    storageKey.trim() === "" ||
    storageKey.includes("\\") ||
    storageKey.includes("..") ||
    storageKey.includes("\0") ||
    isAbsolute(storageKey)
  ) {
    throw new InvalidStorageKeyError(storageKey);
  }

  const segments = storageKey.split("/");

  if (
    segments.length !== 5 ||
    segments[0] !== "organizations" ||
    segments[2] !== "projects" ||
    !/^[A-Za-z0-9_-]+$/.test(segments[1] ?? "") ||
    !/^[A-Za-z0-9_-]+$/.test(segments[3] ?? "") ||
    !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(segments[4] ?? "")
  ) {
    throw new InvalidStorageKeyError(storageKey);
  }
}

function detectPng(content: Uint8Array): ImageMetadata | null {
  if (
    content.byteLength < 24 ||
    content[0] !== 0x89 ||
    content[1] !== 0x50 ||
    content[2] !== 0x4e ||
    content[3] !== 0x47 ||
    content[4] !== 0x0d ||
    content[5] !== 0x0a ||
    content[6] !== 0x1a ||
    content[7] !== 0x0a
  ) {
    return null;
  }

  return {
    mimeType: "image/png",
    extension: "png",
    width: readUInt32BE(content, 16),
    height: readUInt32BE(content, 20)
  };
}

function detectJpeg(content: Uint8Array): ImageMetadata | null {
  if (
    content.byteLength < 4 ||
    content[0] !== 0xff ||
    content[1] !== 0xd8
  ) {
    return null;
  }

  let offset = 2;

  while (offset + 9 < content.byteLength) {
    if (content[offset] !== 0xff) {
      return null;
    }

    const marker = content[offset + 1];
    const length = readUInt16BE(content, offset + 2);

    if (length < 2 || offset + 2 + length > content.byteLength) {
      return null;
    }

    if (marker !== undefined && marker >= 0xc0 && marker <= 0xc3) {
      return {
        mimeType: "image/jpeg",
        extension: "jpg",
        height: readUInt16BE(content, offset + 5),
        width: readUInt16BE(content, offset + 7)
      };
    }

    offset += 2 + length;
  }

  throw new UploadValidationError(
    "MEDIA_FILE_CORRUPT",
    "JPEG image metadata could not be read."
  );
}

function detectWebp(content: Uint8Array): ImageMetadata | null {
  if (
    content.byteLength < 30 ||
    readAscii(content, 0, 4) !== "RIFF" ||
    readAscii(content, 8, 12) !== "WEBP"
  ) {
    return null;
  }

  const chunkType = readAscii(content, 12, 16);

  if (chunkType === "VP8X" && content.byteLength >= 30) {
    return {
      mimeType: "image/webp",
      extension: "webp",
      width: 1 + readUInt24LE(content, 24),
      height: 1 + readUInt24LE(content, 27)
    };
  }

  if (chunkType === "VP8 " && content.byteLength >= 30) {
    return {
      mimeType: "image/webp",
      extension: "webp",
      width: readUInt16LE(content, 26) & 0x3fff,
      height: readUInt16LE(content, 28) & 0x3fff
    };
  }

  throw new UploadValidationError(
    "MEDIA_FILE_CORRUPT",
    "WebP image metadata could not be read."
  );
}

function sanitizeServerId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "_");
}

function readUInt16BE(content: Uint8Array, offset: number): number {
  return ((content[offset] ?? 0) << 8) + (content[offset + 1] ?? 0);
}

function readUInt16LE(content: Uint8Array, offset: number): number {
  return (content[offset] ?? 0) + ((content[offset + 1] ?? 0) << 8);
}

function readUInt24LE(content: Uint8Array, offset: number): number {
  return (
    (content[offset] ?? 0) +
    ((content[offset + 1] ?? 0) << 8) +
    ((content[offset + 2] ?? 0) << 16)
  );
}

function readUInt32BE(content: Uint8Array, offset: number): number {
  return (
    ((content[offset] ?? 0) * 0x1000000) +
    ((content[offset + 1] ?? 0) << 16) +
    ((content[offset + 2] ?? 0) << 8) +
    (content[offset + 3] ?? 0)
  );
}

function readAscii(content: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...content.slice(start, end));
}
