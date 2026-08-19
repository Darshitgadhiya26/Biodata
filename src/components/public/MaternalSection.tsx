import { Home, UserRound } from 'lucide-react';
import type { Biodata } from '@/types';
import { toLines } from '@/utils/format';
import { EmptyState } from '@/components/ui/States';
import { InfoCard } from './InfoCard';
import { Reveal } from './Reveal';
import { Section } from './Section';

/** Reads `biodata.maternal` — an ordered list of relatives plus the address. */
export function MaternalSection({ biodata, still = false }: { biodata: Biodata; still?: boolean }) {
  const { relatives, address } = biodata.maternal;
  const addressLines = toLines(address);

  return (
    <Section id="maternal" eyebrow="Mosal" title="Maternal Details" still={still} compact={still}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {relatives.length > 0 ? (
          relatives.map((relative, index) => (
            <Reveal key={`${relative}-${index}`} delay={index * 0.06} disabled={still}>
              <InfoCard
                icon={UserRound}
                label={`Maternal Relative ${index + 1}`}
                value={relative}
                still={still}
              />
            </Reveal>
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState title="No maternal relatives listed yet" icon={<UserRound className="h-5 w-5" />} />
          </div>
        )}

        <Reveal delay={relatives.length * 0.06} disabled={still}>
          <InfoCard
            icon={Home}
            label="Maternal Address"
            value={address}
            lines={addressLines}
            still={still}
            emphasis
          />
        </Reveal>
      </div>
    </Section>
  );
}
