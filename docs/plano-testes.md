# Estratégia de Testes e Experimento de Inovação — SaúdeDigital

## 1. Estratégia e Plano de Testes (Modelo IEEE 829 Enxuto)
* **Identificador:** PT-SD-2026-01 | **Objeto de Teste:** Módulo de Agendamento de Consultas (`validarAgendamento.js`).
* **Pirâmide de Testes:** Base focada em testes unitários rápidos e isolados (Jest) cobrindo regras de negócio e valores limite, apoiada por especificações executáveis de aceitação em BDD (Gherkin).
* **Critério de Caixa-Branca e Meta:** Cobertura de instruções e ramificações (*branches*) $\ge 80\%$ no módulo crítico, justificada pelo alto impacto financeiro e operacional de erros de agendamento.

### Casos de Teste de Caixa-Preta (Partição de Equivalência e Valor Limite)
| ID | Técnica | Regra / Partição | Dados de Entrada | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CT-01** | Partição Equivalência (Válida) | Horário comercial livre | `2026-12-10T14:00:00`, livre | `valido: true` |
| **CT-02** | Valor Limite (Inferior Válido) | Exato início do expediente | `2026-12-10T08:00:00`, livre | `valido: true` |
| **CT-03** | Valor Limite (Inferior Inválido) | 1 min antes da abertura | `2026-12-10T07:59:00`, livre | `valido: false` (Fora do expediente) |
| **CT-04** | Valor Limite (Superior Inválido) | Exato fim do expediente | `2026-12-10T18:00:00`, livre | `valido: false` (Fora do expediente) |
| **CT-05** | Partição Equivalência (Inválida) | Conflito de agenda | `2026-12-10T14:00:00`, ocupado | `valido: false` (Horário já ocupado) |

## 2. Testes Ágeis (BDD e TDD)
* **BDD (Gherkin):** Cenários documentados em linguagem natural em `backend/tests/features/agendamento.feature`.
* **TDD (Red-Green-Refactor):** Comprovado no histórico de commits do Pull Request #4:
  1. `test: adiciona teste de horario antes das 08h (RED)`
  2. `feat: implementa validacao de horario no agendamento (GREEN)`
  3. `refactor: adiciona testes de conflito e horario comercial valido (REFACTOR)`

## 3. Experimento de Inovação — Carta: "Teste Além da Cobertura"
* **Hipótese Mensurável:** "Acreditamos que aplicar *mutation testing* com StrykerJS no módulo de validação de agendamento vai revelar brechas nos limites de horário não detectadas pela cobertura tradicional de linhas, elevando o *Mutation Score* para 100%, e saberemos pelo relatório gerado pela ferramenta."
* **Linha de Base (Antes):** Com apenas 3 testes iniciais no Jest, a cobertura de linhas já atingia 100%, mas o StrykerJS apontou mutantes sobreviventes nos operadores relacionais (`< 8` alterado para `<= 8` e `>= 18` alterado para `> 18`), reduzindo o *Mutation Score*.
* **Intervenção:** Adição de testes específicos para os valores limite exatos (`08:00` e `18:00`) no arquivo `backend/tests/agendamento.test.js`.
* **Resultado (Depois):** O *Mutation Score* subiu para **100%**, eliminando todos os mutantes e comprovando que cobertura de linhas isolada não garante eficácia contra erros de fronteira.
* **Próximos Passos:** Expandir o StrykerJS para os módulos de cadastro de pacientes e autenticação, integrando um limiar mínimo de *Mutation Score* no pipeline de CI.