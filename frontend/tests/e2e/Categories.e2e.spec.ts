import { test, expect, emailUnico, unico } from './support/fixtures'

// Jornadas J05 (cadastro, edição e exclusão de categoria) e J06 (categoria em uso).
// Nomes em minúsculas: a RN03 normaliza o nome da categoria.

test.describe('J05 — Cadastro, edição e exclusão de categoria', () => {
  // DEFEITO (acessibilidade, análogo ao RF07): na tela de Categorias, <label>Nome:</label>
  // e <label>Descrição:</label> não estão associados aos campos (sem htmlFor/id), e
  // getByLabel('Nome:') não encontra o campo. Testes mantidos conforme a jornada e
  // marcados com test.fail() (regra da atividade).
  test('cadastra pela tela e a categoria continua na lista após recarregar', async ({
    page,
    dados
  }) => {
    test.fail()
    const nome = unico('cat j05 criar')

    // Act
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Adicionar Categoria' }).click()
    await expect(page.getByLabel('Nome:')).toBeVisible()
    await page.getByLabel('Nome:').fill(nome)
    await page.getByLabel('Descrição:').fill('Criada pelo teste E2E')
    await page.getByRole('button', { name: 'Criar' }).click()
    await dados.registrarCategoriaPorNome(nome)

    // Assert: formulário fechado e categoria na lista
    await expect(page.getByRole('button', { name: 'Criar' })).toBeHidden()
    await expect(page.getByRole('row').filter({ hasText: nome })).toContainText(
      'Criada pelo teste E2E'
    )

    // Assert: persistência
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toBeVisible()
  })

  test('edita o nome pela tela, exibe o novo após recarregar e o antigo some', async ({
    page,
    dados
  }) => {
    test.fail()
    // Arrange
    const nomeAntigo = unico('cat j05 antigo')
    const nomeNovo = unico('cat j05 novo')
    await dados.criarCategoria({ name: nomeAntigo })

    // Act
    await page.goto('/categories')
    await page
      .getByRole('row')
      .filter({ hasText: nomeAntigo })
      .getByRole('button', { name: 'Editar' })
      .click()
    await expect(page.getByLabel('Nome:')).toHaveValue(nomeAntigo)
    await page.getByLabel('Nome:').fill(nomeNovo)
    await page.getByRole('button', { name: 'Atualizar' }).click()

    // Assert
    await expect(page.getByRole('row').filter({ hasText: nomeNovo })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: nomeAntigo })).toHaveCount(0)

    // Assert: persistência
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nomeNovo })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: nomeAntigo })).toHaveCount(0)
  })

  test('excluir e confirmar remove a categoria, inclusive após recarregar', async ({
    page,
    dados
  }) => {
    // Arrange
    const nome = unico('cat j05 excluir')
    await dados.criarCategoria({ name: nome })
    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nome })
    await expect(linha).toBeVisible()

    // Act
    page.once('dialog', (dialogo) => dialogo.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    // Assert
    await expect(page.getByRole('row').filter({ hasText: nome })).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Categorias', level: 2 })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: nome })).toHaveCount(0)
  })

  test('excluir e cancelar mantém a categoria, inclusive após recarregar', async ({
    page,
    dados
  }) => {
    // Arrange
    const nome = unico('cat j05 manter')
    await dados.criarCategoria({ name: nome })
    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nome })
    await expect(linha).toBeVisible()

    // Act
    let dialogoExibido = false
    page.once('dialog', (dialogo) => {
      dialogoExibido = true
      return dialogo.dismiss()
    })
    await linha.getByRole('button', { name: 'Excluir' }).click()

    // Assert
    await expect.poll(() => dialogoExibido).toBe(true)
    await expect(page.getByRole('row').filter({ hasText: nome })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toBeVisible()
  })
})

test.describe('J06 — Categoria em uso', () => {
  test('exibe erro ao excluir categoria com tarefa e ela permanece após recarregar', async ({
    page,
    dados
  }) => {
    // Arrange: categoria com 1 tarefa (RN02 / API03)
    const nome = unico('cat j06')
    const usuario = await dados.criarUsuario({ name: 'Dono J06', email: emailUnico('j06') })
    const categoria = await dados.criarCategoria({ name: nome })
    await dados.criarTarefa({
      title: unico('Tarefa J06'),
      userId: usuario.id,
      categoryId: categoria.id
    })
    await page.goto('/categories')
    const linha = page.getByRole('row').filter({ hasText: nome })
    await expect(linha).toBeVisible()

    // Act
    page.once('dialog', (dialogo) => dialogo.accept())
    await linha.getByRole('button', { name: 'Excluir' }).click()

    // Assert: mensagem de erro visível e categoria mantida
    await expect(page.getByText(/erro/i)).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: nome })).toBeVisible()

    // Assert: persistência
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: nome })).toBeVisible()
  })
})
