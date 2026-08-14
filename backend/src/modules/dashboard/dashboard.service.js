import db from "../../config/db.js";

const fechaHoy = () => {
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    return new Date(ahora.getTime() - offset * 60000).toISOString().split("T")[0];
};

export const obtenerResumen = async (id_usuario) => {
    const hoy = fechaHoy();

    // Todos los hábitos activos del usuario (con su tipo)
    const habitosResult = await db.query(
        `SELECT h.id_habito, h.nombre, h.tipo_habito
        FROM habitos h
        WHERE h.usuario = $1 AND h.estado = 'ACTIVO'`,
        [id_usuario]
    );

    const habitos = habitosResult.rows;

    if (habitos.length === 0) {
        return {
            fecha: hoy,
            racha_actual: 0,
            habitos_completados: 0,
            habitos_pendientes: 0,
            habitos_recaida: 0,
            porcentaje_cumplimiento: 0,
            habitos: []
        };
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
            AND rh.fecha = $2
        ORDER BY rh.habito, rh.fecha DESC`,
        [id_usuario, hoy]
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

    // Los evitados no cuentan para el porcentaje de cumplimiento
    const habitosPositivos = habitosConEstado.filter(h => h.tipo_habito !== 4);
    const completados = habitosPositivos.filter(h => h.estado === "COMPLETADO").length;
    const recaidas = habitosConEstado.filter(h => h.tipo_habito === 4 && h.estado === "RECAIDA").length;
    const pendientes = habitosPositivos.length - completados;
    const porcentaje = habitosPositivos.length > 0
        ? Math.round((completados / habitosPositivos.length) * 100)
        : 0;

    // Racha general: días consecutivos donde TODOS los hábitos (no evitados) están completados
    const rachaResult = await db.query(
        `SELECT rh.fecha
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND h.tipo_habito <> 4
            AND rh.estado = 'COMPLETADO'
        GROUP BY rh.fecha
        HAVING COUNT(DISTINCT rh.habito) = (
            SELECT COUNT(*) FROM habitos h2
            WHERE h2.usuario = $1 AND h2.estado = 'ACTIVO' AND h2.tipo_habito <> 4
        )
        ORDER BY rh.fecha DESC`,
        [id_usuario]
    );

    const fechasCumplidas = new Set(rachaResult.rows.map(r => {
        const f = new Date(r.fecha);
        const offset = f.getTimezoneOffset();
        return new Date(f.getTime() - offset * 60000).toISOString().split("T")[0];
    }));

    let racha = 0;
    let cursor = new Date(hoy + "T00:00:00");
    while (fechasCumplidas.has(fechaISO(cursor))) {
        racha++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return {
        fecha: hoy,
        racha_actual: racha,
        habitos_completados: completados,
        habitos_pendientes: pendientes,
        habitos_recaida: recaidas,
        porcentaje_cumplimiento: porcentaje,
        habitos: habitosConEstado
    };
};

const fechaISO = (fecha) => {
    const offset = fecha.getTimezoneOffset();
    return new Date(fecha.getTime() - offset * 60000).toISOString().split("T")[0];
};