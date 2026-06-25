import db from "../../config/db.js";

export const obtenerResumen = async (id_usuario) => {
    const hoy = new Date().toISOString().split("T")[0];

    // Obtener todos los hábitos activos del usuario
    const habitosResult = await db.query(
        `SELECT id_habito, nombre FROM habitos
        WHERE usuario = $1 AND estado = 'ACTIVO'`,
        [id_usuario]
    );

    const habitos = habitosResult.rows;

    if (habitos.length === 0) {
        return {
            fecha: hoy,
            racha_actual: 0,
            habitos_completados: 0,
            habitos_pendientes: 0,
            porcentaje_cumplimiento: 0,
            habitos: []
        };
    }

    // Obtener el registro de hoy para cada hábito
    const registrosHoy = await db.query(
        `SELECT DISTINCT ON (rh.habito)
            rh.habito,
            rh.estado
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.fecha_programada = $2
        ORDER BY rh.habito, rh.fecha_registro DESC`,
        [id_usuario, hoy]
    );

    const registrosMap = {};
    registrosHoy.rows.forEach(r => {
        registrosMap[r.habito] = r.estado?.trim();
    });

    const habitosConEstado = habitos.map(h => ({
        id_habito: h.id_habito,
        nombre: h.nombre,
        estado: registrosMap[h.id_habito] || "N"
    }));

    const completados = habitosConEstado.filter(h => h.estado === "C").length;
    const pendientes = habitos.length - completados;
    const porcentaje = habitos.length > 0
        ? Math.round((completados / habitos.length) * 100)
        : 0;

    // Calcular racha actual: días consecutivos con al menos un hábito completado
    const rachaResult = await db.query(
        `SELECT DISTINCT fecha_programada
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.estado = 'C'
        ORDER BY fecha_programada DESC`,
        [id_usuario]
    );

    let racha = 0;
    const fechasCompletadas = rachaResult.rows.map(r =>
        new Date(r.fecha_programada).toISOString().split("T")[0]
    );

    const fechaActual = new Date(hoy);
    for (let i = 0; i < fechasCompletadas.length; i++) {
        const esperada = new Date(fechaActual);
        esperada.setDate(fechaActual.getDate() - i);
        const esperadaStr = esperada.toISOString().split("T")[0];

        if (fechasCompletadas[i] === esperadaStr) {
            racha++;
        } else {
            break;
        }
    }

    return {
        fecha: hoy,
        racha_actual: racha,
        habitos_completados: completados,
        habitos_pendientes: pendientes,
        porcentaje_cumplimiento: porcentaje,
        habitos: habitosConEstado
    };
};
