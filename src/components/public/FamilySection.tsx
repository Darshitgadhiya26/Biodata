import { Briefcase, Heart, Users } from 'lucide-react';
import type { Biodata } from '@/types';
import { InfoCard } from './InfoCard';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function FamilySection({ biodata, still = false }: { biodata: Biodata; still?: boolean }) {
  const items = [
    { icon: Users, label: "Father's Name", value: biodata.father_name },
    { icon: Briefcase, label: "Father's Occupation", value: biodata.father_occupation },
    { icon: Heart, label: "Mother's Name", value: biodata.mother_name },
  ];

  return (
    <Section id="family" eyebrow="Family" title="Family Details" still={still} compact={still}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Reveal key={item.label} delay={index * 0.06} disabled={still}>
            <InfoCard icon={item.icon} label={item.label} value={item.value} still={still} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
