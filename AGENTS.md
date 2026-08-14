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

## Registro de cambios por fecha

Las entradas más recientes van al inicio. Al finalizar trabajo nuevo, agregar una entrada con la fecha del día y los cambios hechos.

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
