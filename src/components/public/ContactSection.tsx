import { MapPin, MessageCircle, Phone } from 'lucide-react';
import type { Biodata } from '@/types';
import { formatPhone, telHref, toLines } from '@/utils/format';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function ContactSection({ biodata, still = false }: { biodata: Biodata; still?: boolean }) {
  const addressLines = toLines(biodata.address);
  const phone = biodata.phone;

  return (
    <Section
      id="contact"
      eyebrow="Get in Touch"
      title="Contact"
      description="For any enquiry regarding this biodata, please reach out directly."
      still={still}
      compact={still}
    >
      <Reveal disabled={still}>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ---- Phone ---- */}
          <div className="flourish relative overflow-hidden rounded-3xl border border-line bg-surface-raised p-7 text-center shadow-card print-block">
            <div aria-hidden className="absolute inset-0 bg-gold-sheen opacity-60" />

            <div className="relative">
              <span
                aria-hidden
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold"
              >
                <Phone className="h-5 w-5" />
              </span>

              <p className="mt-4 text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">Phone</p>

              {phone ? (
                <a
                  href={telHref(phone)}
                  className="mt-2 inline-block font-display text-2xl font-semibold tracking-wide text-charcoal transition-colors hover:text-gold sm:text-3xl"
                >
                  {formatPhone(phone)}
                </a>
              ) : (
                <p className="mt-2 font-display text-2xl text-subtle">—</p>
              )}

              {/* Calling is the primary action on a phone: full-width there,
                  and a normal inline button from sm upwards. Wrapped in a
                  block so it always starts on its own line. */}
              {phone && (
                <div className="no-print mt-5">
                  <a
                    href={telHref(phone)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-gold-soft via-gold to-gold-deep px-6 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.98] motion-reduce:hover:translate-y-0 sm:w-auto"
                  >
                    <MessageCircle aria-hidden className="h-4 w-4" />
                    Call Now
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ---- Address ---- */}
          <div className="flourish relative overflow-hidden rounded-3xl border border-line bg-surface-raised p-7 text-center shadow-card print-block">
            <div aria-hidden className="absolute inset-0 bg-gold-sheen opacity-60" />

            <div className="relative">
              <span
                aria-hidden
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold"
              >
                <MapPin className="h-5 w-5" />
              </span>

              <p className="mt-4 text-[0.68rem] font-medium uppercase tracking-wideish text-subtle">Address</p>

              {addressLines.length > 0 ? (
                <address className="mt-2 space-y-1 not-italic">
                  {addressLines.map((line, index) => (
                    <span
                      key={`${line}-${index}`}
                      className="block font-display text-lg leading-snug text-charcoal sm:text-xl"
                    >
                      {line}
                    </span>
                  ))}
                </address>
              ) : (
                <p className="mt-2 font-display text-2xl text-subtle">—</p>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
