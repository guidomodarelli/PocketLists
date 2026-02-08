# PocketLists

## Descripción general

Listas simples y rápidas para la vida real. Crea y gestiona listas de compras, checklists de viaje y notas rápidas — todo sincronizado de forma fluida.

## Plan

### Políticas de CI y calidad

- El merge se bloquea si fallan lint (`npm run lint`), tests (`npm run test`) o build (`npm run build`).
- Todo cambio debe traer tests cuando aplique (ver `tests/`) y pasar localmente antes del PR.
- La calidad se asegura con los checks anteriores y el seguimiento de las guías de contribución.

### Convención de commits y ramas (opcional)

- Ramas con prefijos `feature/` y `fix/`, en minúsculas y con guiones (ver la sección "Guía de codificación").
- Commits siguiendo las 7 reglas de mensajes de commit (ver la sección "Guía de codificación").

## Seguridad y manejo de datos sensibles

- Los secretos se gestionan con el gestor de secretos de la organización y nunca se versionan en el repositorio.
- No se deben almacenar ni loguear datos sensibles: información personal, tokens, credenciales, cookies o payloads con PII.

## Pruebas y cobertura

- Estrategia: unitarias (componentes, utils, servicios), integración (API + servicios con mocks) y E2E (flujos completos con WebdriverIO).
- Cobertura mínima: 80% en statements, branches, functions y lines, reportada por Jest en `coverage/`.
- Scripts: `npm run test:unit`, `npm run test:e2e`, `npm run test:a11y`, `npm run test` (todos), `npm run lint` y `npm run build` para validaciones automáticas.
- Accesibilidad: `npm run test:a11y` ejecuta axe-core sobre vistas clave para cumplir WCAG.
- Visual: snapshots en tests unitarios para detectar regresiones de UI.

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
