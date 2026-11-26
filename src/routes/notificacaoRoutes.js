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

router.get('/', authMiddleware, notificacaoController.listar);
router.post(
    '/comunicados',
    authMiddleware,
    requirePerfil('MOTORISTA'),
    notificacaoController.criarComunicado
);
router.patch('/ler-todas', authMiddleware, notificacaoController.marcarTodasComoLidas);
router.patch('/:id/lida', authMiddleware, notificacaoController.marcarComoLida);
router.delete('/:id', authMiddleware, notificacaoController.excluir);

module.exports = router;