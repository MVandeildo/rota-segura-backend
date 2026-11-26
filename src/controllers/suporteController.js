const db = require('../config/database');

const CATEGORIAS_VALIDAS = ['rotas', 'atrasos', 'pagamentos', 'cadastro', 'geral'];
const STATUS_VALIDOS = ['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO'];

function obterUsuarioId(req) {
    return (
        req.user?.id ||
        req.user?.userId ||
        req.usuario?.id ||
        req.userId ||
        null
    );
}

function obterPerfilUsuario(req) {
    return String(
        req.user?.perfil ||
        req.usuario?.perfil ||
        ''
    ).toUpperCase();
}

exports.criarChamado = async (req, res) => {
    const usuarioId = obterUsuarioId(req);
    const { categoria = 'geral', assunto, mensagem } = req.body;

    if (!assunto || !String(assunto).trim() || !mensagem || !String(mensagem).trim()) {
        return res.status(400).json({
            erro: 'Assunto e mensagem detalhada são obrigatórios.'
        });
    }

    const categoriaLimpa = String(categoria).trim().toLowerCase();
    const categoriaFinal = CATEGORIAS_VALIDAS.includes(categoriaLimpa)
        ? categoriaLimpa
        : 'geral';

    try {
        const result = await db.query(
            `INSERT INTO chamados_suporte
                (usuario_id, categoria, assunto, mensagem, status, criado_em, atualizado_em)
             VALUES ($1, $2, $3, $4, 'ABERTO', NOW(), NOW())
             RETURNING *`,
            [
                usuarioId,
                categoriaFinal,
                String(assunto).trim(),
                String(mensagem).trim()
            ]
        );

        const chamado = result.rows[0];

        return res.status(201).json({
            mensagem: `Confirmação de recebimento: chamado #${chamado.id} registrado com sucesso.`,
            chamado
        });
    } catch (error) {
        console.error('Erro ao criar chamado de suporte:', error);
        return res.status(500).json({
            erro: 'Erro interno ao registrar o chamado de suporte.'
        });
    }
};

exports.listarChamados = async (req, res) => {
    const usuarioId = obterUsuarioId(req);
    const perfil = obterPerfilUsuario(req);

    try {
        let result;

        if (perfil === 'ADMIN') {
            result = await db.query(
                `SELECT c.*, u.nome AS usuario_nome, u.email AS usuario_email
                 FROM chamados_suporte c
                 LEFT JOIN usuarios u ON c.usuario_id = u.id
                 ORDER BY c.criado_em DESC, c.id DESC`
            );
        } else if (usuarioId) {
            result = await db.query(
                `SELECT *
                 FROM chamados_suporte
                 WHERE usuario_id = $1
                 ORDER BY criado_em DESC, id DESC`,
                [usuarioId]
            );
        } else {
            result = await db.query(
                `SELECT *
                 FROM chamados_suporte
                 ORDER BY criado_em DESC, id DESC
                 LIMIT 20`
            );
        }

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar chamados de suporte:', error);
        return res.status(500).json({
            erro: 'Erro ao buscar chamados de suporte.'
        });
    }
};

exports.atualizarStatusChamado = async (req, res) => {
    const { id } = req.params;
    const { status, resposta_admin = null } = req.body;

    const statusUpper = String(status || '').trim().toUpperCase();
    if (!STATUS_VALIDOS.includes(statusUpper)) {
        return res.status(400).json({
            erro: 'Status inválido. Use ABERTO, EM_ATENDIMENTO ou RESOLVIDO.'
        });
    }

    try {
        const result = await db.query(
            `UPDATE chamados_suporte
             SET status = $1,
                 resposta_admin = COALESCE($2, resposta_admin),
                 atualizado_em = NOW()
             WHERE id = $3
             RETURNING *`,
            [statusUpper, resposta_admin, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Chamado não encontrado.' });
        }

        return res.status(200).json({
            mensagem: 'Status do chamado atualizado com sucesso.',
            chamado: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao atualizar chamado:', error);
        return res.status(500).json({
            erro: 'Erro ao atualizar status do chamado.'
        });
    }
};