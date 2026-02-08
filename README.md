# PocketLists

## Descripción general

Listas simples y rápidas para la vida real. Crea y gestiona listas de compras, checklists de viaje y notas rápidas — todo sincronizado de forma fluida.

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

### Políticas de CI y calidad

- El merge se bloquea si fallan lint (`npm run lint`), tests (`npm run test`) o build (`npm run build`).
- Todo cambio debe traer tests cuando aplique (ver `tests/`) y pasar localmente antes del PR.
- La calidad se asegura con los checks anteriores y el seguimiento de las guías de contribución.

### Convención de commits y ramas (opcional)

- Ramas con prefijos `feature/` y `fix/`, en minúsculas y con guiones (ver la sección "Guía de codificación").
- Commits siguiendo las 7 reglas de mensajes de commit (ver la sección "Guía de codificación").

## Documentación arquitectónica y decisiones (ADR)

- Registrar decisiones importantes bajo `docs/` con ADRs numerados (ej: `ADR-001`, `ADR-002`).
- Cada ADR debe incluir contexto, decisión, alternativas consideradas y consecuencias.
- Usar ADRs para definir estándares de cambios futuros y asegurar trazabilidad.

## Seguridad y manejo de datos sensibles

- Los secretos se gestionan con el gestor de secretos de la organización y nunca se versionan en el repositorio.
- No se deben almacenar ni loguear datos sensibles: información personal, tokens, credenciales, cookies o payloads con PII.

## Pruebas y cobertura

- Estrategia: unitarias (componentes, utils, servicios), integración (API + servicios con mocks) y E2E (flujos completos con WebdriverIO).
- Cobertura mínima: 80% en statements, branches, functions y lines, reportada por Jest en `coverage/`.
- Scripts: `npm run test:unit`, `npm run test:e2e`, `npm run test:a11y`, `npm run test` (todos), `npm run lint` y `npm run build` para validaciones automáticas.
- Accesibilidad: `npm run test:a11y` ejecuta axe-core sobre vistas clave para cumplir WCAG.
- Visual: snapshots en tests unitarios para detectar regresiones de UI.

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

## Primeros pasos

Primero, ejecuta el servidor de desarrollo:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

Puedes empezar a editar la página modificando `app/page.tsx`. La página se actualiza automáticamente a medida que editas el archivo.

Este proyecto usa [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) para optimizar y cargar automáticamente [Geist](https://vercel.com/font), una nueva familia tipográfica de Vercel.

## Más información

Para saber más sobre Next.js, revisa los siguientes recursos:

- [Documentación de Next.js](https://nextjs.org/docs) - conoce las funciones y la API de Next.js.
- [Aprende Next.js](https://nextjs.org/learn) - un tutorial interactivo de Next.js.

Puedes visitar [el repositorio de Next.js en GitHub](https://github.com/vercel/next.js) - ¡tus comentarios y contribuciones son bienvenidos!

## Despliegue en Vercel

La forma más sencilla de desplegar tu aplicación de Next.js es usar la [plataforma de Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) de los creadores de Next.js.

Consulta nuestra [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para más detalles.
