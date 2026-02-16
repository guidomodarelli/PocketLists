# Module Map

This file documents how current project areas map into `core/`.

## Current -> Target

- `app/features/lists/*` -> `core/modules/lists/*`
- `app/api/lists/route.ts` -> `core/composition/lists.ts` + `core/modules/lists/application/use-cases/*`
- `app/features/lists/actions.ts` -> `core/composition/lists.ts` + `core/modules/lists/application/use-cases/*`
- `lib/db/*` -> shared infrastructure adapters used by `core/modules/*`

## Active Bounded Contexts

- `lists`: list aggregate + items + sub-items (tree behavior, ABM, confirmations).

## Shared/Cross-Cutting

- DB client bootstrap and reusable infra helpers stay in `lib/` and are consumed by `core/infrastructure`.
- Feature entrypoints (`app/`, `pages/`) should call use cases through composition roots.
