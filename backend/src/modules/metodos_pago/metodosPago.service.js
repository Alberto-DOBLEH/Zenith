import db from "../../config/db.js";

const TIPOS = ["DEBITO", "EFECTIVO", "CREDITO"];

export const obtenerMetodosPago = async (id_usuario) => {
    const result = await db.query(
        `SELECT
            id_metodo,
            nombre,
            tipo,
            saldo_actual
        FROM metodos_pago
        WHERE id_usuario = $1
        ORDER BY id_metodo ASC`,
        [id_usuario]
    );

    return result.rows;
};

export const crearMetodoPago = async (id_usuario, datos) => {
    const { nombre, tipo, saldo_inicial } = datos;

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

    if (!TIPOS.includes(tipo)) {
        throw {
            status: 400,
            message: "tipo debe ser DEBITO, EFECTIVO o CREDITO"
        };
    }

    const saldo = saldo_inicial === undefined || saldo_inicial === null ? 0 : Number(saldo_inicial);

    if (Number.isNaN(saldo)) {
        throw {
            status: 400,
            message: "saldo_inicial debe ser un número"
        };
    }

    const existe = await db.query(
        `SELECT 1 FROM metodos_pago
        WHERE id_usuario = $1 AND nombre = $2 AND tipo = $3`,
        [id_usuario, nombreLimpio, tipo]
    );

    if (existe.rows.length > 0) {
        throw {
            status: 409,
            message: "Ya tienes un método de pago con ese nombre y tipo"
        };
    }

    const result = await db.query(
        `INSERT INTO metodos_pago (id_usuario, nombre, tipo, saldo_actual)
        VALUES ($1, $2, $3, $4)
        RETURNING id_metodo, nombre, tipo, saldo_actual`,
        [id_usuario, nombreLimpio, tipo, saldo]
    );

    return {
        message: "Método de pago creado con exito",
        metodo: result.rows[0]
    };
};

export const eliminarMetodoPago = async (id_usuario, id_metodo) => {
    try {
        const result = await db.query(
            `DELETE FROM metodos_pago
            WHERE id_metodo = $1 AND id_usuario = $2
            RETURNING id_metodo`,
            [id_metodo, id_usuario]
        );

        if (result.rows.length === 0) {
            throw {
                status: 404,
                message: "Método de pago no encontrado"
            };
        }

        return { message: "Método de pago eliminado con exito" };
    } catch (error) {
        if (error.code === "23503") {
            throw {
                status: 409,
                message: "No puedes eliminar un método de pago que tiene movimientos asociados"
            };
        }
        throw error;
    }
};
