# Multi-Tenant App — POC de gerenciador de projetos com agente de IA

Prova de conceito de um gerenciador de projetos simples e multi-tenant, com um **agente de IA (agent)** que recebe um pedido em linguagem natural, monta um plano de passos e **executa esses passos usando as próprias operações da aplicação** (criar projeto, adicionar tarefa, atribuir tarefa, gerenciar membros...).

A ideia central: o agente não tem acesso ao banco nem a código privado. Ele só consegue fazer o que a aplicação já sabe fazer, através de um catálogo explícito de capacidades — e cada capacidade continua passando pela mesma checagem de permissão de um usuário humano.

> **Estado da POC:** o ciclo *planejar → executar → acompanhar em tempo real → retomar* está funcionando. Geração de **visualizações** e **relatórios** ainda não está implementada (ver [Roadmap](#roadmap)).

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Backend | Node.js + TypeScript, Express 5 |
| Banco | PostgreSQL via Drizzle ORM |
| Frontend | React 19 + Vite + React Router |
| LLM | OpenRouter (structured outputs / JSON Schema) |
| Tempo real | SSE (Server-Sent Events) sobre uma fila in-memory |
| Testes | `node:test` + `node:assert/strict` (26 arquivos `*.spec.ts`) |

---

## Domínios

O backend é dividido em módulos independentes (`src/modules/`), cada um com `domain/`, `application/`, `repository/`, `db/`, `query/` e uma fachada `*.module.ts`:

- **tenant** — tenants e memberships (papéis `admin` / `member`), limite de membros.
- **user** — identidade e **autorização**. É a fonte única de permissão: todo caso de uso é embrulhado por um decorator de autorização deste módulo.
- **project** — projetos e tarefas (status `screen` → `working` → `review` → `done`), atribuição de responsável.
- **agent** — o agente de IA: planejamento, orquestração dos passos, retomada e streaming de eventos.
- **sse** — expõe streams de eventos de outros módulos sem conhecer nenhum deles (interface `EventStream`).
- **@common** — Mediator, Container, fila, autorizadores, `Criteria`, observers, logger, `Result` em tupla.

Isolamento por tenant: hoje o tenant vem do header `x-tenant-id` em cada request (a infra de subdomínio existe no nginx/schema, mas nenhuma rota usa).

---

## Como o agente funciona

### 1. Catálogo de capacidades

`src/modules/agent/domain/ModuleCapabilities.ts` descreve, em JSON Schema, **toda** ação que um agent pode disparar: nome da ação, schema de entrada, schema de saída e permissões exigidas.

`src/modules/capabilities.ts` liga cada ação à fachada do módulo que a executa, via Mediator:

```
createProject · listProjects · addTask · listTasks · getTask · updateTask · assignTask
addMember · updateMember · removeMember · getTenant
```

Consequências desse desenho:

- O LLM só pode escolher ações dessa lista — qualquer outra é rejeitada no parse do plano.
- A execução passa pela fachada do módulo, então a **permissão do usuário que criou o agent continua valendo**. Um `member` não consegue criar projeto por interposta IA.
- `createTenant` e `listTenants` estão deliberadamente fora do catálogo.

### 2. Planejamento (`Planner` + `PlanService`)

O usuário escreve um pedido (ex.: *"crie o projeto Onboarding e adicione as tarefas de setup, treinamento e revisão"*). O `PlanService` manda para o LLM o pedido + o catálogo de capacidades + o contexto (`tenantId`, `userId`) e recebe de volta, em JSON Schema forçado:

```json
{ "name": "...", "type": "...", "steps": [ { "action": "...", "input": {...}, "type": "action", "order": 1 } ] }
```

O `Agent` é persistido com sua `StepCollection` ordenada e um evento `AgentCreated` vai para a fila.

Um passo pode ser do tipo `action` (o sistema executa) ou `ask` (pedir dado faltante ao usuário — **ainda não implementado**, o agent para nesse caso).

### 3. Execução (`Orchestrator` + `StepService`)

Ao consumir `AgentCreated`, o orquestrador percorre os passos pendentes em ordem e, para cada um:

1. marca como `running`, salva e publica `StepStarted`;
2. **resolve o input** — o `StepService` pede ao LLM que preencha o payload usando apenas a `AgentMemory` (o que os passos anteriores produziram) e o contexto, sem inventar ids;
3. despacha a ação pelo Mediator para o módulo dono;
4. **interpreta o output** em fatos estruturados e grava na memória;
5. salva e publica `StepCompleted`.

Se algo falha, o passo é marcado como `failed` com a mensagem do erro, o estado é persistido, `StepFailed` é publicado e o agent para ali — nada é desfeito às cegas.

Detalhe de transação: o planejamento roda em transação (com uma `DeferredQueue`, que só publica os eventos após o commit); a execução **não**, porque cada passo abre a transação do seu próprio módulo.

### 4. Retomada (`ResumeAgent`)

`POST /api/agents/:id/resume` não repete o trabalho já feito. O LLM recebe o plano como ele parou — incluindo o `error` do passo que falhou — e **replaneja só o que falta**. Os passos já `completed` são preservados; o resto é substituído, com a ordem continuando de onde parou.

O prompt de retomada instrui explicitamente que os efeitos dos passos concluídos **já existem** no sistema e que seus ids foram perdidos: o novo plano deve começar com ações de leitura (ex.: `listProjects`) para reencontrá-los antes de agir.

### 5. Acompanhamento em tempo real

`GET /api/events/agents?tenantId=&userId=` abre um SSE que envia um `snapshot` com o estado atual dos agents e, depois, cada mudança de passo. O `AgentEventStream` faz o filtro por tenant (a fila é compartilhada) e a autorização acontece na abertura do stream. No frontend, `AgentNavBar` mostra o plano de cada agent e o progresso passo a passo, com botão de retomar.

---

## API

Todas as rotas ficam sob `/api`. Autenticação é por header `x-user-id` (`authenticationMiddleware`); operações de tenant exigem também `x-tenant-id`.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/users` | login por e-mail |
| `GET` | `/api/users/search?name=` | busca usuários |
| `POST` | `/api/tenants` | cria tenant (só super admin) |
| `GET` | `/api/tenants` · `/api/tenants/:id` | lista / detalha tenant |
| `POST` | `/api/tenants/:id/users` | adiciona membro |
| `PATCH` · `DELETE` | `/api/tenants/:tenantId/users/:userId` | muda papel / remove membro |
| `POST` · `GET` | `/api/projects` | cria / lista projetos |
| `POST` · `GET` | `/api/projects/:projectId/tasks` | cria / lista tarefas |
| `GET` | `/api/projects/:projectId/tasks/:taskId` | detalha tarefa |
| `PATCH` | `/api/projects/:projectId/tasks/:taskId` | atualiza tarefa |
| `PATCH` | `/api/projects/:projectId/tasks/:taskId/assign` | atribui tarefa |
| `POST` | `/api/agents` | cria um agent a partir de `{ userPrompt }` |
| `GET` | `/api/agents` | lista agents com seus passos |
| `POST` | `/api/agents/:agentId/resume` | replaneja e retoma |
| `GET` | `/api/events/agents` | stream SSE de eventos de agent |

---

## Rodando localmente

Pré-requisitos: Node 20+, Docker (para o Postgres) e uma chave da OpenRouter.

```bash
# 1. banco
docker-compose up db

# 2. variáveis de ambiente (.env na raiz)
DATABASE_URL=postgres://user:password@localhost:5432/tenant_db
SUPER_ADMIN_NAME=...
SUPER_ADMIN_EMAIL=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=...
# opcionais: OPENROUTER_BASE_URL, OPENROUTER_APP_URL, OPENROUTER_APP_TITLE

# 3. schema + backend (porta 3000)
npx drizzle-kit push
npm run start:dev

# 4. frontend (Vite, proxy /api → :3000)
npm run frontend:dev
```

Sem `DATABASE_URL` o processo não sobe. Sem as variáveis da OpenRouter o servidor sobe, mas qualquer planejamento falha.

### Outros comandos

```bash
npm test           # node:test em src/modules/**/*.spec.ts
npx tsc --noEmit   # type-check
npm run build      # tsc → dist/
npm run start      # drizzle-kit push && node dist/main.js
```

Em produção o Express serve o build do frontend (`frontend/dist`) com fallback de SPA; `docker-compose` sobe também um nginx na frente.

---

## Convenções de código

Documentadas em detalhe em [`AGENTS.md`](AGENTS.md). Em resumo:

- **Requisito → teste → implementação.** Nada é implementado sobre suposição; regras de negócio são confirmadas antes.
- Domínio rico: entidades e value objects (`TaskStatus`, `StepType`, `DueDate`, `Id`) guardam as invariantes; casos de uso orquestram.
- Erros esperados voltam como `TupleResult` (`[erro, valor]`); exceção fica para o que é realmente excepcional.
- Módulos se comunicam só por fachadas e pelo Mediator — nunca importando o domínio um do outro.
- Repositórios recebem `Criteria`; existem `Fake*Repository` para testes de caso de uso.
- Aggregates registram eventos via observer, e o repositório decide entre INSERT e UPDATE a partir deles.

Documentos de arquitetura em [`plans/`](plans/) (escritos antes do agent ficar pronto — parte do texto sobre o módulo agent está defasada).

---

## Roadmap

O que a POC pretende cobrir e ainda não cobre:

- **Visualizações** — gráficos gerados pelo agente a partir dos dados do projeto (progresso, distribuição de tarefas por responsável, burndown).
- **Relatórios** — resumo em texto do estado do projeto, produzido pelo agent ao fim de um plano.
- **Passos do tipo `ask`** — o plano já pode prevê-los, mas o orquestrador para ao encontrar um; falta o ciclo de perguntar ao usuário e retomar com a resposta.
- **Anexos** — `POST /api/agents` aceita um campo `file`, mas ele ainda não é usado no planejamento.
- **Fila durável** — hoje é `InMemoryQueue`; agents em andamento não sobrevivem a um restart.
- **Middleware de erro** — está registrado antes dos routers, então não captura erros dos handlers (rotas críticas tratam o próprio erro).
