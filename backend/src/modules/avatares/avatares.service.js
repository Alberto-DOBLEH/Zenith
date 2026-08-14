import db from "../../config/db.js";

export const obtenerAvatares = async () => {
    const result = await db.query(
        `SELECT id_avatar, nombre, ruta_imagen
        FROM avatares
        ORDER BY id_avatar ASC`
    );

    return result.rows;
};