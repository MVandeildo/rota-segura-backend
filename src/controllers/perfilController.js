// controllers/perfilController.js
const db = require('../config/database');

exports.obterPerfil = async (req, res) => {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    try {
        const result = await db.query(
            `SELECT id, nome, email, perfil, telefone, cpf, cnh, nome_exibicao, foto_url
             FROM usuarios
             WHERE id = $1`,
            [usuarioId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        const u = result.rows[0];
        return res.status(200).json({
            usuario: {
                id: u.id,
                nome_completo: u.nome,
                nome_exibicao: u.nome_exibicao || u.nome,
                cpf: u.cpf || '',
                cnh: u.cnh || '',
                telefone: u.telefone || '',
                email: u.email || '',
                foto_url: u.foto_url || '',
                perfil: u.perfil
            }
        });
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        return res.status(500).json({ erro: 'Erro ao carregar perfil.' });
    }
};

exports.atualizarPerfil = async (req, res) => {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) {
        return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    const { nome_completo, nome_exibicao, cpf, cnh, telefone, email, foto_url } = req.body;

    if (typeof nome_completo !== 'string' || !nome_completo.trim()) {
        return res.status(400).json({ erro: 'Nome completo é obrigatório.' });
    }

    try {
        const result = await db.query(
            `UPDATE usuarios
             SET nome = $1,
                 nome_exibicao = $2,
                 cpf = $3,
                 cnh = $4,
                 telefone = $5,
                 email = COALESCE(NULLIF($6, ''), email),
                 foto_url = $7
             WHERE id = $8
             RETURNING id, nome, email, perfil, telefone, cpf, cnh, nome_exibicao, foto_url`,
            [
                nome_completo.trim(),
                (nome_exibicao || nome_completo).trim(),
                (cpf || '').trim() || null,
                (cnh || '').trim() || null,
                (telefone || '').trim() || null,
                (email || '').trim(),
                (foto_url || '').trim() || null,
                usuarioId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        const u = result.rows[0];
        return res.status(200).json({
            mensagem: 'Perfil atualizado com sucesso.',
            usuario: {
                id: u.id,
                nome_completo: u.nome,
                nome_exibicao: u.nome_exibicao || u.nome,
                cpf: u.cpf || '',
                cnh: u.cnh || '',
                telefone: u.telefone || '',
                email: u.email || '',
                foto_url: u.foto_url || '',
                perfil: u.perfil
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
    }
};