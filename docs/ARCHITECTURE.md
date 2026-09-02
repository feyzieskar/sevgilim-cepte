# Sevgilim Cepte — Architecture

## Overview

Sevgilim Cepte is a private two-user companion app built with React Native (Expo) and Supabase. The architecture is designed for real-time synchronization between two linked users (partners).

---

## System Architecture

```mermaid
flowchart LR
    App[React Native / Expo App]
    Auth[Supabase Auth]
    DB[(PostgreSQL + RLS)]
    RT[Supabase Realtime]
    Storage[Private Storage]
    Edge[Edge Functions]
    AI[OpenAI API]
    Push[Expo Push API]

    App --> Auth
    App --> DB
    DB --> RT
    RT --> App
    App --> Storage
    App --> Edge
    Edge --> AI
    Edge --> Push
```

---

## Folder Structure

```
sevgilim-cepte/
├── app/                        # Expo Router screens (file = route)
│   ├── _layout.tsx             # Root layout (auth guard, providers, bootstrap)
│   ├── (auth)/                 # Auth group (login/register)
│   │   └── login.tsx
│   ├── (tabs)/                 # Tab navigation (5 tabs)
│   │   ├── _layout.tsx         # Tab bar config + data bootstrap
│   │   ├── index.tsx           # 🏠 Home ("Bugün Biz")
│   │   ├── takvim.tsx          # 📅 Calendar
│   │   ├── feyzi-ai.tsx        # 💬 Feyzi AI
│   │   ├── streak.tsx          # 📸 Daily Streak
│   │   └── menu.tsx            # ☰ Menu (features grid)
│   ├── ani/[id].tsx            # Memory detail (dynamic route)
│   ├── anilar.tsx              # Memories list
│   ├── bucket-list.tsx         # Bucket list
│   ├── duygular.tsx            # Emotions
│   ├── profil.tsx              # Profile & settings
│   ├── ruh-hali.tsx            # Mood tracking
│   └── sevme-sebepleri.tsx     # Love reasons
├── components/                 # Reusable UI components
│   ├── bucket/                 # Bucket list components
│   ├── calendar/               # Calendar components
│   ├── cards/                  # Home screen cards
│   ├── chat/                   # Chat UI components
│   ├── emotion/                # Emotion components
│   ├── memory/                 # Memory components
│   ├── mood/                   # Mood components
│   ├── streak/                 # Streak components
│   ├── surprise/               # Surprise components
│   └── ui/                     # Shared UI primitives
├── store/                      # Zustand stores (13 stores)
├── services/                   # External service integrations
│   ├── feyziService.ts         # AI chat (via Edge Function)
│   ├── storageService.ts       # Photo upload/download
│   ├── pushService.ts          # Push notifications
│   ├── notifications.ts        # Local notifications
│   ├── media.ts                # Camera/gallery helpers
│   └── appleCalendar.ts        # Apple Calendar export
├── lib/                        # Core utilities
│   ├── supabase.ts             # Supabase client singleton
│   └── validation.ts           # Input validation helpers
├── constants/                  # App constants
│   ├── theme.ts                # Colors, gradients, shadows
│   ├── tarih.ts                # Turkish date formatters
│   ├── kategoriler.ts          # Event categories
│   ├── feyziPrompts.ts         # AI system prompts
│   ├── gunlukSecim.ts          # Daily selection helpers
│   └── surpriz.ts              # Surprise type helpers
├── data/                       # Static data & helpers
├── supabase/                   # Supabase configuration
│   ├── functions/              # Edge Functions
│   │   ├── feyzi-chat/         # OpenAI proxy
│   │   └── send-push/          # Push notification sender
│   └── migrations/             # Incremental SQL migrations
├── __tests__/                  # Unit tests
├── docs/                       # Documentation
└── migration.sql               # Legacy bootstrap schema
```

---

## Navigation Flow

```mermaid
flowchart TD
    Start[App Launch] --> Check{Session exists?}
    Check -->|No| Login[Login Screen]
    Check -->|Yes| Bootstrap[Fetch Data + Subscribe Realtime]
    Login -->|Auth Success| Bootstrap
    Bootstrap --> Tabs[Tab Navigator]
    Tabs --> Home[🏠 Home]
    Tabs --> Calendar[📅 Calendar]
    Tabs --> Chat[💬 Feyzi AI]
    Tabs --> Streak[📸 Streak]
    Tabs --> Menu[☰ Menu]
    Menu --> Memories[Memories]
    Menu --> BucketList[Bucket List]
    Menu --> Mood[Mood]
    Menu --> Profile[Profile]
    Menu --> LoveReasons[Love Reasons]
    Menu --> Surprises[Surprises]
```

---

## State Management

Zustand stores with Supabase persistence:

| Store           | Scope                   | Realtime |
| --------------- | ----------------------- | -------- |
| authStore       | Session, user           | —        |
| profileStore    | User + partner profiles | —        |
| calendarStore   | Shared events           | ✅       |
| memoryStore     | Shared memories         | —        |
| surpriseStore   | Shared surprises        | ✅       |
| loveReasonStore | Shared love reasons     | ✅       |
| ozelGunStore    | Shared special days     | ✅       |
| chatStore       | Personal chat history   | —        |
| emotionStore    | Shared emotions         | ✅       |
| streakStore     | Photos + streak counter | ✅       |
| moodStore       | Shared moods            | ✅       |
| bucketListStore | Shared bucket list      | ✅       |
| useThemeStore   | Theme preference        | Local    |

---

## Data Flow

```mermaid
sequenceDiagram
    participant App as React Native App
    participant Store as Zustand Store
    participant Supa as Supabase
    participant RT as Realtime

    App->>Store: User action (add event)
    Store->>Supa: INSERT into events
    Supa-->>Store: Return new row
    Store-->>App: Update UI
    Supa->>RT: Broadcast change
    RT->>Store: Partner's store receives update
    Store-->>App: Partner's UI updates
```

---

## AI Assistant Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Edge as feyzi-chat Edge Function
    participant AI as OpenAI GPT-4o
    participant Store as Client Stores

    User->>App: Send message
    App->>Edge: messages + tools (JWT auth)
    Edge->>AI: Chat completion request
    AI-->>Edge: Response (possibly with tool_calls)
    Edge-->>App: Sanitized response

    alt Tool call (read)
        App->>Store: Execute read tool locally
        App->>Edge: Continue with tool result
    else Tool call (write)
        App->>User: Show confirmation card
        User->>App: Approve
        App->>Store: Execute write operation
        App->>Edge: Continue with result
    end

    Edge->>AI: Final completion
    AI-->>Edge: Natural language response
    Edge-->>App: Display to user
```

---

## Media Upload Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Picker as Image Picker
    participant Storage as Supabase Storage
    participant DB as PostgreSQL

    User->>Picker: Select photo
    Picker-->>App: URI + base64
    App->>Storage: Upload to <user-id>/<uuid>.jpg
    Storage-->>App: Storage path
    App->>DB: Save path in record
    Note over App: For display, create signed URL on-the-fly
```
