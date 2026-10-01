import db from "../../config/db.js";

const TIPOS = ["GASTO", "ENTRADA"];

const validarNombre = (nombre) => {
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        throw {
            status: 400,
            message: "nombre es obligatorio"
        };
    }

    const nombreLimpio = nombre.trim();

    if (nombreLimpio.length > 50) {
        throw {
            status: 400,
            message: "nombre no puede superar los 50 caracteres"
        };
    }

    return nombreLimpio;
};

export const obtenerCategorias = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            id_categoria,
            nombre,
            tipo
        FROM categorias
        WHERE id_usuario = $1
        ORDER BY id_categoria ASC`,
        [id_usuario]
    );

    return result.rows;
};

export const crearCategoria = async (id_usuario, datos) => {
    const { nombre, tipo } = datos;

    const nombreLimpio = validarNombre(nombre);

    if (!TIPOS.includes(tipo)) {
        throw {
            status: 400,
            message: "tipo debe ser GASTO o ENTRADA"
        };
    }

    const existe = await db.query(
        `SELECT 1 FROM categorias
        WHERE id_usuario = $1 AND nombre = $2 AND tipo = $3`,
        [id_usuario, nombreLimpio, tipo]
    );

    if (existe.rows.length > 0) {
        throw {
            status: 409,
            message: "Ya tienes una categoría con ese nombre y tipo"
        };
    }

    const result = await db.query(
        `INSERT INTO categorias (id_usuario, nombre, tipo)
        VALUES ($1, $2, $3)
        RETURNING id_categoria, nombre, tipo`,
        [id_usuario, nombreLimpio, tipo]
    );

    return {
        message: "Categoría creada con exito",
        categoria: result.rows[0]
    };
};

export const editarCategoria = async (id_usuario, id_categoria, datos) => {
    const { nombre, tipo } = datos;

    if (nombre === undefined && tipo === undefined) {
        throw {
            status: 400,
            message: "Indica al menos nombre o tipo"
        };
    }

    const result = await db.query(
        `SELECT id_categoria, nombre, tipo
        FROM categorias
        WHERE id_categoria = $1 AND id_usuario = $2`,
        [id_categoria, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Categoría no encontrada"
        };
    }

    const actual = result.rows[0];
    const nombreFinal = nombre === undefined ? actual.nombre : validarNombre(nombre);
    const tipoFinal = tipo === undefined ? actual.tipo : tipo;

    if (!TIPOS.includes(tipoFinal)) {
        throw {
            status: 400,
            message: "tipo debe ser GASTO o ENTRADA"
        };
    }

    const duplicada = await db.query(
        `SELECT 1 FROM categorias
        WHERE id_usuario = $1 AND nombre = $2 AND tipo = $3 AND id_categoria <> $4`,
        [id_usuario, nombreFinal, tipoFinal, id_categoria]
    );

    if (duplicada.rows.length > 0) {
        throw {
            status: 409,
            message: "Ya tienes una categoría con ese nombre y tipo"
        };
    }

    await db.query(
        `UPDATE categorias
        SET nombre = $1, tipo = $2
        WHERE id_categoria = $3 AND id_usuario = $4`,
        [nombreFinal, tipoFinal, id_categoria, id_usuario]
    );

    return { message: "Categoría modificada con exito" };
};

export const eliminarCategoria = async (id_usuario, id_categoria) => {
    const result = await db.query(
        `DELETE FROM categorias
        WHERE id_categoria = $1 AND id_usuario = $2
        RETURNING id_categoria`,
        [id_categoria, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Categoría no encontrada"
        };
    }

    return { message: "Categoría eliminada con exito" };
};
