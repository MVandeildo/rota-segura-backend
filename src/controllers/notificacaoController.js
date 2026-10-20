const DispositivoFcmModel = require('../models/DispositivoFcmModel');

const validarToken = (token) =>
    typeof token === 'string' && token.trim().length > 0 && token.length <= 4096;

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
