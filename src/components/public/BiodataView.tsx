import type { Biodata, Hobby, MaternalRelative } from '@/types';
import { Hero } from './Hero';
import { PersonalSection } from './PersonalSection';
import { FamilySection } from './FamilySection';
import { MaternalSection } from './MaternalSection';
import { EducationSection } from './EducationSection';
import { CareerSection } from './CareerSection';
import { HobbiesSection } from './HobbiesSection';
import { ContactSection } from './ContactSection';

interface BiodataViewProps {
  biodata: Biodata;
  hobbies: Hobby[];
  maternalRelatives: MaternalRelative[];
  /** Turns off animations and tightens spacing — used by the admin preview. */
  still?: boolean;
}

/**
 * The biodata document itself.
 *
 * Shared verbatim between the public page and the admin's live preview, which
 * is what guarantees "what you see while editing is what visitors get". Every
 * value is a prop — nothing here is hardcoded.
 */
export function BiodataView({ biodata, hobbies, maternalRelatives, still = false }: BiodataViewProps) {
  return (
    <>
      <Hero biodata={biodata} still={still} />

      {/* Hairline rules between sections keep the page reading as one document */}
      <div className="container-luxe" aria-hidden>
        <div className="divider-gold opacity-50" />
      </div>

      <PersonalSection biodata={biodata} still={still} />
      <FamilySection biodata={biodata} still={still} />
      <MaternalSection biodata={biodata} relatives={maternalRelatives} still={still} />
      <EducationSection biodata={biodata} still={still} />
      <CareerSection biodata={biodata} still={still} />
      <HobbiesSection hobbies={hobbies} still={still} />
      <ContactSection biodata={biodata} still={still} />
    </>
  );
}
