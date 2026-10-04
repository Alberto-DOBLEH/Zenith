// Zona horaria fija del proyecto para jobs y correos (no hay request ni
// header X-Timezone en ese contexto). Configurable con la env ZONA_HORARIA.
export const ZONA_HORARIA = process.env.ZONA_HORARIA || "America/Monterrey";

// Formatea una fecha YYYY-MM-DD como 'lunes, 5 de octubre de 2026' sin que
// la timezone del servidor (Render = UTC) corra el día.
export const fechaLarga = (fechaYYYYMMDD, locale = "es-MX") =>
    new Date(`${fechaYYYYMMDD}T00:00:00Z`).toLocaleDateString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
