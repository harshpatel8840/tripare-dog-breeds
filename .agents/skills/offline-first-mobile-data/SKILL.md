---
name: offline-first-mobile-data
description: Offline-first architecture patterns for mobile apps using Expo SQLite, transactional synchronization, cache integrity, NetInfo connectivity monitoring, and deterministic schema migrations.
---

# Offline-First Mobile Data Skill

## Persistence Architecture

### 1. SQLite Schema
- **`breeds`**: Primary key `id` (UUID), normalized columns for `name`, `normalized_name`, `description`, `hypoallergenic`, `group_id`, `life_min`, `life_max`, `male_weight_min`, `male_weight_max`, `female_weight_min`, `female_weight_max`, `male_height_min`, `male_height_max`, `female_height_min`, `female_height_max`, `origin_era`, `origin_region`, `origin_country`, `coat_type`, `coat_length`, `traits_json`, `temperament_json`, `other_names_json`, `recognized_by_json`, `updated_at`.
- **`breed_groups`**: Primary key `id` (UUID), `name`.
- **`breed_images`**: Primary key `id` (UUID), `breed_id` (foreign key), `url`, `thumb_url`, `medium_url`, `large_url`, `author`, `license`, `license_url`, `source`, `source_url`, `local_path`, `file_size`, `last_accessed_at`.
- **`sync_metadata`**: `id` (INTEGER PRIMARY KEY), `last_attempted_at`, `last_successful_at`, `sync_status` ('idle' | 'syncing' | 'failed' | 'partial' | 'success'), `expected_records`, `persisted_records`, `error_message`.

### 2. Synchronization Integrity Rules
- **Non-destructive upsert**: A sync failure or partial download MUST NEVER wipe existing valid cached records.
- **Transactions**: Multi-record inserts/updates are wrapped in transactions (`db.withTransactionSync` or `db.withExclusiveTransactionAsync`).
- **Dynamic pagination**: Paginate dynamically based on `meta.pagination.next` and `meta.pagination.last` / `links.next`. Validate pages via Zod before persisting.
- **Deduplication**: Stable UUID primary keys ensure idempotent inserts (`INSERT INTO breeds (...) VALUES (...) ON CONFLICT(id) DO UPDATE SET ...`).
- **Progressive availability**: Persist each page immediately in a transaction so that partial data is visible even if later pages fail.
- **Accurate status**: Set `last_successful_at` ONLY when all expected records/pages were successfully fetched and validated. If some pages fail, mark status as `partial`.

### 3. Network Lifecycle
- Monitor connectivity via `@react-native-community/netinfo`.
- When transitioning from offline to online, schedule a background synchronization if stale (e.g., > 1 hour or no complete sync).
- Debounce reconnect triggers to avoid thundering-herd or rapid duplicate synchronizations.
- Offline mode: Serve all list queries, search queries, and filter queries directly from SQLite.

### 4. Acceptance Criteria
- [ ] App boots and displays catalog instantly from SQLite cache without network.
- [ ] Offline searches and multi-filter queries execute in SQLite using SQL indexes.
- [ ] Network interruption during sync preserves existing cached records.
- [ ] Detailed sync status and "Last synced X ago" displayed accurately.
