# Core Architecture

This directory is the hexagonal architecture base for the project.

## Dependency Direction

Dependencies must always point in this direction:

`infrastructure -> application -> domain`

## Layer Rules

- `domain`: entities, value objects, domain services, repository ports.
- `application`: use cases that orchestrate domain rules through ports.
- `infrastructure`: adapters (DB, HTTP, external APIs) implementing ports.
- `composition`: dependency wiring for entrypoints (routes, actions, pages).

## Module Structure

Each business module lives under `core/modules/<module-name>/`:

- `domain/`
- `application/`
- `infrastructure/`

Cross-cutting code shared by many modules belongs to `core/modules/shared/`.
