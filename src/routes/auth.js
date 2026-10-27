const express = require("express");
const router = express.Router();

const { hash, compare } = require("bcryptjs");

const pool = require("../config/database");
const transporter = require("../config/enviar_email");
const enviarEmailRecuperacao = require("../config/enviar_email");
const bcrypt = require('bcrypt');
const {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken,
} = require("../utils/tokens");

router.post("/signup", async (req, res) => {
    try {
        const { nome, email, password } = req.body;

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

        // Insere o nome, email e a senha criptografada na tabela 'usuarios'
        // (Certifique-se de que a coluna 'nome' existe na sua tabela do PostgreSQL)
        const novoUsuario = await pool.query(
            `INSERT INTO usuarios (nome, email, password)
             VALUES ($1, $2, $3)
             RETURNING id, nome, email, verified`,
            [nome, email, passwordHash]
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

const crypto = require("crypto"); // Já nativo no Node.js para gerar tokens seguros

// Rota de Solicitação de Recuperação de Senha
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "O e-mail é obrigatório.",
                type: "error",
            });
        }

        const resultado = await pool.query(
            "SELECT id, email, nome FROM usuarios WHERE email = $1",
            [email]
        );

        if (resultado.rows.length === 0) {
            // Por segurança, retornamos sucesso genérico para não expor se o e-mail existe
            return res.status(200).json({
                message: "Se o e-mail estiver cadastrado, você receberá as instruções em breve.",
                type: "success",
            });
        }

        const usuario = resultado.rows[0];

        // Gera o token seguro e a expiração (1 hora)
        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiration = new Date(Date.now() + 3600000); 

        // Salva no banco de dados
        await pool.query(
            `UPDATE usuarios 
             SET reset_token = $1, reset_token_expires = $2 
             WHERE id = $3`,
            [resetToken, tokenExpiration, usuario.id]
        );

        // Monta o link que será enviado para o front-end
        const linkRedefinicao = `http://localhost:5173/redefinir-senha?token=${resetToken}`;

        // Dispara o e-mail utilizando a função auxiliar que criamos
        await enviarEmailRecuperacao(usuario.email, linkRedefinicao, usuario.nome);

        return res.status(200).json({
            message: "Instruções enviadas com sucesso para o seu e-mail.",
            type: "success",
        });

    } catch (error) {
        console.error("Erro no forgot-password:", error);
        return res.status(500).json({
            type: "error",
            message: "Erro ao processar a solicitação de recuperação de senha.",
            error: error.message,
        });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const { token, novaSenha } = req.body;

        if (!token || !novaSenha) {
            return res.status(400).json({
                message: "Token e nova senha são obrigatórios.",
                type: "error",
            });
        }

        // 1. Procura o usuário pelo token e verifica se ele ainda não expirou
        const resultado = await pool.query(
            `SELECT id FROM usuarios 
             WHERE reset_token = $1 AND reset_token_expires > NOW()`,
            [token]
        );

        if (resultado.rows.length === 0) {
            return res.status(400).json({
                message: "Token inválido ou expirado.",
                type: "error",
            });
        }

        const usuario = resultado.rows[0];

        // 2. Criptografa a nova senha com bcrypt
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(novaSenha, salt);

        // 3. Atualiza a senha no banco e limpa os campos de token para não poderem ser reutilizados
        await pool.query(
            `UPDATE usuarios 
             SET password = $1, reset_token = NULL, reset_token_expires = NULL 
             WHERE id = $2`,
            [senhaHash, usuario.id]
        );

        return res.status(200).json({
            message: "Senha redefinida com sucesso!",
            type: "success",
        });

    } catch (error) {
        console.error("Erro no reset-password:", error);
        return res.status(500).json({
            type: "error",
            message: "Erro interno ao redefinir a senha.",
            error: error.message,
        });
    }
});

module.exports = router;
