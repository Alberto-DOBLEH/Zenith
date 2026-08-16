# Plan de implementación del Frontend — Zenith

Plan completo del frontend (Angular 21 standalone) basado en `Docs/pantallas-pensadas.md`, `Docs/ideas-por-modulo.md` y los endpoints de `Docs/endpoints.md`.

## Decisiones de arquitectura (ya acordadas)

- **Gráficas**: librería Chart.js.
- **Calendario de eventos**: grid manual (HTML/CSS/flex), sin librería.
- **Pomodoro**: temporizador real en el frontend que reporta avance al backend.
- **Rutas**: layout principal protegido con rutas hijas `loadComponent` (lazy loading).
- **Auth**: backend bcrypt + JWT, token en `localStorage`, interceptor `Authorization: Bearer`.
- **Recurrencia de eventos**: fuera de alcance (decisión previa).
- **BD**: local con Supabase (`supabase start`, puerto 54322).

## Estado actual (15-08-2026)

- ✅ Infraestructura: `environment.ts`, `api.service.ts`, `token.interceptor.ts`, `auth.service.ts`, `auth.guard.ts`, `app.config.ts` con `provideHttpClient(withInterceptors)`.
- ✅ Login/registro funcionales (`Autenticacion` con ReactiveForms y validaciones iguales al backend).
- ✅ Backend con `cors()`.
- ✅ Dashboard saluda con nombre real (perfil cargado tras el login y en el dashboard si la signal está vacía).
- ✅ Layout principal (Header + Sidebar + rutas hijas lazy bajo el guard).
- ✅ Dashboard con datos reales (stats, hábitos por tipo, eventos próximos, estado vacío).
- ✅ Módulo Hábitos (CRUD + modales crear/editar/detalles/eliminar).
- ✅ **Sección 2 completa**: Pomodoro (temporizador + ciclos + historial), Eventos (calendario semanal + lista + modales), Notas (nota del día + historial).
- ✅ **Sección 3 completa**: Perfil (3 tarjetas + avatar + modales editar datos / cambiar contraseña / eliminar cuenta / cerrar sesión), Gráficas Chart.js en el dashboard (línea semanal desde `bitacora?periodo=semana` + doughnut mensual desde `estadisticas`), pulido general.

## Sistema de diseño (derivado del login)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#0B0C1A` | Fondo de pantallas |
| `--card` / `--popover` | `#131425` | Tarjetas, contenedores, modales |
| `--muted` / `--input-background` | `#1A1B2E` | Paneles interiores, campos, tabs |
| `--primary` | `#6366F1` | Botones, resaltado, checkbox activo, enlaces |
| `--border` | `rgba(255,255,255,0.06)` | Bordes de tarjetas |
| `--foreground` | `#E8E9F3` | Títulos y texto principal |
| `--muted-foreground` | `#717182` | Etiquetas, descripciones, fechas |
| `--sidebar` | `#0F1020` | Sidebar |

Elementos reutilizados del login: `.boton-principal`, `.inputs-texto`, estilo `auth-card` (radius 1rem, borde sutil). Agregados: `.boton-secundario` (bg `--muted`), `.boton-peligro` (bg `--destructive`), `.boton-icono`, `.tarjeta`, `.overlay`/`.modal` (estilo común de modales).

Colores de estado: verde `#10B981` = completado, rojo `#EF4444` = recaída/error, ámbar `#F59E0B` = parcial/pendiente, índigo = info. Borde derecho de hábitos: bueno → verde, malo → rojo.

**Nota**: agregar assets de avatares en `zenith-frontend/public/assets/avatares/av-N.png` (rutas placeholder hoy).

---

# Sección 1 — Núcleo de la aplicación (lo esencial)

## 1.1 Arreglar el saludo del dashboard ✅
Cargar `GET /api/usuario/perfil` tras el login (o en el constructor del dashboard) para que la signal `usuario` no sea `null` y el nombre se muestre.

## 1.2 Layout principal (Header + Sidebar) ✅
- Componente `layout-principal` con `<app-header>` + `<app-sidebar>` + `<router-outlet>`.
- Rutas hijas lazy bajo el guard: `''→dashboard`, `habitos`, `notas`, `eventos`, `pomodoro`, `perfil`.
- **Header**: logo mini + nombre a la izquierda; botón perfil (avatar/foto circular) a la derecha. En móvil: botón hamburguesa.
- **Sidebar**: logo + "Zenith" arriba; 5 enlaces (Principal, Hábitos, Notas, Eventos, Pomodoro) con icono `bi`, fondo `--sidebar-accent` + borde izquierdo primario en el activo. Móvil: overlay deslizante.
- Estructura `.app-shell`: header ancho completo arriba (sobre el sidebar) + `.cuerpo` con sidebar fija izquierda (~230px, bg `--sidebar`) y contenido con padding. En móvil el sidebar se oculta y sale como overlay bajo el header.
- `withPreloading(PreloadAllModules)` para navegación instantánea.

## 1.3 Dashboard con datos reales ✅
Servicios: `dashboard.service` (`GET /api/dashboard`), `bitacora.service` (`POST /api/bitacora`), `eventos.service` (`GET /api/eventos`), `estadisticas.service` (`GET /api/estadisticas`).

Contenido (orden en pantalla):
1. Saludo (`Buenos días <nombre>`) + fecha actual.
2. Grid de 4 tarjetas de stats: racha (🔥), completados, pendientes, cumplimiento.
3. Dos columnas: lista "Hábitos buenos | Hábitos malos" + columna "Eventos próximos".
4. Gráficas (Chart.js, ver Sección 3).
5. Estado vacío: botón "crear un hábito".

Render de tarjetas de hábito por tipo:
- normal/evitado → checkbox (registra `POST /api/bitacora`)
- repetición → contador con botón sumar (envía `incremento`)
- tiempo → botón que abre el pomodoro del hábito
- completado → oscurecer/tachar
- click en tarjeta → modal Detalles de hábito

## 1.4 Módulo Hábitos ✅
- `habitos.service`: CRUD + `GET /api/habito/tipos`.
- Pantalla: header con total + botón "Crear hábito"; lista por renglón con borde derecho de color por tipo y botones editar (`bi-pencil`) / eliminar (`bi-trash`).
- Modales:
  - **Crear/Editar hábito**: form dinámico — tipo (objetivo+unidad solo en tiempo/repetición), frecuencia (DIARIO/SEMANAL/MENSUAL), días semanales (`habito_dias`) o `dia_del_mes`.
  - **Detalles de hábito**: nombre, descripción, objetivo (según tipo), bueno/malo, frecuencia, días.
  - **Confirmación de eliminación**: sí/no.

---

# Sección 2 — Módulos de apoyo

## 2.1 Pomodoro ✅
- `pomodoro.service`: crear sesión, avanzar, finalizar, listar (`POST/GET/PUT/DELETE /api/pomodoro`).
- Temporizador real: input de minutos → `POST /api/pomodoro` (backend calcula `ciclos_objetivo`) → ciclos 25 trabajo / 5 descanso → `PUT` con `minutos_realizados`/`ciclos_completados` y `finalizar:true` al cumplir (el backend marca el hábito COMPLETADO).
- Pantalla pomodoro externo: círculo de tiempo grande (borde `--primary`, número en `--foreground`), input minutos, botones inicio/pausa/avance, indicador ciclo N/total.
- Modal **pomodoro de hábito**: sesión ligada al hábito de tiempo (select de hábitos tiempo + `?habito=` desde el dashboard).

## 2.2 Eventos ✅
- `eventos.service`: CRUD con `avisos`.
- Calendario semanal manual: grid 7 columnas (días) × franjas horarias (8:00–22:00), hoy resaltado con borde primario, bloques de color según `color` con título, navegación con `bi-chevron-left/right` y botón "Hoy".
- Lista lateral de próximos eventos.
- Modales:
  - **Crear/Editar evento**: nombre, descripción, fecha+hora+duración (`fecha_inicio`/`fecha_fin`), color de catálogo (paleta), lista de avisos dinámica (`recordatorios_evento`).
  - **Detalles de evento** + confirmación de eliminación.

## 2.3 Notas ✅
- `notas.service`: listar, por-fecha, upsert, PUT.
- Dos paneles: izquierda la nota del día (textarea `.inputs-texto`, botón "crear nota del día" → "guardar nota del día", editable solo hoy), derecha el historial (tarjetas `Nota — dd/mm/yyyy` + preview).
- Clic en nota histórica: se muestra en el campo con botón X; cerrar vuelve a la nota del día.

---

# Sección 3 — Extras y pulido

## 3.1 Perfil
- `usuarios.service` + `avatares.service` (`GET /api/avatares`).
- Pantalla: foto/avatar grande en círculo + 3 tarjetas:
  - **Información**: nombres, apellidos, username, fecha nacimiento, país + botón "Cambiar datos".
  - **Autenticación**: correo, teléfono + botón "Cambiar contraseña".
  - **Administración**: botón "Eliminar cuenta".
- Botón "Cerrar sesión" al pie.
- Modales: **editar datos** (con catálogo de avatares), **cambiar contraseña** (actual + nueva → `PUT /api/usuario/cambiar_password`), **confirmación eliminar cuenta**, **confirmación cerrar sesión**.

## 3.2 Gráficas (Chart.js)
- Instalar `chart.js`.
- Línea semanal: % de hábitos completados por día (agrupado en frontend desde `GET /api/bitacora?periodo=semana`).
- Progreso mensual (doughnut/barras con `GET /api/estadisticas`).

## 3.3 Pulido general
- Estados de carga/error/vacío.
- Responsive completo móvil/escritorio.
- Validaciones de formularios.
- Actualizar `AGENTS.md` al terminar.

---

## Modales (estilo común a todos)

Overlay `rgba(0,0,0,0.6)` + tarjeta `--card` centrada (radius 1rem, borde sutil, header con título + X, cuerpo con `.inputs-texto`/select estilizados, footer con botones). Aplica a todos los modales de las secciones.

## Endpoints a consumir

Auth: `POST /api/auth/register`, `POST /api/auth/login`. Usuario: `GET /api/usuario/perfil`, `PUT /api/usuario/editar_perfil`, `PUT /api/usuario/cambiar_password`, `DELETE /api/usuario/`. Hábitos: `GET /api/habito/tipos`, CRUD `/api/habito`. Bitácora: `POST /api/bitacora`, `GET /api/bitacora?periodo=`. Dashboard: `GET /api/dashboard`. Estadísticas: `GET /api/estadisticas`, `GET /api/estadisticas/habito/:id`. Eventos: CRUD `/api/eventos` (con `avisos`). Notas: `GET /api/notas`, `GET /api/notas/por-fecha`, `POST /api/notas`, `PUT /api/notas/:id`. Pomodoro: CRUD `/api/pomodoro`. Avatares: `GET /api/avatares`.
