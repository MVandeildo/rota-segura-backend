const express = require('express');

const usuarioController = require('../controllers/usuarioController');

const router = express.Router();

router.post('/', usuarioController.criarUsuario);

router.get('/', usuarioController.listarUsuarios);

router.get('/:id', usuarioController.buscarUsuario);

router.put('/:id', usuarioController.atualizarUsuario);

router.delete('/:id', usuarioController.removerUsuario);

module.exports = router;