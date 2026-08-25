export const enviarError = (res, error) => {
    const status = error.status || 500;
    const mensaje =
        status < 500 || process.env.NODE_ENV !== "production"
            ? error.message
            : "Error interno del servidor";
    return res.status(status).json({
        message: mensaje
    });
};

export const errorHandler = (err, req, res, next) => {
    return enviarError(res, err);
};