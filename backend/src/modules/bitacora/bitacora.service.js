import db from "../../config/db.js";
import { fechaHoySQL, fechaInicioSQL } from "../../config/fecha.js";

export const registrarProgreso = async (id_usuario, datos, timezone) => {
    const { habito, incremento, valor_realizado, estado } = datos;

    if (!habito) {
        throw {
            status: 400,
            message: "habito es obligatorio"
        };
    }

    // Verificar que el hábito pertenece al usuario y obtener tipo + meta
    const habitoResult = await db.query(
        `SELECT h.id_habito, h.meta, h.tipo_habito, t.nombre AS tipo_nombre
        FROM habitos h
        INNER JOIN tipos_habitos t ON h.tipo_habito = t.id_tipo_habito
        WHERE h.id_habito = $1 AND h.usuario = $2`,
        [habito, id_usuario]
    );

    if (habitoResult.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    const { meta, tipo_nombre } = habitoResult.rows[0];
    const tipo = tipo_nombre.trim().toLowerCase();
    const hoy = fechaHoySQL(timezone);

    // Obtener registro previo del día (para acumular en repeticiones)
    const previo = await db.query(
        `SELECT valor_realizado FROM registro_habitos WHERE habito = $1 AND fecha = ${hoy}`,
        [habito]
    );
    const valorPrevio = previo.rows.length > 0 ? previo.rows[0].valor_realizado || 0 : 0;

    let nuevoValor = null;
    if (valor_realizado !== undefined && valor_realizado !== null) {
        nuevoValor = valor_realizado;
    } else if (incremento !== undefined && incremento !== null) {
        nuevoValor = parseFloat(valorPrevio) + parseFloat(incremento);
    }

    let nuevoEstado;

    switch (tipo) {
        case "normal":
            nuevoEstado = estado === "NO_COMPLETADO" ? "NO_COMPLETADO" : "COMPLETADO";
            break;

        case "repeticion":
        case "repeticiones": {
            if (nuevoValor === null) {
                throw {
                    status: 400,
                    message: "repeticion requiere incremento o valor_realizado"
                };
            }
            if (nuevoValor < 0) {
                throw {
                    status: 400,
                    message: "el valor de repeticiones no puede ser negativo"
                };
            }
            if (nuevoValor === 0) {
                nuevoEstado = "NO_COMPLETADO";
            } else if (meta !== null && nuevoValor >= meta) {
                nuevoEstado = "COMPLETADO";
            } else {
                nuevoEstado = "PARCIAL";
            }
            break;
        }

        case "evitado":
            nuevoEstado = estado === "EVITADO" ? "EVITADO" : "RECAIDA";
            break;

        case "tiempo":
            nuevoEstado = estado || "PARCIAL";
            break;

        default:
            throw {
                status: 400,
                message: "Tipo de hábito no soportado"
            };
    }

    const estadosValidos = ["COMPLETADO", "PARCIAL", "NO_COMPLETADO", "EVITADO", "RECAIDA"];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw {
            status: 400,
            message: "estado invalido"
        };
    }

    await db.query(
        `INSERT INTO registro_habitos (habito, fecha, estado, valor_realizado, fecha_inicio, fecha_completado)
        VALUES ($1, ${hoy}, $2::public.estado_registro_habito, $3,
            CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE NULL END,
            CASE WHEN $2::text = 'COMPLETADO' THEN CURRENT_TIMESTAMP ELSE NULL END)
        ON CONFLICT (habito, fecha) DO UPDATE SET
            estado = EXCLUDED.estado,
            valor_realizado = EXCLUDED.valor_realizado,
            fecha_completado = CASE
                WHEN EXCLUDED.estado = 'COMPLETADO'
                    THEN COALESCE(registro_habitos.fecha_completado, CURRENT_TIMESTAMP)
                ELSE NULL
            END`,
        [habito, nuevoEstado, nuevoValor, nuevoEstado === "PARCIAL"]
    );

    return { message: "registro guardado con exito", estado: nuevoEstado, valor_realizado: nuevoValor };
};

const diasPorPeriodo = (periodo) => {
    switch (periodo) {
        case "dia": return 1;
        case "semana": return 7;
        case "mes": return 30;
        case "trimestre": return 90;
        case "semestre": return 180;
        case "anual": return 365;
        default:
            throw {
                status: 400,
                message: "periodo no valido. Use: dia, semana, mes, trimestre, semestre, anual"
            };
    }
};

export const obtenerRegistrosPorPeriodo = async (id_usuario, periodo, timezone) => {
    if (!periodo) {
        throw {
            status: 400,
            message: "El parametro periodo es obligatorio"
        };
    }

    const dias = diasPorPeriodo(periodo);
    const fechaInicio = fechaInicioSQL(timezone, dias);
    const hoy = fechaHoySQL(timezone);

    const result = await db.query(
        `SELECT
            rh.id_registro_habito,
            h.id_habito,
            h.nombre AS habito,
            rh.fecha,
            rh.valor_realizado,
            h.meta,
            rh.estado
        FROM registro_habitos rh
        INNER JOIN habitos h ON rh.habito = h.id_habito
        WHERE h.usuario = $1
            AND rh.fecha >= ${fechaInicio}
            AND rh.fecha <= ${hoy}
        ORDER BY rh.fecha DESC`,
        [id_usuario]
    );

    return result.rows;
};
