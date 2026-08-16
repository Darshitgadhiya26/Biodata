/**
 * Database schema types.
 *
 * Written in the same shape `supabase gen types typescript` emits, and kept in
 * sync by hand with `supabase/migrations/*.sql`. To regenerate from a live
 * project instead:
 *
 *   npx supabase gen types typescript --project-id <ref> --schema public \
 *     > src/types/database.ts
 *
 * Note: every shape below is a `type` alias rather than an `interface`.
 * postgrest-js constrains rows to `Record<string, unknown>`, and TypeScript
 * only grants an implicit index signature to anonymous object types — an
 * interface here silently degrades every insert/update argument to `never`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BiodataRow = {
  id: string;

  name: string;
  date_of_birth: string | null;
  caste: string | null;
  height: string | null;
  weight: string | null;
  blood_group: string | null;

  father_name: string | null;
  father_occupation: string | null;
  mother_name: string | null;

  maternal_address: string | null;

  degree: string | null;
  college: string | null;

  job_title: string | null;
  company: string | null;
  work_location: string | null;

  phone: string | null;
  address: string | null;

  profile_photo_url: string | null;
  profile_photo_path: string | null;

  is_published: boolean;

  created_at: string;
  updated_at: string;
};

/** `name` is the only NOT NULL column without a default. */
export type BiodataInsert = {
  id?: string;

  name: string;
  date_of_birth?: string | null;
  caste?: string | null;
  height?: string | null;
  weight?: string | null;
  blood_group?: string | null;

  father_name?: string | null;
  father_occupation?: string | null;
  mother_name?: string | null;

  maternal_address?: string | null;

  degree?: string | null;
  college?: string | null;

  job_title?: string | null;
  company?: string | null;
  work_location?: string | null;

  phone?: string | null;
  address?: string | null;

  profile_photo_url?: string | null;
  profile_photo_path?: string | null;

  is_published?: boolean;

  created_at?: string;
  updated_at?: string;
};

export type BiodataUpdateRow = Partial<BiodataInsert>;

export type HobbyRow = {
  id: string;
  biodata_id: string;
  name: string;
  display_order: number;
  created_at: string;
};

export type HobbyInsert = {
  id?: string;
  biodata_id: string;
  name: string;
  display_order?: number;
  created_at?: string;
};

export type HobbyUpdateRow = Partial<HobbyInsert>;

export type MaternalRelativeRow = {
  id: string;
  biodata_id: string;
  name: string;
  display_order: number;
  created_at: string;
};

export type MaternalRelativeInsert = {
  id?: string;
  biodata_id: string;
  name: string;
  display_order?: number;
  created_at?: string;
};

export type MaternalRelativeUpdateRow = Partial<MaternalRelativeInsert>;

export type Database = {
  public: {
    Tables: {
      biodata: {
        Row: BiodataRow;
        Insert: BiodataInsert;
        Update: BiodataUpdateRow;
        Relationships: [];
      };
      hobbies: {
        Row: HobbyRow;
        Insert: HobbyInsert;
        Update: HobbyUpdateRow;
        Relationships: [
          {
            foreignKeyName: 'hobbies_biodata_id_fkey';
            columns: ['biodata_id'];
            isOneToOne: false;
            referencedRelation: 'biodata';
            referencedColumns: ['id'];
          },
        ];
      };
      maternal_relatives: {
        Row: MaternalRelativeRow;
        Insert: MaternalRelativeInsert;
        Update: MaternalRelativeUpdateRow;
        Relationships: [
          {
            foreignKeyName: 'maternal_relatives_biodata_id_fkey';
            columns: ['biodata_id'];
            isOneToOne: false;
            referencedRelation: 'biodata';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
