import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
  /** Rendered as the image's alt text. */
  label?: string;
  onReady?: (dataUrl: string) => void;
}

/**
 * QR code rendered to a data URL.
 *
 * The `qrcode` library is imported dynamically so it is fetched only when a QR
 * is actually shown — it never weighs on the public page's first paint.
 */
export function QrCode({ value, size = 220, className, label, onReady }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);

    if (!value) {
      setDataUrl(null);
      return;
    }

    void (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(value, {
          width: size * 2, // 2x for crisp rendering and printing
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#1c1b1a', light: '#ffffff' },
        });

        if (!active) return;
        setDataUrl(url);
        onReady?.(url);
      } catch {
        if (active) setFailed(true);
      }
    })();

    return () => {
      active = false;
    };
    // onReady is intentionally omitted: callers pass inline callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, size]);

  if (failed) {
    return (
      <div
        className={cn('flex items-center justify-center rounded-2xl border border-line p-4 text-center', className)}
        style={{ width: size, height: size }}
      >
        <p className="text-xs text-muted">QR code unavailable</p>
      </div>
    );
  }

  return (
    <div
      className={cn('overflow-hidden rounded-2xl bg-white p-2.5 shadow-card ring-1 ring-line', className)}
      style={{ width: size, height: size }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={label ?? `QR code linking to ${value}`}
          width={size}
          height={size}
          className="h-full w-full"
        />
      ) : (
        <div className="skeleton h-full w-full rounded-xl" aria-hidden />
      )}
    </div>
  );
}

/** Builds a downloadable PNG of a QR code at print resolution. */
export async function generateQrPng(value: string, size = 1024): Promise<string> {
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL(value, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1c1b1a', light: '#ffffff' },
  });
}
