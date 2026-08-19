const app = require('./app');
const { port, nodeEnv } = require('./config/env');

app.listen(port, () => {
  console.log(`RotaSegura API executando em http://localhost:${port} (${nodeEnv})`);
});
