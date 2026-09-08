const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRoutes = require('./routes/health.routes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const veiculoRoutes = require('./routes/veiculoRoutes');
const rotaRoutes = require('./routes/rotaRoutes');

const { notFoundHandler, errorHandler } = require('./middlewares/error-handler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.json({
        name: 'RotaSegura API',
        version: 'v1'
    });
});

app.use('/api/v1/health', healthRoutes);

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/veiculos', veiculoRoutes);
app.use('/api/rotas', rotaRoutes);

app.get('/api/status', (req, res) => {
    return res.json({ status: 'API RotaSegura operacional!' });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
