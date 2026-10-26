const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const http = require('node:http');

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

test('GET / retorna identificação da API', async () => {
    const response = await fetch(`${baseUrl}/`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        name: 'RotaSegura API',
        version: 'v1'
    });
});

test('GET /api/status indica que a API está operacional', async () => {
    const response = await fetch(`${baseUrl}/api/status`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
        status: 'API RotaSegura operacional!'
    });
});

test('GET /api/v1/health retorna status e timestamp válido', async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'rotasegura-backend');
    assert.ok(Number.isFinite(Date.parse(body.timestamp)));
});

test('rota inexistente retorna 404 em JSON', async () => {
    const response = await fetch(`${baseUrl}/rota-inexistente`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
        error: 'Rota nao encontrada'
    });
});
