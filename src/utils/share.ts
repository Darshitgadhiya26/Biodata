import { getPublicBiodataUrl } from '@/lib/env';

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unavailable';

interface ShareInput {
  name: string;
  url?: string;
}

/** Clipboard write with a fallback for browsers/contexts without the async API. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Uses the Web Share API where available (iOS/Android), otherwise copies the
 * link. Returns what actually happened so the caller can show the right toast.
 */
export async function shareBiodata({ name, url }: ShareInput): Promise<ShareResult> {
  const shareUrl = url ?? getPublicBiodataUrl();
  const title = `${name} | Marriage Biodata`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: `Marriage biodata of ${name}`, url: shareUrl });
      return 'shared';
    } catch (error) {
      // The user dismissing the sheet is not a failure worth reporting.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Anything else (e.g. permission denied) falls back to copying.
    }
  }

  return (await copyToClipboard(shareUrl)) ? 'copied' : 'unavailable';
}

export async function copyLink(url?: string): Promise<boolean> {
  return copyToClipboard(url ?? getPublicBiodataUrl());
}
