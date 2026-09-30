const express = require("express");
const router = express.Router();

const { hash, compare } = require("bcryptjs");

const pool = require("../config/database");

const {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
} = require("../utils/tokens");

router.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "E-mail e senha são obrigatórios.",
                type: "error",
            });
        }

        const usuarioExistente = await pool.query(
            "SELECT id FROM usuarios WHERE email = $1",
            [email]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({
                message: "Usuário já existe!",
                type: "warning",
            });
        }

        const passwordHash = await hash(password, 10);

        const novoUsuario = await pool.query(
            `INSERT INTO usuarios (email, password)
             VALUES ($1, $2)
             RETURNING id, email, verified`,
            [email, passwordHash]
        );

        return res.status(201).json({
            message: "Usuário criado com sucesso!",
            type: "success",
            usuario: novoUsuario.rows[0],
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            type: "error",
            message: "Erro ao criar usuário!",
            error: error.message,
        });
    }
});

router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "E-mail e senha são obrigatórios.",
                type: "error",
            });
        }

        const resultado = await pool.query(
            `SELECT id, email, password, verified
             FROM usuarios
             WHERE email = $1`,
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                message: "Usuário não existe!",
                type: "error",
            });
        }

        const usuario = resultado.rows[0];

        const isMatch = await compare(
            password,
            usuario.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Senha incorreta!",
                type: "error",
            });
        }

        const accessToken = createAccessToken(usuario.id);
        const refreshToken = createRefreshToken(usuario.id);

        await pool.query(
            `UPDATE usuarios
             SET refresh_token = $1
             WHERE id = $2`,
            [refreshToken, usuario.id]
        );

        sendRefreshToken(res, refreshToken);

        sendAccessToken(
            req,
            res,
            accessToken
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            type: "error",
            message: "Erro ao fazer login!",
            error: error.message,
        });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("refreshtoken");

    return res.json({
        message: "Logout realizado com sucesso!",
        type: "success",
    });
});

const { verify } = require("jsonwebtoken");

router.post("/refresh_token", async (req, res) => {
    try {
        const { refreshtoken } = req.cookies;

        if (!refreshtoken) {
            return res.status(401).json({
                message: "No refresh token!",
                type: "error",
            });
        }

        let id;
        try {
            const decoded = verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET);
            id = decoded.id;
        } catch (error) {
            return res.status(401).json({
                message: "Invalid refresh token!",
                type: "error",
            });
        }

        if (!id) {
            return res.status(401).json({
                message: "Invalid refresh token!",
                type: "error",
            });
        }

        // Busca o utilizador no PostgreSQL
        const resultado = await pool.query(
            "SELECT * FROM usuarios WHERE id = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                message: "Usuario não encontrado!",
                type: "error",
            });
        }

        const usuario = resultado.rows[0];

        if (usuario.refresh_token !== refreshtoken) {
            return res.status(401).json({
                message: "Invalid refresh token!",
                type: "error",
            });
        }

        const accessToken = createAccessToken(usuario.id);
        const refreshToken = createRefreshToken(usuario.id);

        await pool.query(
            "UPDATE usuarios SET refresh_token = $1 WHERE id = $2",
            [refreshToken, usuario.id]
        );

        sendRefreshToken(res, refreshToken);

        return res.json({
            message: "Atualizado com sucesso!",
            type: "success",
            accessToken,
        });

    } catch (error) {
        console.error("Erro no refresh_token:", error);
        return res.status(500).json({
            type: "error",
            message: "Error ao atualizar token!",
            error: error.message,
        });
    }
});

const { authMiddleware } = require("../utils/protected");

router.get(
    "/protected",
    authMiddleware,
    async (req, res) => {
        return res.json({
            message: "Você está logado!",
            type: "success",
            usuario: req.usuario,
        });
    }
);

module.exports = router;
