const db = require('../config/database');
const DispositivoFcmModel = require('../models/DispositivoFcmModel');

const idPositivo = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

const validarToken = (token) =>
    typeof token === 'string' && token.trim().length > 0 && token.length <= 4096;

const CATEGORIAS_VALIDAS = ['ALERTAS_TRANSPORTE', 'AVISOS_GERAIS', 'PENDENCIAS'];
const ESCOPOS_VALIDOS = ['GLOBAL', 'ROTA', 'TURMA', 'INDIVIDUAL'];
const PERFIS_VALIDOS = ['MOTORISTA', 'RESPONSAVEL'];
const PERFIS_ENVIO_AUTORIZADOS = ['MOTORISTA'];

function obterUsuario(req) {
    return req.usuario || req.user || {};
}

function normalizarPerfil(perfil) {
    const p = String(perfil || '').trim().toUpperCase();
    return PERFIS_VALIDOS.includes(p) ? p : 'RESPONSAVEL';
}

exports.registrarDispositivo = async (req, res) => {
    const token = req.body?.token;
    if (!validarToken(token)) {
        return res.status(400).json({ erro: 'Informe um token FCM válido.' });
    }

    try {
        await DispositivoFcmModel.salvar(req.usuario.id, token.trim());
        return res.status(200).json({ mensagem: 'Dispositivo registrado para notificações.' });
    } catch (error) {
        console.error('Erro ao registrar dispositivo FCM:', error);
        return res.status(500).json({ erro: 'Erro ao registrar dispositivo.' });
    }
};

exports.removerDispositivo = async (req, res) => {
    const token = req.body?.token;
    if (!validarToken(token)) {
        return res.status(400).json({ erro: 'Informe um token FCM válido.' });
    }

    try {
        await DispositivoFcmModel.remover(req.usuario.id, token.trim());
        return res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover dispositivo FCM:', error);
        return res.status(500).json({ erro: 'Erro ao remover dispositivo.' });
    }
};

exports.listar = async (req, res) => {
    const usuario = obterUsuario(req);
    const usuarioId = usuario.id;
    const usuarioEmail = usuario.email || null;
    const perfil = normalizarPerfil(usuario.perfil);
    const { categoria } = req.query;

    const categoriaFiltro =
        categoria && CATEGORIAS_VALIDAS.includes(String(categoria).toUpperCase())
            ? String(categoria).toUpperCase()
            : null;

    try {
        let query;
        const params = [];

        if (perfil === 'MOTORISTA') {
            params.push(usuarioId);
            query = `
                SELECT n.*
                FROM notificacoes n
                WHERE (
                    n.destinatario_id = $1
                    OR n.remetente_id = $1
                    OR (n.destinatario_id IS NULL AND n.escopo IN ('GLOBAL', 'ROTA'))
                )
            `;
        } else {
            params.push(usuarioId, usuarioEmail);
            query = `
                SELECT n.*
                FROM notificacoes n
                WHERE (
                    n.destinatario_id = $1
                    OR (n.destinatario_id IS NULL AND n.escopo = 'GLOBAL')
                    OR (
                        n.destinatario_id IS NULL
                        AND n.escopo = 'ROTA'
                        AND n.rota_id IN (
                            SELECT DISTINCT a.rota_id
                            FROM alunos a
                            WHERE a.rota_id IS NOT NULL
                            AND COALESCE(a.ativo, TRUE) = TRUE
                            AND $2::text IS NOT NULL
                            AND LOWER(TRIM(a.email_responsavel)) = LOWER(TRIM($2::text))
                        )
                    )
                )
            `;
        }

        if (categoriaFiltro) {
            params.push(categoriaFiltro);
            query += ` AND n.categoria = $${params.length}`;
        }

        query += ` ORDER BY n.criado_em DESC, n.id DESC`;

        const result = await db.query(query, params);
        const naoLidas = result.rows.filter((n) => !n.lida).length;

        return res.status(200).json({
            notificacoes: result.rows,
            naoLidas
        });
    } catch (error) {
        console.error('Erro ao listar notificações:', error);
        return res.status(500).json({ erro: 'Erro ao carregar notificações.' });
    }
};

exports.criarComunicado = async (req, res) => {
    const usuario = obterUsuario(req);
    const perfil = normalizarPerfil(usuario.perfil);

    if (!PERFIS_ENVIO_AUTORIZADOS.includes(perfil)) {
        return res.status(403).json({
            erro: 'Apenas motoristas autorizados podem enviar comunicados.'
        });
    }

    const {
        titulo,
        mensagem,
        categoria = 'AVISOS_GERAIS',
        escopo = 'GLOBAL',
        rota_id = null,
        turma_id = null,
        destinatario_id = null
    } = req.body;

    if (!titulo || !String(titulo).trim() || !mensagem || !String(mensagem).trim()) {
        return res.status(400).json({ erro: 'Título e mensagem são obrigatórios.' });
    }

    const categoriaUpper = String(categoria).toUpperCase();
    const categoriaFinal = CATEGORIAS_VALIDAS.includes(categoriaUpper)
        ? categoriaUpper
        : 'AVISOS_GERAIS';

    const escopoUpper = String(escopo).toUpperCase();
    const escopoFinal = ESCOPOS_VALIDOS.includes(escopoUpper) ? escopoUpper : 'GLOBAL';

    if (escopoFinal === 'ROTA' && !idPositivo(rota_id)) {
        return res.status(400).json({ erro: 'Selecione uma rota para envio direcionado à rota.' });
    }

    if (escopoFinal === 'TURMA' && !idPositivo(turma_id)) {
        return res.status(400).json({ erro: 'Informe a turma para envio direcionado.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO notificacoes
                (remetente_id, destinatario_id, escopo, rota_id, turma_id, categoria, titulo, mensagem, lida, criado_em)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())
             RETURNING *`,
            [
                usuario.id || null,
                idPositivo(destinatario_id) ? Number(destinatario_id) : null,
                escopoFinal,
                idPositivo(rota_id) ? Number(rota_id) : null,
                idPositivo(turma_id) ? Number(turma_id) : null,
                categoriaFinal,
                String(titulo).trim(),
                String(mensagem).trim()
            ]
        );

        return res.status(201).json({
            mensagem: 'Comunicado enviado com sucesso!',
            notificacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao enviar comunicado:', error);
        return res.status(500).json({ erro: 'Erro ao enviar comunicado.' });
    }
};

exports.marcarComoLida = async (req, res) => {
    const { id } = req.params;
    if (!idPositivo(id)) {
        return res.status(400).json({ erro: 'ID de notificação inválido.' });
    }

    const usuario = obterUsuario(req);
    const usuarioId = usuario.id;
    const perfil = normalizarPerfil(usuario.perfil);

    try {
        const condicaoUsuario =
            perfil === 'MOTORISTA'
                ? '(destinatario_id = $2 OR remetente_id = $2 OR destinatario_id IS NULL)'
                : '(destinatario_id = $2 OR destinatario_id IS NULL)';

        const result = await db.query(
            `UPDATE notificacoes
             SET lida = TRUE, lida_em = NOW()
             WHERE id = $1
               AND ${condicaoUsuario}
             RETURNING *`,
            [Number(id), usuarioId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Notificação não encontrada.' });
        }

        return res.status(200).json({
            mensagem: 'Notificação marcada como lida.',
            notificacao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return res.status(500).json({ erro: 'Erro ao atualizar notificação.' });
    }
};

exports.marcarTodasComoLidas = async (req, res) => {
    const usuario = obterUsuario(req);
    const usuarioId = usuario.id;
    const perfil = normalizarPerfil(usuario.perfil);

    try {
        const condicaoUsuario =
            perfil === 'MOTORISTA'
                ? '(destinatario_id = $1 OR remetente_id = $1 OR destinatario_id IS NULL)'
                : '(destinatario_id = $1 OR destinatario_id IS NULL)';

        const result = await db.query(
            `UPDATE notificacoes
             SET lida = TRUE, lida_em = NOW()
             WHERE lida = FALSE
               AND ${condicaoUsuario}
             RETURNING id`,
            [usuarioId]
        );

        return res.status(200).json({
            mensagem: 'Todas as notificações foram marcadas como lidas.',
            atualizadas: result.rowCount
        });
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        return res.status(500).json({ erro: 'Erro ao marcar notificações como lidas.' });
    }
};

exports.excluir = async (req, res) => {
    const { id } = req.params;
    if (!idPositivo(id)) {
        return res.status(400).json({ erro: 'ID de notificação inválido.' });
    }

    const usuario = obterUsuario(req);
    const perfil = normalizarPerfil(usuario.perfil);

    try {
        const query =
            perfil === 'MOTORISTA'
                ? 'DELETE FROM notificacoes WHERE id = $1 AND (destinatario_id = $2 OR remetente_id = $2) RETURNING id'
                : 'DELETE FROM notificacoes WHERE id = $1 AND destinatario_id = $2 RETURNING id';

        const result = await db.query(query, [Number(id), usuario.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Notificação não encontrada ou sem permissão para excluir.' });
        }

        return res.status(200).json({ mensagem: 'Alerta excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir notificação:', error);
        return res.status(500).json({ erro: 'Erro ao excluir notificação.' });
    }
};