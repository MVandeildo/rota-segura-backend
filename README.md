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

## Notificações de embarque e desembarque

Aplique `database/migrations/20261016_presencas_e_dispositivos_fcm.sql` antes de usar os endpoints. Configure as credenciais do Firebase Admin SDK com Application Default Credentials: localmente, defina `GOOGLE_APPLICATION_CREDENTIALS` com o caminho para o JSON da conta de serviço do Firebase; em produção, use as credenciais da plataforma. Não armazene a chave de serviço no repositório.

- `POST /api/notificacoes/dispositivos` (perfil `RESPONSAVEL`) registra/atualiza o token do dispositivo autenticado com `{ "token": "<token FCM>" }`.
- `DELETE /api/notificacoes/dispositivos` (perfil `RESPONSAVEL`) remove o token com o mesmo formato de corpo.
- `GET /api/presencas/rota-do-dia` (perfil `MOTORISTA`) lista os alunos ativos das rotas vinculadas ao motorista e o status de presença do dia (`PENDENTE`, `EMBARCADO` ou `DESEMBARCADO`). Aceita `?data=AAAA-MM-DD`; sem o parâmetro, usa a data atual do banco.
- `POST /api/presencas` (perfil `MOTORISTA`) registra embarque ou desembarque, com horário gerado pelo banco no momento da gravação, coordenadas GPS obrigatórias e notificação imediata ao responsável quando disponível. Exemplo: `{ "aluno_id": 1, "tipo": "EMBARQUE", "latitude": -23.55, "longitude": -46.63 }`. O status diário corresponde ao evento mais recente do aluno naquela rota.

A resposta do registro informa `notificacao.status` como `enviada`, `parcial`, `falha`, `sem_dispositivo` ou `sem_responsavel`. Um erro no FCM é registrado nos logs sem descartar a presença já gravada.

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
