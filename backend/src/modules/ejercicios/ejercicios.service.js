import db from "../../config/db.js";

const LIMITE_NOMBRE = 100;
const LIMITE_GRUPO = 50;

const validarNombre = (nombre) => {
    if (nombre === undefined || nombre === null || typeof nombre !== "string" || !nombre.trim()) {
        throw {
            status: 400,
            message: "nombre es obligatorio"
        };
    }

    const limpio = nombre.trim();

    if (limpio.length > LIMITE_NOMBRE) {
        throw {
            status: 400,
            message: `nombre no puede superar los ${LIMITE_NOMBRE} caracteres`
        };
    }

    return limpio;
};

const validarGrupo = (grupo) => {
    if (grupo === undefined || grupo === null || typeof grupo !== "string" || !grupo.trim()) {
        throw {
            status: 400,
            message: "grupo_muscular es obligatorio"
        };
    }

    const limpio = grupo.trim();

    if (limpio.length > LIMITE_GRUPO) {
        throw {
            status: 400,
            message: `grupo_muscular no puede superar los ${LIMITE_GRUPO} caracteres`
        };
    }

    return limpio;
};

export const obtenerEjercicios = async (filtros) => {
    const { grupo, q } = filtros;

    const condiciones = [];
    const parametros = [];

    if (grupo !== undefined && grupo !== null && String(grupo).trim() !== "") {
        if (typeof grupo !== "string" || grupo.length > LIMITE_GRUPO) {
            throw {
                status: 400,
                message: `grupo debe ser texto de hasta ${LIMITE_GRUPO} caracteres`
            };
        }
        parametros.push(grupo.trim());
        condiciones.push(`lower(e.grupo_muscular) = lower($${parametros.length})`);
    }

    if (q !== undefined && q !== null && String(q).trim() !== "") {
        if (typeof q !== "string" || q.length > 100) {
            throw {
                status: 400,
                message: "q debe ser texto de hasta 100 caracteres"
            };
        }
        parametros.push(`%${q.trim()}%`);
        condiciones.push(`e.nombre ILIKE $${parametros.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

    const result = await db.query(
        `SELECT e.id_ejercicio, e.nombre, e.grupo_muscular
        FROM ejercicios e
        ${where}
        ORDER BY e.grupo_muscular, e.nombre`,
        parametros
    );

    return result.rows;
};

export const crearEjercicio = async (datos) => {
    const nombre = validarNombre(datos.nombre);
    const grupo = validarGrupo(datos.grupo_muscular);

    const existe = await db.query(
        "SELECT 1 FROM ejercicios WHERE lower(nombre) = lower($1)",
        [nombre]
    );

    if (existe.rows.length > 0) {
        throw {
            status: 409,
            message: "Ya existe un ejercicio con ese nombre"
        };
    }

    const result = await db.query(
        `INSERT INTO ejercicios (nombre, grupo_muscular)
        VALUES ($1, $2)
        RETURNING id_ejercicio, nombre, grupo_muscular`,
        [nombre, grupo]
    );

    return {
        message: "Ejercicio creado con exito",
        ejercicio: result.rows[0]
    };
};

export const editarEjercicio = async (id_ejercicio, datos) => {
    if (datos.nombre === undefined && datos.grupo_muscular === undefined) {
        throw {
            status: 400,
            message: "Indica al menos nombre o grupo_muscular"
        };
    }

    const actual = await db.query(
        "SELECT id_ejercicio, nombre, grupo_muscular FROM ejercicios WHERE id_ejercicio = $1",
        [id_ejercicio]
    );

    if (actual.rows.length === 0) {
        throw {
            status: 404,
            message: "Ejercicio no encontrado"
        };
    }

    const nombre = datos.nombre === undefined ? actual.rows[0].nombre : validarNombre(datos.nombre);
    const grupo = datos.grupo_muscular === undefined ? actual.rows[0].grupo_muscular : validarGrupo(datos.grupo_muscular);

    const duplicado = await db.query(
        "SELECT 1 FROM ejercicios WHERE lower(nombre) = lower($1) AND id_ejercicio <> $2",
        [nombre, id_ejercicio]
    );

    if (duplicado.rows.length > 0) {
        throw {
            status: 409,
            message: "Ya existe un ejercicio con ese nombre"
        };
    }

    await db.query(
        "UPDATE ejercicios SET nombre = $1, grupo_muscular = $2 WHERE id_ejercicio = $3",
        [nombre, grupo, id_ejercicio]
    );

    return { message: "Ejercicio modificado con exito" };
};

export const eliminarEjercicio = async (id_ejercicio) => {
    const existe = await db.query(
        "SELECT 1 FROM ejercicios WHERE id_ejercicio = $1",
        [id_ejercicio]
    );

    if (existe.rows.length === 0) {
        throw {
            status: 404,
            message: "Ejercicio no encontrado"
        };
    }

    const uso = await db.query(
        `SELECT
            (SELECT COUNT(*) FROM ejercicios_por_sesion WHERE id_ejercicio = $1)::int AS recetas,
            (SELECT COUNT(*) FROM series_historial WHERE id_ejercicio = $1)::int AS series`,
        [id_ejercicio]
    );

    const { recetas, series } = uso.rows[0];

    if (recetas > 0 || series > 0) {
        throw {
            status: 409,
            message: "El ejercicio está en uso (en una rutina o con series registradas) y no se puede eliminar"
        };
    }

    await db.query("DELETE FROM ejercicios WHERE id_ejercicio = $1", [id_ejercicio]);

    return { message: "Ejercicio eliminado con exito" };
};
