# Relatório de Testes de Caixa Preta — Task Manager

**Disciplina:** Teste de Software — UNIVAS
**Data:** 05/11/2026
**Ambiente:** Docker Compose (frontend `:3000`, API `:3001`, PostgreSQL 16), banco populado com `db:seed`

## 1. Entendendo o sistema (sem olhar o código)

O Task Manager é um gerenciador de tarefas com três cadastros:

| Entidade  | Para que serve | Campos que o usuário informa |
|-----------|----------------|------------------------------|
| Usuário   | Pessoa responsável pelas tarefas | nome, email (único) |
| Categoria | Agrupa tarefas (Trabalho, Estudo...) | nome (único), descrição |
| Tarefa    | Algo a ser feito | título, descrição, status, prioridade, usuário, categoria |

- **Status:** PENDING → IN_PROGRESS → COMPLETED / CANCELLED
- **Prioridade:** LOW, MEDIUM, HIGH, URGENT
- A lista de tarefas pode ser filtrada por status, prioridade, usuário e categoria.

**Técnicas usadas:** particionamento em classes de equivalência (entradas válidas × inválidas),
análise de valor limite (vazio, só espaços, texto muito longo), tabela de transição de estados
(status da tarefa) e suposição de erros (JSON quebrado, SQL injection, XSS, ids inexistentes).

## 2. Casos de teste executados

Legenda: ✅ comportamento correto · ❌ defeito encontrado · ⚠️ funciona, mas é questionável

### Usuários

| ID | Entrada | Esperado | Obtido (HTTP + mensagem) | Resultado |
|----|---------|----------|--------------------------|-----------|
| CT01 | Criar `Maria / maria@x.com` | 201, usuário criado | 201 | ✅ |
| CT02 | Criar outro usuário com o mesmo email | 409, email duplicado | 409 `"Email already exists"` | ✅ |
| CT03 | Nome vazio `""` | 400 | 400 `"Validation error"` / `"Name is required"` | ✅ |
| CT04 | Email `joao` (sem @) | 400 | 400 `"Invalid email format"` | ✅ |
| CT05 | Corpo vazio `{}` | 400 | 400 `"Invalid input: expected string, received undefined"` (nome e email) | ✅ |
| CT06 | JSON malformado `{"name":"Joao", "email":` | 400 com mensagem amigável | 400 `"Unexpected end of JSON input"` **+ stack trace completo do servidor** | ⚠️ |
| CT07 | Nome só com espaços `"   "` | 400 (nome em branco) | 201 — usuário criado sem nome visível | ❌ |
| CT08 | Nome com 300 caracteres | 400 (limite de tamanho) | 201 — aceito sem limite | ⚠️ |
| CT09 | Nome `<script>alert(1)</script>` | Rejeitar ou sanitizar | 201 — gravado como está | ⚠️ |
| CT10 | Nome numérico `123` | 400 | 400 `"expected string, received number"` | ✅ |
| CT11 | Buscar id inexistente | 404 | 404 `"User not found"` | ✅ |
| CT12 | Editar id inexistente | 404 | **500** `"Failed to update user"` | ❌ |
| CT13 | Excluir id inexistente | 404 | **500** `"Failed to delete user"` | ❌ |
| CT22 | Buscar id `' OR 1=1--` (SQL injection) | 404, sem vazar dados | 404 `"User not found"` | ✅ |

### Categorias

| ID | Entrada | Esperado | Obtido | Resultado |
|----|---------|----------|--------|-----------|
| CT14 | Criar `work` (já existe `Work`) | 409, nome duplicado | 201 — criou duplicata com outra caixa | ❌ |
| CT15 | Criar `Work` (idêntico) | 409 | 409 `"Category name already exists"` | ✅ |
| CT16 | Excluir categoria que tem tarefas | Bloquear | 400 `"Cannot delete category with existing tasks"` | ✅ |

### Tarefas

| ID | Entrada | Esperado | Obtido | Resultado |
|----|---------|----------|--------|-----------|
| CT17 | Criar tarefa com usuário inexistente | 404 | 404 `"User not found"` | ✅ |
| CT18 | Prioridade `MAXIMA` | 400 | 400 `"Invalid option: expected one of LOW\|MEDIUM\|HIGH\|URGENT"` | ✅ |
| CT19 | Tarefa **COMPLETED** alterada para **PENDING** | 400, transição inválida | 200 — tarefa concluída "reaberta" | ❌ |
| CT20 | Filtrar `?status=QUALQUER` | 400 (filtro inválido) ou lista vazia | **500** `"Failed to fetch tasks"` | ❌ |

### Geral

| ID | Entrada | Esperado | Obtido | Resultado |
|----|---------|----------|--------|-----------|
| CT21 | `GET /api/rota-inexistente` | 404 | 404 `"Not Found - /api/rota-inexistente"` | ✅ |

**Resumo:** 22 casos · 13 ✅ · 6 ❌ · 3 ⚠️

## 3. Defeitos encontrados

| # | Defeito | Severidade | Casos |
|---|---------|-----------|-------|
| D1 | Editar/excluir registro inexistente retorna **500 (erro interno)** em vez de 404. Vale para usuários, categorias e tarefas. A mensagem "Failed to update/delete" não diz ao usuário o que aconteceu. | Média | CT12, CT13 |
| D2 | Tarefa concluída ou cancelada pode voltar para pendente — o fluxo de status não é respeitado. | Alta | CT19 |
| D3 | Nome de categoria duplicado é aceito quando muda só maiúsculas/minúsculas ou espaços (`Work` × `work`). | Média | CT14 |
| D4 | Filtro com valor inválido derruba a consulta com 500 em vez de avisar que o valor é inválido. | Média | CT20 |
| D5 | Nome composto só por espaços é aceito. | Baixa | CT07 |
| O1 | JSON malformado devolve o **stack trace** do servidor (caminhos internos, bibliotecas) — vazamento de informação. | Média (segurança) | CT06 |
| O2 | Sem limite de tamanho nos textos e sem sanitização de HTML (o React escapa na tela, mas o dado fica sujo no banco). | Baixa | CT08, CT09 |

## 4. O que as mensagens de erro dizem

- **Erros de validação (400)** são bons: dizem o campo (`path`) e o motivo (`"Name is required"`, `"Invalid email format"`, lista de valores aceitos).
- **Erros 500** são genéricos (`"Failed to update user"`, `"Failed to fetch tasks"`) e aparecem justamente onde o problema é do usuário (id ou filtro errado) — o cliente não consegue saber o que corrigir.
- **JSON quebrado** expõe detalhes internos do servidor (stack trace), o que não deveria chegar ao cliente.

## 5. Como reproduzir

Pela interface (http://localhost:3000): cadastrar um usuário com email repetido, criar a categoria
`work`, marcar uma tarefa como concluída e depois voltar para pendente.

Pela API (Git Bash / Postman):

```bash
curl -i -X PUT http://localhost:3001/api/users/abc123 -H "Content-Type: application/json" -d '{"name":"X"}'
curl -i "http://localhost:3001/api/tasks?status=QUALQUER"
curl -i -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d '{"name":"Joao", "email":'
```

## 6. Testes automatizados (extra)

Os mesmos cenários foram automatizados com Vitest + Supertest em `backend/tests/`
(unitários e de integração, usando um banco de teste separado). Os defeitos aparecem
como `it.fails('[BUG] ...')`: passam enquanto o bug existir e quebram quando for corrigido.

```bash
docker compose exec backend npx vitest run
# 68 passed | 8 expected fail
```
