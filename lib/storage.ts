import { AVATAR_BUCKET, SHOT_COVER_BUCKET, getSupabaseUrl } from "@/lib/env";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const SHOT_COVER_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function storagePublicUrl(bucket: string, path: string): string {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

export function shotCoverUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  // External covers (allow-listed Unsplash URLs) are stored verbatim.
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return storagePublicUrl(SHOT_COVER_BUCKET, path);
}

export function avatarUrl(path: string | null | undefined): string | null {
  return path ? storagePublicUrl(AVATAR_BUCKET, path) : null;
}

export function validateImageFile(file: File, maxBytes: number): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }

  if (file.size > maxBytes) {
    return `Image must be ${Math.round(maxBytes / (1024 * 1024))} MB or smaller.`;
  }

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  return null;
}

export function extensionForFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName === "jpeg" || fromName === "jpg") {
    return "jpg";
  }

  if (fromName === "png" || fromName === "webp") {
    return fromName;
  }

  return MIME_EXTENSIONS[file.type] ?? "jpg";
}

export function shotCoverPath(userId: string, uploadId: string, file: File): string {
  return `${userId}/${uploadId}/cover.${extensionForFile(file)}`;
}

export function avatarStoragePath(userId: string, file: File): string {
  return `${userId}/avatar-${Date.now()}.${extensionForFile(file)}`;
}
