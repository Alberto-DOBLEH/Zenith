# Endpoints — Backend Zenith

Recopilación de todos los endpoints del backend (`backend/src/modules/`). Base URL: `http://localhost:3000`.

Todos los endpoints (salvo los marcados como públicos) requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene de `POST /api/auth/login`.

---

# Módulo: Autenticación

## Endpoint: Registro de usuario
Descripcion: Registra un nuevo usuario con sus credenciales (bcrypt + JWT).
Ruta:
- {POST} /api/auth/register

Header: No requiere autenticación.

Body:
```json
{
  "nombre": "Alberto",
  "primer_apellido": "Doble",
  "segundo_apellido": "H",
  "correo": "alberto@mail.com",
  "telefono": "6141234567",
  "username": "alberto_dh",
  "contraseña": "Contraseña123!"
}
```

Response:
```json
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id_usuario": 1,
    "nombre": "Alberto",
    "correo": "alberto@mail.com",
    "username": "alberto_dh"
  }
}
```

## Endpoint: Inicio de sesión
Descripcion: Autentica al usuario por correo, username o teléfono y devuelve el token JWT.
Ruta:
- {POST} /api/auth/login

Header: No requiere autenticación.

Body:
```json
{
  "login": "alberto@mail.com",
  "contraseña": "Contraseña123!"
}
```

Response:
```json
{
  "message": "Inicio de sesión exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Endpoint: Verificación de correo
Descripcion: Valida el token enviado por correo al registrarse y marca el correo como verificado. El login está bloqueado (403) hasta verificar.
Ruta:
- {GET} /api/auth/verificar-email/:token

Header: No requiere autenticación.

Response:
```json
{
  "message": "Correo verificado correctamente"
}
```

## Endpoint: Health check
Descripcion: Verifica que el servidor esté vivo (usado por Render y por la suite de seguridad).
Ruta:
- {GET} /health

Header: No requiere autenticación.

Response:
```json
{
  "status": "ok"
}
```

---

# Módulo: Usuario

## Endpoint: Obtener perfil
Descripcion: Devuelve la información completa del usuario autenticado.
Ruta:
- {GET} /api/usuario/perfil

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "nombre": "Alberto",
  "primer_apellido": "Doble",
  "segundo_apellido": "H",
  "correo": "alberto@mail.com",
  "telefono": "6141234567",
  "username": "alberto_dh",
  "foto_perfil": null,
  "avatar": null,
  "fecha_nacimiento": null,
  "pais": null,
  "estado": "ACTIVO"
}
```

## Endpoint: Editar perfil
Descripcion: Modifica los datos editables del usuario (nombre, apellidos, foto, avatar, fecha de nacimiento y país).
Ruta:
- {PUT} /api/usuario/editar_perfil

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "nombre": "Alberto",
  "primer_apellido": "Doble",
  "segundo_apellido": "H",
  "foto_perfil": "/assets/avatares/av-1.png",
  "avatar": 1,
  "fecha_nacimiento": "2000-01-15",
  "pais": "México"
}
```

Response:
```json
{
  "message": "perfil modificado con exito"
}
```

## Endpoint: Cambiar contraseña
Descripcion: Cambia la contraseña verificando primero la contraseña actual.
Ruta:
- {PUT} /api/usuario/cambiar_password

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "contraseña_actual": "Contraseña123!",
  "contraseña_nueva": "NuevaContraseña456@"
}
```

Response:
```json
{
  "message": "Contraseña actualizada con exito"
}
```

## Endpoint: Eliminar cuenta
Descripcion: Elimina definitivamente la cuenta del usuario autenticado.
Ruta:
- {DELETE} /api/usuario/

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "message": "usuario eliminado con exito"
}
```

---

# Módulo: Hábitos

## Endpoint: Obtener tipos de hábitos
Descripcion: Devuelve el catálogo de tipos de hábito (sus ids se usan al crear un hábito).
Ruta:
- {GET} /api/habito/tipos

Header: `Authorization: Bearer <token>`

Response:
```json
[
  { "id_tipo_habito": 1, "nombre": "Normal" },
  { "id_tipo_habito": 2, "nombre": "Tiempo" },
  { "id_tipo_habito": 3, "nombre": "Repeticion" },
  { "id_tipo_habito": 4, "nombre": "Evitado" }
]
```

## Endpoint: Crear hábito
Descripcion: Crea un nuevo hábito. Si la frecuencia es SEMANAL, se requieren los `dias`; si es MENSUAL, se requiere `dia_del_mes`.
Ruta:
- {POST} /api/habito/

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "tipo_habito": 1,
  "nombre": "Leer",
  "descripcion": "Leer un libro",
  "frecuencia": "SEMANAL",
  "dias": ["LUNES", "MIERCOLES"],
  "meta": null,
  "unidad": null
}
```

Response:
```json
{
  "message": "Habito creado con exito",
  "id_habito": 1
}
```

## Endpoint: Obtener hábitos
Descripcion: Devuelve todos los hábitos del usuario, incluyendo sus días (si es semanal) y el nombre del tipo.
Ruta:
- {GET} /api/habito/

Header: `Authorization: Bearer <token>`

Response:
```json
[
  {
    "id_habito": 1,
    "tipo_habito": 1,
    "tipo_nombre": "Normal",
    "nombre": "Leer",
    "descripcion": "Leer un libro",
    "meta": null,
    "unidad": null,
    "frecuencia": "DIARIO",
    "dia_del_mes": null,
    "estado": "ACTIVO",
    "fecha_creacion": "2026-08-13T10:00:00.000Z",
    "dias": ["LUNES", "MIERCOLES"]
  }
]
```

## Endpoint: Editar hábito
Descripcion: Modifica un hábito. Si en el body se envía `dias`, se reemplazan los días del hábito (borra y reinserta).
Ruta:
- {PUT} /api/habito/:id_habito

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "nombre": "Leer",
  "descripcion": "Leer 10 páginas",
  "meta": 10,
  "unidad": "Paginas",
  "frecuencia": "REPETICION",
  "dia_del_mes": null,
  "dias": ["LUNES"]
}
```

Response:
```json
{
  "message": "Habito modificado con exito"
}
```

## Endpoint: Eliminar hábito
Descripcion: Elimina un hábito del usuario (borra también sus días y registros por CASCADE).
Ruta:
- {DELETE} /api/habito/:id_habito

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "message": "Habito eliminado con exito"
}
```

---

# Módulo: Bitácora

## Endpoint: Registrar progreso
Descripcion: Registra o actualiza (upsert) el progreso del día para un hábito. La lógica depende del tipo:
- Normal: marca `COMPLETADO` (o `NO_COMPLETADO` si se envía ese estado).
- Repeticion: envíar `incremento` para sumar y no restar; pasa a `COMPLETADO` al llegar a la meta, `PARCIAL` si es > 0.
- Evitado: marca `RECAIDA` (o `EVITADO`).
- Tiempo: marcado por el módulo pomodoro; se puede enviar `estado`.

Ruta:
- {POST} /api/bitacora/

Header: `Authorization: Bearer <token>`

Body (repetición):
```json
{
  "habito": 3,
  "incremento": 5
}
```

Body (normal/evitado):
```json
{
  "habito": 1
}
```

Response:
```json
{
  "message": "registro guardado con exito",
  "estado": "PARCIAL",
  "valor_realizado": 5
}
```

## Endpoint: Obtener registros por periodo
Descripcion: Devuelve los registros de la bitácora del usuario dentro de un periodo. Valores de `periodo`: `dia`, `semana`, `mes`, `trimestre`, `semestre`, `anual`.
Ruta:
- {GET} /api/bitacora/?periodo=semana

Header: `Authorization: Bearer <token>`

Response:
```json
[
  {
    "id_registro_habito": 3,
    "id_habito": 3,
    "habito": "Leer",
    "fecha": "2026-08-13",
    "valor_realizado": 5,
    "meta": 10,
    "estado": "PARCIAL"
  }
]
```

---

# Módulo: Dashboard

## Endpoint: Resumen del día
Descripcion: Devuelve los hábitos programados para hoy con su estado (COMPLETADO / NO_COMPLETADO / PARCIAL / RECAIDA / EVITADO). Las métricas (rachas, cumplimiento) viven en el módulo de Estadísticas.
Ruta:
- {GET} /api/dashboard/

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "fecha": "2026-08-13",
  "habitos": [
    {
      "id_habito": 1,
      "nombre": "Leer",
      "tipo_habito": 1,
      "estado": "COMPLETADO",
      "valor_realizado": null
    }
  ]
}
```

---

# Módulo: Estadísticas

## Endpoint: Estadísticas generales
Descripcion: Devuelve porcentaje de cumplimiento, completados, no completados y rachas (general) del usuario en un periodo. Valores de `periodo`: `semana`, `mes` (por defecto), `trimestre`, `semestre`, `anual`.
Ruta:
- {GET} /api/estadisticas/?periodo=mes

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "cumplimiento": 67,
  "completados": 20,
  "no_completados": 10,
  "racha_actual": 3,
  "racha_maxima": 12
}
```

## Endpoint: Mapa de estadísticas por hábito
Descripcion: Devuelve, para cada hábito activo, su racha actual/máxima y el estado de cada día programado del período (mapa tipo GitHub). Solo se consideran días programados según la frecuencia, desde la creación del hábito. En los hábitos evitados (tipo 4) la lógica se invierte: un día sin registro o con estado `EVITADO` es bueno (nivel 2) y `RECAIDA` es mal día (nivel 0). `nivel`: `2` completo, `1` a medias (PARCIAL), `0` no hecho. Valores de `periodo`: `semana`, `mes`, `trimestre`, `semestre` (por defecto), `anual`.
Ruta:
- {GET} /api/estadisticas/mapa?periodo=semestre

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "periodo": "semestre",
  "inicio": "2026-04-01",
  "fin": "2026-09-28",
  "habitos": [
    {
      "id_habito": 3,
      "nombre": "Beber agua",
      "tipo_habito": 1,
      "racha_actual": 6,
      "racha_maxima": 9,
      "dias": [
        { "fecha": "2026-09-28", "estado": "COMPLETADO", "nivel": 2 },
        { "fecha": "2026-09-27", "estado": null, "nivel": 0 }
      ]
    }
  ]
}
```

---

# Módulo: Eventos

## Endpoint: Crear evento
Descripcion: Crea un evento (bloque en el calendario) con sus avisos/recordatorios opcionales.
Ruta:
- {POST} /api/eventos/

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "titulo": "Examen Lenguajes",
  "descripcion": "Examen parcial",
  "fecha_inicio": "2026-09-16T14:00:00",
  "fecha_fin": "2026-09-16T17:00:00",
  "color": "#ef4444",
  "avisos": ["2026-09-11T12:00:00", "2026-09-16T10:00:00"]
}
```

Response:
```json
{
  "message": "Evento creado con exito",
  "id_evento": 1
}
```

## Endpoint: Obtener eventos
Descripcion: Devuelve todos los eventos del usuario ordenados por fecha de inicio, con sus avisos.
Ruta:
- {GET} /api/eventos/

Header: `Authorization: Bearer <token>`

Response:
```json
[
  {
    "id_evento": 1,
    "titulo": "Examen Lenguajes",
    "descripcion": "Examen parcial",
    "fecha_inicio": "2026-09-16T14:00:00",
    "fecha_fin": "2026-09-16T17:00:00",
    "color": "#ef4444",
    "avisos": ["2026-09-11T12:00:00", "2026-09-16T10:00:00"]
  }
]
```

## Endpoint: Editar evento
Descripcion: Modifica un evento. Si se envía `avisos`, se reemplazan todos los recordatorios del evento.
Ruta:
- {PUT} /api/eventos/:id_evento

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "titulo": "Examen Lenguajes (Final)",
  "descripcion": "Examen final",
  "fecha_inicio": "2026-09-16T15:00:00",
  "fecha_fin": "2026-09-16T18:00:00",
  "color": "#3b82f6",
  "avisos": ["2026-09-16T10:00:00"]
}
```

Response:
```json
{
  "message": "Evento modificado con exito"
}
```

## Endpoint: Eliminar evento
Descripcion: Elimina un evento del usuario (borra también sus recordatorios por CASCADE).
Ruta:
- {DELETE} /api/eventos/:id_evento

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "message": "Evento eliminado con exito"
}
```

---

# Módulo: Notas

## Endpoint: Obtener notas
Descripcion: Devuelve todas las notas del usuario ordenadas por fecha descendente.
Ruta:
- {GET} /api/notas/

Header: `Authorization: Bearer <token>`

Response:
```json
[
  {
    "id_nota": 2,
    "fecha": "2026-08-13",
    "contenido": "Hoy leí el primer capítulo."
  },
  {
    "id_nota": 1,
    "fecha": "2026-08-12",
    "contenido": "Empecé el hábito de ejercicio."
  }
]
```

## Endpoint: Crear / guardar nota del día
Descripcion: Crea o actualiza (upsert) la nota de la fecha de hoy. Solo existe una nota por fecha.
Ruta:
- {POST} /api/notas/

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "contenido": "Hoy leí el primer capítulo."
}
```

Response:
```json
{
  "message": "nota guardada con exito",
  "nota": {
    "id_nota": 2,
    "fecha": "2026-08-13",
    "contenido": "Hoy leí el primer capítulo."
  }
}
```

## Endpoint: Editar nota
Descripcion: Edita una nota. Solo está permitido editar la nota del día actual (de lo contrario devuelve 403).
Ruta:
- {PUT} /api/notas/:id_nota

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "contenido": "Text actualizado de la nota de hoy."
}
```

Response:
```json
{
  "message": "nota modificada con exito",
  "nota": {
    "id_nota": 2,
    "fecha": "2026-08-13",
    "contenido": "Text actualizado de la nota de hoy."
  }
}
```

---

# Módulo: Pomodoro

## Endpoint: Crear sesión pomodoro
Descripcion: Inicia una sesión pomodoro. El sistema calcula los ciclos necesarios (25 min por ciclo). `habito` es opcional (pomodoro externo) y solo puede ser de un hábito del usuario.
Ruta:
- {POST} /api/pomodoro/

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "habito": 2,
  "minutos_objetivo": 50
}
```

Response:
```json
{
  "message": "Sesion pomodoro iniciada",
  "sesion": {
    "id_sesion": 1,
    "habito": 2,
    "fecha_inicio": "2026-08-13T15:00:00",
    "minutos_objetivo": 50,
    "ciclos_objetivo": 2
  }
}
```

## Endpoint: Obtener sesiones
Descripcion: Devuelve el historial de sesiones pomodoro del usuario.
Ruta:
- {GET} /api/pomodoro/

Header: `Authorization: Bearer <token>`

Response:
```json
[
  {
    "id_sesion": 1,
    "habito": 2,
    "habito_nombre": "Estudiar",
    "fecha_inicio": "2026-08-13T15:00:00",
    "fecha_fin": null,
    "minutos_objetivo": 50,
    "minutos_realizados": 25,
    "ciclos_objetivo": 2,
    "ciclos_completados": 1
  }
]
```

## Endpoint: Obtener sesión por id
Descripcion: Devuelve una sesión pomodoro específica del usuario.
Ruta:
- {GET} /api/pomodoro/:id_sesion

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "id_sesion": 1,
  "habito": 2,
  "habito_nombre": "Estudiar",
  "fecha_inicio": "2026-08-13T15:00:00",
  "fecha_fin": null,
  "minutos_objetivo": 50,
  "minutos_realizados": 25,
  "ciclos_objetivo": 2,
  "ciclos_completados": 1
}
```

## Endpoint: Avanzar sesión
Descripcion: Actualiza el progreso de la sesión. Si `finalizar` es `true`, cierra la sesión y, si completó los ciclos de un hábito de tiempo, lo marca como `COMPLETADO` en la bitácora del día.
Ruta:
- {PUT} /api/pomodoro/:id_sesion

Header: `Authorization: Bearer <token>`

Body (progreso):
```json
{
  "minutos_realizados": 50,
  "ciclos_completados": 2
}
```

Body (finalizar):
```json
{
  "minutos_realizados": 50,
  "ciclos_completados": 2,
  "finalizar": true
}
```

Response (progreso):
```json
{
  "message": "Progreso registrado",
  "sesion": {
    "id_sesion": 1,
    "habito": 2,
    "habito_nombre": "Estudiar",
    "fecha_inicio": "2026-08-13T15:00:00",
    "fecha_fin": null,
    "minutos_objetivo": 50,
    "minutos_realizados": 50,
    "ciclos_objetivo": 2,
    "ciclos_completados": 2
  }
}
```

Response (finalizar):
```json
{
  "message": "Sesion finalizada",
  "completado": true
}
```

## Endpoint: Eliminar sesión
Descripcion: Elimina una sesión pomodoro del usuario.
Ruta:
- {DELETE} /api/pomodoro/:id_sesion

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "message": "Sesion eliminada con exito"
}
```

---

# Módulo: Avatares

## Endpoint: Obtener catálogo de avatares
Descripcion: Devuelve el catálogo de avatares disponibles para el usuario.
Ruta:
- {GET} /api/avatares/

Header: No requiere autenticación.

Response:
```json
[
  {
    "id_avatar": 1,
    "nombre": "Avatar 1",
    "ruta_imagen": "/assets/avatares/av-1.png"
  }
]
```
---

# Módulo: Métodos de pago

## Endpoint: Obtener métodos de pago
Descripcion: Devuelve los métodos de pago del usuario autenticado (incluye el "Efectivo" creado al registrarse).
Ruta:
- {GET} /api/metodos-pago/

Header: `Authorization: Bearer <token>`

Response:
```json
[
  {
    "id_metodo": 1,
    "nombre": "Efectivo",
    "tipo": "EFECTIVO",
    "saldo_actual": "0.00"
  },
  {
    "id_metodo": 2,
    "nombre": "Banamex",
    "tipo": "DEBITO",
    "saldo_actual": "200.00"
  }
]
```

Notas:
- `tipo` es un enum: `DEBITO`, `EFECTIVO`, `CREDITO`.
- `saldo_actual` solo lo modifican los movimientos (no existe endpoint para editarlo a mano); `saldo_inicial` se establece al crear.
- Se permite repetir el mismo nombre con distinto tipo (ej. dos "Banamex", uno débito y otro crédito); la unicidad es (usuario, nombre, tipo).

## Endpoint: Crear método de pago
Descripcion: Registra un nuevo método de pago para el usuario.
Ruta:
- {POST} /api/metodos-pago/

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "nombre": "Banamex",
  "tipo": "DEBITO",
  "saldo_inicial": 500
}
```

Response:
```json
{
  "message": "Método de pago creado con exito",
  "metodo": {
    "id_metodo": 2,
    "nombre": "Banamex",
    "tipo": "DEBITO",
    "saldo_actual": "500.00"
  }
}
```

Errores:
- `400` nombre vacío, nombre > 50 caracteres o `tipo` fuera del enum.
- `409` ya existe un método con ese mismo nombre **y** tipo.

## Endpoint: Eliminar método de pago
Descripcion: Elimina un método de pago del usuario.
Ruta:
- {DELETE} /api/metodos-pago/:id_metodo

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "message": "Método de pago eliminado con exito"
}
```

Errores:
- `404` el método no existe o no pertenece al usuario.
- `409` el método tiene movimientos asociados (no se borra historial).

---

# Módulo: Categorías

## Endpoint: Obtener categorías
Descripcion: Devuelve las categorías del usuario autenticado.
Ruta:
- {GET} /api/categorias/

Header: `Authorization: Bearer <token>`

Response:
```json
[
  {
    "id_categoria": 1,
    "nombre": "Comida",
    "tipo": "GASTO"
  },
  {
    "id_categoria": 2,
    "nombre": "Sueldo",
    "tipo": "ENTRADA"
  }
]
```

Notas: `tipo` es un enum: `GASTO`, `ENTRADA`.

## Endpoint: Crear categoría
Descripcion: Crea una categoría para el usuario.
Ruta:
- {POST} /api/categorias/

Header: `Authorization: Bearer <token>`

Body:
```json
{
  "nombre": "Comida",
  "tipo": "GASTO"
}
```

Response:
```json
{
  "message": "Categoría creada con exito",
  "categoria": {
    "id_categoria": 1,
    "nombre": "Comida",
    "tipo": "GASTO"
  }
}
```

Errores:
- `400` nombre vacío, nombre > 50 caracteres o `tipo` fuera del enum.
- `409` ya existe una categoría con ese mismo nombre y tipo.

## Endpoint: Editar categoría
Descripcion: Actualiza nombre y/o tipo de una categoría.
Ruta:
- {PUT} /api/categorias/:id_categoria

Header: `Authorization: Bearer <token>`

Body (al menos un campo):
```json
{
  "nombre": "Comida fuera",
  "tipo": "GASTO"
}
```

Response:
```json
{
  "message": "Categoría modificada con exito"
}
```

Errores: `400` sin campos o inválidos, `404` no existe/no pertenece al usuario, `409` duplicada.

## Endpoint: Eliminar categoría
Descripcion: Elimina una categoría. Los movimientos que la usaban quedan sin categoría (`ON DELETE SET NULL`).
Ruta:
- {DELETE} /api/categorias/:id_categoria

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "message": "Categoría eliminada con exito"
}
```

Errores: `404` no existe o no pertenece al usuario.

---

# Módulo: Movimientos

## Endpoint: Obtener movimientos (con filtros)
Descripcion: Lista los movimientos del usuario, más recientes primero. Filtros opcionales y combinables.
Ruta:
- {GET} /api/movimientos/
- {GET} /api/movimientos/?fecha=2026-10-01
- {GET} /api/movimientos/?mes=2026-10
- {GET} /api/movimientos/?tipo=GASTO
- {GET} /api/movimientos/?metodo=2

Header: `Authorization: Bearer <token>`

Parámetros query:
- `fecha`: día exacto, formato `YYYY-MM-DD`.
- `mes`: mes completo, formato `YYYY-MM`.
- `tipo`: `GASTO`, `ENTRADA` o `TRANSFERENCIA`.
- `metodo`: id de método de pago (incluye el método destino en transferencias).

Response:
```json
[
  {
    "id_movimiento": 3,
    "tipo_movimiento": "TRANSFERENCIA",
    "cantidad": "200.00",
    "fecha": "2026-10-01T07:00:00.000Z",
    "descripcion": null,
    "id_metodo_pago": 2,
    "metodo_nombre": "Banamex",
    "id_metodo_pago_destino": 3,
    "metodo_destino_nombre": "Banamex",
    "id_categoria": null,
    "categoria_nombre": null,
    "categoria_tipo": null
  }
]
```

Errores: `400` si `fecha`, `mes`, `tipo` o `metodo` tienen formato inválido.

Notas: `fecha` se devuelve como timestamp ISO de pg; para mostrarla usar solo la parte `YYYY-MM-DD`.

## Endpoint: Detalle de un movimiento
Descripcion: Devuelve toda la información de un movimiento con los nombres de método y categoría resueltos.
Ruta:
- {GET} /api/movimientos/:id_movimiento

Header: `Authorization: Bearer <token>`

Response: mismo objeto del listado (un solo objeto, no arreglo).

Errores: `404` no existe o pertenece a otro usuario. `400` id no numérico.

## Endpoint: Crear movimiento
Descripcion: Registra un gasto, entrada o transferencia. Se ejecuta en transacción: inserta el movimiento y actualiza los saldos de los métodos de pago afectados.
Ruta:
- {POST} /api/movimientos/

Header: `Authorization: Bearer <token>`

Body (gasto):
```json
{
  "tipo_movimiento": "GASTO",
  "cantidad": 100,
  "fecha": "2026-10-01",
  "descripcion": "Comida",
  "id_metodo_pago": 2,
  "id_categoria": 1
}
```

Body (transferencia):
```json
{
  "tipo_movimiento": "TRANSFERENCIA",
  "cantidad": 200,
  "id_metodo_pago": 2,
  "id_metodo_pago_destino": 3
}
```

Response:
```json
{
  "message": "Movimiento creado con exito",
  "movimiento": {
    "id_movimiento": 4,
    "id_usuario": 1,
    "id_metodo_pago": 2,
    "id_categoria": 1,
    "tipo_movimiento": "GASTO",
    "cantidad": "100.00",
    "fecha": "2026-10-01T07:00:00.000Z",
    "descripcion": "Comida",
    "id_metodo_pago_destino": null
  }
}
```

Efecto en saldos (siempre positiva la cantidad, el backend aplica el signo):
- `GASTO`: resta `cantidad` al método origen.
- `ENTRADA`: suma `cantidad` al método origen.
- `TRANSFERENCIA`: resta al origen y suma al destino (ambos deben pertenecer al usuario y ser distintos).
- El saldo puede quedar negativo (permitido a decisión del usuario).

Errores:
- `400` tipo fuera del enum, cantidad ≤ 0 o no numérica, fecha mal formada, descripción > 255, `id_metodo_pago_destino` ausente en transferencia o presente en gasto/entrada, destino = origen.
- `404` método origen/destino o categoría no existen o no pertenecen al usuario.

---

# Módulo: Ejercicios (catálogo del gimnasio)

Catálogo **universal** (sin `id_usuario`): todos los usuarios comparten los mismos ejercicios para unificar historiales y PRs. Se siembra con 43 ejercicios comunes.

## Endpoint: Obtener ejercicios
Descripcion: Lista el catálogo de ejercicios, ordenado por grupo muscular. Filtros opcionales.
Ruta:
- {GET} /api/ejercicios/
- {GET} /api/ejercicios/?grupo=Pecho
- {GET} /api/ejercicios/?q=press

Header: `Authorization: Bearer <token>`

Parámetros query:
- `grupo`: coincidencia exacta sin importar mayúsculas.
- `q`: búsqueda por nombre (`ILIKE`).

Response:
```json
[
  { "id_ejercicio": 1, "nombre": "Press Banca", "grupo_muscular": "Pecho" }
]
```

Errores: `400` si `grupo` supera 50 caracteres o `q` 100.

## Endpoint: Crear ejercicio
Descripcion: Agrega un ejercicio al catálogo compartido.
Ruta:
- {POST} /api/ejercicios/

Body:
```json
{ "nombre": "Press de pecho en máquina", "grupo_muscular": "Pecho" }
```

Response:
```json
{
  "message": "Ejercicio creado con exito",
  "ejercicio": { "id_ejercicio": 44, "nombre": "Press de pecho en máquina", "grupo_muscular": "Pecho" }
}
```

Errores: `400` nombre/grupo vacíos o fuera de límite (100/50). `409` ya existe un ejercicio con ese nombre (sin importar mayúsculas).

## Endpoint: Editar ejercicio
Descripcion: Cambia el nombre y/o el grupo muscular de un ejercicio (afecta a todos los usuarios).
Ruta:
- {PUT} /api/ejercicios/:id_ejercicio

Body (al menos un campo):
```json
{ "grupo_muscular": "Empuje" }
```

Response: `{ "message": "Ejercicio modificado con exito" }`

Errores: `400` sin campos. `404` no existe. `409` nombre duplicado.

## Endpoint: Eliminar ejercicio
Descripcion: Borra un ejercicio del catálogo solo si no está en uso.
Ruta:
- {DELETE} /api/ejercicios/:id_ejercicio

Response: `{ "message": "Ejercicio eliminado con exito" }`

Errores: `404` no existe. `409` el ejercicio está en una receta de sesión o tiene series registradas (no se rompe historial).

---

# Módulo: Splits

## Endpoint: Obtener splits
Descripcion: Devuelve los splits del usuario (el activo primero) con el número de sesiones.
Ruta:
- {GET} /api/splits/

Response:
```json
[
  { "id_split": 1, "nombre": "PPLxUL", "es_activo": true, "sesiones": 6 },
  { "id_split": 2, "nombre": "Arnold Split", "es_activo": false, "sesiones": 4 }
]
```

## Endpoint: Detalle de un split
Descripcion: Devuelve el split con sus sesiones y la receta de ejercicios de cada una (ordenada).
Ruta:
- {GET} /api/splits/:id_split

Response:
```json
{
  "id_split": 1,
  "nombre": "PPLxUL",
  "es_activo": true,
  "sesiones": [
    {
      "id_sesion_plan": 1,
      "nombre_sesion": "Push",
      "dia_asignado": 1,
      "ejercicios": [
        { "id_ejercicio": 1, "nombre": "Press Banca", "grupo_muscular": "Pecho", "orden": 1 }
      ]
    }
  ]
}
```

Errores: `404` no existe o pertenece a otro usuario.

## Endpoint: Crear split
Descripcion: Crea un split opcionalmente con sus sesiones y recetas, todo en una transacción.
Ruta:
- {POST} /api/splits/

Body:
```json
{
  "nombre": "PPLxUL",
  "es_activo": true,
  "sesiones": [
    {
      "nombre_sesion": "Push",
      "dia_asignado": 1,
      "ejercicios": [ { "id_ejercicio": 1 }, { "id_ejercicio": 2, "orden": 2 } ]
    },
    { "nombre_sesion": "Pull", "dia_asignado": 2 }
  ]
}
```

Response:
```json
{
  "message": "Split creado con exito",
  "id_split": 1,
  "sesiones": [
    { "id_sesion_plan": 1, "nombre_sesion": "Push", "dia_asignado": 1 },
    { "id_sesion_plan": 2, "nombre_sesion": "Pull", "dia_asignado": 2 }
  ]
}
```

Notas:
- `dia_asignado`: **1 = lunes … 7 = domingo**; un día sin sesión es descanso.
- `orden` es opcional (auto = posición, 1-based); no puede repetirse dentro de la sesión.
- `es_activo: true` desactiva los demás splits del usuario.

Errores: `400` nombre vacío/ > 50, `es_activo` no booleano, `sesiones` no arreglo/ > 7, día fuera de 1-7, día repetido, ejercicio repetido u orden repetido. `404` ejercicio inexistente. `409` sesión en día ocupado (carrera).

## Endpoint: Editar split
Descripcion: Renombra un split.
Ruta:
- {PUT} /api/splits/:id_split

Body: `{ "nombre": "PPLxUL v2" }`

Errores: `400` sin nombre. `404` no existe/no pertenece.

## Endpoint: Activar split
Descripcion: Marca un split como el actual y desactiva los demás (transacción; la BD garantiza un único activo).
Ruta:
- {PUT} /api/splits/:id_split/activar

Response: `{ "message": "Split activado con exito" }`

Errores: `404` no existe/no pertenece.

## Endpoint: Eliminar split
Descripcion: Borra el split con sus sesiones y recetas (no el historial de entrenamientos).
Ruta:
- {DELETE} /api/splits/:id_split

Errores: `404` no existe/no pertenece. `409` el split tiene entrenamientos registrados.

## Endpoint: Crear sesión en un split
Descripcion: Agrega un día al molde del split.
Ruta:
- {POST} /api/splits/:id_split/sesiones

Body:
```json
{ "nombre_sesion": "Legs", "dia_asignado": 3 }
```

Response:
```json
{
  "message": "Sesión creada con exito",
  "sesion": { "id_sesion_plan": 3, "nombre_sesion": "Legs", "dia_asignado": 3 }
}
```

Errores: `400` nombre o día inválidos. `404` split inexistente/ajeno. `409` el día ya está ocupado en ese split.

---

# Módulo: Sesiones (días del molde)

## Endpoint: Editar sesión
Descripcion: Cambia el nombre y/o el día asignado de una sesión.
Ruta:
- {PUT} /api/sesiones/:id_sesion_plan

Body (al menos un campo):
```json
{ "nombre_sesion": "Upper", "dia_asignado": 5 }
```

Errores: `400` sin campos o día fuera de 1-7. `404` no existe/no pertenece. `409` el día destino ya tiene otra sesión.

## Endpoint: Reemplazar los ejercicios de una sesión
Descripcion: Reescribe por completo la receta del día (borra y reinserta, igual que `dias` de los hábitos). `[]` vacía la sesión.
Ruta:
- {PUT} /api/sesiones/:id_sesion_plan/ejercicios

Body:
```json
{
  "ejercicios": [
    { "id_ejercicio": 1, "orden": 1 },
    { "id_ejercicio": 7 }
  ]
}
```

Response: `{ "message": "Ejercicios de la sesión actualizados con exito", "ejercicios": 2 }`

Errores: `400` sin campo `ejercicios`, no arreglo, ejercicio repetido u orden repetido. `404` ejercicio inexistente / sesión ajena.

## Endpoint: Eliminar sesión
Descripcion: Borra un día del molde (y su receta).
Ruta:
- {DELETE} /api/sesiones/:id_sesion_plan

Errores: `404` no existe/no pertenece. `409` la sesión tiene entrenamientos registrados.

---

# Módulo: Entrenamientos

Flujo: `GET /hoy` → `POST /` (iniciar) → `POST /:id/series` (una por una) → `PUT /:id/finalizar`.

## Endpoint: Plan del día
Descripcion: Todo lo necesario para la pantalla de gimnasio: el split activo, la sesión asignada a hoy (`null` si es descanso o no hay split), el entrenamiento en curso (si lo hay) y, por cada ejercicio de la receta, su **PR** y la **última vez** que se entrenó (fecha + series). El PR compara normalizando a kg (`lbs × 0.45359237`) y se devuelve con la unidad en que se logró. El header `X-Timezone` (o `UTC` por defecto) define "hoy".
Ruta:
- {GET} /api/entrenamientos/hoy

Response:
```json
{
  "fecha": "2026-10-02",
  "dia_semana": 5,
  "split": { "id_split": 1, "nombre": "PPLxUL" },
  "sesion": { "id_sesion_plan": 5, "nombre_sesion": "Upper", "dia_asignado": 5 },
  "entrenamiento_activo": null,
  "ejercicios": [
    {
      "id_ejercicio": 1,
      "nombre": "Press Banca",
      "grupo_muscular": "Pecho",
      "orden": 1,
      "pr": { "peso": 225, "unidad_peso": "lbs", "repeticiones": 3, "fecha": "2026-09-30" },
      "ultima_vez": {
        "fecha": "2026-09-30",
        "series": [
          { "numero_serie": 1, "repeticiones": 12, "peso": 70, "unidad_peso": "kg" },
          { "numero_serie": 2, "repeticiones": 10, "peso": 75, "unidad_peso": "kg" }
        ]
      }
    }
  ]
}
```

Notas: `fecha` siempre es texto `YYYY-MM-DD`. `dia_semana`: 1 = lunes … 7 = domingo. `pr`/`ultima_vez` son `null` sin historial; `ultima_vez` excluye el entrenamiento en curso. Si no hay split activo, `split`, `sesion` y `ejercicios` vienen en `null`/`[]`.

## Endpoint: Iniciar entrenamiento
Descripcion: Crea la sesión física real (`fecha_inicio = now()`).
Ruta:
- {POST} /api/entrenamientos/

Body (la sesión de hoy del split activo):
```json
{}
```

Body (sesión explícita, p.ej. para entrenar un día no asignado):
```json
{ "id_sesion_plan": 5 }
```

Response:
```json
{
  "message": "Entrenamiento iniciado",
  "entrenamiento": {
    "id_entrenamiento": 10,
    "id_sesion_plan": 5,
    "nombre_sesion": "Upper",
    "fecha_inicio": "2026-10-02T14:00:00.000Z",
    "fecha_fin": null
  }
}
```

Errores: `400` sin split activo / hoy es descanso (cuando no se envía `id_sesion_plan`). `404` sesión inexistente o ajena. `409` ya hay un entrenamiento en curso (también lo garantiza un índice único en BD).

## Endpoint: Historial de entrenamientos
Descripcion: Lista las idas al gimnasio, más recientes primero.
Ruta:
- {GET} /api/entrenamientos/
- {GET} /api/entrenamientos/?mes=2026-10
- {GET} /api/entrenamientos/?fecha=2026-10-02

Response:
```json
[
  {
    "id_entrenamiento": 10,
    "id_sesion_plan": 5,
    "nombre_sesion": "Upper",
    "id_split": 1,
    "nombre_split": "PPLxUL",
    "fecha_inicio": "2026-10-02T14:00:00.000Z",
    "fecha_fin": "2026-10-02T15:05:00.000Z",
    "ejercicios": 7,
    "series": 21,
    "duracion_minutos": 65
  }
]
```

Errores: `400` `fecha`/`mes` con formato inválido.

## Endpoint: Detalle de un entrenamiento
Descripcion: El entrenamiento con sus series agrupadas por ejercicio (primero los de la receta en su orden).
Ruta:
- {GET} /api/entrenamientos/:id_entrenamiento

Response:
```json
{
  "id_entrenamiento": 10,
  "id_sesion_plan": 5,
  "nombre_sesion": "Upper",
  "id_split": 1,
  "nombre_split": "PPLxUL",
  "fecha_inicio": "2026-10-02T14:00:00.000Z",
  "fecha_fin": "2026-10-02T15:05:00.000Z",
  "duracion_minutos": 65,
  "ejercicios": [
    {
      "id_ejercicio": 1,
      "nombre": "Press Banca",
      "grupo_muscular": "Pecho",
      "orden": 1,
      "series": [
        { "id_serie": 1, "numero_serie": 1, "repeticiones": 12, "peso": 70, "unidad_peso": "kg" }
      ]
    }
  ]
}
```

Errores: `404` no existe/no pertenece.

## Endpoint: Finalizar entrenamiento
Descripcion: Pone `fecha_fin = now()` y calcula la duración.
Ruta:
- {PUT} /api/entrenamientos/:id_entrenamiento/finalizar

Response:
```json
{
  "message": "Entrenamiento finalizado",
  "entrenamiento": { "id_entrenamiento": 10, "fecha_inicio": "...", "fecha_fin": "...", "duracion_minutos": 65 }
}
```

Errores: `404` no existe/no pertenece. `409` ya fue finalizado.

## Endpoint: Registrar serie (anidada)
Descripcion: Registra una serie conforme se termina en el gimnasio (una por una). El ejercicio puede ser cualquiera del catálogo (también sirve para agregar uno no planeado).
Ruta:
- {POST} /api/entrenamientos/:id_entrenamiento/series

Body:
```json
{
  "id_ejercicio": 1,
  "numero_serie": 3,
  "repeticiones": 9,
  "peso": 75,
  "unidad_peso": "kg"
}
```

Response:
```json
{
  "message": "Serie registrada con exito",
  "serie": { "id_serie": 1, "id_ejercicio": 1, "numero_serie": 3, "repeticiones": 9, "peso": 75, "unidad_peso": "kg" }
}
```

Errores: `400` `numero_serie`/`repeticiones` enteros ≥ 1, `peso` > 0 y ≤ 99999.99, `unidad_peso` ∈ `kg`/`lbs`. `404` entrenamiento o ejercicio inexistente. `409` esa serie del ejercicio ya existe en este entrenamiento.

## Endpoint: Eliminar entrenamiento
Descripcion: Borra un registro erróneo (sus series caen por `CASCADE`).
Ruta:
- {DELETE} /api/entrenamientos/:id_entrenamiento

Errores: `404` no existe/no pertenece.

---

# Módulo: Series (corrección)

## Endpoint: Editar serie
Descripcion: Corrige repeticiones y/o peso de una serie ya registrada. `peso` y `unidad_peso` deben enviarse juntos.
Ruta:
- {PUT} /api/series/:id_serie

Body:
```json
{ "repeticiones": 8, "peso": 77.5, "unidad_peso": "kg" }
```

Errores: `400` sin campos, `peso` sin `unidad_peso` (o viceversa), repeticiones ≤ 0 o unidad inválida. `404` no existe/no pertenece.

## Endpoint: Eliminar serie
Descripcion: Quita una serie equivocada.
Ruta:
- {DELETE} /api/series/:id_serie

Errores: `404` no existe/no pertenece.
