# RotaSegura Backend

API REST do projeto RotaSegura usando Node.js, JavaScript e Express.

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
