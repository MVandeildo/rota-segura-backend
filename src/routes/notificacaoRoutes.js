const express = require('express');
const notificacaoController = require('../controllers/notificacaoController');
const { authMiddleware, requirePerfil } = require('../utils/protected');

const router = express.Router();

router.post(
    '/dispositivos',
    authMiddleware,
    requirePerfil('RESPONSAVEL'),
    notificacaoController.registrarDispositivo
);

router.delete(
    '/dispositivos',
    authMiddleware,
    requirePerfil('RESPONSAVEL'),
    notificacaoController.removerDispositivo
);

module.exports = router;
