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

## Endpoint: Obtener hábito por id
Descripcion: Devuelve un hábito específico del usuario.
Ruta:
- {GET} /api/habito/:id_habito

Header: `Authorization: Bearer <token>`

Response:
```json
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
  "dias": []
}
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
Descripcion: Devuelve el resumen del día actual: racha general, hábitos completados/pendientes, recaídas y porcentaje de cumplimiento (los evitados no cuentan en el porcentaje).
Ruta:
- {GET} /api/dashboard/

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "fecha": "2026-08-13",
  "racha_actual": 0,
  "habitos_completados": 2,
  "habitos_pendientes": 1,
  "habitos_recaida": 1,
  "porcentaje_cumplimiento": 67,
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

## Endpoint: Estadísticas de un hábito
Descripcion: Devuelve estadísticas de un hábito específico: cumplimiento, días registrados y rachas.
Ruta:
- {GET} /api/estadisticas/habito/:id_habito

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "id_habito": 3,
  "nombre": "Leer",
  "cumplimiento": 80,
  "dias_registrados": 10,
  "racha_actual": 2,
  "racha_maxima": 5
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

## Endpoint: Obtener evento por id
Descripcion: Devuelve un evento específico del usuario.
Ruta:
- {GET} /api/eventos/:id_evento

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "id_evento": 1,
  "titulo": "Examen Lenguajes",
  "descripcion": "Examen parcial",
  "fecha_inicio": "2026-09-16T14:00:00",
  "fecha_fin": "2026-09-16T17:00:00",
  "color": "#ef4444",
  "avisos": ["2026-09-11T12:00:00", "2026-09-16T10:00:00"]
}
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

## Endpoint: Obtener nota por fecha
Descripcion: Devuelve la nota de una fecha específica (o `null` si no existe).
Ruta:
- {GET} /api/notas/por-fecha?fecha=2026-08-13

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "id_nota": 2,
  "fecha": "2026-08-13",
  "contenido": "Hoy leí el primer capítulo."
}
```

## Endpoint: Obtener nota por id
Descripcion: Devuelve una nota específica del usuario.
Ruta:
- {GET} /api/notas/:id_nota

Header: `Authorization: Bearer <token>`

Response:
```json
{
  "id_nota": 2,
  "fecha": "2026-08-13",
  "contenido": "Hoy leí el primer capítulo."
}
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