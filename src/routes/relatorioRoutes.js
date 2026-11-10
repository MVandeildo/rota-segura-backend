const express = require('express');
const relatorioController = require('../controllers/relatorioController');
const { authMiddleware, requirePerfil } = require('../utils/protected');

const router = express.Router();

router.get(
    '/auditoria',
    authMiddleware,
    requirePerfil('administrador'),
    relatorioController.auditoria
);

module.exports = router;
