import { prisma } from '../src/index'

export async function resetDatabase() {
  await prisma.task.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
}

export function createUser(overrides: Partial<{ name: string; email: string }> = {}) {
  return prisma.user.create({
    data: {
      name: 'Usuário Teste',
      email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      ...overrides
    }
  })
}

export function createCategory(overrides: Partial<{ name: string; description: string }> = {}) {
  return prisma.category.create({
    data: {
      name: `Categoria ${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...overrides
    }
  })
}

export async function createTask(
  overrides: Partial<{
    title: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    userId: string
    categoryId: string
  }> = {}
) {
  const userId = overrides.userId ?? (await createUser()).id
  const categoryId = overrides.categoryId ?? (await createCategory()).id
  return prisma.task.create({
    data: { title: 'Tarefa Teste', ...overrides, userId, categoryId }
  })
}

export { prisma }
