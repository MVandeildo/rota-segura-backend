const db = require('../config/database');

class DispositivoFcmModel {
    static async salvar(usuarioId, token) {
        await db.query(
            `INSERT INTO dispositivos_fcm (usuario_id, token)
             VALUES ($1, $2)
             ON CONFLICT (token)
             DO UPDATE SET usuario_id = EXCLUDED.usuario_id, atualizado_em = NOW()`,
            [usuarioId, token]
        );
    }

    static async remover(usuarioId, token) {
        await db.query(
            'DELETE FROM dispositivos_fcm WHERE usuario_id = $1 AND token = $2',
            [usuarioId, token]
        );
    }

    static async listarTokensPorUsuario(usuarioId) {
        const result = await db.query(
            'SELECT token FROM dispositivos_fcm WHERE usuario_id = $1',
            [usuarioId]
        );
        return result.rows.map((row) => row.token);
    }

    static async removerTokens(tokens) {
        if (tokens.length === 0) {
            return;
        }

        await db.query(
            'DELETE FROM dispositivos_fcm WHERE token = ANY($1::text[])',
            [tokens]
        );
    }
}

module.exports = DispositivoFcmModel;
