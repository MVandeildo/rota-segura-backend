const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { hash, compare } = require("bcryptjs");
const { verify } = require("jsonwebtoken");

const pool = require("../config/database");
const enviarEmailRecuperacao = require("../config/enviar_email");
const { authMiddleware } = require("../utils/protected");
const {
    createAccessToken,
    createRefreshToken,
    sendRefreshToken,
} = require("../utils/tokens");

// Helper para normalizar variações de perfil entre front-end e banco
const normalizarPerfil = (perfil) => {
    if (!perfil) return null;
    const p = String(perfil).trim().toUpperCase();
    if (['ADMINISTRADOR', 'GESTOR', 'ADMIN'].includes(p)) return 'ADMIN'; // Ajuste para 'GESTOR' se sua constraint CHECK usar 'GESTOR'
    return p;
};

router.post("/signup", async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        if (!nome || !email || !password) {
            return res.status(400).json({
                message: "Nome, e-mail e senha são obrigatórios.",
                type: "error",
            });
        }

        const usuarioExistente = await pool.query(
            "SELECT id FROM usuarios WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({
                message: "Usuário já existe!",
                type: "warning",
            });
        }

        const passwordHash = await hash(password, 10);

        // Cadastro público força perfil RESPONSAVEL por segurança
        const perfilPadrao = "RESPONSAVEL";

        const novoUsuario = await pool.query(
            `INSERT INTO usuarios (nome, email, password, perfil)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, email, verified, perfil`,
            [nome.trim(), email.trim().toLowerCase(), passwordHash, perfilPadrao]
        );

        return res.status(201).json({
            message: "Usuário criado com sucesso!",
            type: "success",
            usuario: novoUsuario.rows[0],
        });
    } catch (error) {
        console.error("Erro no signup:", error);
        return res.status(500).json({
            type: "error",
            message: "Erro ao criar usuário!",
            error: error.message,
        });
    }
});

router.post("/signin", async (req, res) => {
    try {
        const { email, password, perfil } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "E-mail e senha são obrigatórios.",
                type: "error",
            });
        }

        const resultado = await pool.query(
            `SELECT id, nome, email, password, verified, perfil
             FROM usuarios
             WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                message: "Usuário não existe!",
                type: "error",
            });
        }

        const usuario = resultado.rows[0];

        const isMatch = await compare(password, usuario.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Senha incorreta!",
                type: "error",
            });
        }

        // Validação de perfil case-insensitive e normalizada
        const perfilSolicitado = normalizarPerfil(perfil);
        const perfilBanco = normalizarPerfil(usuario.perfil);

        if (perfilSolicitado && perfilBanco && perfilBanco !== perfilSolicitado) {
            return res.status(403).json({
                message: `Acesso negado. Esta conta está cadastrada como '${usuario.perfil}', não sendo permitido o acesso como '${perfil}'.`,
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

        return res.json({
            accesstoken: accessToken,
            message: "Login com sucesso",
            type: "success",
            user: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
            },
        });
    } catch (error) {
        console.error("Erro no signin:", error);
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

        const resultado = await pool.query(
            "SELECT * FROM usuarios WHERE id = $1",
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                message: "Usuário não encontrado!",
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
            message: "Erro ao atualizar token!",
            error: error.message,
        });
    }
});

router.get("/protected", authMiddleware, async (req, res) => {
    return res.json({
        message: "Você está logado!",
        type: "success",
        usuario: req.usuario,
    });
});

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
            [email.trim().toLowerCase()]
        );

        if (resultado.rows.length === 0) {
            return res.status(200).json({
                message: "Se o e-mail estiver cadastrado, você receberá as instruções em breve.",
                type: "success",
            });
        }

        const usuario = resultado.rows[0];
        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiration = new Date(Date.now() + 3600000);

        await pool.query(
            `UPDATE usuarios 
             SET reset_token = $1, reset_token_expires = $2 
             WHERE id = $3`,
            [resetToken, tokenExpiration, usuario.id]
        );

        const linkRedefinicao = `http://localhost:5173/redefinir-senha?token=${resetToken}`;
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
        const senhaHash = await hash(novaSenha, 10);

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

// Rota protegida para Administradores/Gestores cadastrarem Motoristas ou outros Admins internamente
router.post("/admin/criar-usuario", authMiddleware, async (req, res) => {
    try {
        // 1. Identifica quem está fazendo a requisição usando o ID injetado pelo authMiddleware
        // (Nota: ajuste 'req.usuario?.id' ou 'req.userId' conforme o seu middleware de proteção)
        const adminId = req.usuario?.id || req.userId;

        if (!adminId) {
            return res.status(401).json({ message: "Não autorizado.", type: "error" });
        }

        // 2. Confere no banco se o usuário logado realmente tem perfil de ADMIN ou GESTOR
        const adminCheck = await pool.query(
            "SELECT perfil FROM usuarios WHERE id = $1",
            [adminId]
        );

        if (adminCheck.rows.length === 0 || !['ADMIN', 'GESTOR'].includes(adminCheck.rows[0].perfil)) {
            return res.status(403).json({ 
                message: "Acesso negado. Apenas administradores podem cadastrar novos membros.", 
                type: "error" 
            });
        }

        // 3. Recebe os dados do novo usuário enviado pelo front-end administrativo
        const { nome, email, password, perfil } = req.body;

        if (!nome || !email || !password || !perfil) {
            return res.status(400).json({
                message: "Nome, e-mail, senha e perfil são obrigatórios.",
                type: "error",
            });
        }

        const perfilFormatado = perfil.trim().toUpperCase();
        const perfisPermitidos = ['MOTORISTA', 'ADMIN', 'GESTOR', 'RESPONSAVEL'];
        
        if (!perfisPermitidos.includes(perfilFormatado)) {
            return res.status(400).json({
                message: "Perfil inválido.",
                type: "error",
            });
        }

        // 4. Verifica se o e-mail já existe
        const usuarioExistente = await pool.query(
            "SELECT id FROM usuarios WHERE email = $1",
            [email.trim().toLowerCase()]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({
                message: "Já existe um usuário com este e-mail.",
                type: "warning",
            });
        }

        // 5. Cria o hash da senha e insere no banco com o perfil escolhido (ex: MOTORISTA)
        const passwordHash = await hash(password, 10);

        const novoUsuario = await pool.query(
            `INSERT INTO usuarios (nome, email, password, perfil)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, email, perfil`,
            [nome.trim(), email.trim().toLowerCase(), passwordHash, perfilFormatado]
        );

        return res.status(201).json({
            message: "Usuário cadastrado com sucesso pelo administrador!",
            type: "success",
            usuario: novoUsuario.rows[0],
        });

    } catch (error) {
        console.error("Erro ao criar usuário por admin:", error);
        return res.status(500).json({
            type: "error",
            message: "Erro interno ao cadastrar usuário.",
            error: error.message,
        });
    }
});

module.exports = router;