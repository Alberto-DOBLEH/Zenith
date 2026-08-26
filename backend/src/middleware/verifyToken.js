import jwt from "jsonwebtoken";

const TIMEZONE_DEFAULT = "UTC";

export const verifyToken = (req, res, next) => {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token requerido"
        });
    }
    const token =
        authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = decoded;
        // Timezone del usuario desde el header X-Timezone
        req.timezone = req.headers["x-timezone"] || TIMEZONE_DEFAULT;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token inválido"
        });
    }
};