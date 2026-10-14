---
name: mobile-testing-documentation
description: Testing and technical documentation standards for production React Native applications including Jest, React Native Testing Library, unit tests for pagination/sync/database/filtering, and comprehensive architectural documentation.
---

# Mobile Testing and Documentation Skill

## Testing Strategies

### 1. High-Risk Business Logic Unit Tests
- **API Client & Pagination**:
  - Valid and invalid response handling with Zod.
  - Multi-page dynamic pagination loop (handling `records`, `last`, `next`).
  - Deduplication by breed UUID.
  - Timeout, backoff, and retry handling.
- **Persistence & Synchronization**:
  - SQLite table creation and migration.
  - Upsert idempotency.
  - Partial sync resilience (network drop on page 3 doesn't drop pages 1-2).
  - Sync metadata tracking (`last_successful_at` semantics).
  - LRU image cache eviction logic based on byte budget.
- **Filters & Search**:
  - Name and alternate names search (case-insensitive, normalized).
  - Size band derivations (small, medium, large, giant, unknown).
  - Coat length & type mappings (wire handling).
  - Hypoallergenic filter (boolean match).
  - Trait thresholds (exercise minutes, children, dogs, strangers).

### 2. Component & Screen Testing
- React Native Testing Library tests with mock providers (Navigation, QueryClient).
- Screen tests:
  - `BreedListScreen`: Empty state, loading skeleton, grouped section headers, search input, offline banner.
  - `BreedDetailsScreen`: Tab navigation (Overview, Traits, Gallery), trait scale display, missing value handling ("Not provided").
  - `GalleryTab`: Attribution display (author, license, license URL, source, source URL).

### 3. Documentation Deliverables
- **`README.md`**: Complete setup, architecture, quick start, mermaid diagrams, offline details.
- **`docs/ARCHITECTURE.md`**: Module boundaries, data flow, SQLite schema, caching, error handling.
- **`docs/DECISIONS.md`**: In-depth ADRs for all key technology choices and edge-case behaviors.
- **`docs/PERFORMANCE.md`**: Real measured results, bundle sizes, memory consumption, profiling logs.

### 4. Acceptance Criteria
- [ ] 100% pass rate on `npm test`.
- [ ] No regressions or skipped tests.
- [ ] Clean typecheck (`npm run typecheck`) and linting (`npm run lint`).
