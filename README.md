# SaúdeDigital — Sistema de Gestão Clínica (SQA & UC HUB 2026/2)

Sistema web para gestão de clínicas médicas (pacientes, médicos, especialidades e agendamento de consultas), modernizado com práticas de **Gestão e Qualidade de Software** com foco no módulo crítico de **Agendamento de Consultas**.

---

## 📋 Enquadramento do Projeto
* **Caminho Adotado:** Sistema Existente ou Legado (Caminho 2)
* **Módulo Crítico Priorizado:** Validação e Agendamento de Consultas (`backend/src/services/validarAgendamento.js`)
* **Carta de Inovação:** *Teste além da cobertura* — Aplicação de **Mutation Testing** com **StrykerJS** para comprovar a eficácia real dos testes nos valores limite de horário.

---

## 🗂️ Estrutura do Repositório

```text
saudedigital/
├── .github/workflows/
│   └── ci.yml                          # Pipeline de CI com Quality Gate (GitHub Actions)
├── backend/
│   ├── src/
│   │   └── services/
│   │       └── validarAgendamento.js   # Regras de negócio isoladas do agendamento
│   ├── tests/
│   │   ├── features/
│   │   │   └── agendamento.feature     # Cenários BDD em Gherkin (linguagem natural)
│   │   └── agendamento.test.js         # Suíte de testes unitários e valores limite (Jest)
│   ├── package.json
│   └── stryker.config.json             # Configuração do Mutation Testing (StrykerJS)
├── docs/
│   ├── plano-qualidade.md              # Plano SQA, ISO 25010, Ata de Revisão e Git Flow
│   ├── plano-testes.md                 # Plano IEEE 829, Caixa-Preta e Experimento StrykerJS
│   └── gestao-e-metricas.md            # Métricas DORA, Story Points, MPS.BR/CMMI e Issues
└── frontend/                           # Interface web do sistema
```

---

## ⚙️ Pré-requisitos e Instalação

* **Node.js** (v20 ou superior)
* **MySQL** (para execução completa da API e persistência de dados)

1. Clone o repositório:
   ```bash
   git clone [https://github.com/ViniciusUlian/saudedigital.git](https://github.com/ViniciusUlian/saudedigital.git)
   cd saudedigital
   ```

2. Instale as dependências do backend:
   ```bash
   cd backend
   npm install
   ```

---

## 🧪 Como Executar os Testes e o Experimento de Inovação

Todos os comandos abaixo devem ser executados dentro da pasta `backend/`:

* **Rodar a suíte de testes unitários (Jest):**
  ```bash
  npm test
  ```

* **Gerar relatório de cobertura de código (Caixa-Branca):**
  ```bash
  npx jest --coverage
  ```

* **Executar o Mutation Testing (StrykerJS — Carta de Inovação):**
  ```bash
  npx stryker run
  ```
  *(O relatório detalhado em HTML é gerado em `backend/reports/mutation/mutation.html`).*

---

## 🔀 Gestão de Configuração e CI/CD

* **Estratégia de Branches:** Git Flow simplificado (`main` protegida por *Branch Protection Rules* e `develop` para integração).
* **Quality Gate:** Todo *Pull Request* direcionado à `main` exige aprovação de revisão em pares (*Peer Review*) e execução bem-sucedida do workflow `testes-e-qualidade` no GitHub Actions.
* **Releases:**
  * `v1.0.0-baseline`: Versão inicial antes da implantação da esteira de qualidade.
  * `v1.1.0-sqa`: Versão com TDD/BDD, StrykerJS, CI/CD e documentação SQA.

---

## 📄 Documentação Técnica (Evidências A3)

* [Plano de Qualidade (ISO 25010) e Ata de Revisão](docs/plano-qualidade.md)
* [Estratégia de Testes (IEEE 829) e Experimento StrykerJS](docs/plano-testes.md)
* [Métricas DORA, Estimativas, Maturidade e Evolução](docs/gestao-e-metricas.md)
