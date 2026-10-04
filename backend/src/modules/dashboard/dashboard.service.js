import db from "../../config/db.js";
import { fechaHoySQL } from "../../config/fecha.js";

// Filtro SQL para hábitos según su frecuencia y una fecha dada
export const filtroFrecuencia = (alias, fechaExpr) => `
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

export const obtenerResumen = async (id_usuario, timezone) => {
    const hoy = fechaHoySQL(timezone);

    // Hábitos activos que corresponden al día de hoy (según frecuencia)
    const habitosResult = await db.query(
        `SELECT h.id_habito, h.nombre, h.tipo_habito
        FROM habitos h
        WHERE h.usuario = $1 AND h.estado = 'ACTIVO'
            AND ${filtroFrecuencia("h", hoy)}`,
        [id_usuario]
    );

    const habitos = habitosResult.rows;

    if (habitos.length === 0) {
        const hoyStr = (await db.query(`SELECT ${hoy}::text AS hoy`)).rows[0].hoy;
        return { fecha: hoyStr, habitos: [] };
    }

    // Registro de hoy para cada hábito
    const registrosHoy = await db.query(
        `SELECT DISTINCT ON (rh.habito)
            rh.habito,
            rh.estado,
            rh.valor_realizado
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.fecha = ${hoy}
        ORDER BY rh.habito, rh.fecha DESC`,
        [id_usuario]
    );

    const registrosMap = {};
    registrosHoy.rows.forEach(r => {
        registrosMap[r.habito] = {
            estado: r.estado,
            valor_realizado: r.valor_realizado
        };
    });

    const habitosConEstado = habitos.map(h => {
        const registro = registrosMap[h.id_habito] || {};
        return {
            id_habito: h.id_habito,
            nombre: h.nombre,
            tipo_habito: h.tipo_habito,
            estado: registro.estado || "NO_COMPLETADO",
            valor_realizado: registro.valor_realizado ?? null
        };
    });

    const hoyStr = (await db.query(`SELECT ${hoy}::text AS hoy`)).rows[0].hoy;
    return { fecha: hoyStr, habitos: habitosConEstado };
};
