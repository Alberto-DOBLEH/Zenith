# Zenith — Guía del proyecto

Aplicación web de seguimiento de hábitos para la materia Desarrollo Web 2.

## Stack

- **Frontend**: Angular 21 (standalone components, CSS puro con variables CSS + bootstrap-icons).
- **Backend**: Node.js + Express 5 + `pg`, patrón routes → controller → service.
- **Base de datos**: PostgreSQL en Supabase (proyecto remoto `fimeoxsgabbttjqtxwek`). Backend se conecta vía pooler como rol `postgres` (bypass RLS).

## Comandos útiles

- Backend: `cd backend && npm run dev` (nodemon, puerto 3000).
- Frontend: `cd zenith-frontend && npm start` (Angular dev server).
- Supabase: `supabase db push` para aplicar migraciones al remoto.

## Convenciones backend

- Cada módulo vive en `backend/src/modules/<nombre>/` con `*.routes.js`, `*.controller.js`, `*.service.js`.
- Todas las rutas (salvo auth) pasan por `verifyToken` (JWT en header `Authorization: Bearer <token>`).
- Los servicios lanzan errores con `{ status, message }`; los controllers lo transforman en JSON.
- El esquema de BD usa **enums** para estados (ver `supabase/migrations/`).

## Seguridad y pruebas

- **Suite de pruebas de seguridad** (auth, IDOR, SQLi, XSS, headers, rate limit): `cd backend && npm test`. Levanta su propio servidor en el puerto **3100** (no toca el de dev en 3000) y requiere Supabase local corriendo (`npx supabase start`). Al terminar elimina los usuarios de prueba. Si se re-corre de inmediato, el test de rate limit queda reseteado por levantar servidor nuevo; si el de registro fallara por límite, subir `RATE_LIMIT_REGISTRO` al arrancar.
- **Hardening backend**: `helmet()` (headers de seguridad), CORS allowlist desde `CORS_ORIGIN` (comas; sin valor = todos los orígenes para dev), `express-rate-limit` en login (10 fallos/15 min, no cuenta éxitos) y registro (50/15 min), `GET /health`, error handler JSON genérico en producción (sin detalles de `pg`/stack), `validarId` en rutas con `:id`, y fail-fast en `server.js` si faltan `JWT_SECRET`/`DB_*`. `JWT_SECRET` se genera con `openssl rand -hex 32`.
- **`npm audit` backend**: 0 vulnerabilidades. **Frontend**: 11 hallazgos en `undici`/`esbuild` son solo del **tooling de build** de Angular 21 (no llegan al bundle desplegado); el fix real exige Angular 22, se dejan documentadas.

## Deploy

- **Supabase**: `supabase db push` aplica las migraciones al proyecto remoto. La conexión usa el rol `postgres` (bypass RLS); seguridad a nivel de app.
- **Backend (Render)**: env vars `DB_USER=postgres.fimeoxsgabbttjqtxwek`, `DB_HOST` (pooler `aws-0-us-west-1.pooler.supabase.com`), `DB_NAME=postgres`, `DB_PASSWORD`, `DB_PORT=6543`, `DB_SSL=true`, `JWT_SECRET` (`openssl rand -hex 32`), `JWT_EXPIRES_IN=7d`, `NODE_ENV=production`, `CORS_ORIGIN=https://<proyecto>.vercel.app`. Render asigna `PORT` automáticamente; no configurarlo. Nunca subir `.env` al repo (ya ignorado).
- **Frontend (Vercel)**: root directory `zenith-frontend`, build `ng build` (usa `environment.prod.ts` vía `fileReplacements`; actualizar su `apiUrl` al dominio real de Render antes de buildear), output `dist/zenith-frontend/browser`, y `vercel.json` con rewrites SPA (deep links → `index.html`). La ruta `**` muestra la página 404.
- Verificación post-deploy con curl: `GET /health` en Render, deep links (`/perfil`, `/notas`) → 200 en Vercel, y login/registro de extremo a extremo. La suite de seguridad puede apuntarse al deploy con `BASE_URL`.

## Plan de trabajo del frontend

El plan completo de implementación del frontend (arquitectura, sistema de diseño, secciones por prioridad y endpoints) vive en `Docs/plan-frontend.md`. Al retomar trabajo del frontend, consultarlo primero; las secciones se marcan ✅/⬜ según avance. La siguiente sección pendiente es la **Sección 1** (layout principal + dashboard con datos reales).

## Registro de cambios por fecha

Las entradas más recientes van al inicio. Al finalizar trabajo nuevo, agregar una entrada con la fecha del día y los cambios hechos.

### 2026-08-17
- **Hardening de seguridad (preparación para deploy)**:
  - Backend: `helmet()`, CORS allowlist desde `CORS_ORIGIN`, `express-rate-limit` en login (10 fallos/15 min, no cuenta éxitos) y registro (50/15 min), `GET /health`, error handler JSON genérico (`enviarError`, oculta detalles de `pg`/stack en producción) en los 10 controllers, `validarId` en todas las rutas con `:id`, y fail-fast en `server.js` si faltan `JWT_SECRET`/`DB_*`. `nodemon` movido a `devDependencies`.
  - Fix real encontrado por la suite: `GET /api/notas/por-fecha` con fecha inválida daba 500 con detalle de pg → ahora valida `YYYY-MM-DD` y responde 400.
  - **Suite de pruebas de seguridad** `backend/scripts/pruebas-seguridad.js` (`node --test`): health/headers, validación de registro, login sin revelar existencia, token inválido/manipulado/vencido, batería de SQLi sin fuga de errores, validación de ids, IDOR (usuario A no accede a recursos de B: hábito/nota/evento/pomodoro/estadísticas → 404), XSS almacenado (el backend devuelve el payload tal cual; el render seguro lo garantiza Angular) y rate limit (429). Se corre con `npm test` desde `backend`: levanta su propio servidor en el puerto 3100 y lo cierra. **9/9 pass**.
  - Frontend: `environment.prod.ts` con `apiUrl` placeholder de Render + `fileReplacements` en `angular.json` (production), y `vercel.json` con rewrites SPA. **Pantalla 404** (`principales/no-encontrado`, ruta `**` en vez de redirect).
  - `npm audit`: backend **0 vulnerabilidades**; frontend 11 hallazgos en `undici`/`esbuild` (solo tooling de build de Angular 21, no llegan al bundle; fix real exige Angular 22).
  - Verificado: suite 9/9, `ng build` OK, `ng test` 12/12.

### 2026-08-15
- **Frontend — Sección 3 del plan completada** (ver `Docs/plan-frontend.md`):
  - **3.1 Perfil**: página completa con avatar grande en círculo (foto, avatar del catálogo `av-N.png` o iniciales), 3 tarjetas (Información con "Cambiar datos", Autenticación con "Cambiar contraseña", Administración con "Eliminar cuenta") y botón "Cerrar sesión" al pie. Modales: editar datos (nombre/apellidos/fecha nacimiento/país + selector de avatares con `GET /api/avatares` → `PUT /api/usuario/editar_perfil`), cambiar contraseña (`PUT /api/usuario/cambiar_password` con validación de actual), confirmación de eliminar cuenta (`DELETE /api/usuario/`) y confirmación de cerrar sesión. `usuarios.service` + `avatares.service` (ya existían). El header ahora muestra el avatar del usuario si tiene uno (`/assets/avatares/av-N.png`).
  - **3.2 Gráficas Chart.js**: instalado `chart.js`. En el dashboard, sección "Progreso" con línea semanal (% de completados por día de los últimos 7 días agrupado desde `GET /api/bitacora?periodo=semana`) y doughnut mensual (completados vs no completados desde `GET /api/estadisticas`). Se dibujan con `viewChild` + `effect()` (compatible zoneless): el effect se dispara cuando el `<canvas>` aparece y/o los datos cambian.
  - **Fix fecha `date` en perfil**: `pg` serializa columnas `date` como ISO con hora (`2000-05-10T06:00:00.000Z`), y `new Date()` en el navegador (UTC-7) la corre un día. `formatearFecha`/`aYyyyMmDd` usan la parte `YYYY-MM-DD` (mismo patrón que notas).
  - Verificado: `PUT editar_perfil` (avatar+fecha+pais) y `PUT cambiar_password` (401 con contraseña incorrecta) contra Supabase local. `ng build` OK, `ng test` 12/12 OK.
- **Pomodoro — temporizador congelado (mostraba 24:59 y no avanzaba)**: Angular 21 usa change detection **zoneless por defecto** (sin `provideZoneChangeDetection`); en ese modo solo disparan CD los signals, `markForCheck`, listeners, etc. El temporizador mutaba **propiedades planas** (`tiempoRestante`, `fase`, `corriendo`, `sesionActiva`…) dentro de `setInterval`, que nunca programa CD → la vista se congelaba. Solución: convertir todo el estado del temporizador a **signals** (`sesionActiva`, `fase`, `corriendo`, `tiempoRestante`, `cicloActual`, `ciclosCompletados`, `minutosRealizados`, `habitoBloqueado`), consistente con el resto del app. Verificado backend `POST /api/pomodoro` OK. Build y tests OK.
- **Eventos — modal de edición quedaba detrás del de detalle**: al pulsar "Editar" desde el modal de detalles, `abrirEditar` abría el formulario sin cerrar el detalle, y al estar el overlay del detalle después en el DOM, quedaba por encima (el formulario se veía "debajo"). Solución: `abrirEditar` ahora cierra primero el detalle (`cerrarDetalles()`) antes de abrir el formulario. Build y tests OK.
- **Eventos — calendario de 24 horas**: la franja visible era 8:00–22:00, así que eventos nocturnos (p.ej. Gimnasio a las 22:35) quedaban fuera y se ocultaban. Ahora `HORA_INICIO=0`/`HORA_FIN=24`, el grid se envuelve en `.contenedor-calendario` (overflow auto, `max-height: 70vh`) para hacer scroll vertical sobre las 24 h, y las etiquetas de hora se rellenan a 2 dígitos (`00:00`). El evento de las 22:35 ahora se posiciona en su hora real (top ~94%). Build y tests OK.
- **Eventos — eventos fuera de la franja visible (8:00–22:00)**: un evento que toca un día pero queda totalmente fuera de las horas visibles (p.ej. miércoles 19 a las 22:35) era descartado por `bloqueDelDia` (no aparecía en el calendario aunque sí en "Próximos eventos", que no revisa el rango horario). Solución: si el evento toca el día pero no hay solapamiento con la franja visible, se muestra como un indicador pegado al borde (4% de alto; arriba si empieza antes de las 8:00, abajo si termina después de las 22:00). Eliminado el `return null` previo. Verificado con el evento "Gimnasio" de alberto (2026-08-20T05:35Z = mié 19 22:35 local). Build y tests OK.
- **Eventos — fix de eventos que no aparecían en el día correcto + rango de fechas de la semana**: el backend devuelve `fecha_inicio`/`fecha_fin` en UTC ISO (`2026-08-19T16:00:00.000Z`), así que el filtro `fecha_inicio.startsWith(fechaLocal)` fallaba para eventos de tarde/noche (la parte de fecha UTC se corría al día siguiente y el evento no se reflejaba). Solución: comparar por fecha local con `mismoDiaCalendario()` (convierte a `Date` local). También `abrirEditar` ahora deriva fecha/hora de la `Date` local (antes usaba `slice` sobre el string UTC). El botón "Hoy (semana N)" ahora muestra el rango de fechas de la semana visible (`rangoSemana()`, p.ej. `17 ago – 23 ago 2026`); se eliminó `semanas()`. Build y tests OK.
- **Notas UI — botón de guardar oculto al ver nota pasada**: al abrir una nota histórica (con X para cerrar) ya no se muestra "Crear/Guardar nota del día" para evitar confusión; el botón vuelve al cerrar (`notas.html`).
- **Fix Notas backend — el `PUT /api/notas/:id` siempre daba 403**: `editarNota` comparaba `nota.fecha` (objeto `Date` de pg) contra `fechaHoy()` (string `YYYY-MM-DD`) → `Date !== string` era siempre verdadero, así que ni siquiera hoy se podía editar la nota del día. Solución: helper `fechaCorta()` que normaliza a `YYYY-MM-DD` antes de comparar (`backend/src/modules/notas/notas.service.js`). Verificado: PUT de la nota de hoy → 200; PUT de una nota de ayer → 403 correcto.
- **Fix Notas — la nota del día no se recargaba**: `pg` devuelve las columnas `date` como objeto `Date`, y JSON las serializa como ISO con hora (`"2026-08-15T00:00:00.000Z"`), no como `"2026-08-15"`. Por eso la comparación `n.fecha === fechaHoy` fallaba: la nota de hoy quedaba vacía al recargar y aparecía en el historial (y al guardar otra se sobreescribía por el upsert). Solución: normalizar la fecha a `YYYY-MM-DD` (`slice(0,10)`) en `notas.service.ts` (obtener, por-fecha, crear, editar). Build y tests OK.

### 2026-08-15
- **Frontend — Sección 2 del plan completada** (ver `Docs/plan-frontend.md`):
  - **2.1 Pomodoro**: `pomodoro.service.ts` (crear/avanzar/finalizar/eliminar); temporizador real con ciclos 25 min trabajo / 5 min descanso, círculo de progreso (conic-gradient), input de minutos, hábito de tiempo opcional (select + `?habito=` desde el dashboard), indicador ciclo N/total, reporte de progreso al backend y `finalizar:true` al completar (marca el hábito COMPLETADO), historial con retomar/eliminar.
  - **2.2 Eventos**: `eventos.service.ts` con CRUD completo + `avisos`; calendario semanal manual (7 columnas × horas 8:00–22:00) con bloques posicionados por hora, hoy resaltado, navegación con chevrons y botón "Hoy (semana N)"; lista lateral de próximos eventos; modales crear/editar (título, descripción, fecha+hora+duración, paleta de colores, avisos dinámicos datetime-local), detalles y confirmación de eliminación.
  - **2.3 Notas**: `notas.service.ts` (listar, por-fecha, upsert, PUT); panel izquierdo nota del día (textarea + "Crear/Guardar nota del día") y panel derecho historial (tarjetas `Nota — dd/mm/yyyy` + preview); clic en nota histórica la muestra con botón X y al cerrar vuelve a la nota del día.
  - **Avatares placeholder**: generados `public/assets/avatares/av-1.png`…`av-6.png` (círculos de color, Python puro).
  - Verificado: `ng build` OK, `ng test` 12/12 OK.
- Pendiente: Sección 3 (Perfil con edición/cambio de contraseña/eliminar cuenta, Gráficas Chart.js, pulido).

### 2026-08-14
- **Dashboard: checkboxes bloqueados tras marcarse**: los hábitos tipo checkbox (Normal → COMPLETADO, Evitado → EVITADO) quedan deshabilitados una vez marcados (`bloqueado()` en `dashboard.ts`, `[disabled]` + `marcado()` en `dashboard.html`). También se corrige que el checkbox de Evitado se muestre marcado al estar EVITADO. Build y tests OK.
- **Fix `inconsistent types deduced for parameter $3` en `POST /api/bitacora`**:
  - El error salía al marcar un hábito Normal (checkbox) o subir el conteo de un Repetición. PostgreSQL deducía dos tipos para `$3` (estado): el enum `estado_registro_habito` por la columna del INSERT y `text` por la comparación `$3 = 'COMPLETADO'`.
  - Solución: cast explícito `$3::public.estado_registro_habito` en VALUES y `$3::text` en la comparación (`backend/src/modules/bitacora/bitacora.service.js`). Pomodoro ya usa literal, no le afecta.
  - Verificado contra Supabase local: Normal on/uncheck y Repetición incremento → PARCIAL / hasta meta → COMPLETADO.
  - Nota: el backend corría con `node server.js` (no nodemon), por lo que los cambios en JS requieren reiniciar el proceso a mano.

### 2026-08-14
- **Frontend — Sección 1 del plan completada** (ver `Docs/plan-frontend.md`):
  - **1.1 Saludo arreglado**: `cargarPerfil()` se ejecuta tras el login (autenticacion) y en el dashboard si la signal `usuario` está vacía.
  - **1.2 Layout principal**: `layout-principal` con `header` (logo + perfil, hamburguesa en móvil) y `sidebar` (5 enlaces con `routerLinkActive`, overlay móvil). Rutas hijas lazy bajo `authGuard` en `app.routes.ts` (`dashboard`, `habitos`, `notas`, `eventos`, `pomodoro`, `perfil`); `''` redirige a `dashboard`. `ui.service.ts` controla la sidebar móvil. Header ocupa todo el ancho sobre el sidebar (`.app-shell` columna: header + `.cuerpo` con sidebar + contenido); en móvil el sidebar se oculta y aparece como overlay bajo el header.
  - **Navegación instantánea**: `provideRouter(routes, withPreloading(PreloadAllModules))` precarga los chunks lazy; evita la demora/flash de la primera carga al navegar entre secciones.
  - **Fix change detection**: el proyecto se generó zoneless (sin zone.js) y no había polyfills; las respuestas HTTP actualizaban el estado pero no disparaban el cambio de vista (pantallas "Cargando" hasta interactuar). Se instaló `zone.js` y se agregó a `polyfills` en `angular.json`. Requiere reiniciar `ng serve`.
  - **1.3 Dashboard con datos reales**: servicios `dashboard`, `bitacora`, `habitos`, `eventos`, `estadisticas`; grid de stats (racha, completados, pendientes, cumplimiento), hábitos de hoy por tipo (checkbox para normal/evitado, contador + incremento para repetición, botón pomodoro para tiempo), eventos próximos, estado vacío con botón a hábitos, y modal de detalles compartido.
  - **1.4 Módulo Hábitos**: CRUD completo (`GET /api/habito`, `/tipos`, POST/PUT/DELETE); lista con borde derecho verde/rojo; modales crear/editar (form dinámico por tipo y frecuencia con días semanales o día del mes), detalles y confirmación de eliminación.
  - **Estilos globales** en `styles.css`: `.boton-secundario`, `.boton-peligro`, `.boton-icono`, `.tarjeta`, `.overlay`, `.modal`, mensajes.
  - Páginas placeholder para notas/eventos/pomodoro/perfil (secciones 2 y 3).
  - Verificado: `ng build` OK, `ng test` 12/12 OK (specs nuevos de header, layout, habitos, modal y dashboard con mocks).
- Pendiente: Sección 2 (Pomodoro, Eventos, Notas) y Sección 3 (Perfil, Gráficas Chart.js, pulido).

### 2026-08-14
- **Entorno local activado**: `backend/.env` creado apuntando a Supabase local (`127.0.0.1:54322`, user/pass `postgres`, `DB_SSL=false`). `.env.example` actualizado con ambas opciones (local/remota comentada).
- **Supabase local funcionando**: levantado con `supabase start` (Docker Desktop). Creado `supabase/seed.sql` (vacío, los catálogos los inserta la migración de reconciliación). Reset de la BD local con `supabase db reset` para aplicar ambas migraciones.
- **Verificado contra BD local**: esquema completo (usuarios con `contraseña`/`pais`, 4 `tipos_habitos`, 6 `avatares`).
- **Backend probado en local (servidor en puerto 3000)**:
  - `POST /api/auth/register` → crea usuario correctamente.
  - `POST /api/auth/login` → devuelve JWT.
  - `GET /api/usuario/perfil`, `GET /api/habito/tipos`, `GET /api/dashboard`, `POST /api/notas` → OK con token.
  - Nota: la contraseña con `ñ` no pasa la validación del backend (regex solo `A-Za-z`); usar caracteres ASCII.
- **Frontend: infraestructura + login/registro funcionales**:
  - `environment.ts` con `apiUrl` (`http://localhost:3000/api`).
  - `core/servicios/api.service.ts` (wrapper HttpClient), `core/interceptores/token.interceptor.ts` (Bearer token), `core/servicios/auth.service.ts` (login/registro/perfil, token en localStorage con signals), `core/guardias/auth.guard.ts`.
  - `app.config.ts`: `provideHttpClient(withInterceptors([tokenInterceptor]))`. Rutas con `loadComponent` (lazy).
  - `Autenticacion`: formularios Reactivos con validaciones iguales al backend (incl. regex de contraseña), mensajes de error/éxito, redirige a `/dashboard` al loguearse.
  - Backend: agregado `cors()` (frontend en 4200 → backend en 3000).
  - Dashboard: saluda con el nombre real del usuario (signal del auth service).
  - Verificado: `ng build` OK, `ng test` 5/5 OK, servidor dev en 4200 responde.
- Pendiente: continuar plan frontend (F2 layout/header/sidebar, F4 dashboard con datos reales, F5 hábitos, etc.).

### 2026-08-13
- Revisión de `Docs/ideas-por-modulo.md` y `Docs/pantallas-pensadas.md`, y del esquema remoto en `supabase/migrations/20260813141352_remote_schema.sql`.
- Decidido: mantener autenticación backend con bcrypt + JWT (no Supabase Auth), frontend → backend Express → Supabase, y arrancar por el backend.
- **Migración nueva** `supabase/migrations/20260813220000_backend_reconciliacion.sql`: agrega `usuarios.contraseña` y `usuarios.pais`, y seed de `tipos_habitos` (Normal, Tiempo, Repeticion, Evitado) y `avatares`.
- **Conexión**: `backend/.env.example` creado (pooler Supabase), `db.js` con `ssl` condicional (`DB_SSL=true`).
- **Backend migrado al esquema nuevo de Supabase**:
  - `auth`: registro usa estado `ACTIVO` (enum).
  - `usuarios`: perfil completa (fecha_nacimiento, avatar, pais), nuevo `PUT /api/usuario/cambiar_password`.
  - `habitos`: maneja `habito_dias` (SEMANAL) y `dia_del_mes` (MENSUAL); devuelve `dias` y tipo; nuevo `GET /api/habito/tipos`.
  - `bitacora`: upsert `ON CONFLICT (habito, fecha)` con enum de 5 estados y lógica por tipo (Normal→COMPLETADO, Repeticion→suma/COMPLETADO cuando llega a meta, Evitado→RECAIDA, Tiempo→PARCIAL/COMPLETADO).
  - `dashboard`: estados enum, racha general = días donde TODOS los hábitos (no evitados) están completados, y `habitos_recaida`.
  - `estadisticas`: enum COMPLETADO, racha general con la nueva definición.
  - **`actividades` reemplazado por `eventos`** (servicio/controller/routes nuevos): `eventos` + `recordatorios_evento` (avisos), CRUD completo.
  - `notas`: columnas `fecha`/`contenido`, upsert por `(usuario, fecha)`, `GET /por-fecha`, `PUT /:id` (solo nota del día).
  - **Nuevos módulos**: `pomodoro` (sesiones_pomodoro con ciclos; al completar marca el hábito de tiempo como COMPLETADO) y `avatares` (GET catálogo).
  - `app.js`: monta eventos, pomodoro y avatares; elimina actividades. Eliminados archivos vacíos (`usuarios.services.js`, `auth.middleware.js`).
- Verificación: sintaxis de todos los módulos OK y servidor arranca correctamente en puerto 3000.
- **Pendiente**: crear `backend/.env` real (desde `.env.example` con password de Supabase) y correr `supabase db push`; pruebas de endpoints con BD; luego seguir con el frontend.
