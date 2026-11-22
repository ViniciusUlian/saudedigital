# Métricas, Planejamento, Maturidade e Evolução — SaúdeDigital

## 1. Painel de Métricas e Indicadores
| Categoria | Métrica | Meta Definida | Resultado Obtido | Decisão Apoiada |
| :--- | :--- | :--- | :--- | :--- |
| **Produto (ISO 25010)** | Cobertura de Testes (Módulo Crítico) | $\ge 80\%$ | 100% | Liberar ou bloquear *merge* no Quality Gate |
| **Produto (Inovação)** | Mutation Score (StrykerJS) | $\ge 90\%$ | 100% | Identificar testes fracos em valores limite |
| **Processo (DORA)** | *Change Failure Rate* (Taxa de Falha) | $0\%$ na `main` | $0\%$ | Validar eficácia da proteção de branch |
| **Processo (Fluxo)** | *Lead Time* de Mudança (PR #4) | $< 24\text{ horas}$ | $\approx 30\text{ minutos}$ | Avaliar agilidade da revisão e entrega |

## 2. Estimativa e Planejamento (Story Points)
| Tarefa / Entregável | Estimado (SP) | Realizado (SP) | Observações |
| :--- | :---: | :---: | :--- |
| Setup Git Flow, Releases e Issues | 2 | 2 | Concluído conforme planejado |
| Implementação BDD + TDD (Agendamento) | 5 | 5 | Ciclo Red-Green-Refactor versionado |
| Experimento Mutation Testing (StrykerJS) | 5 | 5 | Ajustes nos testes de valor limite |
| Pipeline GitHub Actions + Quality Gate | 3 | 4 | Ajuste na indentação YAML e permissões de PR |
| Documentação SQA, Métricas e Relatório | 5 | 5 | Consolidado na pasta `/docs` |
| **Total** | **20 SP** | **21 SP** | Variação de +5% (dentro da margem esperada) |

## 3. Maturidade (MPS.BR / CMMI) e Melhoria Contínua
* **Mini-Diagnóstico:** Antes do projeto, o processo encontrava-se equivalente ao **Nível G do MPS.BR / Nível 1 do CMMI** (processo *ad-hoc*, sem testes automatizados). Com a implantação de gestão de configuração, revisão em pares, métricas e verificação automatizada, o fluxo da equipe avançou para práticas estruturadas do **Nível F do MPS.BR / Nível 2 do CMMI (Gerenciado)**.
* **Retrospectiva Documentada:**
  * *O que funcionou bem:* Isolamento da regra de negócio do banco MySQL facilitou o TDD e o StrykerJS.
  * *O que melhorar:* Validar localmente a sintaxe YAML do GitHub Actions antes do *push* e cadastrar colaboradores antecipadamente para evitar bloqueios na revisão.
* **Roadmap e OKRs de Qualidade (Próximo Ciclo):**
  * **Objetivo:** Blindar os demais módulos críticos da API SaúdeDigital.
  * **KR1:** Atingir 85% de cobertura de testes nas rotas de Pacientes e Médicos.
  * **KR2:** Reduzir o tempo médio de revisão de Pull Requests para menos de 15 minutos.

## 4. Manutenção e Evolução
### Solicitações de Mudança Registradas (Aba *Issues* do GitHub)
1. **Issue #1 — Criptografia de dados sensíveis de pacientes:** Tipo **Corretiva / Segurança** | Impacto **Alto** (conformidade com LGPD e proteção de prontuários).
2. **Issue #2 — Filtro de busca de consultas por especialidade médica:** Tipo **Evolutiva** | Impacto **Médio** (melhoria na experiência da recepção).
3. **Issue #3 — Padronização de logs de auditoria de agendamento:** Tipo **Adaptativa** | Impacto **Médio** (rastreabilidade de alterações na agenda).

### Decisão Arquitetural (Refatorar vs. Substituir)
Optou-se por **refatorar e modernizar incrementalmente** o SaúdeDigital em vez de substituí-lo, pois a arquitetura atual (Node.js, Express e MySQL) já atende aos requisitos funcionais da clínica e possui baixo custo de manutenção quando protegida por testes unitários desacoplados e *Quality Gates* automatizados.