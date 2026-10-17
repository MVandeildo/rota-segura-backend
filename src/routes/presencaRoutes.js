const express = require('express');
const presencaController = require('../controllers/presencaController');
const { authMiddleware, requirePerfil } = require('../utils/protected');

const router = express.Router();

router.post(
    '/',
    authMiddleware,
    requirePerfil('MOTORISTA'),
    presencaController.registrar
);

module.exports = router;
