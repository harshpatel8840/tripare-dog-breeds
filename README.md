# Tripare Dog Breed Explorer (`tripare-dog-breeds`)

A production-grade, offline-first mobile application built from scratch with **React Native (0.86.3)**, **Expo (SDK 57)**, **React 19**, and **TypeScript in Strict Mode** (with zero `any`).

Powered by the live [Dog API v2](https://dogapi.dog/docs/api-v2), the application features dynamic multi-page pagination, a durable SQLite storage engine operating in Write-Ahead Logging (WAL) mode, TanStack Query request caching, Zustand filter management, an autonomous 150 MB managed image cache with LRU eviction and active-screen protection, and a virtualized `SectionList` with sub-millisecond query projections.

---

## 🚀 Key Highlights & Architecture

- **100% Strict TypeScript:** Enforced with `strict: true` and ESLint `@typescript-eslint/no-explicit-any: error`. Zero `any` in application code or tests.
- **Offline-First SQLite Source of Truth:** Remote API data is ingested directly into an indexed SQLite database (`expo-sqlite`). The UI queries SQLite exclusively.
- **Dynamic Pagination Without Hardcoding:** Automatically detects total pages and records via API pagination metadata (`records: 283`, `last: 6` across 48-item pages).
- **Non-Destructive Partial Sync:** Network disconnects preserve existing persisted pages without recording false completion timestamps; automatically recovers on reconnect.
- **Active-Protected Image Cache (150 MB Budget):** Autonomous LRU eviction engine deletes the oldest unaccessed images when exceeding 150 MB while strictly preserving actively displayed screen images.
- **Sub-Millisecond Query Projections:** Virtualized `SectionList` grouped by official Dog API breed groups renders lightweight projections, preventing memory spikes during 60 FPS scrolling.
- **Exhaustive Trait Modeling:** All 11 domain traits are modeled with custom rating scales, interactive interpretations, and dual snake_case/camelCase threshold matching.

```mermaid
graph TD
    API[Dog API v2 REST API] <-->|Dynamic Pagination / JSON| ApiClient[DogApiClient\nTimeout + Full Jitter Backoff]
    NetInfo[NetworkMonitor\nNetInfo Event Emitter] -->|Connectivity Events| SyncCoord[SyncCoordinator\nDynamic Pages + Deduplication]
    ApiClient --> SyncCoord
    SyncCoord -->|Atomic Batch Transactions| SQLite[(Expo SQLite WAL Database\nbreeds, breed_groups, breed_images)]

    ImageMgr[ImageManager\n150 MB Budget + LRU Eviction] <-->|Paths, File, Directory| FileCache[(FileSystem Cache\n/cache/dog_images/)]
    ImageMgr <-->|Metadata Tracking| SQLite

    SQLite -->|Lightweight Projections| TanStack[TanStack Query v5\nCache Invalidation Lifecycle]
    Zustand[Zustand Stores\nFilters, Search & Theme] -->|Reactive Predicates| TanStack

    TanStack --> BreedList[BreedListScreen\nVirtualized SectionList]
    TanStack --> BreedDetail[BreedDetailsScreen\nOverview, Traits & Gallery]
    Zustand <--> FilterScreen[FilterScreen\nMulti-Select & Range Thresholds]
```

---

## 📱 Application Previews

|                                Explorer Screen (SectionList)                                 |                               Breed Details (Traits & Specs)                               |                            Advanced Filters (Pills & Ranges)                             |
| :------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------: |
| <img src="./docs/performance/explorer_screen.jpg" width="240" alt="Breed Explorer Screen" /> | <img src="./docs/performance/details_screen.jpg" width="240" alt="Breed Details Screen" /> | <img src="./docs/performance/filter_screen.jpg" width="240" alt="Filter Modal Screen" /> |

---

## 📦 Documentation Directory

Comprehensive architectural specifications and decision records are available in the [`docs/`](./docs) folder:

- 📐 [**Architecture Specification (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md): System components, dynamic pagination flow, SQLite schema, index designs, and LRU eviction diagrams.
- ⚖️ [**Architecture Decision Records (`docs/DECISIONS.md`)**](./docs/DECISIONS.md): 8 ADRs detailing rationale for SQLite, TanStack Query + Zustand, SectionList, size band derivations, coat wire mapping, and partial sync recovery.
- ⚡ [**Performance & Benchmarking Report (`docs/PERFORMANCE.md`)**](./docs/PERFORMANCE.md): Hermes bytecode sizes (3MB Android / 3MB iOS, 1,519 modules), query latency benchmarks, and virtualization tuning.

---

## 🛠️ Quick Start

### Prerequisites

- Node.js $\ge 18.x$ (tested on Node v22.18.0)
- npm $\ge 9.x$
- iOS Simulator (macOS) or Android Emulator / Physical Device with Expo Go

### 1. Installation

```bash
# Clone and enter directory
cd tripare-dog-breeds

# Install dependencies
npm install
```

### 2. Environment Configuration

Copy the template configuration file:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Default configuration values in `.env`:

```env
EXPO_PUBLIC_DOG_API_BASE_URL=https://dogapi.dog/api/v2
EXPO_PUBLIC_IMAGE_CACHE_MAX_MB=150
```

### 3. Launch Development Server

```bash
# Start Expo development bundler
npm start

# Or launch directly into an emulator / browser
npm run android
npm run ios
npm run web
```

---

## 🧪 Verification & Testing Suite

The repository includes a comprehensive automated test suite with **64 passing tests across 9 test suites**, delivering **78.5%+ test coverage** across domain logic, repositories, sync coordinator, LRU eviction, and components.

```bash
# Run all unit and integration tests
npm test

# Run tests with code coverage report
npm run test:coverage

# Run TypeScript strict type verification
npm run typecheck

# Run ESLint validation (enforcing zero any)
npm run lint

# Check code and documentation formatting
npm run format:check

# Auto-format codebase and markdown files
npm run format

# Run production Hermes bytecode export build
npx expo export
```

---

## 📱 Feature Deep-Dive

### 1. Dynamic Catalog Synchronization

- **Endpoints Utilized:**
  - `GET /v2/groups` — Ingests 9 official breed groups (`Working`, `Toy`, `Herding`, `Hound`, `Sporting`, `Non-Sporting`, `Terrier`, `Miscellaneous Class`, `Foundation Stock Service`).
  - `GET /v2/breeds?page[number]=N&page[size]=48` — Dynamically pulls all 6 pages totaling 283 breeds.
  - `GET /v2/breeds/:id` — Fetches complete high-res photo attribution and individual breed updates.
- **Resilience:** Automatic exponential backoff with jitter on HTTP 429 and 5xx errors; immediate rejection on 404 client errors.
- **Conflict-Free Deduplication:** Guarantees idempotent storage even if upstream API paginations duplicate records across page boundaries.

### 2. Managed Image Cache (150 MB Budget)

- **Zero Memory Leaks:** Employs Expo SDK 57 modern `expo-file-system` class APIs (`Paths`, `File`, `Directory`).
- **LRU Eviction Engine:** Tracks file byte sizes and `last_accessed_at` in SQLite. When total cache size exceeds 150 MB, the oldest unused files are purged.
- **Active Protection:** Images actively mounted on screen (`registerActiveImage`) are immune from eviction during active viewports.

### 3. Comprehensive Filtering & Debounced Search

- **Debounced Search:** 300ms debounce matching against both `breeds.name` and secondary aliases in `breeds.other_names_json`.
- **Size Bands:** Automatic derivation into **Toy** ($< 5\text{ kg}$), **Small** ($5-12\text{ kg}$), **Medium** ($12-25\text{ kg}$), **Large** ($25-45\text{ kg}$), and **Giant** ($\ge 45\text{ kg}$).
- **Coat Length Normalization:** Handles API quirk where wire-haired breeds define `coat.type = 'wire'` with `coat.length = 'short'`, unifying them under wire coat search filters.
- **11 Trait Threshold Pickers:** Set minimum rating filters (1–5) for `good_with_children`, `good_with_dogs`, `good_with_strangers`, `shedding`, `grooming`, `drooling`, `coat_length`, `energy_level`, `barking_level`, `trainability`, and `protectiveness`.

### 4. Interactive Detail Experience

- **Overview:** Origin era, region, country, life expectancy range, weight and height metrics.
- **Trait Visualization:** Horizontal rating scale bars with textual interpretations (e.g., Low, Moderate, High, Exceptional).
- **Attribution Gallery:** High-resolution photo gallery with photographer name, license type, license link, and source attribution card.

---

## 📂 Project Structure

```
tripare-dog-breeds/
├── docs/                             # Architecture & engineering documentation
│   ├── ARCHITECTURE.md               # System diagrams & technical specification
│   ├── DECISIONS.md                  # 8 formal Architecture Decision Records
│   └── PERFORMANCE.md                # Hermes bundle sizes & query benchmarks
├── src/
│   ├── __tests__/                    # 9 Jest test suites (64 passing tests)
│   ├── app/                          # Navigation container & provider stack
│   ├── components/                   # Reusable atomic & composite components
│   │   ├── breeds/                   # BreedListItem, SectionHeader, FilterChips
│   │   ├── common/                   # Badge, ScaleBar, Skeleton, EmptyState, OfflineBanner
│   │   ├── filters/                  # MultiSelectPill, TraitThresholdPicker
│   │   └── gallery/                  # GalleryViewer, AttributionCard
│   ├── hooks/                        # useBreeds, useBreedDetails, useSync, useNetwork
│   ├── screens/                      # BreedListScreen, BreedDetailsScreen, FilterScreen
│   ├── services/
│   │   ├── api/                      # DogApiClient with backoff, jitter, Zod schemas
│   │   ├── database/                 # SQLiteClient with WAL pragmas & migrations
│   │   ├── images/                   # ImageManager with 150 MB LRU eviction
│   │   ├── network/                  # NetworkMonitor with NetInfo observer
│   │   ├── repositories/             # BreedRepository with lightweight projections
│   │   └── sync/                     # SyncCoordinator with dynamic pagination
│   ├── store/                        # Zustand filterStore & themeStore
│   ├── theme/                        # Colors, typography, spacing, useTheme hook
│   ├── types/                        # Strict domain, API, DB, and navigation types
│   └── utils/                        # SizeBand, CoatNormalizer, formatting, logger
├── App.tsx                           # Root application entry
├── app.json                          # Expo configuration & permissions
├── eslint.config.mjs                 # Strict TypeScript ESLint rules
├── jest.config.js                    # Jest test runner configuration
├── package.json                      # Project dependencies & scripts
└── tsconfig.json                     # Strict TypeScript compiler options
```

---

## 💡 Troubleshooting & FAQ

### 1. Resetting Local SQLite Database

If you wish to test a clean cold-start sync:

```bash
# Delete the local SQLite database file on device or simulator
# On Android emulator:
adb shell run-as com.anonymous.triparedogbreeds rm -rf databases/

# Or simply trigger "Pull to Refresh" on the Explorer screen to perform a full upsert
```

### 2. Clearing Metro Bundler Cache

```bash
npm start -- --clear
```

### 3. Testing Offline Mode

- In iOS Simulator: `Developer -> Network Link Conditioner -> 100% Loss` or toggle Mac Wi-Fi off.
- In Android Emulator: Open Quick Settings, enable **Airplane Mode**.
- The app instantly displays the red `OfflineBanner`, and all 283 cached breeds remain instantly searchable and viewable.

---

## ⚖️ Engineering Trade-Offs & Interview Talking Points

1. **Why SQLite over AsyncStorage or MMKV?**
   While MMKV is exceptionally fast for simple key-value pairs, querying 283 dog breeds with dynamic combinations of 6 filter dimensions (groups, size bands, coat lengths, hypoallergenic, text search, trait thresholds) in memory requires repeatedly scanning large arrays. Indexed SQLite queries execute in **sub-2ms** directly in native C, avoiding garbage collection pressure on the JavaScript thread.
2. **Why TanStack Query alongside Zustand?**
   Server cache and client UI state have fundamentally different lifecycles. Conflating filter slider movements with API caching creates excessive re-render cascades. Using Zustand for user UI parameters and TanStack Query for data fetching ensures clean component subscriptions and optimal memoization.
3. **How does LRU eviction protect active images?**
   A traditional LRU cache evicts the oldest items by timestamp. If a user leaves a screen open on a low-memory device while background syncing occurs, the displayed breed photo could be purged from disk. Our `ImageManager` implements `registerActiveImage()`, ensuring that any photo currently mounted on the screen is strictly preserved regardless of age.

---

## 📄 License

MIT License. Created for the Tripare AI Senior Mobile Engineering Assessment.
