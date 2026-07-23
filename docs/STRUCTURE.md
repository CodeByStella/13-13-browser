# Project structure

```
Google Chrome/
├── shared/                    # Cross-process: types, IPC names, pure utils
│   ├── types/
│   ├── ipc/
│   └── utils/
├── electron/                  # Main process
│   ├── main.ts
│   ├── app/                   # Bootstrap & app context
│   ├── ipc/                   # IPC handlers by domain
│   ├── services/
│   │   ├── tabs/              # TabManager
│   │   ├── privacy/           # Privacy engine, content protection
│   │   ├── permissions/       # Per-site permission resolver
│   │   └── bookmarks-service.ts
│   ├── stores/                # JSON persistence
│   ├── windows/               # Frameless popup windows
│   ├── lib/                   # Electron helpers (shared.ts, dev-server)
│   └── preload/               # contextBridge APIs
├── src/                       # Renderer (React)
│   ├── app/                   # App shell
│   ├── features/              # Stateful hooks by feature
│   ├── components/
│   │   ├── chrome/            # Browser UI (tabs, toolbar, find bar…)
│   │   └── ui/                # Shared presentational (icons)
│   ├── styles/
│   └── types/                 # Re-exports from @shared/types
└── public/                    # Static pages + popup HTML
```

## Adding a feature

1. Types → `shared/types/`
2. IPC channels → `shared/ipc/channels.ts`
3. Main logic → `electron/services/<domain>/`
4. IPC handler → `electron/ipc/<domain>.ipc.ts`
5. Preload API → `electron/preload/browser-api.ts`
6. UI hook → `src/features/<feature>/`
7. Components → `src/components/chrome/` or `src/components/ui/`
