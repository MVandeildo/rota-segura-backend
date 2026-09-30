const { verify } = require("jsonwebtoken");

const pool = require("../config/database");

const authMiddleware = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                message: "Token não informado!",
                type: "error",
            });
        }

        const token = authorization.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token inválido!",
                type: "error",
            });
        }

        const decoded = verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        const resultado = await pool.query(
            `SELECT id, email, verified
             FROM usuarios
             WHERE id = $1`,
            [decoded.id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                message: "Usuário não existe!",
                type: "error",
            });
        }

        req.usuario = resultado.rows[0];

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token inválido!",
            type: "error",
        });
    }
};

module.exports = {
    authMiddleware,
};
