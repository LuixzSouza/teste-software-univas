import { test, expect, emailUnico, unico } from './support/fixtures'

// Jornada J03 (docs/especificacao.md): edição de usuário pela interface.
test.describe('J03 — Edição de usuário', () => {
  test('altera o nome pela tela, exibe o novo nome após recarregar e o antigo some', async ({
    page,
    dados
  }) => {
    // Arrange: usuário preparado pela API, com email e nomes únicos
    const email = emailUnico('j03')
    const nomeAntigo = unico('Antigo J03')
    const nomeNovo = unico('Novo J03')
    await dados.criarUsuario({ name: nomeAntigo, email })

    // Act: o usuário edita o nome pela interface
    await page.goto('/users')
    const linha = page.getByRole('row').filter({ hasText: email })
    await linha.getByRole('button', { name: 'Editar' }).click()
    await expect(page.getByLabel('Nome:')).toHaveValue(nomeAntigo)
    await page.getByLabel('Nome:').fill(nomeNovo)
    await page.getByRole('button', { name: 'Atualizar' }).click()

    // Assert: resultado visível
    await expect(page.getByRole('button', { name: 'Atualizar' })).toBeHidden()
    await expect(page.getByRole('row').filter({ hasText: email })).toContainText(nomeNovo)
    await expect(page.getByText(nomeAntigo)).toHaveCount(0)

    // Assert: persistência
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: email })).toContainText(nomeNovo)
    await expect(page.getByText(nomeAntigo)).toHaveCount(0)
  })
})
