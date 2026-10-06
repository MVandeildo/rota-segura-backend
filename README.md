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

## Redefinição de senha

Antes de usar o fluxo, aplique `database/migrations/20261005_password_reset_tokens.sql` e configure as variáveis SMTP e `CLIENT_URL` no `.env`.

- `POST /api/auth/request-password-reset` com `{ "email": "usuario@example.com" }` envia um link quando o endereço está cadastrado. A resposta não revela se o e-mail existe.
- `POST /api/auth/reset-password` com `{ "id": 1, "token": "...", "password": "nova-senha" }` define uma senha com no mínimo 8 caracteres. O token expira em 1 hora e só pode ser usado uma vez.

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
