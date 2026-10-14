---
name: rn-production-architecture
description: Production-grade React Native application architecture patterns including clean separation of concerns, TypeScript strict mode, React Navigation typed NativeStack, TanStack Query integration, Zustand UI state management, and component hierarchy.
---

# React Native Production Architecture Skill

## Architectural Boundaries

1. **SQLite (Expo SQLite):** The sole durable source of truth for normalized persistent entities: breeds, breed groups, image metadata, and sync status.
2. **TanStack Query:** Network lifecycle management, request timeouts, retries with exponential backoff and jitter, transient query states (loading, error, fetching). Does not store redundant complete datasets.
3. **Zustand:** User-controlled client UI state only (selected filters, debounced search query, active sorting, UI preferences).
4. **React Component State:** Ephemeral presentation state (active detail tabs, modal visibility, image error states).

## Rules & Checklists

### 1. TypeScript Strictness
- `strict: true` in `tsconfig.json`.
- Zero `any` in codebase and tests.
- Untrusted data parsed via Zod schemas into strongly typed DTOs.
- Explicit domain models separate from database rows and API DTOs.

### 2. Navigation Architecture
- React Navigation Native Stack for smooth platform transitions.
- Fully typed route param lists:
  - `RootStackParamList`:
    - `BreedList`: undefined
    - `BreedDetails`: `{ breedId: string; breedName: string }`
    - `FilterModal`: undefined
- Stable callback handlers to avoid unnecessary screen re-renders.

### 3. State Management Best Practices
- Keep screen components thin: screens consume custom hooks (`useBreeds`, `useBreedDetails`, `useBreedFilters`, `useSyncStatus`).
- No business logic, SQL queries, or raw fetch calls inside JSX components.
- Modular features folder structure:
  - `src/features/breeds/`
  - `src/features/filters/`
  - `src/features/sync/`

### 4. Acceptance Criteria
- [ ] Strict mode enabled without compilation warnings or errors.
- [ ] Clear unidirectional data flow: API -> Repository/SQLite -> Custom Hook -> View.
- [ ] Error boundaries wrap major screen trees to isolate component crashes.
