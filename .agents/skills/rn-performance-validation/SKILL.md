---
name: rn-performance-validation
description: Best practices for React Native mobile performance optimization including SectionList virtualization, bounded image caching, LRU disk eviction, minimal memory footprint, and profiling evidence collection.
---

# React Native Performance Validation Skill

## Core Principles

### 1. SectionList Virtualization Optimization
- **Lightweight Row Projections**: Do NOT pass the complete 283 breed database row with 11 traits and 9 full image records into the list row component. Project only `{ id, name, groupName, thumbUrl, hypoallergenic, sizeBand, coatLength }`.
- **`React.memo`**: Wrap SectionList item components with custom comparison or shallow equality on primitive props.
- **`getItemLayout` or keyExtractor**: Always provide a stable `keyExtractor` (`(item) => item.id`) and section keyExtractor (`(section) => section.title`).
- **Tuning props**: Set `initialNumToRender={12}`, `maxToRenderPerBatch={10}`, `windowSize={5}`, `removeClippedSubviews={Platform.OS === 'android'}`.
- **Search debounce**: Debounce search queries (250ms–350ms) to prevent unnecessary re-filtering and list re-renders on every keystroke.

### 2. Managed Image Cache with Hard Storage Budget
- **Budget**: Enforce a strict storage budget (default 150 MB, configurable via `EXPO_PUBLIC_IMAGE_CACHE_MAX_MB`).
- **Hierarchy of variants**:
  - Main List: Thumbnail (`thumb`) ONLY.
  - Detail Overview / Gallery preview: Medium (`medium`).
  - Fullscreen Gallery Zoom / High-Res: Large (`large`) on demand.
- **LRU Eviction Policy**: Record `last_accessed_at` and `file_size` in SQLite `breed_images`.
- When total disk cache exceeds the budget, evict least recently accessed files on disk and update local cache pointers.
- Do not evict images actively displayed on screen.

### 3. Profiling & Evidence
- Profile JS bundle size, startup time, and scroll FPS.
- Report honest findings in `docs/PERFORMANCE.md` with methodology and environment details.
- Never fake benchmark numbers or profiler screenshots.

### 4. Acceptance Criteria
- [ ] Warm cache startup under 3 seconds to interactive.
- [ ] List scrolling targets 60 FPS without frame drops on physical device/emulator.
- [ ] Memory consumption stays under 150 MB during full catalog browsing.
- [ ] Image cache stays strictly within configured disk budget.
