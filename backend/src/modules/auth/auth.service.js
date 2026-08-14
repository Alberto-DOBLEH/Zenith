import bcrypt from "bcrypt";
import db from "../../config/db.js";
import { generateToken } from "../../utils/jwt.js"

export const registrarUsuario = async (userData) => {
    const {
        nombre,
        primer_apellido,
        segundo_apellido,
        correo,
        telefono,
        username,
        contraseña
    } = userData;

    // Verificar correo

    const correoExiste = await db.query(
        "SELECT id_usuario FROM usuarios WHERE correo = $1",
        [correo]
    );

    if (correoExiste.rows.length > 0) {
        throw {
            status: 409,
            message: "El correo ya está registrado"
        };
    }

    // Verificar username

    const usernameExiste = await db.query(
        "SELECT id_usuario FROM usuarios WHERE username = $1",
        [username]
    );

    if (usernameExiste.rows.length > 0) {
        throw {
            status: 409,
            message: "El username ya está registrado"
        };
    }

    // Verificar teléfono

    const telefonoExiste = await db.query(
        "SELECT id_usuario FROM usuarios WHERE telefono = $1",
        [telefono]
    );

    if (telefonoExiste.rows.length > 0) {
        throw {
            status: 409,
            message: "El teléfono ya está registrado"
        };
    }

    // Encriptar contraseña

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Insertar usuario

    const result = await db.query(
        `
    INSERT INTO usuarios (
      nombre,
      primer_apellido,
      segundo_apellido,
      correo,
      telefono,
      username,
      contraseña,
      estado
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING
      id_usuario,
      nombre,
      correo,
      username
    `,
        [
            nombre,
            primer_apellido,
            segundo_apellido || null,
            correo,
            telefono,
            username,
            hashedPassword,
            'ACTIVO'
        ]
    );

    return {
        message: "Usuario registrado correctamente",
        user: result.rows[0]
    };
};

export const loginUsuario = async ({
    login,
    contraseña
}) => {
    const result = await db.query(
        `
    SELECT
      id_usuario,
      nombre,
      username,
      correo,
      telefono,
      contraseña
    FROM usuarios
    WHERE
      correo = $1
      OR username = $1
      OR telefono = $1
    `,
        [login]
    );

    if (result.rows.length === 0) {
        throw {
            status: 401,
            message: "Credenciales inválidas"
        };
    }

    const user = result.rows[0];

    const passwordCorrecta =
        await bcrypt.compare(
            contraseña,
            user.contraseña
        );

    if (!passwordCorrecta) {
        throw {
            status: 401,
            message: "Credenciales inválidas"
        };
    }

    const token = generateToken(user);

    return {
        message: "Inicio de sesión exitoso",
        token
    };
};
