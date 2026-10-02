// Devuelve un fragmento SQL que calcula la fecha "hoy" en la timezone del usuario.
// Usar como:   WHERE fecha = ${fechaHoySQL(tz)}
//              INSERT INTO ... VALUES (${fechaHoySQL(tz)}, ...)
//
// El parámetro tz es el nombre IANA (ej. "America/Mexico_City").
export const fechaHoySQL = (tz) =>
    `(CURRENT_TIMESTAMP AT TIME ZONE '${tz.replace(/'/g, "''")}')::date`;

// Rango de fechas para un período, en la timezone del usuario.
export const fechaInicioSQL = (tz, dias) =>
    `(CURRENT_TIMESTAMP AT TIME ZONE '${tz.replace(/'/g, "''")}' - INTERVAL '${dias} days')::date`;

// Nombre IANA de zona entrecomillado (seguro para interpolación en SQL).
export const zonaSQL = (tz) =>
    `'${String(tz || "UTC").replace(/'/g, "''")}'`;

// Fecha (YYYY-MM-DD) de una expresión timestamptz en la timezone del usuario.
export const fechaEnZonaSQL = (expresion, tz) =>
    `(${expresion} AT TIME ZONE ${zonaSQL(tz)})::date`;

// 'YYYY-MM' de una expresión timestamptz en la timezone del usuario.
export const mesEnZonaSQL = (expresion, tz) =>
    `to_char(${expresion} AT TIME ZONE ${zonaSQL(tz)}, 'YYYY-MM')`;
