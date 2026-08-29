# 🚦 Definition of Ready (DoR) — Sistema RotaSegura

A **Definição de Preparado (Definition of Ready - DoR)** estabelece o conjunto de critérios que uma História de Usuário (US) ou tarefa deve satisfazer antes de ser aceita no planejamento de uma Sprint (Sprint Planning) e liberada para o desenvolvimento da equipe.

O objetivo do DoR é evitar que tarefas ambíguas, incompletas ou sem validação técnica entrem em execução, garantindo clareza e eficiência ao longo das Sprints.

---

## 📋 Checklist Geral de Preparado (DoR)

Para que qualquer item do backlog do **RotaSegura** seja considerado **Ready** (Pronto para Desenvolvimento), ele deve cumprir os seguintes requisitos:

### 1. Detalhamento e Formato da História
- [ ] A história está escrita no formato padrão: *"Como [perfil], quero [ação], para [benefício]"*.
- [ ] O perfil do usuário envolvido (Gestor Municipal, Motorista ou Responsável) está claramente identificado.
- [ ] O valor de negócio ou o propósito da funcionalidade está explícito.

### 2. Critérios de Aceitação
- [ ] Os **Critérios de Aceitação** foram definidos e validados junto ao Product Owner (PO) / equipe.
- [ ] Os fluxos alternativos e cenários de exceção (ex: falha na conexão de GPS, ausência de sinal) foram especificados.

### 3. Estimativa e Independência
- [ ] A história foi estimada pela equipe de desenvolvimento em Pontos de História (Story Points).
- [ ] A história é pequena o suficiente para ser concluída dentro de uma única Sprint.
- [ ] Dependências técnicas ou de negócio entre outras tarefas foram identificadas e resolvidas (ou minimizadas).

### 4. Apoio de UX/UI e Arquitetura
- [ ] As telas, protótipos de alta/baixa fidelidade no Figma ou esboços de interface necessários estão disponíveis e aprovados.
- [ ] O impacto na estrutura do banco de dados e nos endpoints da API backend foi alinhado entre o time técnico.

---

## 🔎 Exemplo Prático de Item "Ready"

Para ilustrar o cumprimento do DoR dentro do projeto **RotaSegura**:

### US05 - Registro de Presença (Check-in/Check-out)
* **Status:** ✅ Ready (Pronto para a Sprint)
* **Descrição:** Como motorista, quero marcar a presença do aluno no embarque e desembarque para ter controle da chamada digital.
* **Critérios de Aceitação:** 
  1. Exibir a lista de alunos da rota ativa com botões de tamanho adequado ($48 \times 48\,\text{dp}$) para uso em trânsito.
  2. Registrar o horário exato e as coordenadas de GPS no momento da confirmação.
  3. Notificar o servidor sobre a alteração do status do aluno.
* **UI/UX:** Protótipo aprovado no Figma (Tela de Chamada do Motorista).
* **Estimativa:** 8 pontos.
* **Dependências:** `US04 - Iniciar Rota` concluída.