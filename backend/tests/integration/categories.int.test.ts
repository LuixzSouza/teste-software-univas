import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

// Contratos API03 (aplica RN02) e API04 (aplica RN03) — docs/especificacao.md.
// Cada teste verifica: status HTTP + corpo no formato do contrato + efeito no banco.

beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('DELETE /api/categories/:id (API03 / RN02)', () => {
  // Caso 1 — categoria sem tarefas → 200, categoria removida
  it('exclui categoria sem tarefas, responde 200 e remove do banco', async () => {
    // Arrange
    const categoria = await prisma.category.create({ data: { name: 'estudos' } })

    // Act
    const res = await request(app).delete(`/api/categories/${categoria.id}`)

    // Assert: contrato
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    // Assert: efeito no banco
    expect(await prisma.category.findUnique({ where: { id: categoria.id } })).toBeNull()
  })

  // Caso 2 — categoria com 1 tarefa (valor-limite da RN02) → 400, nada removido
  it('recusa excluir categoria com 1 tarefa, responde 400 e mantém categoria e tarefa', async () => {
    // Arrange
    const { user, category } = await seedUserAndCategory()
    const tarefa = await prisma.task.create({
      data: { title: 'Relatório', userId: user.id, categoryId: category.id }
    })

    // Act
    const res = await request(app).delete(`/api/categories/${category.id}`)

    // Assert: contrato de erro
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(typeof res.body.error).toBe('string')
    // Assert: efeito no banco — nada foi apagado
    expect(await prisma.category.findUnique({ where: { id: category.id } })).not.toBeNull()
    expect(await prisma.task.findUnique({ where: { id: tarefa.id } })).not.toBeNull()
  })

  // Caso 3 — categoria com 2 tarefas ("uma ou mais") → 400, nada removido
  it('recusa excluir categoria com 2 tarefas e mantém as duas tarefas', async () => {
    // Arrange
    const { user, category } = await seedUserAndCategory()
    await prisma.task.createMany({
      data: [
        { title: 'Tarefa A', userId: user.id, categoryId: category.id },
        { title: 'Tarefa B', userId: user.id, categoryId: category.id }
      ]
    })

    // Act
    const res = await request(app).delete(`/api/categories/${category.id}`)

    // Assert
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(await prisma.category.count()).toBe(1)
    expect(await prisma.task.count({ where: { categoryId: category.id } })).toBe(2)
  })

  // Caso 4 — categoria inexistente → 404, banco inalterado
  it('responde 404 para categoria inexistente sem alterar o banco', async () => {
    // Arrange: existe outra categoria, que não deve ser afetada
    await prisma.category.create({ data: { name: 'casa' } })

    // Act
    const res = await request(app).delete('/api/categories/inexistente')

    // Assert
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(await prisma.category.count()).toBe(1)
  })
})

describe('POST /api/categories (API04 / RN03)', () => {
  // Caso 1 — banco vazio, nome inédito → 201, categoria criada
  it('cria categoria com nome inédito, responde 201 e grava no banco', async () => {
    // Act
    const res = await request(app).post('/api/categories').send({ name: 'Trabalho' })

    // Assert: contrato
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.data.id).toBe('string')
    // Assert: efeito no banco
    expect(await prisma.category.count()).toBe(1)
    expect(await prisma.category.findUnique({ where: { id: res.body.data.id } })).not.toBeNull()
  })

  // Caso 2 — já existe outra categoria, nome diferente → 201, passam a existir 2
  it('cria categoria quando o nome normalizado é diferente dos existentes', async () => {
    // Arrange
    await prisma.category.create({ data: { name: 'trabalho' } })

    // Act
    const res = await request(app).post('/api/categories').send({ name: 'Trabalhos' })

    // Assert
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(await prisma.category.count()).toBe(2)
  })

  // Casos 3 a 5 — nome que, após RN03, coincide com um existente → 409, nada criado
  it.each([
    { existente: ' trabalho ', enviado: 'Trabalho', regra: 'exemplo da especificação' },
    { existente: 'trabalho', enviado: '  TRABALHO  ', regra: 'trim + minúsculas' },
    {
      existente: 'trabalho da faculdade',
      enviado: '  Trabalho   da\tFaculdade ',
      regra: 'espaços internos e tabulação'
    }
  ])(
    'responde 409 ao enviar "$enviado" quando já existe "$existente" ($regra)',
    async ({ existente, enviado }) => {
      // Arrange
      await prisma.category.create({ data: { name: existente } })

      // Act
      const res = await request(app).post('/api/categories').send({ name: enviado })

      // Assert: contrato de erro + nenhuma categoria criada
      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
      expect(typeof res.body.error).toBe('string')
      expect(await prisma.category.count()).toBe(1)
    }
  )
})
