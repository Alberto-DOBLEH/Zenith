import pool from '../config/db.js';

export const crearHabito = async (datosHabito) => {
    const { nombre, id_usuario, tipo_habito, negpos } = datosHabito;

    const result = await pool.query(
        `INSERT INTO habitos (nombre, id_usuario, tipo_habito, negpos) 
        VALUES ($1, $2, $3, $4) RETURNING *`,
        [nombre, id_usuario, tipo_habito, negpos]
    );

    return result.rows[0];
};
