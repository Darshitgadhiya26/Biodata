import { CalendarDays, Droplet, Ruler, User, Users, Weight } from 'lucide-react';
import type { Biodata } from '@/types';
import { calculateAge, formatDateLong } from '@/utils/format';
import { InfoCard } from './InfoCard';
import { Reveal } from './Reveal';
import { Section } from './Section';

/** Reads `biodata.personal`. Nothing on this page is hardcoded. */
export function PersonalSection({ biodata, still = false }: { biodata: Biodata; still?: boolean }) {
  const { personal } = biodata;

  const age = calculateAge(personal.dateOfBirth);
  const dateOfBirth = formatDateLong(personal.dateOfBirth);

  const items = [
    { icon: User, label: 'Name', value: personal.name },
    {
      icon: CalendarDays,
      label: 'Date of Birth',
      value: dateOfBirth ? (age !== null ? `${dateOfBirth} (${age} years)` : dateOfBirth) : '',
    },
    { icon: Users, label: 'Caste', value: personal.caste },
    { icon: Ruler, label: 'Height', value: personal.height },
    { icon: Weight, label: 'Weight', value: personal.weight },
    { icon: Droplet, label: 'Blood Group', value: personal.bloodGroup },
  ];

  return (
    <Section id="personal" eyebrow="About" title="Personal Information" still={still} compact={still}>
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
