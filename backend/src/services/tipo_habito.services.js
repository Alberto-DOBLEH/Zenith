import pool from '../config/db.js';

export const obtenerTiposHabito = async () => {
    const result = await pool.query('SELECT * FROM tipo_habito');
    return result.rows;
};
