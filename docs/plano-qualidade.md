# Plano de Qualidade (SQA) e Gestão de Configuração — SaúdeDigital

## 1. Contexto e Escopo Crítico
* **Caminho Adotado:** Sistema Existente ou Legado (Caminho 2), com foco na modernização da garantia de qualidade e automatização de testes.
* **Módulo Crítico Priorizado:** Validação e Agendamento de Consultas (`backend/src/services/validarAgendamento.js`).
* **Justificativa de Risco:** Falhas neste módulo geram conflitos de horário (*overbooking*), perda de faturamento para a clínica e desgaste na relação médico-paciente.

## 2. Objetivos e Características da ISO 25010 Priorizadas
1. **Adequação Funcional (Completude e Correção Funcional):** Garantir que nenhuma consulta seja marcada fora do horário de funcionamento (08:00 às 18:00) ou em duplicidade para o mesmo médico.
2. **Confiabilidade (Tolerância a Falhas):** Assegurar que entradas fora do padrão ou conflitos sejam tratados de forma controlada pela API sem derrubar o servidor.
3. **Manutenibilidade (Modificabilidade e Testabilidade):** Isolar as regras de negócio de agendamento em serviços desacoplados da camada de banco de dados (MySQL), permitindo testes unitários rápidos e seguros.

## 3. Padrões, Auditoria e Ata de Revisão (Peer Review / Walkthrough)
* **Padrões Adotados:** Padronização de commits semânticos (`test:`, `feat:`, `refactor:`, `ci:`), cenários BDD em Gherkin e validação automatizada via GitHub Actions.
* **Auditoria de Processo:** Verificação automática via *Branch Protection Rules* na branch `main`, exigindo aprovação de revisão em pares (*Pull Request*) e sucesso no pipeline de CI antes de qualquer *merge*.

### Ata de Inspeção e Revisão Técnica
* **Data:** Novembro de 2026 | **Artefato:** Módulo de Agendamento de Consultas
* **Participantes:** Squad SaúdeDigital
* **Não Conformidades Identificadas na Versão Baseline (`v1.0.0-baseline`):**
  1. Ausência de validação automatizada para agendamentos em horários limites (antes das 08:00 e a partir das 18:00).
  2. Falta de verificação automatizada de conflito de horários já ocupados na agenda.
  3. Inexistência de suíte de testes unitários e bloqueio de código defeituoso no repositório.
* **Ações Corretivas:** Implementação da função `validarAgendamento`, criação de suíte Jest com cobertura de valores limite e configuração de *Quality Gate* no GitHub Actions (resolvido no PR #4).

## 4. Gestão de Configuração
* **Estratégia de Branching:** **Git Flow Simplificado**, utilizando `main` (código estável e protegido), `develop` (integração contínua das entregas) e branches específicas para funcionalidades/testes. Justifica-se pelo controle rigoroso de qualidade antes da entrega em produção.
* **Tags e Releases:**
  * `v1.0.0-baseline`: Estado inicial do sistema antes da implantação da esteira de qualidade.
  * `v1.1.0-sqa`: Versão consolidada com testes TDD/BDD, Mutation Testing e pipeline CI/CD ativo.