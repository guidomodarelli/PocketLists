Generá el contenido completo de un Pull Request describiendo **todo lo implementado en el estado actual del repositorio**.

Instrucciones obligatorias:

1. Analizá los cambios de código y tests reales del workspace (archivos modificados, agregados y eliminados) usando `main` como referencia de comparación.
2. La referencia a `main` es solo para análisis interno del comando y nunca debe aparecer en el texto final.
3. No menciones frases como "contra main", "respecto de main", "base branch", ni equivalentes.
4. Escribí en español claro y técnico, con foco en:
   - problema resuelto,
   - alcance funcional,
   - decisiones relevantes,
   - impacto en API/endpoints,
   - validación con pruebas.
5. Si no encontrás issue asociado, dejá `Fixes #N/A`.
6. Si no hubo cambios en endpoints en alguna categoría, dejar explícitamente `- Ninguno`.
7. Usá checkboxes marcando solo lo que aplica (`[x]`) y eliminá lo irrelevante cuando corresponda.

Salida obligatoria:

# Pull Request

## 🧾 Descripción

Incluya un resumen del cambio y el problema que se solucionó.
Enumere las dependencias necesarias para este cambio si es que hay.

## 📝 Cambios en el código

- `filename.test.tsx`: descripción del cambio, decisión relevante, impacto en API/endpoints, validación con pruebas.
- `filename.module.scss`: descripción del cambio, decisión relevante, impacto en API/endpoints, validación con pruebas.
- `filename.ts`: descripción del cambio, decisión relevante, impacto en API/endpoints, validación con pruebas.

## 🧩 Tipo de cambios

- [ ] Bug fix (cambio permanente que soluciona un problema)
- [ ] New feature (cambio que agrega funcionalidad)
- [ ] Breaking change (corrección o característica que haría que la funcionalidad existente no funcione como se espera)

## ✅ ¿De qué forma se puede testear?

Describe las pruebas que realizaste para verificar tus cambios.

- [ ] Test en el componente
- [ ] Test en el service
- [ ] Test en endpoints/API
- [ ] Test de build/lint

**URL PARA PODER PROBAR LOS CAMBIOS**:

- URL:
- Acciones a seguir:
  - ...
  - ...
  - ...

## 🛣️ Endpoints agregados

- [ ] user/etc....
- [ ] user/etc....
- [ ] user/etc....
- [ ] user/etc....

## 🛠️ Endpoints modificados

- [ ] user/etc....
- [ ] user/etc....
- [ ] user/etc....
- [ ] user/etc....

## 🗑️ Endpoints borrados

- [ ] user/etc....
- [ ] user/etc....
- [ ] user/etc....
- [ ] user/etc....

Notas de calidad de la respuesta:

- No inventes cambios: todo debe estar respaldado por archivos y diff reales.
- Si agregás dependencias, aclará el motivo de cada una.
- Si hubo cambios de arquitectura/migración, explicá brevemente el antes y el después.
- Priorizá información accionable para reviewer (riesgos, validaciones y alcance).
