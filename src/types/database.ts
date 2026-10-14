export interface BreedRow {
  id: string;
  name: string;
  normalized_name: string;
  description: string | null;
  hypoallergenic: number; // 0 or 1
  group_id: string | null;
  life_min: number | null;
  life_max: number | null;
  male_weight_min: number | null;
  male_weight_max: number | null;
  female_weight_min: number | null;
  female_weight_max: number | null;
  male_height_min: number | null;
  male_height_max: number | null;
  female_height_min: number | null;
  female_height_max: number | null;
  origin_era: string | null;
  origin_region: string | null;
  origin_country: string | null;
  coat_type: string | null;
  coat_length: string | null;
  traits_json: string | null;
  temperament_json: string | null;
  other_names_json: string | null;
  recognized_by_json: string | null;
  size_band: string;
  updated_at: number;
}

export interface BreedGroupRow {
  id: string;
  name: string;
  updated_at: number;
}

export interface BreedImageRow {
  id: string;
  breed_id: string;
  display_order: number;
  url: string;
  thumb_url: string | null;
  medium_url: string | null;
  large_url: string | null;
  author: string | null;
  license: string | null;
  license_url: string | null;
  source: string | null;
  source_url: string | null;
  local_path: string | null;
  file_size: number | null;
  last_accessed_at: number | null;
  updated_at: number;
}

export interface SyncMetadataRow {
  id: number;
  last_attempted_at: number | null;
  last_successful_at: number | null;
  sync_status: string;
  expected_records: number | null;
  persisted_records: number;
  error_message: string | null;
}
