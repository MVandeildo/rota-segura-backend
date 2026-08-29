# 📄 ADR 002: Escolha do Sistema Gerenciador de Banco de Dados (SGBD)

* **Status:** Aceito
* **Data:** 29/08/2026
* **Decisores:** Equipe de Desenvolvimento do RotaSegura

---

## 🔍 Contexto e Problema

O sistema **RotaSegura** precisa armazenar e consultar com segurança dados estruturados e relacionais, como usuários (gestores, motoristas e responsáveis), frotas, veículos, rotas escolares e diários de presença. 

Além disso, a aplicação exige alta integridade referencial para vincular alunos a rotas e pais a alunos, além de suporte eficiente para armazenar históricos de coordenadas geográficas e logs de presença dos embarques e desembarques.

---

## 🎯 Opções Consideradas

1. **Opção 1:** PostgreSQL (SGBD Relacional Open Source com suporte a extensão PostGIS)
2. **Opção 2:** MySQL / MariaDB (SGBD Relacional tradicional)
3. **Opção 3:** MongoDB (Banco de Dados Não-Relacional / NoSQL voltado a documentos)

---

## ⚡ Decisão Escolhida

Escolhemos a **Opção 1: PostgreSQL**.

### Justificativa:
* **Integridade Referencial Forte:** A estrutura de transporte público escolar exige garantias estritas de consistência (chaves estrangeiras e relacionamentos `1:N` e `N:N` rígidos entre alunos, pais, motoristas e rotas), tornando um SGBD relacional indispensable.
* **Extensibilidade Geográfica (PostGIS):** O PostgreSQL possui suporte nativo e maduro para dados geográficos e cálculos de distância através da extensão PostGIS, o que facilita consultas de geolocalização no monitoramento do veiculo.
* **Confiabilidade e Desempenho:** É uma solução gratuita, de código aberto, amplamente adotada na indústria e compatível com todos os serviços de hospedagem em nuvem (como Render, Supabase e Neon).
* **Integração com Node.js:** Integração nativa e de excelente desempenho com o backend Node.js via driver `pg`.

---

## 🚀 Consequências

### Positivas:
* Garantia de consistência transacional (propriedades ACID) na chamada dos alunos e na atualização de status das rotas.
* Possibilidade de realizar consultas espaciais complexas diretamente no banco de dados.
* Facilidade para realizar backups, migrações de schema e modelagem relacional.

### Negativas / Riscos:
* Requer a criação prévia de *migrations* ou scripts SQL bem estruturados para alterações de tabela.
* O dimensionamento horizontal (escala de escrita) é mais complexo em relação a bancos NoSQL, embora a demanda inicial do projeto seja perfeitamente suprida por uma única instância.