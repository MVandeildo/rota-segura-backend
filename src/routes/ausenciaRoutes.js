
const express = require('express');
const router = express.Router();

const ausenciaController = require('../controllers/ausenciaController');
const { authMiddleware } = require('../utils/protected');

// Registrar ausência de um aluno.
router.post(
    '/',
    authMiddleware,
    ausenciaController.criarAusencia
);

// Consultar ausências de uma data.
router.get(
    '/',
    authMiddleware,
    ausenciaController.listarAusenciasPorData
);

// Consultar histórico de ausências de um aluno.
router.get(
    '/aluno/:alunoId',
    authMiddleware,
    ausenciaController.listarAusenciasPorAluno
);

// Cancelar uma ausência registrada.
router.delete(
    '/:id',
    authMiddleware,
    ausenciaController.cancelarAusencia
);

module.exports = router;
