import { assertSupabaseConfigured, supabase } from '@/lib/supabase';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env';
import { BiodataError } from '@/types';
import { processImageForUpload, type ProcessedImage } from '@/utils/image';

export const BUCKET = 'biodata-assets';
const PHOTO_PREFIX = 'profile-photos';

export interface UploadedPhoto {
  path: string;
  publicUrl: string;
  bytes: number;
  width: number;
  height: number;
}

function extensionFor(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

/** Stable-ish, collision-proof object key. */
function buildObjectPath(file: File): string {
  const random = crypto.randomUUID().slice(0, 8);
  return `${PHOTO_PREFIX}/${Date.now()}-${random}.${extensionFor(file.type)}`;
}

/**
 * Uploads through the Storage REST endpoint with XHR so the admin gets a real
 * byte-level progress bar (supabase-js does not expose upload progress).
 * Authorisation is the caller's own session token — the storage policies in
 * 004_create_storage_policies.sql decide whether the write is allowed.
 */
function uploadWithProgress(
  path: string,
  file: File,
  accessToken: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('x-upsert', 'true');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      if (xhr.status === 401 || xhr.status === 403) {
        reject(new BiodataError('You are not allowed to upload photos. Please sign in again.'));
        return;
      }
      if (xhr.status === 413) {
        reject(new BiodataError('That image is too large for the storage bucket (5 MB limit).'));
        return;
      }

      reject(new BiodataError('Unable to upload the photo. Please try again.'));
    };

    xhr.onerror = () =>
      reject(new BiodataError('Could not reach storage. Check your connection and try again.'));
    xhr.onabort = () => reject(new BiodataError('The upload was cancelled.'));

    const form = new FormData();
    form.append('cacheControl', '3600');
    form.append('', file, file.name);

    xhr.send(form);
  });
}

/** Compresses (in the browser), uploads, and returns the public URL. */
export async function uploadProfilePhoto(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedPhoto> {
  assertSupabaseConfigured();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new BiodataError('Your session has expired. Please sign in again.');
  }

  const processed: ProcessedImage = await processImageForUpload(file);
  URL.revokeObjectURL(processed.previewUrl);

  const path = buildObjectPath(processed.file);
  await uploadWithProgress(path, processed.file, session.access_token, onProgress);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl,
    bytes: processed.bytes,
    width: processed.width,
    height: processed.height,
  };
}

/**
 * Removes an object from the bucket.
 * Safe to call with a null/bundled path — deleting the previous photo must
 * never be able to fail the surrounding save.
 */
export async function deleteProfilePhoto(path: string | null | undefined): Promise<void> {
  if (!path) return;
  assertSupabaseConfigured();

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new BiodataError('Unable to delete the previous photo from storage.', { cause: error });
  }
}

/** Best-effort cleanup used after a successful replace. */
export async function deleteProfilePhotoQuietly(path: string | null | undefined): Promise<void> {
  try {
    await deleteProfilePhoto(path);
  } catch {
    // The new photo is already saved; an orphaned old object is not worth
    // failing the user's action over.
  }
}
