import db from "../../config/db.js";
import { fechaHoySQL, fechaInicioSQL } from "../../config/fecha.js";

const fechaLocal = (fecha) => {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const filtroFrecuencia = (alias, fechaExpr) => `
    (
        ${alias}.frecuencia = 'DIARIO'
        OR (${alias}.frecuencia = 'SEMANAL' AND EXISTS (
            SELECT 1 FROM habito_dias hd
            WHERE hd.habito = ${alias}.id_habito
                AND hd.dia = CASE EXTRACT(DOW FROM ${fechaExpr})
                    WHEN 0 THEN 'DOMINGO'::dia_semana
                    WHEN 1 THEN 'LUNES'::dia_semana
                    WHEN 2 THEN 'MARTES'::dia_semana
                    WHEN 3 THEN 'MIERCOLES'::dia_semana
                    WHEN 4 THEN 'JUEVES'::dia_semana
                    WHEN 5 THEN 'VIERNES'::dia_semana
                    WHEN 6 THEN 'SABADO'::dia_semana
                END
        ))
        OR (${alias}.frecuencia = 'MENSUAL' AND EXTRACT(DAY FROM ${fechaExpr}) = ${alias}.dia_del_mes)
    )
`;

const diasPorPeriodo = (periodo) => {
    switch (periodo) {
        case "semana": return 7;
        case "trimestre": return 90;
        case "semestre": return 180;
        case "anual": return 365;
        case "mes":
        default: return 30;
    }
};

const calcularRacha = (fechasCompletadas, hoy) => {
    if (fechasCompletadas.length === 0) return { racha_actual: 0, racha_maxima: 0 };

    const set = new Set(fechasCompletadas);

    let rachaActual = 0;
    let cursor = new Date(hoy + "T00:00:00");
    while (set.has(fechaLocal(cursor))) {
        rachaActual++;
        cursor.setDate(cursor.getDate() - 1);
    }

    let rachaMaxima = 0;
    let rachaTemp = 1;
    for (let i = 0; i < fechasCompletadas.length; i++) {
        if (i === 0) {
            rachaTemp = 1;
        } else {
            const prev = new Date(fechasCompletadas[i - 1] + "T00:00:00");
            const curr = new Date(fechasCompletadas[i] + "T00:00:00");
            const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                rachaTemp++;
            } else {
                rachaTemp = 1;
            }
        }
        if (rachaTemp > rachaMaxima) rachaMaxima = rachaTemp;
    }

    return { racha_actual: rachaActual, racha_maxima: rachaMaxima };
};

export const obtenerEstadisticasGenerales = async (id_usuario, periodo, timezone) => {
    const dias = diasPorPeriodo(periodo);
    const fechaInicio = fechaInicioSQL(timezone, dias);
    const hoy = fechaHoySQL(timezone);

    const hoyStr = (await db.query(`SELECT ${hoy}::text AS hoy`)).rows[0].hoy;

    // Generar cuadrícula de hábitos programados × fechas del período,
    // LEFT JOIN con registros reales para que los no marcados cuenten como no completados
    const registrosResult = await db.query(
        `WITH fechas AS (
            SELECT generate_series(${fechaInicio}, ${hoy}, '1 day'::interval)::date AS fecha
        ),
        habitos_programados AS (
            SELECT h.id_habito, f.fecha
            FROM habitos h
            CROSS JOIN fechas f
            WHERE h.usuario = $1
                AND h.estado = 'ACTIVO'
                AND h.tipo_habito <> 4
                AND ${filtroFrecuencia("h", "f.fecha")}
        )
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE rh.estado = 'COMPLETADO') AS completados
        FROM habitos_programados hp
        LEFT JOIN registro_habitos rh
            ON rh.habito = hp.id_habito AND rh.fecha = hp.fecha`,
        [id_usuario]
    );

    const { total, completados } = registrosResult.rows[0];
    const totalNum = parseInt(total, 10);
    const completadosNum = parseInt(completados, 10);
    const noCompletados = totalNum - completadosNum;
    const cumplimiento = totalNum > 0 ? Math.round((completadosNum / totalNum) * 100) : 0;

    // Fechas con todos los hábitos programados completados, para racha general
    const rachaResult = await db.query(
        `SELECT DISTINCT rh.fecha
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND h.tipo_habito <> 4
            AND rh.estado = 'COMPLETADO'
            AND ${filtroFrecuencia("h", "rh.fecha::date")}
        GROUP BY rh.fecha
        HAVING COUNT(DISTINCT rh.habito) = (
            SELECT COUNT(*) FROM habitos h2
            WHERE h2.usuario = $1 AND h2.estado = 'ACTIVO' AND h2.tipo_habito <> 4
                AND ${filtroFrecuencia("h2", "rh.fecha::date")}
        )
        ORDER BY rh.fecha DESC`,
        [id_usuario]
    );

    const fechas = rachaResult.rows.map(r => fechaLocal(new Date(r.fecha)));

    const { racha_actual, racha_maxima } = calcularRacha(fechas, hoyStr);

    return {
        cumplimiento,
        completados,
        no_completados: noCompletados,
        racha_actual,
        racha_maxima
    };
};

// Mapa tipo GitHub por hábito: rachas + estado de cada día programado.
// Reglas:
//   - Hábitos "buenos" (tipo 1/2/3): buen día = COMPLETADO; PARCIAL queda como nivel 1.
//   - Hábitos evitados (tipo 4): la lógica se invierte; buen día = sin registro o EVITADO,
//     RECAIDA es mal día (nivel 0).
//   - Solo se consideran días programados según la frecuencia del hábito.
export const obtenerMapa = async (id_usuario, periodo, timezone) => {
    const per = periodo || "semestre";
    const dias = diasPorPeriodo(per);
    const fechaInicio = fechaInicioSQL(timezone, dias);
    const hoy = fechaHoySQL(timezone);

    const periodoResult = await db.query(
        `SELECT (${fechaInicio})::text AS inicio, ${hoy}::text AS fin`
    );
    const { inicio: inicioPeriodo, fin } = periodoResult.rows[0];

    const habitosResult = await db.query(
        `SELECT id_habito, nombre, tipo_habito, frecuencia, dia_del_mes,
                fecha_creacion::text AS fecha_creacion
         FROM habitos
         WHERE usuario = $1 AND estado = 'ACTIVO'
         ORDER BY nombre`,
        [id_usuario]
    );

    if (habitosResult.rows.length === 0) {
        return { periodo: per, inicio: inicioPeriodo, fin, habitos: [] };
    }

    const fechaCreacionMin = habitosResult.rows
        .map(h => h.fecha_creacion.slice(0, 10))
        .sort()[0];
    const inicioCalculo = fechaCreacionMin < inicioPeriodo ? fechaCreacionMin : inicioPeriodo;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicioCalculo)) {
        throw { status: 500, message: "fecha de calculo invalida" };
    }

    // Días programados de cada hábito (desde su creación o desde el inicio del período)
    // con LEFT JOIN de registros para que los no marcados lleguen con estado null.
    const registrosResult = await db.query(
        `WITH fechas AS (
            SELECT generate_series('${inicioCalculo}'::date, ${hoy}, '1 day'::interval)::date AS fecha
        ),
        habitos_programados AS (
            SELECT h.id_habito, h.tipo_habito, f.fecha
            FROM habitos h
            CROSS JOIN fechas f
            WHERE h.usuario = $1
                AND h.estado = 'ACTIVO'
                AND f.fecha >= h.fecha_creacion::date
                AND ${filtroFrecuencia("h", "f.fecha")}
        )
        SELECT hp.id_habito, hp.fecha::text AS fecha, rh.estado
        FROM habitos_programados hp
        LEFT JOIN registro_habitos rh ON rh.habito = hp.id_habito AND rh.fecha = hp.fecha
        ORDER BY hp.id_habito, hp.fecha`,
        [id_usuario]
    );

    const filasPorHabito = new Map();
    for (const fila of registrosResult.rows) {
        if (!filasPorHabito.has(fila.id_habito)) {
            filasPorHabito.set(fila.id_habito, []);
        }
        filasPorHabito.get(fila.id_habito).push(fila);
    }

    const esBueno = (tipo, estado) => {
        if (tipo === 4) return estado !== "RECAIDA";
        return estado === "COMPLETADO";
    };

    const nivelDe = (tipo, estado) => {
        if (tipo === 4) return estado === "RECAIDA" ? 0 : 2;
        if (estado === "COMPLETADO") return 2;
        if (estado === "PARCIAL") return 1;
        return 0;
    };

    const habitos = habitosResult.rows.map(h => {
        const filas = filasPorHabito.get(h.id_habito) ?? [];

        // Racha actual: desde el último día programado hacia atrás
        let racha_actual = 0;
        if (filas.length > 0 && esBueno(h.tipo_habito, filas[filas.length - 1].estado)) {
            racha_actual = 1;
            for (let i = filas.length - 2; i >= 0; i--) {
                if (esBueno(h.tipo_habito, filas[i].estado)) {
                    racha_actual++;
                } else {
                    break;
                }
            }
        }

        // Racha máxima: mayor racha histórica de días programados consecutivos
        let racha_maxima = 0;
        let rachaTemp = 0;
        for (const fila of filas) {
            if (esBueno(h.tipo_habito, fila.estado)) {
                rachaTemp++;
                if (rachaTemp > racha_maxima) racha_maxima = rachaTemp;
            } else {
                rachaTemp = 0;
            }
        }

        const diasMapa = filas
            .filter(f => f.fecha >= inicioPeriodo)
            .map(f => ({
                fecha: f.fecha,
                estado: f.estado ?? null,
                nivel: nivelDe(h.tipo_habito, f.estado)
            }));

        return {
            id_habito: h.id_habito,
            nombre: h.nombre,
            tipo_habito: h.tipo_habito,
            racha_actual,
            racha_maxima,
            dias: diasMapa
        };
    });

    return { periodo: per, inicio: inicioPeriodo, fin, habitos };
};
