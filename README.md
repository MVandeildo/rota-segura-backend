# RotaSegura Backend

API REST do projeto RotaSegura usando Node.js, JavaScript e Express.

## Integrantes do Projeto

- Igor Costa Alcantara de Macedo
- Manoel Vandeildo da Silva Melo
- Maria Beatriz Targino

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação

```bash
npm install
```

Copie `.env.example` para `.env` e ajuste as variáveis, se necessário.

## Execução

Desenvolvimento com reinício automático:

```bash
npm run dev
```

Execução normal:

```bash
npm start
```

A API ficará disponível em `http://localhost:3000`.

## Endpoint inicial

- `GET /api/v1/health`
- `GET /api/status`
- `GET|POST|PUT|DELETE /api/usuarios`
- `GET|POST|PUT|DELETE /api/veiculos`
- `GET|POST|PUT|DELETE /api/rotas`

## Estrutura

```text
src/
  config/       Configurações da aplicação
  controllers/  Entrada HTTP e respostas
  middlewares/  Middlewares compartilhados
  routes/       Definição das rotas
  services/     Regras de negócio
  app.js        Configuração do Express
  server.js     Inicialização do servidor
```
