import db from "../../config/db.js";

const TIPOS_MOVIMIENTO = ["GASTO", "ENTRADA", "TRANSFERENCIA"];
const LIMITE_CANTIDAD = 9999999999.99;

const COLUMNAS_LISTA = `
    m.id_movimiento,
    m.tipo_movimiento,
    m.cantidad,
    m.fecha,
    m.descripcion,
    m.id_metodo_pago,
    mp.nombre AS metodo_nombre,
    m.id_metodo_pago_destino,
    mpd.nombre AS metodo_destino_nombre,
    m.id_categoria,
    c.nombre AS categoria_nombre,
    c.tipo AS categoria_tipo`;

const JOINS_LISTA = `
    JOIN metodos_pago mp ON mp.id_metodo = m.id_metodo_pago
    LEFT JOIN metodos_pago mpd ON mpd.id_metodo = m.id_metodo_pago_destino
    LEFT JOIN categorias c ON c.id_categoria = m.id_categoria`;

export const obtenerMovimientos = async (id_usuario, filtros) => {
    const { fecha, mes, tipo, metodo } = filtros;

    const condiciones = ["m.id_usuario = $1"];
    const parametros = [id_usuario];

    if (fecha) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw {
                status: 400,
                message: "fecha debe tener formato YYYY-MM-DD"
            };
        }
        parametros.push(fecha);
        condiciones.push(`m.fecha = $${parametros.length}`);
    }

    if (mes) {
        if (!/^\d{4}-\d{2}$/.test(mes)) {
            throw {
                status: 400,
                message: "mes debe tener formato YYYY-MM"
            };
        }
        parametros.push(mes);
        condiciones.push(`to_char(m.fecha, 'YYYY-MM') = $${parametros.length}`);
    }

    if (tipo) {
        if (!TIPOS_MOVIMIENTO.includes(tipo)) {
            throw {
                status: 400,
                message: "tipo debe ser GASTO, ENTRADA o TRANSFERENCIA"
            };
        }
        parametros.push(tipo);
        condiciones.push(`m.tipo_movimiento = $${parametros.length}::public.tipo_movimiento`);
    }

    if (metodo) {
        if (!/^\d+$/.test(String(metodo))) {
            throw {
                status: 400,
                message: "metodo debe ser un número"
            };
        }
        parametros.push(Number(metodo));
        condiciones.push(
            `(m.id_metodo_pago = $${parametros.length} OR m.id_metodo_pago_destino = $${parametros.length})`
        );
    }

    const result = await db.query(
        `SELECT ${COLUMNAS_LISTA}
        FROM movimientos m
        ${JOINS_LISTA}
        WHERE ${condiciones.join(" AND ")}
        ORDER BY m.fecha DESC, m.id_movimiento DESC`,
        parametros
    );

    return result.rows;
};

export const obtenerMovimiento = async (id_usuario, id_movimiento) => {
    const result = await db.query(
        `SELECT ${COLUMNAS_LISTA}
        FROM movimientos m
        ${JOINS_LISTA}
        WHERE m.id_movimiento = $1 AND m.id_usuario = $2`,
        [id_movimiento, id_usuario]
    );

    if (result.rows.length === 0) {
        throw {
            status: 404,
            message: "Movimiento no encontrado"
        };
    }

    return result.rows[0];
};

export const crearMovimiento = async (id_usuario, datos) => {
    const {
        tipo_movimiento,
        cantidad,
        fecha,
        descripcion,
        id_metodo_pago,
        id_categoria,
        id_metodo_pago_destino
    } = datos;

    if (!TIPOS_MOVIMIENTO.includes(tipo_movimiento)) {
        throw {
            status: 400,
            message: "tipo_movimiento debe ser GASTO, ENTRADA o TRANSFERENCIA"
        };
    }

    const monto = Number(cantidad);

    if (cantidad === undefined || cantidad === null || !Number.isFinite(monto) || monto <= 0 || monto > LIMITE_CANTIDAD) {
        throw {
            status: 400,
            message: "cantidad debe ser un número mayor a 0"
        };
    }

    if (!/^\d+$/.test(String(id_metodo_pago ?? ""))) {
        throw {
            status: 400,
            message: "id_metodo_pago es obligatorio y debe ser un número"
        };
    }

    if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw {
            status: 400,
            message: "fecha debe tener formato YYYY-MM-DD"
        };
    }

    if (descripcion !== undefined && descripcion !== null && String(descripcion).length > 255) {
        throw {
            status: 400,
            message: "descripcion no puede superar los 255 caracteres"
        };
    }

    if (id_categoria !== undefined && id_categoria !== null && !/^\d+$/.test(String(id_categoria))) {
        throw {
            status: 400,
            message: "id_categoria debe ser un número"
        };
    }

    const esTransferencia = tipo_movimiento === "TRANSFERENCIA";

    if (esTransferencia) {
        if (!/^\d+$/.test(String(id_metodo_pago_destino ?? ""))) {
            throw {
                status: 400,
                message: "En una transferencia id_metodo_pago_destino es obligatorio"
            };
        }
        if (Number(id_metodo_pago_destino) === Number(id_metodo_pago)) {
            throw {
                status: 400,
                message: "El método destino debe ser distinto al método origen"
            };
        }
    } else if (id_metodo_pago_destino !== undefined && id_metodo_pago_destino !== null) {
        throw {
            status: 400,
            message: "id_metodo_pago_destino solo aplica en transferencias"
        };
    }

    const client = await db.connect();

    try {
        await client.query("BEGIN");

        const metodoOrigen = await client.query(
            "SELECT 1 FROM metodos_pago WHERE id_metodo = $1 AND id_usuario = $2",
            [id_metodo_pago, id_usuario]
        );

        if (metodoOrigen.rows.length === 0) {
            throw {
                status: 404,
                message: "Método de pago no encontrado"
            };
        }

        if (esTransferencia) {
            const metodoDestino = await client.query(
                "SELECT 1 FROM metodos_pago WHERE id_metodo = $1 AND id_usuario = $2",
                [id_metodo_pago_destino, id_usuario]
            );

            if (metodoDestino.rows.length === 0) {
                throw {
                    status: 404,
                    message: "Método de pago destino no encontrado"
                };
            }
        }

        if (id_categoria !== undefined && id_categoria !== null) {
            const categoria = await client.query(
                "SELECT 1 FROM categorias WHERE id_categoria = $1 AND id_usuario = $2",
                [id_categoria, id_usuario]
            );

            if (categoria.rows.length === 0) {
                throw {
                    status: 404,
                    message: "Categoría no encontrada"
                };
            }
        }

        const columnas = ["id_usuario", "id_metodo_pago", "tipo_movimiento", "cantidad"];
        const valores = [id_usuario, id_metodo_pago, tipo_movimiento, monto];

        if (fecha) {
            columnas.push("fecha");
            valores.push(fecha);
        }

        if (descripcion !== undefined && descripcion !== null && String(descripcion).trim()) {
            columnas.push("descripcion");
            valores.push(String(descripcion).trim());
        }

        if (id_categoria !== undefined && id_categoria !== null) {
            columnas.push("id_categoria");
            valores.push(id_categoria);
        }

        if (esTransferencia) {
            columnas.push("id_metodo_pago_destino");
            valores.push(id_metodo_pago_destino);
        }

        const placeholders = columnas.map((_, i) => `$${i + 1}`).join(", ");

        const insertado = await client.query(
            `INSERT INTO movimientos (${columnas.join(", ")})
            VALUES (${placeholders})
            RETURNING *`,
            valores
        );

        if (tipo_movimiento === "GASTO") {
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual - $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [monto, id_metodo_pago, id_usuario]
            );
        } else if (tipo_movimiento === "ENTRADA") {
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual + $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [monto, id_metodo_pago, id_usuario]
            );
        } else {
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual - $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [monto, id_metodo_pago, id_usuario]
            );
            await client.query(
                "UPDATE metodos_pago SET saldo_actual = saldo_actual + $1 WHERE id_metodo = $2 AND id_usuario = $3",
                [monto, id_metodo_pago_destino, id_usuario]
            );
        }

        await client.query("COMMIT");

        return {
            message: "Movimiento creado con exito",
            movimiento: insertado.rows[0]
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
