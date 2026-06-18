export const validarRegistro = (req, res, next) => {
    const {
        nombre,
        primer_apellido,
        correo,
        telefono,
        username,
        contraseña
    } = req.body;

    if (
        !nombre ||
        !primer_apellido ||
        !correo ||
        !telefono ||
        !username ||
        !contraseña
    ) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    if (telefono.length !== 10) {
        return res.status(400).json({ message: "El telefono debe tener 10 digitos" });
    }

    const expresionRegularCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!expresionRegularCorreo.test(correo)) {
        return res.status(400).json({ message: "El correo no es valido" });
    }

    const expresionRegularUsername = /^[a-zA-Z0-9_]{3,16}$/;
    if (!expresionRegularUsername.test(username)) {
        return res.status(400).json({ message: "El username no es valido" });
    }

    const expresionRegularContraseña = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!expresionRegularContraseña.test(contraseña)) {
        return res.status(400).json({ message: "La contraseña no es valida" });
    }

    next();
};

export const validarLogin = (req, res, next) => {
    const { login, contraseña } = req.body;

    if (!login || !contraseña) {
        return res.status(400).json({
            message: "Es necesario llenar todos los campos"
        });
    }

    next();
};