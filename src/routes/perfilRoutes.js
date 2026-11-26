// routes/perfilRoutes.js
const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const { authMiddleware } = require('../utils/protected');

router.use(authMiddleware);
router.get('/', perfilController.obterPerfil);
router.put('/', perfilController.atualizarPerfil);

module.exports = router;