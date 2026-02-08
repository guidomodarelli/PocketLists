# PocketLists

## Descripcion general

Listas simples y rápidas para la vida real. Crea y gestiona listas de compras, checklists de viaje y notas rápidas — todo sincronizado de forma fluida.

## Alcance y objetivos

- Resolver un flujo completo SSR + API para listas (server + client).
- Integrar validacion, mocks de servicios externos y contratos de datos estables.
- Mantener modularidad (servicios, hooks, componentes) y estandares estandarizados.

## UI states

- Loading: muestra un indicador de estado de carga con la etiqueta "Cargando listas..." mientras se obtienen los datos del cliente.
- Empty: muestra un mensaje informativo cuando la lista de listas está vacía.
- Error: muestra un mensaje seguro y orientado a la acción cuando falla la obtención de datos SSR o del cliente, incluyendo errores de validación para parámetros de consulta inválidos.

## Plan

### Enfoque de alto nivel

- **Descubrimiento y contrato**: alinear el alcance del endpoint y la forma del dato para que server y UI trabajen con un contrato estable.
- **Backend server-only**: resolver la integracion mediante servicios y mocks, con validaciones centrales y observabilidad segura.
- **SSR + cliente**: entregar SSR estable y permitir refresco de datos en cliente sin duplicar requests.
- **UI accesible**: construir la vista con estados claros y priorizando semantica y accesibilidad.
- **Diseño responsive**: aplicar estilos modulares con enfoque mobile-first.
- **Calidad y tests**: cubrir con tests unitarios y asegurar calidad por linting, accesibilidad y reportes.

### Entregables

- Endpoint de listas listo para SSR y consumo cliente.
- Servicio de listas con mocks y normalizacion consistente.
- Pagina SSR con UI de resultados y estados controlados.
- Componentes con estilos modulares y diseño responsive.
- Tests y checks de calidad integrados.
### Patrones de codigo

- Nomenclatura semantica: nombres descriptivos para variables, funciones, componentes y archivos.
- Early returns: manejar casos invalidos al inicio y evitar anidamientos profundos.
- Manejo de errores centralizado: concentrar la logica en handlers/servicios y devolver respuestas consistentes.

### Politicas de CI y calidad

- El merge se bloquea si fallan lint (`npm run lint`), tests (`npm run test`) o build (`npm run build`).
- Todo cambio debe traer tests cuando aplique (ver `tests/`) y pasar localmente antes del PR.
- La calidad se asegura con los checks anteriores y el seguimiento de las guias de contribucion.

### Convencion de commits y branching (opcional)

- Branches con prefijos `feature/` y `fix/`, en minusculas y con guiones (ver la seccion "Guia de codificacion").
- Commits siguiendo las 7 reglas de commit messages (ver la seccion "Guia de codificacion").

## Documentacion arquitectonica y decisiones (ADR)

- Registrar decisiones importantes bajo `docs/` con ADRs numerados (ej: `ADR-001`, `ADR-002`).
- Cada ADR debe incluir contexto, decision, alternativas consideradas y consecuencias.
- Usar ADRs para definir estandares de cambios futuros y asegurar trazabilidad.

## Seguridad y manejo de datos sensibles

- Los secretos se gestionan con el gestor de secretos de la organizacion y nunca se versionan en el repositorio.
- No se deben almacenar ni loguear datos sensibles: informacion personal, tokens, credenciales, cookies o payloads con PII.

## Pruebas y cobertura

- Estrategia: unitarias (componentes, utils, servicios), integracion (API + servicios con mocks) y E2E (flujos completos con WebdriverIO).
- Cobertura minima: 80% en statements, branches, functions y lines, reportada por Jest en `coverage/`.
- Scripts: `npm run test:unit`, `npm run test:e2e`, `npm run test:a11y`, `npm run test` (todos), `npm run lint` y `npm run build` para validaciones automaticas.
- Accesibilidad: `npm run test:a11y` ejecuta axe-core sobre vistas clave para cumplir WCAG.
- Visual: snapshots en tests unitarios para detectar regresiones de UI.

## Anexos y utilitarios

- Plantillas: ADR, changelog y release notes con estructura minima para mantener trazabilidad.
- Scripts automatizados (pseudocodigo): smoke tests y verificacion de despliegue.
- Uso recomendado:
  - Antes de merge: completar ADR si hay decision relevante y actualizar CHANGELOG si aplica.
  - Antes de release: generar RELEASE_NOTES desde CHANGELOG.
  - Post-deploy: ejecutar smoke tests y verificacion de despliegue.

Plantilla ADR (minima):

```
ADR-XXX: Titulo
Fecha: YYYY-MM-DD
Estado: Propuesto | Aceptado | Rechazado | Reemplazado

Contexto:
- Que problema se resuelve y por que ahora.

Decision:
- Que se decide y alcance.

Alternativas:
- Opciones evaluadas y por que se descartan.

Consecuencias:
- Impacto tecnico y operativo.
```

Plantilla CHANGELOG (minima):

```
## [Unreleased]
- Added:
- Changed:
- Fixed:

## [X.Y.Z] - YYYY-MM-DD
- Added:
- Changed:
- Fixed:
```

Plantilla RELEASE_NOTES (minima):

```
# Release X.Y.Z - YYYY-MM-DD

Highlights:
- Cambio principal.

Changes:
- Added:
- Changed:
- Fixed:

Known issues:
- Lista corta si aplica.

Rollback:
- Pasos resumidos o referencia al runbook.
```

Scripts en pseudocodigo

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

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
