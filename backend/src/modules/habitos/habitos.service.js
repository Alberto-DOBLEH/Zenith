import db from "../../config/db.js";

const DIAS_VALIDOS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

export const obtenerTiposHabitos = async () => {
    const result = await db.query(
        `SELECT id_tipo_habito, nombre
        FROM tipos_habitos
        ORDER BY id_tipo_habito ASC`
    );

    return result.rows;
};

const validarDias = (dias) => {
    if (!Array.isArray(dias) || dias.length === 0) {
        throw {
            status: 400,
            message: "dias es requerido con al menos un dia (LUNES..DOMINGO)"
        };
    }
    for (const dia of dias) {
        if (!DIAS_VALIDOS.includes(dia)) {
            throw {
                status: 400,
                message: "dia invalido, use: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO"
            };
        }
    }
};

const consultaSelectHabito = `
    SELECT
        h.id_habito,
        h.tipo_habito,
        t.nombre AS tipo_nombre,
        h.nombre,
        h.descripcion,
        h.meta,
        h.unidad,
        h.frecuencia,
        h.dia_del_mes,
        h.estado,
        h.fecha_creacion,
        COALESCE(d.dias, '{}') AS dias
    FROM habitos h
    LEFT JOIN tipos_habitos t ON h.tipo_habito = t.id_tipo_habito
    LEFT JOIN (
        SELECT habito, ARRAY_AGG(dia ORDER BY dia) AS dias
        FROM habito_dias
        GROUP BY habito
    ) d ON d.habito = h.id_habito
`;

export const crearHabito = async (id_usuario, datos) => {
    const { tipo_habito, nombre, descripcion, meta, unidad, frecuencia, dias, dia_del_mes } = datos;

    if (!tipo_habito || !nombre || !frecuencia) {
        throw {
            status: 400,
            message: "tipo_habito, nombre y frecuencia son obligatorios"
        };
    }

    const frecuenciasValidas = ["DIARIO", "SEMANAL", "MENSUAL"];
    if (!frecuenciasValidas.includes(frecuencia)) {
        throw {
            status: 400,
            message: "frecuencia debe ser DIARIO, SEMANAL o MENSUAL"
        };
    }

    if (frecuencia === "SEMANAL") {
        validarDias(dias);
    }

    if (frecuencia === "MENSUAL" && (dia_del_mes === null || dia_del_mes === undefined)) {
        throw {
            status: 400,
            message: "dia_del_mes es requerido para frecuencia MENSUAL (1-31)"
        };
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO habitos (tipo_habito, usuario, nombre, descripcion, frecuencia, meta, unidad, dia_del_mes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id_habito`,
            [
                tipo_habito,
                id_usuario,
                nombre,
                descripcion || null,
                frecuencia,
                meta || null,
                unidad || null,
                dia_del_mes || null
            ]
        );

        const id_habito = result.rows[0].id_habito;

        if (frecuencia === "SEMANAL" && Array.isArray(dias)) {
            for (const dia of dias) {
                await client.query(
                    "INSERT INTO habito_dias (habito, dia) VALUES ($1, $2)",
                    [id_habito, dia]
                );
            }
        }

        await client.query("COMMIT");
        return { message: "Habito creado con exito", id_habito };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const obtenerHabitos = async (id_usuario) => {
    const result = await db.query(
        `${consultaSelectHabito}
        WHERE h.usuario = $1
        ORDER BY h.fecha_creacion DESC`,
        [id_usuario]
    );

    return result.rows.map(normalizarHabito);
};

export const obtenerHabitoPorId = async (id_usuario, id_habito) => {
    const result = await db.query(
        `${consultaSelectHabito}
        WHERE h.id_habito = $1 AND h.usuario = $2`,
        [id_habito, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    return normalizarHabito(result.rows[0]);
};

const normalizarHabito = (fila) => {
    let dias = fila.dias;
    if (Array.isArray(dias)) {
        dias = dias.map((d) => String(d).trim());
    } else if (typeof dias === "string" && dias.startsWith("{")) {
        dias = dias.slice(1, -1).split(",").filter(Boolean);
    }
    return {
        ...fila,
        dias: dias || []
    };
};

export const editarHabito = async (id_usuario, id_habito, datos) => {
    const { nombre, descripcion, meta, unidad, frecuencia, dia_del_mes } = datos;

    const habito = await obtenerHabitoPorId(id_usuario, id_habito);

    if (frecuencia) {
        const frecuenciasValidas = ["DIARIO", "SEMANAL", "MENSUAL"];
        if (!frecuenciasValidas.includes(frecuencia)) {
            throw {
                status: 400,
                message: "frecuencia debe ser DIARIO, SEMANAL o MENSUAL"
            };
        }
    }

    const diasParaActualizar = datos.dias !== undefined ? datos.dias : undefined;
    if (diasParaActualizar !== undefined && (frecuencia || habito.frecuencia) === "SEMANAL") {
        validarDias(diasParaActualizar);
    }

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE habitos
            SET
                nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                meta = COALESCE($3, meta),
                unidad = COALESCE($4, unidad),
                frecuencia = COALESCE($5, frecuencia),
                dia_del_mes = COALESCE($6, dia_del_mes)
            WHERE id_habito = $7 AND usuario = $8`,
            [
                nombre || null,
                descripcion || null,
                meta || null,
                unidad || null,
                frecuencia || null,
                dia_del_mes || null,
                id_habito,
                id_usuario
            ]
        );

        if (diasParaActualizar !== undefined) {
            await client.query("DELETE FROM habito_dias WHERE habito = $1", [id_habito]);
            for (const dia of diasParaActualizar) {
                await client.query(
                    "INSERT INTO habito_dias (habito, dia) VALUES ($1, $2)",
                    [id_habito, dia]
                );
            }
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return { message: "Habito modificado con exito" };
};

export const eliminarHabito = async (id_usuario, id_habito) => {
    const result = await db.query(
        "DELETE FROM habitos WHERE id_habito = $1 AND usuario = $2 RETURNING id_habito",
        [id_habito, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Habito no encontrado"
        };
    }

    return { message: "Habito eliminado con exito" };
};