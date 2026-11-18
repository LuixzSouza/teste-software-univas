import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/index'
import { prisma, resetDatabase, createUser, createTask } from '../helpers'

beforeEach(resetDatabase)
afterAll(() => prisma.$disconnect())

describe('GET /health', () => {
  it('responde OK', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('OK')
  })
})

describe('Rota inexistente', () => {
  it('retorna 404', async () => {
    const res = await request(app).get('/api/nao-existe')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe('GET /api/users', () => {
  it('retorna lista vazia quando não há usuários', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, count: 0, data: [] })
  })

  it('lista usuários com suas tarefas', async () => {
    const user = await createUser({ name: 'Ana' })
    await createTask({ userId: user.id })

    const res = await request(app).get('/api/users')
    expect(res.body.count).toBe(1)
    expect(res.body.data[0].name).toBe('Ana')
    expect(res.body.data[0].tasks).toHaveLength(1)
    expect(res.body.data[0].tasks[0].category).toBeDefined()
  })
})

describe('GET /api/users/:id', () => {
  it('retorna o usuário', async () => {
    const user = await createUser()
    const res = await request(app).get(`/api/users/${user.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(user.email)
  })

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/api/users/inexistente')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/users', () => {
  it('cria usuário válido', async () => {
    const res = await request(app).post('/api/users').send({ name: 'Bia', email: 'bia@test.com' })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ name: 'Bia', email: 'bia@test.com', tasks: [] })
    expect(await prisma.user.count()).toBe(1)
  })

  it.each([
    [{ email: 'a@test.com' }, 'sem nome'],
    [{ name: '', email: 'a@test.com' }, 'nome vazio'],
    [{ name: 'A' }, 'sem email'],
    [{ name: 'A', email: 'invalido' }, 'email inválido']
  ])('retorna 400 para %o (%s)', async (body) => {
    const res = await request(app).post('/api/users').send(body)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation error')
    expect(await prisma.user.count()).toBe(0)
  })

  it('retorna 409 para email duplicado', async () => {
    await createUser({ email: 'dup@test.com' })
    const res = await request(app).post('/api/users').send({ name: 'X', email: 'dup@test.com' })
    expect(res.status).toBe(409)
  })
})

describe('PUT /api/users/:id', () => {
  it('atualiza o nome', async () => {
    const user = await createUser()
    const res = await request(app).put(`/api/users/${user.id}`).send({ name: 'Novo Nome' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Novo Nome')
  })

  it('retorna 400 para email inválido', async () => {
    const user = await createUser()
    const res = await request(app).put(`/api/users/${user.id}`).send({ email: 'x' })
    expect(res.status).toBe(400)
  })

  // BUG: o controller procura "Record to update not found" na mensagem,
  // mas o Prisma 6 usa outro texto (código P2025) -> cai no 500.
  it.fails('[BUG] retorna 404 para id inexistente', async () => {
    const res = await request(app).put('/api/users/inexistente').send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/users/:id', () => {
  it('exclui o usuário e suas tarefas (cascade)', async () => {
    const user = await createUser()
    await createTask({ userId: user.id })

    const res = await request(app).delete(`/api/users/${user.id}`)
    expect(res.status).toBe(200)
    expect(await prisma.user.count()).toBe(0)
    expect(await prisma.task.count()).toBe(0)
  })

  it.fails('[BUG] retorna 404 para id inexistente', async () => {
    const res = await request(app).delete('/api/users/inexistente')
    expect(res.status).toBe(404)
  })
})
