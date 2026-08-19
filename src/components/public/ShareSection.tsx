import { useState } from 'react';
import { Download, Link2, Printer, QrCode as QrCodeIcon, Share2 } from 'lucide-react';
import { getPublicBiodataUrl, isLocalHost } from '@/utils/site';
import { useToast } from '@/hooks/useToast';
import { copyLink } from '@/utils/share';
import { Button } from '@/components/ui/Button';
import { QrCode } from '@/components/ui/QrCode';
import { Reveal } from './Reveal';
import { Section } from './Section';

interface ShareSectionProps {
  name: string;
  onShare: () => void;
}

/**
 * Share / print / QR block.
 *
 * "Download PDF" and "Print" both open the browser's print dialog against the
 * dedicated print stylesheet — choosing "Save as PDF" there produces a vector,
 * selectable, correctly paginated document. That beats rasterising the DOM with
 * a heavyweight client-side PDF library, and keeps the bundle small.
 */
export function ShareSection({ name, onShare }: ShareSectionProps) {
  const toast = useToast();
  const [showQr, setShowQr] = useState(false);
  // Always the address the visitor is actually on — never a hardcoded URL.
  const publicUrl = getPublicBiodataUrl();

  const handlePrint = (asPdf: boolean) => {
    if (asPdf) {
      toast.notify('Opening the print dialog', {
        description: 'Choose "Save as PDF" as the destination to download the biodata.',
      });
    }
    // Give the toast a frame to paint before the dialog blocks the main thread.
    setTimeout(() => window.print(), asPdf ? 350 : 0);
  };

  const handleCopy = async () => {
    const copied = await copyLink(publicUrl);
    if (copied) {
      toast.success('Link copied!', publicUrl);
    } else {
      toast.error('Unable to copy the link.', 'Please copy it from the address bar.');
    }
  };

  return (
    <Section id="share" eyebrow="Share" title="Share this Biodata" className="no-print">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface-raised p-7 shadow-card sm:p-9">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button variant="gold" size="lg" leadingIcon={<Share2 className="h-4 w-4" />} onClick={onShare} fullWidth className="sm:w-auto">
              Share Biodata
            </Button>

            <Button
              variant="secondary"
              size="lg"
              leadingIcon={<Link2 className="h-4 w-4" />}
              onClick={handleCopy}
              fullWidth
              className="sm:w-auto"
            >
              Copy Link
            </Button>

            <Button
              variant="secondary"
              size="lg"
              leadingIcon={<Download className="h-4 w-4" />}
              onClick={() => handlePrint(true)}
              fullWidth
              className="sm:w-auto"
            >
              Download PDF
            </Button>

            <Button
              variant="secondary"
              size="lg"
              leadingIcon={<Printer className="h-4 w-4" />}
              onClick={() => handlePrint(false)}
              fullWidth
              className="sm:w-auto"
            >
              Print
            </Button>
          </div>

          <div className="mt-7 border-t border-line pt-7 text-center">
            {showQr ? (
              <div className="flex flex-col items-center gap-3">
                <QrCode value={publicUrl} size={200} label={`QR code linking to the marriage biodata of ${name}`} />
                <p className="text-sm font-medium text-charcoal">Scan to view biodata</p>
                <p className="max-w-xs break-all text-xs text-subtle">{publicUrl}</p>
                {isLocalHost() && (
                  <p className="max-w-xs text-xs text-danger">
                    This is a local development address. The deployed site produces a public URL.
                  </p>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                leadingIcon={<QrCodeIcon className="h-4 w-4" />}
                onClick={() => setShowQr(true)}
              >
                Show QR code
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
