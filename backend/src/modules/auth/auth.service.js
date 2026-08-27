import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../../config/db.js";
import { generateToken } from "../../utils/jwt.js";
import { enviarVerificacion } from "../../services/correo.service.js";

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

    // Verificar teléfono (solo si se proporciona)
    if (telefono) {
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
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Insertar usuario con email_verificado = FALSE
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
            estado,
            email_verificado
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
            telefono || null,
            username,
            hashedPassword,
            'ACTIVO',
            false
        ]
    );

    const usuario = result.rows[0];

    // Generar token de verificación
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await db.query(
        `
        INSERT INTO tokens_verificacion (usuario, token, expiracion)
        VALUES ($1, $2, $3)
        `,
        [usuario.id_usuario, token, expiracion]
    );

    // Enviar correo de verificación
    try {
        await enviarVerificacion(correo, token);
    } catch (error) {
        console.error('Error al enviar correo de verificación:', error);
        // No fallamos el registro si el correo falla, pero lo registramos
    }

    return {
        message: "Usuario registrado correctamente. Revisa tu correo para verificar tu cuenta.",
        user: usuario
    };
};

export const verificarEmail = async (token) => {
    // Buscar el token
    const tokenResult = await db.query(
        `
        SELECT 
            tv.id,
            tv.usuario,
            tv.expiracion,
            tv.usado,
            u.id_usuario,
            u.email_verificado
        FROM tokens_verificacion tv
        JOIN usuarios u ON u.id_usuario = tv.usuario
        WHERE tv.token = $1
        `,
        [token]
    );

    if (tokenResult.rows.length === 0) {
        throw {
            status: 400,
            message: "Token de verificación inválido"
        };
    }

    const tokenData = tokenResult.rows[0];

    // Verificar si ya fue usado
    if (tokenData.usado) {
        throw {
            status: 400,
            message: "Este token ya ha sido utilizado"
        };
    }

    // Verificar si expiró
    if (new Date(tokenData.expiracion) < new Date()) {
        throw {
            status: 400,
            message: "El token de verificación ha expirado. Solicita uno nuevo."
        };
    }

    // Verificar si el correo ya está verificado
    if (tokenData.email_verificado) {
        throw {
            status: 400,
            message: "El correo ya está verificado"
        };
    }

    // Actualizar usuario y marcar token como usado
    await db.query('BEGIN');

    try {
        await db.query(
            "UPDATE usuarios SET email_verificado = TRUE WHERE id_usuario = $1",
            [tokenData.usuario]
        );

        await db.query(
            "UPDATE tokens_verificacion SET usado = TRUE WHERE id = $1",
            [tokenData.id]
        );

        await db.query('COMMIT');
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    }

    return {
        message: "Correo electrónico verificado correctamente"
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
            contraseña,
            email_verificado
        FROM usuarios
        WHERE
            correo = $1
            OR username = $1
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

    // Verificar si el correo está verificado
    if (!user.email_verificado) {
        throw {
            status: 403,
            message: "Debes verificar tu correo electrónico para iniciar sesión"
        };
    }

    const token = generateToken(user);

    return {
        message: "Inicio de sesión exitoso",
        token
    };
};
