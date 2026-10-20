const express = require("express");
const router = express.Router();

const { randomBytes, createHash } = require("crypto");
const { hash, compare } = require("bcrypt");

const pool = require("../config/database");
const {
    createPasswordResetUrl,
    sendPasswordResetEmail,
} = require("../utils/email");

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

router.post("/request-password-reset", async (req, res) => {
    try {
        const email = typeof req.body.email === "string"
            ? req.body.email.trim().toLowerCase()
            : "";

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Informe um e-mail válido.",
                type: "error",
            });
        }

        const resultado = await pool.query(
            `SELECT id, email
             FROM usuarios
             WHERE LOWER(email) = $1`,
            [email]
        );

        if (resultado.rows.length > 0) {
            const usuario = resultado.rows[0];
            const token = randomBytes(32).toString("hex");
            const tokenHash = createHash("sha256").update(token).digest("hex");

            await pool.query(
                `INSERT INTO password_reset_tokens (usuario_id, token_hash, expires_at)
                 VALUES ($1, $2, NOW() + INTERVAL '1 hour')
                 ON CONFLICT (usuario_id)
                 DO UPDATE SET token_hash = EXCLUDED.token_hash,
                               expires_at = EXCLUDED.expires_at`,
                [usuario.id, tokenHash]
            );

            await sendPasswordResetEmail(
                usuario.email,
                createPasswordResetUrl(usuario.id, token)
            );
        }

        return res.json({
            message: "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
            type: "success",
        });
    } catch (error) {
        console.error("Erro ao solicitar redefinição de senha:", error);
        return res.status(500).json({
            message: "Não foi possível solicitar a redefinição de senha.",
            type: "error",
        });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const { id, token, password } = req.body;

        if (!/^\d+$/.test(String(id || "")) ||
            typeof token !== "string" ||
            !/^[a-f0-9]{64}$/.test(token) ||
            typeof password !== "string" ||
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({
                message: "Informe um token válido e uma senha entre 8 caracteres e 72 bytes.",
                type: "error",
            });
        }

        const tokenHash = createHash("sha256").update(token).digest("hex");
        const passwordHash = await hash(password, 10);
        const resultado = await pool.query(
            `WITH token_utilizado AS (
                DELETE FROM password_reset_tokens
                WHERE usuario_id = $1
                  AND token_hash = $2
                  AND expires_at > NOW()
                RETURNING usuario_id
             )
             UPDATE usuarios AS usuario
             SET password = $3, refresh_token = NULL
             FROM token_utilizado
             WHERE usuario.id = token_utilizado.usuario_id
             RETURNING usuario.id`,
            [id, tokenHash, passwordHash]
        );

        if (resultado.rows.length === 0) {
            return res.status(400).json({
                message: "Token inválido ou expirado.",
                type: "error",
            });
        }

        return res.json({
            message: "Senha redefinida com sucesso.",
            type: "success",
        });
    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        return res.status(500).json({
            message: "Não foi possível redefinir a senha.",
            type: "error",
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
