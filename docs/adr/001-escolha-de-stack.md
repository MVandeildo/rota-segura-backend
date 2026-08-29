# 📄 ADR 001: Escolha da Stack Tecnológica do Backend e Frontend

* **Status:** Aceito
* **Data:** 29/08/2026
* **Decisores:** Equipe de Desenvolvimento do RotaSegura

---

##  Contexto e Problema

O sistema **RotaSegura** exige uma arquitetura de software eficiente para lidar com rastreamento geográfico em tempo real, disparo assíncrono de notificações de presença (*push notifications*) e uma interface tátil simples para motoristas de veiculos escolares e pais. 

Precisamos definir a pilha de tecnologias (stack) para o desenvolvimento do backend e das interfaces de usuário, considerando o tempo de desenvolvimento acadêmico, a facilidade de integração e a curva de aprendizado da equipe.

---

## 🎯 Opções Consideradas

1. **Opção 1:** Backend em Node.js (JavaScript/Express) + Frontend Web (React.js) / Mobile (React Native)
2. **Opção 2:** Backend em Java (Spring Boot) + Frontend Web (Angular) / Mobile (Flutter)
3. **Opção 3:** Backend em Python (Django) + Frontend em HTML/CSS/JS tradicional (Server-Side Rendering)

---

## ⚡ Decisão Escolhida

Escolhemos a **Opção 1: Node.js (JavaScript/Express)** para o Backend e **React.js / React Native** para as interfaces de usuário.

### Justificativa:
* **Linguagem Única:** O uso de JavaScript de ponta a ponta (Full-stack JS) reduz o contexto de aprendizado da equipe, permitindo o compartilhamento de lógicas e validações entre servidor e aplicativos.
* **Desempenho Orientado a Eventos:** O Node.js possui arquitetura não-bloqueante (I/O assíncrono), ideal para lidar com conexões concorrentes de geolocalização e disparos de alertas em tempo real.
* **Ecossistema e Prototipagem Rápida:** Grande disponibilidade de bibliotecas prontas (como `express`, `cors`, `pg` e Firebase Admin SDK para envio de notificações).
* **Multiplataforma:** O React Native possibilita construir o app tátil dos motoristas e a visão de acompanhamento dos pais para Android e iOS a partir de um único código-base.

---

## 🚀 Consequências

### Positivas:
* Desenvolvimento mais rápido e ágil para entrega das releases do backlog.
* Alta facilidade na integração com bancos de dados relacionais (PostgreSQL) e APIs de terceiros (Google Maps e Firebase).
* Estrutura leve para hospedagem gratuita ou de baixo custo em ambientes de demonstração.

### Negativas / Riscos:
* Como o JavaScript possui tipagem dinâmica, é necessário manter uma forte disciplina de código (utilizando o *Definition of Done*) para evitar erros em tempo de execução.
* A manipulação de eventos assíncronos requer atenção reforçada nos testes unitários e no tratamento de exceções do backend.