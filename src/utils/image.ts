/**
 * Client-side image validation and compression.
 *
 * Photos are resized and re-encoded in the browser before they are sent to
 * `/api/github/upload-image`, which keeps uploads fast on mobile data, keeps
 * the committed image small and keeps the public page light. The serverless
 * route enforces the same format allow-list and size cap by inspecting the
 * actual bytes — this is convenience, not the security boundary.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB before compression
/** Hard ceiling accepted by `/api/github/upload-image` after compression. */
export const MAX_COMMIT_BYTES = 3 * 1024 * 1024;
export const MIN_IMAGE_DIMENSION = 200; // px — below this the portrait looks poor
export const TARGET_MAX_DIMENSION = 1200; // px — plenty for a 512px portrait at 2x

export interface ProcessedImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  bytes: number;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

function isAcceptedType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Type + size checks that can run before decoding the file. */
export function validateImageFile(file: File): void {
  if (!isAcceptedType(file.type)) {
    throw new ImageValidationError('Please choose a JPEG, PNG or WEBP image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError('That image is larger than 8 MB. Please choose a smaller file.');
  }
  if (file.size === 0) {
    throw new ImageValidationError('That file appears to be empty.');
  }
}

function loadBitmap(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageValidationError('That image could not be read. Please try a different file.'));
    };

    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ImageValidationError('Could not process that image.'))),
      type,
      quality,
    );
  });
}

/**
 * The API refuses anything over 3 MB, so refuse it here too rather than
 * letting the admin wait for an upload that cannot succeed.
 */
function ensureCommittable(result: ProcessedImage): ProcessedImage {
  if (result.bytes > MAX_COMMIT_BYTES) {
    throw new ImageValidationError(
      'That image is still over 3 MB after compression. Please choose a smaller or less detailed photo.',
    );
  }
  return result;
}

/**
 * Validates, downscales and re-encodes an image.
 * Returns the original file untouched when it is already small and well sized.
 */
export async function processImageForUpload(file: File): Promise<ProcessedImage> {
  validateImageFile(file);

  const image = await loadBitmap(file);
  const { naturalWidth: width, naturalHeight: height } = image;

  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    throw new ImageValidationError(
      `The image is only ${width}×${height}px. Please use one at least ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION}px.`,
    );
  }

  const scale = Math.min(1, TARGET_MAX_DIMENSION / Math.max(width, height));
  const alreadyOptimal = scale === 1 && file.size <= 400 * 1024;

  if (alreadyOptimal) {
    return ensureCommittable({
      file,
      previewUrl: URL.createObjectURL(file),
      width,
      height,
      originalBytes: file.size,
      bytes: file.size,
    });
  }

  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    // Canvas unavailable (rare) — fall back to uploading the original.
    return ensureCommittable({
      file,
      previewUrl: URL.createObjectURL(file),
      width,
      height,
      originalBytes: file.size,
      bytes: file.size,
    });
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  // Keep PNG transparency; everything else compresses better as JPEG.
  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, outputType, 0.86);

  // If compression made things worse (small PNGs sometimes do), keep the original.
  if (blob.size >= file.size && scale === 1) {
    return ensureCommittable({
      file,
      previewUrl: URL.createObjectURL(file),
      width,
      height,
      originalBytes: file.size,
      bytes: file.size,
    });
  }

  const extension = outputType === 'image/png' ? 'png' : 'jpg';
  const processed = new File([blob], `profile-${Date.now()}.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });

  return ensureCommittable({
    file: processed,
    previewUrl: URL.createObjectURL(processed),
    width: targetWidth,
    height: targetHeight,
    originalBytes: file.size,
    bytes: processed.size,
  });
}
