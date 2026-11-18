import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../src/index'
import { prisma, resetDatabase, createCategory, createTask } from '../helpers'

beforeEach(resetDatabase)
afterAll(() => prisma.$disconnect())

describe('GET /api/categories', () => {
  it('lista categorias com tarefas e usuários', async () => {
    const category = await createCategory({ name: 'Estudo' })
    await createTask({ categoryId: category.id })

    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(1)
    expect(res.body.data[0].tasks[0].user).toBeDefined()
  })

  it('ordena da mais recente para a mais antiga', async () => {
    await createCategory({ name: 'Primeira' })
    await createCategory({ name: 'Segunda' })
    const res = await request(app).get('/api/categories')
    expect(res.body.data.map((c: { name: string }) => c.name)).toEqual(['Segunda', 'Primeira'])
  })
})

describe('GET /api/categories/:id', () => {
  it('retorna a categoria', async () => {
    const category = await createCategory({ name: 'Casa' })
    const res = await request(app).get(`/api/categories/${category.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Casa')
  })

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/api/categories/inexistente')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/categories', () => {
  it('cria categoria com descrição', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Saúde', description: 'Academia' })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ name: 'Saúde', description: 'Academia' })
  })

  it('cria categoria sem descrição', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Lazer' })
    expect(res.status).toBe(201)
    expect(res.body.data.description).toBeNull()
  })

  it('retorna 400 sem nome', async () => {
    const res = await request(app).post('/api/categories').send({ description: 'x' })
    expect(res.status).toBe(400)
  })

  it('retorna 409 para nome duplicado', async () => {
    await createCategory({ name: 'Trabalho' })
    const res = await request(app).post('/api/categories').send({ name: 'Trabalho' })
    expect(res.status).toBe(409)
  })

  // BUG: normalizeName() existe em utils mas não é usado pelo controller,
  // então "Trabalho" e "  trabalho " viram categorias diferentes.
  it.fails('[BUG] retorna 409 para nome duplicado com caixa/espaços diferentes', async () => {
    await createCategory({ name: 'Trabalho' })
    const res = await request(app).post('/api/categories').send({ name: '  trabalho ' })
    expect(res.status).toBe(409)
  })
})

describe('PUT /api/categories/:id', () => {
  it('atualiza a descrição', async () => {
    const category = await createCategory()
    const res = await request(app).put(`/api/categories/${category.id}`).send({ description: 'Nova' })
    expect(res.status).toBe(200)
    expect(res.body.data.description).toBe('Nova')
  })

  it.fails('[BUG] retorna 404 para id inexistente', async () => {
    const res = await request(app).put('/api/categories/inexistente').send({ name: 'X' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/categories/:id', () => {
  it('exclui categoria sem tarefas', async () => {
    const category = await createCategory()
    const res = await request(app).delete(`/api/categories/${category.id}`)
    expect(res.status).toBe(200)
    expect(await prisma.category.count()).toBe(0)
  })

  it('impede excluir categoria com tarefas (regra canDeleteCategory)', async () => {
    const category = await createCategory()
    await createTask({ categoryId: category.id })

    const res = await request(app).delete(`/api/categories/${category.id}`)
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Cannot delete category with existing tasks')
    expect(await prisma.category.count()).toBe(1)
  })

  it.fails('[BUG] retorna 404 para id inexistente', async () => {
    const res = await request(app).delete('/api/categories/inexistente')
    expect(res.status).toBe(404)
  })
})
