# Repository Guidelines

## Build, Test, and Development Commands
- `npm run dev`: starts the local dev server on `http://localhost:3000` with hot reload.
- `npm run build`: creates the production build; run this before opening a PR.
- `npm run start`: serves the production build after `npm run build`.
- `npm run lint`: runs ESLint with Next.js Core Web Vitals + TypeScript rules.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled; prefer explicit types for non-trivial data structures.

## Estándares obligatorios de UI y estilos

- **Tailwind CSS obligatorio**: los estilos de la interfaz deben construirse utilizando Tailwind CSS como base.
- **SCSS Module obligatorio por componente/página**: cada archivo de componente o página debe tener su archivo asociado `Nombre.module.scss` en la misma carpeta, compartiendo el mismo nombre base.
- **Estructura de carpetas obligatoria (no reservados)**:
  - Cada componente debe vivir en una carpeta con su mismo nombre.
  - Cada página no reservada debe vivir en una carpeta con su mismo nombre.
  - Dentro de esa carpeta, el archivo TSX y el archivo SCSS Module deben compartir nombre base.
  - Ejemplo: `Componente/Componente.tsx` + `Componente/Componente.module.scss`.
- **Excepción para archivos reservados de Next.js**: `page.tsx`, `layout.tsx`, `loading.tsx` y `error.tsx` mantienen su convención de nombre reservada, pero igual deben tener su archivo asociado (`page.module.scss`, `layout.module.scss`, etc.).
- **BEM mandatorio en SCSS**: todas las clases declaradas en `*.module.scss` deben seguir BEM (`bloque`, `bloque__elemento`, `bloque--modificador`, `bloque__elemento--modificador`).
- **shadcn/ui obligatorio como primera opción**:
  - Antes de crear UI nueva, usar primero componentes existentes de `shadcn/ui`.
  - Si el componente exacto no existe pero uno existente se puede ajustar con cambios leves, modificar ese componente priorizando valores por defecto y manteniendo compatibilidad.
  - Crear un componente nuevo solo como última opción, cuando no exista alternativa reutilizable.
  - Los componentes de `shadcn/ui` se agregan siempre usando CLI (`npx shadcn@latest add <component>`), no copiando código manualmente.
  - Los componentes generados por `shadcn/ui` en `components/ui/**` quedan exceptuados de la regla de SCSS Module + BEM; se estilizan con sus variantes/utilidades Tailwind y `cn`.

## Security & Configuration Tips
- Never commit secrets. Keep local values in `.env.local` (all `.env*` files are gitignored).
- Review dependency and config changes carefully, especially in `next.config.ts` and auth/runtime-related code.

## Estrategia de testing (obligatoria)

- **TDD obligatorio SIEMPRE** para cualquier cambio de código (nueva feature, refactor, bugfix o ajuste menor).
- Flujo mandatorio en cada iteración:
  1. Implementar o actualizar tests primero.
  2. Verificar que fallen por la razón esperada (fase roja).
  3. Implementar la solución mínima en código productivo.
  4. Ejecutar tests y validar que pasen (fase verde).
  5. Refactorizar manteniendo tests en verde.
  6. Repetir el ciclo hasta cubrir el alcance completo.
- No se considera terminado un cambio sin tests que cubran happy path y edge cases relevantes.

## 📁 Estructura típica

```txt
.
├── app/                        # App Router (core del routing)
│   ├── layout.tsx              # Layout raíz (html, body, providers)
│   ├── page.tsx                # Página principal (/)
│   ├── loading.tsx             # UI de loading para la ruta
│   ├── error.tsx               # Error boundary de la ruta
│   ├── not-found.tsx           # 404
│   │
│   ├── api/                    # Route Handlers (API)
│   │   └── users/
│   │       └── route.ts        # GET, POST, etc.
│   │
│   ├── (auth)/                 # Route Group (no afecta la URL)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── components/             # Componentes reutilizables (UI)
│   │   ├── ui/                 # Componentes presentacionales
│   │   └── shared/             # Componentes con lógica compartida
│   │
│   ├── features/               # Features / módulos de dominio
│   │   ├── users/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services.ts
│   │   └── billing/
│   │
│   └── lib/                    # Utilidades, helpers, clientes
│       ├── db.ts               # Cliente DB
│       ├── auth.ts             # Auth helpers
│       └── fetcher.ts
│
├── hooks/                      # Custom React hooks globales
│
├── public/                     # Assets estáticos
│   ├── images/
│   └── fonts/
│
├── next.config.js              # Configuración Next.js
├── tsconfig.json
├── package.json
├── AGENTS.md                   # Reglas / convenciones del repo
└── README.md
```

---

## 🧠 Notas clave

* **Layouts son jerárquicos**: cada carpeta puede tener su propio `layout.tsx`.
* **Route Groups `(…)`** organizan sin afectar la URL.
* **Server Components por defecto** (usar `"use client"` solo cuando hace falta).

---

## 🧩 Variante ultra-estricta

Podés agregar al final de `AGENTS.md` algo como:

- El routing vive exclusivamente en `app/`
- No se permite lógica de dominio en `components/ui`
- Los Server Components son el default
- `"use client"` debe justificarse
- Las APIs usan `app/api/**/route.ts`

## Alcance y objetivos

- Resolver un flujo completo SSR + API para listas (servidor + cliente).
- Integrar validación, mocks de servicios externos y contratos de datos estables.
- Mantener modularidad (servicios, hooks, componentes) y estándares consistentes.

## Estados de la UI

- Carga: muestra un indicador de estado de carga con la etiqueta "Cargando listas..." mientras se obtienen los datos del cliente.
- Vacío: muestra un mensaje informativo cuando la lista de listas está vacía.
- Error: muestra un mensaje seguro y orientado a la acción cuando falla la obtención de datos SSR o del cliente, incluyendo errores de validación para parámetros de consulta inválidos.

## Plan

### Enfoque de alto nivel

- **Descubrimiento y contrato**: alinear el alcance del endpoint y la forma del dato para que server y UI trabajen con un contrato estable.
- **Backend solo servidor**: resolver la integración mediante servicios y mocks, con validaciones centrales y observabilidad segura.
- **SSR + cliente**: entregar SSR estable y permitir refresco de datos en cliente sin duplicar solicitudes.
- **Interfaz accesible**: construir la vista con estados claros y priorizando semántica y accesibilidad.
- **Diseño responsivo**: aplicar estilos modulares con enfoque mobile-first.
- **Calidad y pruebas**: cubrir con pruebas unitarias y asegurar calidad por linting, accesibilidad y reportes.

### Entregables

- Endpoint de listas listo para SSR y consumo cliente.
- Servicio de listas con mocks y normalización consistente.
- Página SSR con UI de resultados y estados controlados.
- Componentes con estilos modulares y diseño responsivo.
- Pruebas y checks de calidad integrados.

### Patrones de código

- Nomenclatura semántica: nombres descriptivos para variables, funciones, componentes y archivos.
- Retornos tempranos: manejar casos inválidos al inicio y evitar anidamientos profundos.
- Manejo de errores centralizado: concentrar la lógica en handlers/servicios y devolver respuestas consistentes.

## Documentación arquitectónica y decisiones (ADR)

- Registrar decisiones importantes bajo `docs/` con ADRs numerados (ej: `ADR-001`, `ADR-002`).
- Cada ADR debe incluir contexto, decisión, alternativas consideradas y consecuencias.
- Usar ADRs para definir estándares de cambios futuros y asegurar trazabilidad.

## Anexos y utilitarios

- Plantillas: ADR, changelog y release notes con estructura mínima para mantener trazabilidad.
- Scripts automatizados (pseudocódigo): smoke tests y verificación de despliegue.
- Uso recomendado:
  - Antes de merge: completar ADR si hay decisión relevante y actualizar CHANGELOG si aplica.
  - Antes de release: generar RELEASE_NOTES desde CHANGELOG.
- Post-despliegue: ejecutar smoke tests y verificación de despliegue.

Plantilla ADR (mínima):

```
ADR-XXX: Título
Fecha: YYYY-MM-DD
Estado: Propuesto | Aceptado | Rechazado | Reemplazado

Contexto:
- Qué problema se resuelve y por qué ahora.

Decisión:
- Qué se decide y alcance.

Alternativas:
- Opciones evaluadas y por qué se descartan.

Consecuencias:
- Impacto técnico y operativo.
```

Plantilla CHANGELOG (mínima):

```
## [Sin publicar]
- Agregado:
- Cambiado:
- Corregido:

## [X.Y.Z] - YYYY-MM-DD
- Agregado:
- Cambiado:
- Corregido:
```

Plantilla RELEASE_NOTES (mínima):

```
# Lanzamiento X.Y.Z - YYYY-MM-DD

Destacados:
- Cambio principal.

Cambios:
- Agregado:
- Cambiado:
- Corregido:

Problemas conocidos:
- Lista corta si aplica.

Reversión:
- Pasos resumidos o referencia al runbook.
```

Scripts en pseudocódigo

```
smoke_test:
  http_get "/" => assert status 200
  http_get "/api/products?siteId=MLA&limit=1" => assert status 200
  assert response.items length >= 0

deploy_verification:
  assert last_deploy == expected_version
  assert error_rate_5xx <= 2% for 15m
  assert latency_p95 <= baseline * 1.2
  assert feature_flags == expected_state
```

## Guia de codificacion

Se fomentan las contribuciones a este proyecto porque sabemos que distintos desarrolladores enriquecen nuestras codebases :punch:.

Sin embargo, absorber todas las contribuciones tal cual podria generar dificultades en el mantenimiento del codebase si no se controlan. Los codebases colaborativos suelen establecer lineamientos para que las contribuciones se mantengan sostenibles en el tiempo.

El proposito de esta guia es establecer un estandar para las contribuciones. Estas guias no buscan limitar las herramientas a tu disposicion ni reconfigurar tu forma de pensar, sino incentivar mejores practicas.

### Lineamientos de idioma

Usamos **English** como idioma por defecto para todo el proyecto.

Excepciones permitidas (y unicas):

- Archivos `*.md`.
- Texto mostrado al usuario final en pantalla (copy de UI, labels, placeholders, mensajes de validacion y feedback visible para usuario).
- Texto de errores en strings (por ejemplo, `throw new Error(...)`, campos `error/details` de respuestas API y mensajes de validacion/negocio de error).

Todo lo demas debe estar en **English**, incluyendo:

- Nombres de carpetas, archivos y rutas.
- Nombres de componentes, funciones, variables, clases, tipos, interfaces, enums y constantes.
- Nombres de clases CSS/SCSS y selectores BEM.
- Comentarios tecnicos, logs y mensajes internos no visibles para usuario (excepto mensajes de error).
- Mensajes de commit, PRs y comentarios de revision.

Si hay duda, la regla por defecto es: **English**.

### Lineamientos de comentarios :speech_balloon:

Los comentarios de codigo son dificiles de escribir, no porque sea dificil producir palabras sino porque es dificil escribir comentarios relevantes. Demasiados comentarios hacen que la gente no los lea (sin mencionar que dificultan la lectura del codigo). Muy pocos comentarios obligan a leer grandes porciones del codebase para entender que hace una feature o un bloque de codigo. Ambas situaciones son indeseables y siempre se deben hacer esfuerzos por tener una experiencia agradable al leer comentarios.

Como regla general, deberias comentar decisiones que tomaste mientras codificabas y que no forman parte de una especificacion.

En particular, siempre deberias comentar cualquier decision que:

- se aparte de la sabiduria comun o una convencion (el por que es necesario).
- haya tomado un tiempo significativo producirla. Una buena regla es: si pasaste mas de 1 hora pensando como producir un fragmento de codigo que tardaste 2 minutos en escribir, deberias documentar tu razonamiento para ayudar al lector y permitir validacion.
- necesite preservar propiedades de la implementacion. Este es el caso de porciones sensibles a performance, sincronizacion de corutinas, implementaciones de primitivas de seguridad, algoritmos de control de congestion, etc.

Como regla general de lo que no se debe comentar, evita:

- comentar la estructura de programas que ya forma parte de una convencion, especificada o no.
- explicaciones pedantes de comportamiento que pueden encontrarse con una lectura inmediata de los artefactos alrededor.
- comentar comportamientos que no puedes atestiguar.

### Lineamientos de branching :twisted_rightwards_arrows:

#### Seguir esta convencion de nombres:

- Para un patch que arregla un comportamiento no deseado por un bug, el nombre de la branch debe comenzar con `fix/`
- Para una nueva feature o un cambio en una feature existente, el nombre de la branch debe comenzar con `feature/`
- Luego de la categoria, el nombre debe tener como maximo tres palabras, en minusculas y separadas por guiones.
- Ejemplo: `feature/debounce`, `fix/question-box-height`

#### Diagrama GitFlow

```mermaid
gitGraph
   commit id: "init"
   branch develop
   checkout develop
   commit id: "dev-setup"
   branch "feature/catalog"
   checkout "feature/catalog"
   commit id: "feat-1"
   commit id: "feat-2"
   checkout develop
   merge "feature/catalog"
   commit id: "integrate-feature"
   branch "release/1.0.0"
   checkout "release/1.0.0"
   commit id: "prepare-release"
   checkout main
   merge "release/1.0.0" tag: "v1.0.0"
   checkout develop
   merge "release/1.0.0"
   branch "hotfix/1.0.1"
   checkout "hotfix/1.0.1"
   commit id: "hotfix-issue"
   checkout main
   merge "hotfix/1.0.1" tag: "v1.0.1"
   checkout develop
   merge "hotfix/1.0.1"
```

Flujo: las features salen de `develop` y vuelven a `develop`; las releases salen de `develop` y se mergean a `main` y luego de vuelta a `develop`; los hotfix salen de `main` y se mergean a `main` y `develop`.

### Versionado

Adoptamos el sistema de versionado [semver](https://semver.org/): **MAJOR.MINOR.PATCH**

- MAJOR para cambios incompatibles con versiones anteriores
- MINOR para cambios compatibles que agregan nuevas features o mejoras
- PATCH para cambios compatibles, fixes o cambios minimos

### Lineamientos de CHANGELOG :page_facing_up:

En cada version de un proyecto recuerda **honrar** el lineamiento [Keep a CHANGELOG](https://keepachangelog.com/en):

1. Los changelogs son para humanos :busts_in_silhouette:, no para maquinas :robot:.
2. Debe haber una entrada para cada version.
3. Los mismos **tipos de cambios** deben agruparse.
4. Las versiones y secciones deben ser enlazables.
5. La version mas reciente va primero.
6. La fecha de release de cada version se muestra en el formato YYYY-MM-DD.

#### Tipos de cambio:

- `Added` para nuevas features.
- `Changed` para cambios en funcionalidad existente.
- `Deprecated` para lo que se eliminara pronto.
- `Removed` para lo eliminado actualmente.
- `Fixed` para fixes de bugs.
- `Security` en caso de vulnerabilidades.
