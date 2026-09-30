const express = require('express');

const router = express.Router();

const alunoController = require('../controllers/alunoController');

router.post('/', alunoController.criarAluno);


router.get('/', alunoController.listarAlunos);


router.get('/:id', alunoController.buscarAlunoPorId);


router.put('/:id', alunoController.atualizarAluno);


router.delete('/:id', alunoController.removerAluno);


module.exports = router;