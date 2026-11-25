# Relatório — Testes unitários com IA generativa

**Aluno(s):** Luiz Antônio de Souza
**Ferramenta de IA utilizada:** Claude Code
**Unidades testadas:** `backend/src/utils/taskRules.ts` — RN01 (`canTransition`) e `backend/src/utils/normalize.ts` — RN03 (`normalizeName`)

## 1. Tabela de casos (elaborada antes de usar a IA)

Casos derivados exclusivamente de `docs/especificacao.md`.

### RN01 — `canTransition(from, to)`

| #  | Entrada (from → to)       | Resultado esperado | Técnica | Regra |
|----|---------------------------|--------------------|---------|-------|
| 1  | PENDING → IN_PROGRESS     | `true`  | Partição (permitida) | RN01 |
| 2  | PENDING → CANCELLED       | `true`  | Partição (permitida) — "pendente pode ser cancelada antes de ser iniciada" | RN01 |
| 3  | IN_PROGRESS → COMPLETED   | `true`  | Partição (permitida) | RN01 |
| 4  | IN_PROGRESS → CANCELLED   | `true`  | Partição (permitida) | RN01 |
| 5  | PENDING → COMPLETED       | `false` | Inválido (pular etapa) | RN01 |
| 6  | IN_PROGRESS → PENDING     | `false` | Inválido (voltar etapa) | RN01 |
| 7  | PENDING → PENDING         | `false` | Valor-limite (mesmo status) | RN01 |
| 8  | IN_PROGRESS → IN_PROGRESS | `false` | Valor-limite (mesmo status) | RN01 |
| 9  | COMPLETED → COMPLETED     | `false` | Valor-limite (mesmo status) | RN01 |
| 10 | CANCELLED → CANCELLED     | `false` | Valor-limite (mesmo status) | RN01 |
| 11 | COMPLETED → PENDING       | `false` | Inválido (status final) | RN01 |
| 12 | COMPLETED → IN_PROGRESS   | `false` | Inválido (status final) | RN01 |
| 13 | COMPLETED → CANCELLED     | `false` | Inválido (status final) | RN01 |
| 14 | CANCELLED → PENDING       | `false` | Inválido (status final) | RN01 |
| 15 | CANCELLED → IN_PROGRESS   | `false` | Inválido (status final) | RN01 |
| 16 | CANCELLED → COMPLETED     | `false` | Inválido (status final) | RN01 |

### RN03 — `normalizeName(name)`

| #  | Entrada | Resultado esperado | Técnica | Regra |
|----|---------|--------------------|---------|-------|
| 1  | `"  Trabalho   da  Faculdade "` | `"trabalho da faculdade"` | Partição (exemplo da especificação) | RN03 |
| 2  | `"   estudo"` | `"estudo"` | Partição (passo 1, início) | RN03 |
| 3  | `"estudo   "` | `"estudo"` | Partição (passo 1, fim) | RN03 |
| 4  | `"\t\nestudo\n\t"` | `"estudo"` | Partição (passo 1, tab/quebra nas bordas) | RN03 |
| 5  | `"casa nova"` | `"casa nova"` | Valor-limite (1 espaço interno) | RN03 |
| 6  | `"casa  nova"` | `"casa nova"` | Valor-limite (2 espaços internos) | RN03 |
| 7  | `"casa\tnova"` | `"casa nova"` | Partição (passo 2, tab) | RN03 |
| 8  | `"casa\nnova"` | `"casa nova"` | Partição (passo 2, quebra de linha) | RN03 |
| 9  | `"casa \t\n nova"` | `"casa nova"` | Partição (passo 2, sequência mista) | RN03 |
| 10 | `"TRABALHO"` | `"trabalho"` | Partição (passo 3) | RN03 |
| 11 | `"ÉPOCA ÁGIL"` | `"época ágil"` | Partição (passo 3, acentos) | RN03 |
| 12 | `"trabalho da faculdade"` | `"trabalho da faculdade"` | Partição (já normalizado) | RN03 |
| 13 | `""` | `""` | Valor-limite (vazio) | RN03 |
| 14 | `" \t\n "` | `""` | Valor-limite (só espaços em branco) | RN03 |
| 15 | `"A"` | `"a"` | Valor-limite (1 caractere) | RN03 |
| 16 | `"Trabalho da Faculdade"` × `"  trabalho\tDA   faculdade\n"` | mesmo resultado (duplicados) | Partição (duplicidade) | RN03 |
| 17 | `"Trabalho"` × `"Trabalhos"` | resultados diferentes | Partição (não duplicados) | RN03 |

## 2. Prompt utilizado

### Prompt 1 — RN01

```
Contexto: função canTransition em backend/src/utils/taskRules.ts, regra RN01 de
docs/especificacao.md. Use a implementação apenas para conhecer a assinatura
da função.

Tarefa: escreva testes unitários em backend/tests/unit/taskRules.test.ts.

Casos obrigatórios (definidos por mim):
| #  | from        | to          | esperado | técnica                     |
| 1  | PENDING     | IN_PROGRESS | true     | partição (permitida)        |
| 2  | PENDING     | CANCELLED   | true     | partição (permitida)        |
| 3  | IN_PROGRESS | COMPLETED   | true     | partição (permitida)        |
| 4  | IN_PROGRESS | CANCELLED   | true     | partição (permitida)        |
| 5  | PENDING     | COMPLETED   | false    | inválido (pular etapa)      |
| 6  | IN_PROGRESS | PENDING     | false    | inválido (voltar etapa)     |
| 7  | PENDING     | PENDING     | false    | valor-limite (mesmo status) |
| 8  | IN_PROGRESS | IN_PROGRESS | false    | valor-limite (mesmo status) |
| 9  | COMPLETED   | COMPLETED   | false    | valor-limite (mesmo status) |
| 10 | CANCELLED   | CANCELLED   | false    | valor-limite (mesmo status) |
| 11 | COMPLETED   | PENDING     | false    | inválido (status final)     |
| 12 | COMPLETED   | IN_PROGRESS | false    | inválido (status final)     |
| 13 | COMPLETED   | CANCELLED   | false    | inválido (status final)     |
| 14 | CANCELLED   | PENDING     | false    | inválido (status final)     |
| 15 | CANCELLED   | IN_PROGRESS | false    | inválido (status final)     |
| 16 | CANCELLED   | COMPLETED   | false    | inválido (status final)     |

Restrições: siga o AGENTS.md. Não altere src/. Use it.each para a tabela.

Saída: execute npm test e liste cada teste com o caso da tabela que ele verifica.
```

### Prompt 2 — RN03

```
Contexto: função normalizeName em backend/src/utils/normalize.ts, regra RN03 de
docs/especificacao.md. Use a implementação apenas para conhecer a assinatura
da função.

Tarefa: escreva testes unitários em backend/tests/unit/normalize.test.ts.

Casos obrigatórios (definidos por mim):
| #  | entrada                         | esperado                | técnica                       |
| 1  | "  Trabalho   da  Faculdade "   | "trabalho da faculdade" | partição (exemplo da spec)    |
| 2  | "   estudo"                     | "estudo"                | partição (passo 1, início)    |
| 3  | "estudo   "                     | "estudo"                | partição (passo 1, fim)       |
| 4  | "\t\nestudo\n\t"                | "estudo"                | partição (bordas tab/quebra)  |
| 5  | "casa nova"                     | "casa nova"             | valor-limite (1 espaço)       |
| 6  | "casa  nova"                    | "casa nova"             | valor-limite (2 espaços)      |
| 7  | "casa\tnova"                    | "casa nova"             | partição (tab interno)        |
| 8  | "casa\nnova"                    | "casa nova"             | partição (quebra interna)     |
| 9  | "casa \t\n nova"                | "casa nova"             | partição (sequência mista)    |
| 10 | "TRABALHO"                      | "trabalho"              | partição (minúsculas)         |
| 11 | "ÉPOCA ÁGIL"                    | "época ágil"            | partição (acentos)            |
| 12 | "trabalho da faculdade"         | "trabalho da faculdade" | partição (já normalizado)     |
| 13 | ""                              | ""                      | valor-limite (vazio)          |
| 14 | " \t\n "                        | ""                      | valor-limite (só espaços)     |
| 15 | "A"                             | "a"                     | valor-limite (1 caractere)    |
| 16 | "Trabalho da Faculdade" e "  trabalho\tDA   faculdade\n" | iguais após normalizar | partição (duplicados) |
| 17 | "Trabalho" e "Trabalhos"        | diferentes após normalizar | partição (não duplicados) |

Restrições: siga o AGENTS.md. Não altere src/. Use it.each para a tabela.

Saída: execute npm test e liste cada teste com o caso da tabela que ele verifica.
```

### Prompt 3 — Revisão (após a execução)

```
O caso 2 da RN01 (PENDING → CANCELLED, esperado true) falhou. Não altere o valor
esperado nem o código de src/: a especificação diz que uma tarefa pendente pode
ser cancelada. Mantenha o teste, marque-o com it.fails e adicione um comentário
indicando a regra RN01 violada. Depois execute npm test e npm run test:mutation
e informe o score de mutação por arquivo.
```

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|-------------------------------------|--------------------------------|
| Versão anterior de `taskRules.test.ts` classificava PENDING → CANCELLED como **proibida** e passava: teste-espelho (oráculo copiado do código, contrariando a RN01). | Teste reescrito a partir da tabela da especificação; o caso 2 passou a esperar `true` e falha, evidenciando o defeito. |
| Versão anterior deixava 6 mutantes sobreviventes em `taskRules.ts` (ex.: `from === 'CANCELLED'` trocado por `from === ""` não era detectado). | Tabela passou a cobrir a matriz completa 4×4 (16 casos). Os 6 sobreviventes persistem por serem mutantes equivalentes (ver seção 4). |
| Caso 2 falha após a geração. | Mantido com o valor da especificação; marcado com `it.fails` + comentário da regra (prompt 3), sem alterar `src/`. |
| Casos 7 a 10 da RN01 (mesmo status) apareciam no relatório do Vitest como `impede PENDING → undefined`: o título do `it.each` usava dois `%s`, mas a linha da tabela tinha só um status. O nome não descrevia o comportamento. | Tabela do `it.each` passou a informar `from` e `to` explicitamente; nomes corrigidos para `impede PENDING → PENDING (mesmo status)`. |
| Checklist do slide 18: um teste por caso, asserções exatas (`toBe`), limites e inválidos, nomes em português, sem `.skip`. | Conferido. `git diff src/` vazio. |

## 4. Resultados

- Testes criados: 36 (16 RN01 + 17 RN03 + 3 RN02 de referência) | aprovados: 35 | reprovados: 1 (caso 2 da RN01 — defeito, marcado com `it.fails`)
- Cobertura de linhas da unidade: 100% (`src/utils`)
- Score de mutação (backend): **87,23%** (41 mortos / 47)
  - `categoryRules.ts`: 100% (4/4) · `normalize.ts`: 100% (6/6) · `taskRules.ts`: 83,78% (31/37)

**Análise dos 6 sobreviventes (`taskRules.ts`).** Todos estão na mesma linha:
`if (from === 'COMPLETED' || from === 'CANCELLED') return false`.
Os mutantes removem ou enfraquecem essa guarda (`if (false)`, `&&` no lugar de `||`,
`""` no lugar do status). Mesmo assim, os 16 casos da matriz completa — incluindo as 6
transições a partir de status finais (casos 11 a 16) — continuam corretos, porque o
restante da função já retorna `false` para essas entradas. A guarda é redundante: são
**mutantes equivalentes**, que não alteram o comportamento observável e, portanto, não
podem ser mortos por nenhum caso derivado da especificação. Não geraram novos casos na
tabela, pois a matriz 4×4 já está completa.

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|-------|----------------------------|-------------------------|---------------------|
| RN01 | PENDING → CANCELLED é permitido ("uma tarefa pendente pode ser cancelada antes de ser iniciada") | `canTransition('PENDING', 'CANCELLED')` retorna `false` | `taskRules.test.ts` › transições permitidas pela RN01 › caso 2: permite PENDING → CANCELLED |

---

# Parte 2 — Frontend: componente `Users` (Aula 11)

**Unidade testada:** `frontend/src/components/Users.tsx`, com os requisitos RF01, RF02, RF04, RF05, RF06 e RF07
(o RF03 é coberto pelo teste de referência `Users.error.test.tsx`).
**Arquivo de testes:** `frontend/tests/unit/Users.test.tsx`

## 1. Tabela de casos (antes de usar a IA)

Casos derivados exclusivamente de `docs/especificacao.md`.

| #  | Req. | Preparação (mock) | Ação do usuário | Resultado esperado |
|----|------|-------------------|-----------------|--------------------|
| 1  | RF01 | `api.get` pendente (promessa que não resolve) | — | "Carregando usuários..." visível |
| 2  | RF01 | `api.get` → lista com 1 usuário | — | "Carregando usuários..." some após o carregamento |
| 3  | RF02 | `api.get` → 2 usuários | — | 2 linhas de dados na tabela |
| 4  | RF02 | `api.get` → lista vazia (limite) | — | 0 linhas de dados |
| 5  | RF02 | `api.get` → Ana / ana@email.com | — | nome e email na linha do usuário |
| 6  | RF02 | usuário sem o campo `tasks` | — | quantidade de tarefas = 0 |
| 7  | RF02 | usuário com `tasks: []` (limite) | — | quantidade de tarefas = 0 |
| 8  | RF02 | usuário com 1 tarefa (limite) | — | quantidade de tarefas = 1 |
| 9  | RF02 | usuário com 3 tarefas | — | quantidade de tarefas = 3 |
| 10 | RF04 | `api.get` → lista vazia | nenhuma | botão "Criar" ausente (formulário fechado) |
| 11 | RF04 | `api.get` → lista vazia | clicar "Adicionar Usuário" | botão "Criar" visível |
| 12 | RF04 | `api.get` → lista vazia | clicar "Adicionar Usuário" | campo **Nome** visível (pelo rótulo) |
| 13 | RF04 | `api.get` → lista vazia | clicar "Adicionar Usuário" | campo **Email** visível (pelo rótulo) |
| 14 | RF05 | `api.get` → lista vazia | abrir, clicar "Cancelar" | formulário fechado |
| 15 | RF05 | `api.get` → lista vazia | abrir, digitar, "Cancelar", reabrir | campos Nome e Email vazios |
| 16 | RF06 | `api.get` → Ana | clicar "Editar" | botão "Atualizar" visível e "Criar" ausente |
| 17 | RF06 | `api.get` → Ana | clicar "Editar" | campo Nome = "Ana" |
| 18 | RF06 | `api.get` → Ana | clicar "Editar" | campo Email = "ana@email.com" |
| 19 | RF06 | `api.get` → Ana e Bruno | clicar "Editar" na linha de Bruno | campo Nome = "Bruno" (dados da linha clicada) |
| 20 | RF07 | `api.get` → lista vazia | clicar "Adicionar Usuário" | campo Nome localizável por `getByRole('textbox', { name: /Nome/ })` |
| 21 | RF07 | `api.get` → lista vazia | clicar "Adicionar Usuário" | campo Email localizável por `getByRole('textbox', { name: /Email/ })` |

## 2. Prompt utilizado

```
Contexto: componente frontend/src/components/Users.tsx, requisitos RF01, RF02,
RF04, RF05, RF06 e RF07 de docs/especificacao.md (RF03 já tem teste de referência).

Tarefa: escreva testes em frontend/tests/unit/Users.test.tsx.

Casos obrigatórios (definidos por mim): tabela da seção 1 (casos 1 a 21).

Restrições: siga o AGENTS.md. Use getByRole ou getByLabelText e userEvent.
Não altere src/. Se algum teste não puder passar sem alterar src/,
interrompa e explique o motivo.

Saída: execute npm test e relacione cada teste a uma linha da tabela.
```

Prompt de revisão (após a execução):

```
Os 8 testes que falham por causa do rótulo não associado (RF07) devem ser mantidos
com o valor da especificação e marcados com it.fails, com comentário indicando o
defeito. Depois aplique as quatro sabotagens do slide 13, uma por vez, desfazendo
cada uma com git restore, e registre quais testes falharam.
```

## 3. Revisão do teste gerado

| Problema encontrado no teste gerado | Ajuste solicitado ou realizado |
|-------------------------------------|--------------------------------|
| Na 1ª execução, 20 de 22 testes falharam com `Found multiple elements with the role "button" and name "Adicionar Usuário"`: o componente de um teste continuava montado no seguinte. A limpeza automática da Testing Library só funciona com `globals: true`, e o projeto importa `describe/it` explicitamente. | Adicionado `afterEach(() => cleanup())` no arquivo de teste. Problema do teste, não do componente. |
| 8 testes falham porque `getByLabelText(/Nome/i)` encontra o rótulo, mas nenhum campo associado a ele. | Não contornado com seletor CSS, `data-testid` nem `getByDisplayValue`. Registrado como defeito (seção 5) e testes marcados com `it.fails`. |
| RF04 e RF06 tinham várias verificações no mesmo teste ("Nome, Email e Criar"). | Separados em um teste por comportamento; assim, o botão "Criar" e o botão "Atualizar" continuam verificados apesar do defeito de RF07. |
| Checklist do slide 11: sem `container.querySelector`, sem `fireEvent`, sem `data-testid`, sem verificar `showForm`, sem snapshot, sem `setTimeout`. | Conferido. Interações com `userEvent`; esperas com `findBy...`. `git status src/` vazio. |
| As dependências do frontend não estavam instaladas (`node_modules` vazio). | Executado `npm ci`, que instala exatamente o `package-lock.json`, sem adicionar nem atualizar pacotes. |

## 4. Resultados

- Testes do componente: 22 (21 em `Users.test.tsx` + 1 de referência RF03) | aprovados: 14 | falhas esperadas (`it.fails`): 8 (casos 12, 13, 15, 17, 18, 19, 20 e 21: defeito RF07)
- Cobertura de `Users.tsx`: 62,96% das linhas · 71,42% dos ramos. As linhas não cobertas são `handleSubmit` (criar/atualizar), `handleDelete` (excluir) e os `onChange` dos campos. Envio e exclusão não fazem parte de RF01 a RF07; os `onChange` só são alcançados digitando nos campos, o que o defeito de RF07 impede.

### Sabotagem controlada (mutação manual)

| # | Sabotagem em `Users.tsx` | Req. | Detectada? | Testes que falharam |
|---|--------------------------|------|------------|---------------------|
| 1 | Remover `setShowForm(false)` de `handleCancel` | RF05 | Sim | RF05 › fecha o formulário ao clicar em "Cancelar" |
| 2 | Trocar o texto `'Criar'` por `'Salvar'` | RF04 | Sim | RF04 › exibe o botão "Criar" ao clicar em "Adicionar Usuário" |
| 3 | Trocar `user.tasks?.length \|\| 0` por `1` | RF02 | Sim | RF02 › quantidade 0 (sem `tasks`), quantidade 0 (`tasks: []`) e quantidade 3 |
| 4 | Alterar a mensagem `'Erro ao carregar usuários'` | RF03 | Sim | RF03 › exibe mensagem de erro quando a API falha (teste de referência) |

As 4 sabotagens foram detectadas (4/4). Cada uma foi desfeita com `git restore src/components/Users.tsx` antes da próxima.
Na sabotagem 3, o caso de 1 tarefa continua passando, porque o valor fixo `1` coincide com o esperado. Isso mostra que os
valores-limite 0 e 3 são necessários para detectá-la.

**Limitação:** com os rótulos desassociados, uma sabotagem que removesse `setFormData({ name: '', email: '' })` de
`handleCancel` (a parte "campos limpos" do RF05) **não seria detectada**, pois o teste do caso 15 já falha por causa de RF07.
Esse comportamento só passará a ser verificado depois que o defeito de RF07 for corrigido.

## 5. Defeitos encontrados (divergências entre especificação e código)

| Regra | Comportamento especificado | Comportamento observado | Testes que evidenciam |
|-------|----------------------------|-------------------------|-----------------------|
| RF07 | Todo campo de formulário deve estar associado ao seu rótulo e poder ser localizado pelo texto do rótulo (`getByLabelText`) | Os `<label>Nome:</label>` e `<label>Email:</label>` não têm `htmlFor`, os `<input>` não têm `id` e não estão dentro do rótulo. O erro da Testing Library é: *"Found a label with the text of: /Nome/i, however no form control was found associated to that label"* | RF07 › associa o campo Nome/Email ao seu rótulo; RF04 › exibe o campo Nome/Email; RF05 › limpa os campos digitados; RF06 › nome preenchido, email preenchido, dados da linha clicada |

A correção é uma alteração de produção (associar `htmlFor`/`id` ou colocar o `<input>` dentro do `<label>`). Ela deve ser
feita em commit separado e decidida pelo aluno, não durante a escrita dos testes. Depois da correção, os 8 testes passarão e
o `it.fails` deverá ser removido.

**Atualização (Aula 12):** o defeito RF07 foi corrigido no repositório da disciplina (commit `3a57228`, rótulos com
`htmlFor`/`id`). Após sincronizar o fork, os 8 testes passaram e o `it.fails` foi removido, sem alterar nenhuma asserção.

---

# Parte 3 — Testes de integração (Aula 12)

**Backend:** API03, API04 e API05 com Supertest + PostgreSQL (`teste_software_test_db`).
Arquivos: `backend/tests/integration/categories.int.test.ts` e `backend/tests/integration/tasks.int.test.ts`.
**Frontend:** RF08 e RF09 com Testing Library + MSW. Arquivo: `frontend/tests/integration/Users.create.int.test.tsx`.

## 1. Tabela de casos (antes de usar a IA)

### Backend

| #  | Regra | Estado inicial | Requisição | Resposta esperada | Efeito no banco |
|----|-------|----------------|------------|-------------------|-----------------|
| 1  | API03 | categoria sem tarefas | `DELETE /api/categories/:id` | 200 `{ success: true }` | categoria removida |
| 2  | API03 | categoria com 1 tarefa (limite) | `DELETE /api/categories/:id` | 400 `{ success: false, error }` | categoria e tarefa mantidas |
| 3  | API03 | categoria com 2 tarefas | `DELETE /api/categories/:id` | 400 | categoria e as 2 tarefas mantidas |
| 4  | API03 | outra categoria existente | `DELETE /api/categories/inexistente` | 404 | nenhum (1 categoria continua) |
| 5  | API04 | banco vazio | `POST /api/categories` `{ name: "Trabalho" }` | 201 com `data.id` | 1 categoria gravada |
| 6  | API04 | existe `trabalho` | `POST` `{ name: "Trabalhos" }` | 201 | 2 categorias |
| 7  | API04 | existe `" trabalho "` | `POST` `{ name: "Trabalho" }` | 409 | nenhuma criada |
| 8  | API04 | existe `trabalho` | `POST` `{ name: "  TRABALHO  " }` | 409 | nenhuma criada |
| 9  | API04 | existe `trabalho da faculdade` | `POST` `{ name: "  Trabalho   da\tFaculdade " }` | 409 | nenhuma criada |
| 10–13 | API05 | tarefa PENDING→IN_PROGRESS, PENDING→CANCELLED, IN_PROGRESS→COMPLETED, IN_PROGRESS→CANCELLED | `PUT /api/tasks/:id` `{ status }` | 200, `data.status` novo | novo status gravado |
| 14–19 | API05 | tarefa COMPLETED→PENDING, COMPLETED→IN_PROGRESS, CANCELLED→PENDING, CANCELLED→IN_PROGRESS, PENDING→COMPLETED, IN_PROGRESS→PENDING | `PUT /api/tasks/:id` `{ status }` | 400 `{ success: false, error }` | status e `updatedAt` inalterados |
| 20 | API05 | outra tarefa existente | `PUT /api/tasks/inexistente` | 404 | outra tarefa inalterada |

### Frontend (o "estado inicial" é a resposta do handler MSW)

| #  | Req. | Handlers MSW | Ação do usuário | Resultado esperado |
|----|------|--------------|-----------------|--------------------|
| 21 | RF08 | GET → [Ana]; POST → 201 | preencher Nome/Email, clicar "Criar" | corpo do POST = `{ name, email }` digitados |
| 22 | RF08 | GET → lista atualizada após o POST | idem | formulário fechado; GET chamado 2 vezes; linha do novo usuário com email e 0 tarefas |
| 23 | RF09 | POST → 409 `{ success: false, error }` | idem, com email repetido | mensagem "Email já cadastrado" |
| 24 | RF09 | POST → 409 | idem | formulário aberto com os dados digitados |

## 2. Prompts utilizados

```
Contexto: rotas DELETE /api/categories/:id, POST /api/categories e PUT /api/tasks/:id,
contratos API03, API04 e API05 e regras RN01–RN04 de docs/especificacao.md.
Tarefa: escreva testes de integração em backend/tests/integration/categories.int.test.ts
e tasks.int.test.ts.
Casos obrigatórios (definidos por mim): tabela Backend, casos 1 a 20.
Restrições: siga o AGENTS.md (seção Testes de integração). Use request(app) e os helpers
de helpers/db.ts. Não use vi.mock. Não altere src/.
Saída: execute npm run test:integration e relacione cada teste a uma linha da tabela.
```

```
Contexto: componente Users, requisitos RF08 e RF09, contratos API01 e API02.
Tarefa: escreva testes de integração em frontend/tests/integration/Users.create.int.test.tsx.
Casos obrigatórios: tabela Frontend, casos 21 a 24.
Restrições: siga o AGENTS.md. Use MSW (server.use), sem vi.spyOn(api). Respostas no
formato do contrato. No POST, verifique o corpo recebido com await request.json().
Não altere src/. Saída: execute npm run test:integration e relacione cada teste à tabela.
```

## 3. Revisão do teste gerado

| Problema encontrado | Ajuste |
|---------------------|--------|
| No frontend, os componentes de um teste continuavam montados no seguinte (`Found multiple elements ... "Adicionar Usuário"`). | `afterEach(() => cleanup())` no arquivo, mesmo problema da Aula 11. |
| Checklist de sinais de alerta (slide 18): sem `vi.mock` do Prisma, sem `vi.spyOn(api)`, status + corpo + efeito no banco, cenário criado no próprio teste, `testDatabase.ts` intocado, handlers no formato do contrato, corpo do POST verificado. | Conferido. |
| Os testes de integração antigos da Aula 10 (`*.test.ts` com `tests/helpers.ts`) não seguem o padrão `*.int.test.ts` da nova configuração. | Mantidos no repositório, mas não são executados por `npm run test:integration`. |

## 4. Resultados

- **Frontend** (`npm test`): 27 testes, 26 aprovados + 1 falha esperada (`it.fails`, defeito RF09).
- **Backend** (`npm run test:integration`): testes escritos (casos 1–20), **execução pendente**. O `globalSetup` do
  projeto executa `prisma db push --force-reset` no banco `teste_software_test_db`, e o Prisma bloqueia esse comando
  quando ele é disparado por um agente de IA sem o consentimento explícito do aluno. Para executar:
  `docker compose up -d postgres` e, em `backend/`, `npm run test:integration`.

### Sabotagem controlada (slide 19)

| # | Sabotagem | Arquivo | Regra | Detectada? | Testes que falharam |
|---|-----------|---------|-------|------------|---------------------|
| 1 | Remover a checagem `canDeleteCategory` | `categoryController.ts` | API03 | pendente (backend) | — |
| 2 | Trocar o status 409 por 400 | `userController.ts` | API01 | pendente (backend) | — |
| 3 | Remover `include: { tasks: ... }` de `getUsers` | `userController.ts` | API02 | pendente (backend) | — |
| 4 | Remover `fetchUsers()` após salvar | `Users.tsx` | RF08 | **Sim** | RF08 › envia ao POST o nome e o email digitados; RF08 › após o 201, fecha o formulário e a lista recarregada exibe o novo usuário |

Cada sabotagem é desfeita com `git restore src/` antes da próxima.

## 5. Defeitos encontrados

| Regra | Comportamento especificado | Comportamento observado | Teste que evidencia |
|-------|----------------------------|-------------------------|---------------------|
| RF09 | Com `409` ao criar usuário, exibir "Email já cadastrado" | O componente exibe a mensagem genérica "Erro ao salvar usuário" (o `catch` de `handleSubmit` ignora o status e o `error` da resposta) | `Users.create.int.test.tsx` › RF09 › exibe a mensagem "Email já cadastrado" (`it.fails`) |

---

# Parte 4 — Testes E2E com Playwright (Aula 13)

**Jornadas:** J03, J04, J05 e J06 (obrigatórias); J07 e J08 (complementares). J01 e J02 são os testes de referência.
**Ambiente:** aplicação completa no Docker (`docker compose up -d`): frontend :3000, backend :3001 e PostgreSQL.
O Playwright (Chromium) roda na máquina local.
**Arquivos:** `frontend/tests/e2e/UsersEdit.e2e.spec.ts` (J03), `UsersDelete.e2e.spec.ts` (J04),
`Categories.e2e.spec.ts` (J05, J06), `UsersEmail.e2e.spec.ts` (J07), `Tasks.e2e.spec.ts` (J08).

## 1. Tabela de casos (antes de usar a IA)

| #  | Jornada | Preparação (API, fixture `dados`) | Passos do usuário | Resultado visível | Após recarregar |
|----|---------|-----------------------------------|-------------------|-------------------|-----------------|
| 1  | J03 | usuário com email e nome únicos | "Editar" na linha → campo Nome preenchido → novo nome → "Atualizar" | formulário fecha; linha exibe o novo nome; nome antigo não aparece | novo nome aparece; antigo não |
| 2  | J04 | usuário com email único | "Excluir" na linha → **confirmar** | linha removida | usuário não aparece |
| 3  | J04 | usuário com email único | "Excluir" na linha → **cancelar** (alternativa) | linha permanece | usuário aparece |
| 4  | J05 | nenhuma (nome único) | "Adicionar Categoria" → Nome e Descrição → "Criar" | formulário fecha; categoria e descrição na lista | categoria aparece |
| 5  | J05 | categoria com nome único | "Editar" → novo nome → "Atualizar" | novo nome na lista; antigo não | novo nome aparece; antigo não |
| 6  | J05 | categoria com nome único | "Excluir" → confirmar | linha removida | categoria não aparece |
| 7  | J05 | categoria com nome único | "Excluir" → cancelar (alternativa) | linha permanece | categoria aparece |
| 8  | J06 | usuário + categoria + 1 tarefa nela | "Excluir" na categoria → confirmar | mensagem de erro; categoria permanece | categoria aparece |
| 9  | J07 | usuário com email único | "Adicionar Usuário" → outro nome, **mesmo email** → "Criar" | "Email já cadastrado" | — |
| 10 | J08 | tarefa com status COMPLETED | "Editar" → Status = Pendente → "Atualizar" | lista continua com COMPLETED | lista exibe COMPLETED |

## 2. Prompt utilizado (etapas 2 e 3 — contextualizar e gerar)

O mesmo modelo do slide 16, um por jornada. Exemplo do J04:

```
Contexto: jornada J04 de docs/especificacao.md, tela /users. A aplicação está em
execução (docker compose).
Tarefa: escreva o teste E2E em frontend/tests/e2e/UsersDelete.e2e.spec.ts.
Casos obrigatórios (definidos por mim):
| # | Preparação        | Passos               | Após recarregar |
| 1 | usuário via dados | Excluir e confirmar  | não aparece     |
| 2 | usuário via dados | Excluir e cancelar   | aparece         |
Restrições: siga o AGENTS.md (seção Testes E2E). Use a fixture dados,
getByRole/getByLabel e page.once('dialog'). Sem waitForTimeout. Não altere src/
nem a configuração.
Saída: execute npm run test:e2e e relacione cada teste a uma linha da tabela.
```

Para J03, J05, J06, J07 e J08 o prompt foi o mesmo, trocando a jornada, a tela, o arquivo e as linhas da tabela da seção 1.

## 3. Revisão do teste gerado (etapa 4 — sinais de alerta)

| Problema encontrado | Ajuste |
|---------------------|--------|
| J05 (cadastrar/editar) e J08 falharam com `getByLabel('Nome:')` / `getByLabel('Status:')`: *element(s) not found*. Nas telas de Categorias e Tarefas, os `<label>` não estão associados aos campos. | **J05:** a jornada cita os "campos Nome e Descrição", que o usuário identifica pelo rótulo. O localizador foi mantido, o defeito foi registrado e os testes foram marcados com `test.fail()`. **J08:** a jornada trata da RN01, não de rótulos. Foi corrigido **apenas o localizador** (limite do healer): `getByRole('combobox').filter({ has: getByRole('option', { name: 'Concluída' }) })`, sem CSS e sem `nth()`. |
| J08 verificava uma "mensagem de erro" que a jornada **não exige**. | Asserção removida por ir além da especificação. As asserções da jornada (COMPLETED antes e depois de recarregar) foram mantidas. |
| No J05 (cadastrar), com `test.fail()`, o `fill` esperava 30 s e terminava em *timeout*, que o Playwright não aceita como falha esperada. | Adicionado `await expect(getByLabel('Nome:')).toBeVisible()` antes do `fill`, que falha em 5 s com mensagem clara. Timeout e configuração não foram alterados. |
| Checklist do slide 17: sem `waitForTimeout`, sem `.locator('.btn-danger').nth()`, sem dados do seed, cada teste prepara os próprios dados, o que é criado pela tela é registrado (`registrarCategoriaPorNome`), sem `{ force: true }`, timeout ou retries. | Conferido. Nomes de categoria em minúsculas, porque a RN03 normaliza o nome. |
| J04/J05, caso "cancelar": sem verificar o diálogo, o teste passaria mesmo se a exclusão nem pedisse confirmação. | O handler de `page.once('dialog')` marca que o diálogo apareceu, e o teste verifica isso com `expect.poll`. |

## 4. Resultados (etapa 5 — avaliar)

- `npm run test:e2e`: **14 aprovados**. Isso inclui 4 falhas esperadas (`test.fail()`): J05 cadastrar, J05 editar, J07 e J08.
- **Estabilidade** (`npx playwright test --repeat-each=5`): cada um dos 14 testes executado 5 vezes seguidas (70 execuções
  por rodada).

  | Rodada | Data | Execuções | Aprovadas | Falhas inesperadas | Observação |
  |--------|------|-----------|-----------|--------------------|------------|
  | 1 | 25/11/2026 | 70 | 69 | 1 | J02 (teste de referência) falhou na repetição 2 |
  | — | 25/11/2026 | 10 | 10 | 0 | J02 isolado com `--repeat-each=10` |
  | 2 | 25/11/2026 | 70 | 70 | 0 | — |
  | 3 | 25/11/2026 | 70 | 70 | 0 | — |

  Além disso, a suíte foi executada uma vez sem repetição (`npm run test:e2e`): 14 aprovados.

  Nas rodadas 2 e 3, as 4 falhas esperadas (`test.fail()`) falharam em todas as repetições, e todos os demais testes
  passaram em todas. Os defeitos, portanto, são reproduzíveis, não intermitentes. A única falha inesperada (J02, rodada 1)
  não se repetiu em 90 execuções posteriores do J02. Os artefatos dela não foram preservados, então a causa não foi
  confirmada: fica registrada como **possível intermitência a investigar**. A suspeita é concorrência com o banco
  compartilhado da aplicação, já que os testes E2E usam o mesmo banco em execução.

### Sabotagem controlada

Observação: no Windows, o Docker não repassa ao Vite nem ao backend a notificação de alteração de arquivo. Após cada
sabotagem foi preciso `docker compose restart <serviço>` (e de novo após o `git restore`).

| # | Sabotagem | Arquivo | Jornada | Detectada? | Testes que falharam |
|---|-----------|---------|---------|------------|---------------------|
| 1 | Remover `fetchUsers()` após salvar | `Users.tsx` | J02, J03 | **Sim** | J02 › cria um usuário…; J03 › altera o nome… |
| 2 | Trocar o texto do link "Categorias" por "Grupos" | `App.tsx` | J01 | **Sim** | J01 › leva do Dashboard à tela de Categorias |
| 3 | Ignorar o `window.confirm` na exclusão | `Users.tsx` | J04 (caso 2) | **Sim** | J04 › caso 2: excluir e cancelar mantém o usuário |
| 4 | Remover a checagem `canDeleteCategory` | `categoryController.ts` (backend) | J06 | **Sim** | J06 › exibe erro ao excluir categoria com tarefa… |

Todas as 4 sabotagens foram detectadas (4/4). Cada uma foi desfeita com `git restore` antes da próxima.

## 5. Defeitos encontrados

| Jornada | Comportamento especificado | Comportamento observado | Teste que evidencia |
|---------|----------------------------|-------------------------|---------------------|
| J08 (RN01/RN04/API05) | COMPLETED → Pendente é recusado e a lista continua com COMPLETED | A alteração é **aceita**: após "Atualizar", a linha exibe `PENDING` | `Tasks.e2e.spec.ts` › J08 (`test.fail()`) |
| J07 (RF09/API01) | Email repetido exibe "Email já cadastrado" | Exibe "Erro ao salvar usuário" (mesmo defeito do RF09, Aula 12) | `UsersEmail.e2e.spec.ts` › J07 (`test.fail()`) |
| J05 (acessibilidade, análogo ao RF07) | Campos Nome e Descrição identificáveis pelo rótulo | Em Categorias (e em Tarefas), os `<label>` não têm `htmlFor` e os campos não têm `id`; `getByLabel` não os encontra | `Categories.e2e.spec.ts` › J05 cadastrar e editar (`test.fail()`) |
