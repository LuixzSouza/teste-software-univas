import { test, expect, emailUnico } from './support/fixtures'

// Jornada J04 (docs/especificacao.md): exclusão de usuário pela interface.
test.describe('J04 — Exclusão de usuário', () => {
  test('caso 1: excluir e confirmar remove o usuário, inclusive após recarregar', async ({
    page,
    dados
  }) => {
    // Arrange
    const email = emailUnico('j04c1')
    await dados.criarUsuario({ name: 'Para Excluir', email })
    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    await expect(linha).toBeVisible()

    // Act: confirma o diálogo window.confirm
    page.once('dialog', (dialogo) => dialogo.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    // Assert: linha removida da lista
    await expect(page.getByRole('row').filter({ hasText: email })).toHaveCount(0)

    // Assert: persistência
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Usuários', level: 2 })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: email })).toHaveCount(0)
  })

  test('caso 2: excluir e cancelar mantém o usuário, inclusive após recarregar', async ({
    page,
    dados
  }) => {
    // Arrange
    const email = emailUnico('j04c2')
    await dados.criarUsuario({ name: 'Para Manter', email })
    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    await expect(linha).toBeVisible()

    // Act: cancela o diálogo window.confirm
    let dialogoExibido = false
    page.once('dialog', (dialogo) => {
      dialogoExibido = true
      return dialogo.dismiss()
    })
    await linha.getByRole('button', { name: 'Excluir' }).click()

    // Assert: o diálogo apareceu e a linha permanece
    await expect.poll(() => dialogoExibido).toBe(true)
    await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible()

    // Assert: persistência
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: email })).toContainText('Para Manter')
  })
})
