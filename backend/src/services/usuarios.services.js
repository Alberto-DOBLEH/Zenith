import pool from '../config/db.js';

export const crearUsuario = async (datosUsuario) => {
    const { nombre, primer_apellido, segundo_apellido, numero_telefono, correo_electronico, contraseña } = datosUsuario;

    const result = await pool.query(
        `INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, numero_telefono, correo_electronico, contraseña) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [nombre, primer_apellido, segundo_apellido, numero_telefono, correo_electronico, contraseña]
    );

    return result.rows[0];
};
