export const enviarError = (res, error) => {
    const status = error.status || 500;
    console.error("ERROR DETAIL:", error.message, error.code, error.detail);
    return res.status(status).json({
        message: error.message || "Error interno del servidor",
        code: error.code,
        detail: error.detail
    });
};

export const errorHandler = (err, req, res, next) => {
    return enviarError(res, err);
};