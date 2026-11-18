const express = require('express');
const presencaController = require('../controllers/presencaController');
const { authMiddleware, requirePerfil } = require('../utils/protected');

const router = express.Router();

router.get(
    '/rota-do-dia',
    authMiddleware,
    requirePerfil('MOTORISTA'),
    presencaController.listarRotaDoDia
);

router.post(
    '/',
    authMiddleware,
    (req, res, next) => {
        const perfisPermitidos = ['MOTORISTA', 'ADMIN', 'GESTOR'];
        
        if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({ erro: "Usuário sem permissão para esta operação." });
        }
        
        next();
    },
    presencaController.registrar
);

module.exports = router;