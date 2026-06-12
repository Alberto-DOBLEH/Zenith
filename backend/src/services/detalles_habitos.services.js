import pool from '../config/db.js';

export const crearDetalleHabito = async (datosDetalle) => {
    const { id_habito, dias, horas } = datosDetalle;

    const result = await pool.query(
        `INSERT INTO detalles_habitos (id_habito, dias, horas) 
        VALUES ($1, $2, $3) RETURNING *`,
        [id_habito, dias, horas]
    );

    return result.rows[0];
};
