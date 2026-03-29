# Implementation Plan - Google Books 429 / API key handling

## Objetivo
Reducir errores `429` en búsquedas de Google Books y mejorar el diagnóstico cuando falta configuración de API key en React Native.

## Cambios propuestos
1. **`apps/mobile/src/services/googleBooksService.ts`**
   - Añadir error tipado para distinguir `RATE_LIMIT` (429) de otros errores.
   - Mejorar `fetchWithRetry` para usar `Retry-After` cuando venga en headers y soportar `AbortSignal`.
   - Mantener cache en memoria y emitir warnings claros cuando no hay API key disponible.

2. **`apps/mobile/src/screens/LibraryScreen.tsx`**
   - Reducir presión de requests subiendo debounce de búsqueda.
   - Cancelar búsquedas previas con `AbortController` al cambiar el texto.
   - Mostrar feedback de error más útil cuando ocurra 429.

## Testing / Verification
1. Ejecutar `git status --short` para confirmar archivos modificados esperados.
2. Ejecutar `git diff -- apps/mobile/src/services/googleBooksService.ts apps/mobile/src/screens/LibraryScreen.tsx implementation_plan.md` para validar cambios.
3. Ejecutar `yarn --cwd apps/mobile lint` (si hay entorno listo) para chequeo estático rápido.
4. Validación manual:
   - Buscar varios términos seguidos en Library.
   - Confirmar que se cancelan requests viejas (sin parpadeos raros).
   - Ver mensaje amigable ante 429.