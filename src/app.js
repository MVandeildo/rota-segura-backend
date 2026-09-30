require("dotenv").config();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const express = require("express");
const cookieParser = require("cookie-parser");

const healthRoutes = require('./routes/health.routes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const gestorRoutes = require('./routes/gestorRoutes');
const veiculoRoutes = require('./routes/veiculoRoutes');
const rotaRoutes = require('./routes/rotaRoutes');
const alunoRoutes = require('./routes/alunoRoutes');
const frotaRoutes = require('./routes/frotaRoutes');
const motoristaRoutes = require('./routes/motoristaRoutes');

const { notFoundHandler, errorHandler } = require('./middlewares/error-handler');

const authRouter = require("./routes/auth");

const app = express();
app.get('/', (req, res) => {
    res.json({
        name: 'RotaSegura API',
        version: 'v1'
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/gestores', gestorRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/rotas', rotaRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/motoristas', motoristaRoutes);
app.use('/api/frota', frotaRoutes);

app.get('/api/status', (req, res) => {
    return res.json({ status: 'API RotaSegura operacional!' });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
