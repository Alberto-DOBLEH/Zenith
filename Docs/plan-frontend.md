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
- ✅ **Sección 2 completa**: Pomodoro (temporizador + ciclos; la página `/pomodoro` e historial se retiraron y ahora es el **modal-timer** `compartidos/modal-timer`), Eventos (calendario semanal + lista + modales), Notas (nota del día + historial).
- ✅ **Sección 3 completa**: Perfil (3 tarjetas + avatar + modales editar datos / cambiar contraseña / eliminar cuenta / cerrar sesión), Gráficas Chart.js (línea semanal desde `bitacora?periodo=semana` + doughnut mensual desde `estadisticas`; hoy viven en la pantalla **Estadísticas**), pulido general.
- ✅ **28-09-2026 — Primer cambio**: dashboard sin tarjetas de stats ni gráficas (solo hábitos + eventos), pantalla de hábitos con frecuencia/objetivo/pomodoro, modal-timer ampliado, y **Sección 4** (nueva pantalla Estadísticas).
- ✅ **02-10-2026 — Gimnasio**: nueva pantalla `/gimnasio` (plan de hoy + entrenamiento en curso + historial) y `/rutinas` (splits, sesiones, receta y catálogo de ejercicios), con `gimnasio.service.ts` sobre los 18 endpoints del módulo. Sección 5.

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
- Modal compartido `compartidos/modal-timer` (la página `/pomodoro` con historial fue retirada; `pomodoro.service` y el CRUD `/api/pomodoro` siguen en standby para un futuro reuso con eventos).
- Temporizador real: ciclos 25 trabajo / 5 descanso, círculo de progreso con `conic-gradient`, fase TRABAJO/DESCANSO coloreada, indicador ciclo N/total.
- Reporta el progreso a la bitácora (`POST /api/bitacora`); el hábito de tiempo se marca COMPLETADO al finalizar.
- Sesión ligada a un hábito de tiempo opcional (select de hábitos tiempo + `?habito=` desde el dashboard).

## 2.2 Eventos ✅
- `eventos.service`: CRUD con `avisos`.
- Calendario semanal manual: grid 7 columnas (días) × franjas horarias (8:00–22:00), hoy resaltado con borde primario, bloques de color según `color` con título, navegación con `bi-chevron-left/right` y botón "Hoy".
- Lista lateral de próximos eventos.
- Modales:
  - **Crear/Editar evento**: nombre, descripción, fecha+hora+duración (`fecha_inicio`/`fecha_fin`), color de catálogo (paleta), lista de avisos dinámica (`recordatorios_evento`).
  - **Detalles de evento** + confirmación de eliminación.

## 2.3 Notas ✅
- `notas.service`: listar, upsert, PUT.
- Dos paneles: izquierda la nota del día (textarea `.inputs-texto`, botón "crear nota del día" → "guardar nota del día", editable solo hoy), derecha el historial (tarjetas `Nota — dd/mm/yyyy` + preview).
- Clic en nota histórica: se muestra en el campo con botón X; cerrar vuelve a la nota del día.

---

# Sección 3 — Extras y pulido

## 3.1 Perfil ✅
- `usuarios.service` + `avatares.service` (`GET /api/avatares`).
- Pantalla: foto/avatar grande en círculo + 3 tarjetas:
  - **Información**: nombres, apellidos, username, fecha nacimiento, país + botón "Cambiar datos".
  - **Autenticación**: correo, teléfono + botón "Cambiar contraseña".
  - **Administración**: botón "Eliminar cuenta".
- Botón "Cerrar sesión" al pie.
- Modales: **editar datos** (con catálogo de avatares), **cambiar contraseña** (actual + nueva → `PUT /api/usuario/cambiar_password`), **confirmación eliminar cuenta**, **confirmación cerrar sesión**.

## 3.2 Gráficas (Chart.js) ✅
- Instalar `chart.js`.
- Línea semanal: % de hábitos completados por día (agrupado en frontend desde `GET /api/bitacora?periodo=semana`).
- Progreso mensual (doughnut/barras con `GET /api/estadisticas`).
- Nota (28-09-2026): se movieron del dashboard a la pantalla **Estadísticas** (Sección 4).

## 3.3 Pulido general ✅
- Estados de carga/error/vacío.
- Responsive completo móvil/escritorio.
- Validaciones de formularios.
- Actualizar `AGENTS.md` al terminar.

---

# Sección 4 — Estadísticas y ajustes (28-09-2026)

## 4.1 Dashboard más limpio ✅
- Eliminadas las 4 tarjetas de stats (racha, completados, pendientes, cumplimiento) y la sección "Progreso" con las gráficas. Quedan saludo, hábitos de hoy y eventos próximos. Todo el código Chart.js se movió fuera de `dashboard.ts`.

## 4.2 Pantalla de Hábitos con más detalle ✅
- Cada fila muestra la frecuencia (Diario / Semanal con días / Mensual con día), el objetivo de tiempo (`25 min` / `1 h`) y de repetición (`10 repeticiones`), y badge "Pomodoro" si el hábito de tiempo lo tiene habilitado.
- Modal de detalles: fila "Pomodoro" (Habilitado/No habilitado) y objetivo formateado.
- Util compartida `core/utilidades/habito-formato.ts` (`textoFrecuencia`, `textoTiempo`, `textoObjetivo`).
- Modal del pomodoro ampliado: números `clamp(3.5rem, 10vw, 4.75rem)`, círculo hasta 20rem, etiqueta de fase TRABAJO/DESCANSO grande y coloreada (verde en descanso), modal de 34rem.

## 4.3 Pantalla Estadísticas (nueva) ✅
- Ruta `/estadisticas` + enlace en el sidebar (`bi-graph-up`).
- Backend: `GET /api/estadisticas/mapa?periodo=semestre` → racha actual/máxima por hábito (solo días programados, con inversión para evitados) + `dias[{fecha, estado, nivel}]`.
- Contenido: tarjetas de racha general actual/máxima y cumplimiento del mes, gráficas migradas del dashboard (línea semanal + doughnut mensual), y mapa tipo GitHub por hábito (26 semanas, lunes→domingo, verde sólido = completado, verde opaco = parcial, gris = no hecho; no programado transparente; tooltip con fecha y estado).

---

# Sección 5 — Gimnasio y Rutinas (02-10-2026)

## 5.1 Servicio `gimnasio.service.ts` ✅
- Un solo service con los 5 grupos de endpoints del módulo: ejercicios, splits, sesiones, entrenamientos y series (patrón `ApiService` + `CacheService.swr`).
- Claves nuevas en `CLAVES_CACHE`: `gimnasio:hoy`, `gimnasio:historial`, `splits`, `ejercicios`. Las mutaciones invalidan `hoy` + `historial` (series/iniciar/finalizar) o `splits` + `ejercicios` (gestión de rutinas).
- `GET /entrenamientos` con filtros va directo (sin caché), igual que movimientos.

## 5.2 Pantalla Gimnasio (`/gimnasio`) ✅
- **Un solo enlace en el sidebar** (`bi-fire`); `/rutinas` no aparece ahí, se llega con el botón "Administrar rutinas".
- Tarjeta **Hoy** con 3 estados: sin split activo (CTA a Rutinas), descanso (aviso + "Ver rutina") y sesión hoy (plan con ejercicios, badge **PR** con trofeo en la unidad en que se logró, "Última vez" y botón "Iniciar entrenamiento").
- **Modo en curso**: badge pulsante "EN CURSO", hora de inicio (sin cronómetro, decisión del usuario), botón Finalizar con confirmación; por ejercicio: series registradas con editar/eliminar inline y fila para agregar serie (reps + peso + kg/lbs + ➕). `numero_serie` lo calcula el front como `max + 1`. Receta desde `GET /hoy` con fallback a `GET /splits/:id` si la sesión activa no es la de hoy; series desde `GET /entrenamientos/:id`.
- **Historial**: filtro de mes (select con nombres, valor `YYYY-MM`), filas con sesión/split/fecha/ejercicios/series/duración → clic abre **modal detalle** (series agrupadas por ejercicio); 🗑 con confirmación. DELETE y finalizar también con confirmación.

## 5.3 Pantalla Rutinas (`/rutinas`) ✅
- Rejilla **Splits** + **Catálogo de ejercicios**; botón "← Volver al gimnasio".
- Splits: fila con badge "Activo", #sesiones y acciones activar/ver/editar/eliminar. Catálogo: filtro de grupo + búsqueda (ambos cliente), CRUD con `datalist` de sugerencias.
- Modales: **crear/editar split** (solo nombre — decisión: sin sesiones anidadas), **detalle del split** (sesiones Lunes→Domingo con receta numerada + "Agregar día"), **nueva/editar sesión** (nombre + día; eliminar dentro), **receta del día** (doble lista: elegidos con ↑↓/quitar + catálogo con toggle), **nuevo/editar ejercicio** y **confirmación genérica** (split/sesión/ejercicio).

## 5.4 Verificación ✅
- `ng build` OK (warnings de presupuesto CSS en gimnasio 7.85 kB y rutinas 6.94 kB, igual que eventos/finanzas) y `ng test --watch=false` **59/59** (24 tests nuevos: 11 de gimnasio y 13 de rutinas). Smoke manual del backend **55/55**.
- Fuera de alcance (fase futura): estadísticas/PRs históricos, cronómetro en vivo, "iniciar otra sesión", agregar ejercicio no planeado al entrenamiento en curso.

---

# Sección 6 — Reestructuración de navegación y dashboard (03-10-2026)

## 6.1 Nuevos nombres de módulos y rutas ✅
- Sidebar con **6 enlaces**: Principal (`/dashboard`), Hábitos (`/habitos`), **Calendario** (`/calendario`, antes Eventos), **Ideas** (`/ideas`, antes Notas), Finanzas (`/finanzas`) y **Entrenamiento** (`/entrenamiento`, antes Gimnasio). Estadísticas dejó de ser un enlace (ver 6.2).
- Rutas renombradas en `app.routes.ts` con **redirect de las viejas**: `/eventos → /calendario`, `/notas → /ideas`, `/gimnasio → /entrenamiento` (`pathMatch: 'full'`, heredan `authGuard` al vivir bajo el layout).
- Solo cambiaron rutas y textos de UI (títulos `<h1>`, "Volver al entrenamiento", etc.); carpetas/clases internas (`principales/eventos`, `class Eventos`…) se conservan (decisión del usuario: cero riesgo de imports rotos).
- Specs ajustados: `gimnasio.spec` (encabezado "Entrenamiento") y `rutinas.spec` ("Volver al entrenamiento").

## 6.2 Hábitos + Estadísticas en una sola pantalla (pestañas) ✅
- `/habitos` tiene barra de **2 pestañas** (segmented control): **Hábitos** (lista + modales CRUD, contador y botón "Crear hábito" solo en esta pestaña) y **Estadísticas** (`<app-estadisticas>` incrustado, cero migración de lógica).
- Estado de la pestaña **driveado por query param** (`/habitos?tab=estadisticas`): compartible, back-friendly; al salir de la pestaña se destruye el componente (charts se destruyen limpio en `ngOnDestroy`) y al volver se recarga desde caché SWR.
- `/estadisticas` ya no es una ruta con componente: redirige con **`RedireccionTab`** (micro-componente `principales/redireccion-tab/` que hace `navigateByUrl('/habitos?tab=estadisticas')` en `ngOnInit`). *Nota: `redirectTo` con query params NO conserva el query en Angular, y una ruta solo con `canActivate` sin componente da `NG04014` — por eso el micro-componente.*
- Se quitó el `<header>` propio de `estadisticas.html` (título duplicado bajo la pestaña).

## 6.3 Dashboard con lo importante de los demás módulos ✅
Bloques nuevos (más saludo/fecha y las secciones existentes):
1. **Stats rápidas** (fila de 5 tarjetas): 🔥 racha actual y % cumplimiento del mes (`GET /estadisticas?periodo=mes`); saldo total, entradas y gastos del mes (`GET /metodos-pago` + `GET /movimientos` filtrado en cliente por `YYYY-MM`, misma lógica que la pantalla Finanzas).
2. **Hábitos de hoy**: se conserva la lista interactiva completa (checkbox/contador/pomodoro, modal de detalles y de recaída); el estado vacío "Aún no tienes hábitos" ahora vive **dentro** de su tarjeta para que el resto del dashboard siga visible.
3. **Entrenamiento de hoy** (`GET /entrenamientos/hoy`): 4 estados — sin split activo (CTA "Crear rutina" → `/rutinas`), descanso, sesión del día (nombre, split, #ejercicios, botón "Empezar") y **EN CURSO** (badge pulsante + "Continuar"). Cada bloque con enlace "Ver todo" a su módulo.
4. **Eventos próximos** (se conserva) con "Ver todo" → `/calendario`.
- Cada bloque tiene su propio estado de carga; los fallos de carga son locales (no dejan banner global).

## 6.4 Verificación ✅
- `ng build` OK (solo warnings preexistentes de presupuesto CSS) y `ng test --watch=false` **71/71** (5 tests nuevos: 2 de redirección/pestañas extra en hábitos — incluye prueba del redirect `/estadisticas` con query param — y 4 del dashboard: stats, finanzas, tarjeta de entrenamiento y eventos).
- Backend sin cambios; la suite de seguridad no se corrió (Docker/Supabase local apagado).

---

## Modales (estilo común a todos)

Overlay `rgba(0,0,0,0.6)` + tarjeta `--card` centrada (radius 1rem, borde sutil, header con título + X, cuerpo con `.inputs-texto`/select estilizados, footer con botones). Aplica a todos los modales de las secciones.

## Endpoints a consumir

Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/verificar-email/:token`. Usuario: `GET /api/usuario/perfil`, `PUT /api/usuario/editar_perfil`, `PUT /api/usuario/cambiar_password`, `DELETE /api/usuario/`. Hábitos: `GET /api/habito/tipos`, `GET /api/habito`, `POST /api/habito`, `PUT/DELETE /api/habito/:id`. Bitácora: `POST /api/bitacora`, `GET /api/bitacora?periodo=`. Dashboard: `GET /api/dashboard` (solo `fecha` + `habitos`). Estadísticas: `GET /api/estadisticas?periodo=`, `GET /api/estadisticas/mapa?periodo=`. Eventos: `GET/POST /api/eventos`, `PUT/DELETE /api/eventos/:id` (con `avisos`). Notas: `GET/POST /api/notas`, `PUT /api/notas/:id`. Pomodoro: CRUD `/api/pomodoro` (en standby). Avatares: `GET /api/avatares`. Gimnasio: `GET/POST /api/ejercicios`, `PUT/DELETE /api/ejercicios/:id`, `GET/POST /api/splits`, `GET/PUT/DELETE /api/splits/:id`, `PUT /api/splits/:id/activar`, `POST /api/splits/:id/sesiones`, `PUT/DELETE /api/sesiones/:id`, `PUT /api/sesiones/:id/ejercicios`, `GET /api/entrenamientos/hoy`, `GET/POST /api/entrenamientos`, `GET/DELETE /api/entrenamientos/:id`, `PUT /api/entrenamientos/:id/finalizar`, `POST /api/entrenamientos/:id/series`, `PUT/DELETE /api/series/:id`. Salud: `GET /health`.

Nota (28-09-2026): se retiraron los GET por id sin consumidor (`/api/habito/:id`, `/api/eventos/:id`, `/api/notas/:id`, `/api/notas/por-fecha`, `/api/estadisticas/habito/:id`).
