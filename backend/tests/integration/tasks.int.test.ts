import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import { prisma, resetDb, seedUserAndCategory } from './helpers/db'

// Contrato API05 — PUT /api/tasks/:id (aplica RN01 e RN04), docs/especificacao.md.
// Cada teste verifica: status HTTP + corpo no formato do contrato + efeito no banco.

type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

// Cenário criado no próprio teste: um usuário, uma categoria e uma tarefa no status dado.
async function criarTarefa(status: Status) {
  const { user, category } = await seedUserAndCategory()
  return prisma.task.create({
    data: { title: 'Estudar testes', status, userId: user.id, categoryId: category.id }
  })
}

beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PUT /api/tasks/:id (API05 / RN01 / RN04)', () => {
  // Transições permitidas pela tabela da RN01 → 200 e novo status gravado
  it.each<{ de: Status; para: Status }>([
    { de: 'PENDING', para: 'IN_PROGRESS' },
    { de: 'PENDING', para: 'CANCELLED' },
    { de: 'IN_PROGRESS', para: 'COMPLETED' },
    { de: 'IN_PROGRESS', para: 'CANCELLED' }
  ])('aceita $de → $para, responde 200 e grava o novo status', async ({ de, para }) => {
    // Arrange
    const tarefa = await criarTarefa(de)

    // Act
    const res = await request(app).put(`/api/tasks/${tarefa.id}`).send({ status: para })

    // Assert: contrato
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe(para)
    // Assert: efeito no banco
    const noBanco = await prisma.task.findUnique({ where: { id: tarefa.id } })
    expect(noBanco?.status).toBe(para)
  })

  // Transições proibidas pela RN01 → 400 e tarefa inalterada
  it.each<{ de: Status; para: Status }>([
    { de: 'COMPLETED', para: 'PENDING' }, // exemplo da especificação
    { de: 'COMPLETED', para: 'IN_PROGRESS' }, // COMPLETED é final
    { de: 'CANCELLED', para: 'PENDING' }, // CANCELLED é final
    { de: 'CANCELLED', para: 'IN_PROGRESS' },
    { de: 'PENDING', para: 'COMPLETED' }, // pula IN_PROGRESS
    { de: 'IN_PROGRESS', para: 'PENDING' } // volta não listada
  ])('recusa $de → $para, responde 400 e mantém a tarefa inalterada', async ({ de, para }) => {
    // Arrange
    const tarefa = await criarTarefa(de)

    // Act
    const res = await request(app).put(`/api/tasks/${tarefa.id}`).send({ status: para })

    // Assert: contrato de erro
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(typeof res.body.error).toBe('string')
    // Assert: efeito no banco — status e dados preservados
    const noBanco = await prisma.task.findUnique({ where: { id: tarefa.id } })
    expect(noBanco?.status).toBe(de)
    expect(noBanco?.updatedAt.getTime()).toBe(tarefa.updatedAt.getTime())
  })

  it('responde 404 para tarefa inexistente', async () => {
    // Arrange: existe outra tarefa, que não deve ser afetada
    const outra = await criarTarefa('PENDING')

    // Act
    const res = await request(app)
      .put('/api/tasks/inexistente')
      .send({ status: 'IN_PROGRESS' })

    // Assert
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    const noBanco = await prisma.task.findUnique({ where: { id: outra.id } })
    expect(noBanco?.status).toBe('PENDING')
  })
})
