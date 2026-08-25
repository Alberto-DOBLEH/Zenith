export const validarId = (req, res, next) => {
    for (const valor of Object.values(req.params)) {
        if (!/^\d+$/.test(valor)) {
            return res.status(400).json({
                message: "El identificador debe ser un número entero"
            });
        }
    }
    next();
};