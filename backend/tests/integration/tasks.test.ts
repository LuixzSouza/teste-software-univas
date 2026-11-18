import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/index'
import { prisma, resetDatabase, createUser, createCategory, createTask } from '../helpers'

beforeEach(resetDatabase)
afterAll(() => prisma.$disconnect())

describe('GET /api/tasks', () => {
  it('lista tarefas com usuário e categoria', async () => {
    await createTask({ title: 'Ler livro' })
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(1)
    expect(res.body.data[0]).toMatchObject({ title: 'Ler livro', status: 'PENDING', priority: 'MEDIUM' })
    expect(res.body.data[0].user).toBeDefined()
    expect(res.body.data[0].category).toBeDefined()
  })

  describe('filtros', () => {
    it('por status', async () => {
      const user = await createUser()
      const category = await createCategory()
      const base = { userId: user.id, categoryId: category.id }
      await createTask({ ...base, status: 'PENDING' })
      await createTask({ ...base, status: 'COMPLETED' })
      await createTask({ ...base, status: 'COMPLETED' })

      const res = await request(app).get('/api/tasks?status=COMPLETED')
      expect(res.body.count).toBe(2)
      expect(res.body.data.every((t: { status: string }) => t.status === 'COMPLETED')).toBe(true)
    })

    it('por prioridade', async () => {
      await createTask({ priority: 'URGENT' })
      await createTask({ priority: 'LOW' })
      const res = await request(app).get('/api/tasks?priority=URGENT')
      expect(res.body.count).toBe(1)
    })

    it('por usuário e categoria combinados', async () => {
      const ana = await createUser()
      const bia = await createUser()
      const cat = await createCategory()
      await createTask({ userId: ana.id, categoryId: cat.id })
      await createTask({ userId: ana.id })
      await createTask({ userId: bia.id, categoryId: cat.id })

      const res = await request(app).get(`/api/tasks?userId=${ana.id}&categoryId=${cat.id}`)
      expect(res.body.count).toBe(1)
    })
  })
})

describe('GET /api/tasks/:id', () => {
  it('retorna a tarefa', async () => {
    const task = await createTask()
    const res = await request(app).get(`/api/tasks/${task.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(task.id)
  })

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/api/tasks/inexistente')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/tasks', () => {
  it('cria tarefa com valores padrão', async () => {
    const user = await createUser()
    const category = await createCategory()
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Nova', userId: user.id, categoryId: category.id })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ title: 'Nova', status: 'PENDING', priority: 'MEDIUM' })
    expect(res.body.data.user.id).toBe(user.id)
  })

  it('retorna 400 sem título', async () => {
    const user = await createUser()
    const category = await createCategory()
    const res = await request(app).post('/api/tasks').send({ userId: user.id, categoryId: category.id })
    expect(res.status).toBe(400)
  })

  it('retorna 400 para prioridade inválida', async () => {
    const user = await createUser()
    const category = await createCategory()
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'X', priority: 'SUPER', userId: user.id, categoryId: category.id })
    expect(res.status).toBe(400)
  })

  it('retorna 404 quando o usuário não existe', async () => {
    const category = await createCategory()
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'X', userId: 'inexistente', categoryId: category.id })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('User not found')
  })

  it('retorna 404 quando a categoria não existe', async () => {
    const user = await createUser()
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'X', userId: user.id, categoryId: 'inexistente' })
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Category not found')
  })
})

describe('PUT /api/tasks/:id', () => {
  it('permite transição válida PENDING -> IN_PROGRESS', async () => {
    const task = await createTask({ status: 'PENDING' })
    const res = await request(app).put(`/api/tasks/${task.id}`).send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('IN_PROGRESS')
  })

  it('retorna 404 ao trocar para usuário inexistente', async () => {
    const task = await createTask()
    const res = await request(app).put(`/api/tasks/${task.id}`).send({ userId: 'inexistente' })
    expect(res.status).toBe(404)
  })

  // BUG: canTransition() existe em utils mas não é usado pelo controller,
  // então uma tarefa concluída pode voltar para pendente.
  it.fails('[BUG] bloqueia transição inválida COMPLETED -> PENDING', async () => {
    const task = await createTask({ status: 'COMPLETED' })
    const res = await request(app).put(`/api/tasks/${task.id}`).send({ status: 'PENDING' })
    expect(res.status).toBe(400)
  })

  it.fails('[BUG] retorna 404 para id inexistente', async () => {
    const res = await request(app).put('/api/tasks/inexistente').send({ title: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/tasks/:id', () => {
  it('exclui a tarefa sem afetar usuário e categoria', async () => {
    const task = await createTask()
    const res = await request(app).delete(`/api/tasks/${task.id}`)
    expect(res.status).toBe(200)
    expect(await prisma.task.count()).toBe(0)
    expect(await prisma.user.count()).toBe(1)
    expect(await prisma.category.count()).toBe(1)
  })

  it.fails('[BUG] retorna 404 para id inexistente', async () => {
    const res = await request(app).delete('/api/tasks/inexistente')
    expect(res.status).toBe(404)
  })
})
