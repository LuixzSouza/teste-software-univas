import { test, expect, emailUnico, unico } from './support/fixtures'

// Jornada J08 (docs/especificacao.md): tarefa concluída não volta para Pendente
// (RN01 / API05).
test.describe('J08 — Tarefa concluída', () => {
  // DEFEITO (RN01 / RN04 / API05): a alteração COMPLETED → PENDING é aceita; após
  // "Atualizar" a lista exibe PENDING. Teste mantido conforme a jornada e marcado com
  // test.fail() (regra da atividade).
  test.fail()

  test('recusa alterar COMPLETED para Pendente e mantém COMPLETED após recarregar', async ({
    page,
    dados
  }) => {
    // Arrange: tarefa concluída preparada pela API
    const titulo = unico('Tarefa J08')
    const usuario = await dados.criarUsuario({ name: 'Dono J08', email: emailUnico('j08') })
    const categoria = await dados.criarCategoria({ name: unico('cat j08') })
    await dados.criarTarefa({
      title: titulo,
      userId: usuario.id,
      categoryId: categoria.id,
      status: 'COMPLETED'
    })

    // Act: edita a tarefa e tenta mudar o status para Pendente
    await page.goto('/tasks')
    const linha = page.getByRole('row').filter({ hasText: titulo })
    await expect(linha).toContainText('COMPLETED')
    await linha.getByRole('button', { name: 'Editar' }).click()
    // Localizador ajustado na revisão: o <label>Status:</label> não está associado ao
    // <select> (defeito de acessibilidade registrado no relatório), então getByLabel não
    // o encontra. O campo é localizado pelo papel (combobox) e pela opção que o usuário vê.
    const campoStatus = page
      .getByRole('combobox')
      .filter({ has: page.getByRole('option', { name: 'Concluída' }) })
    await expect(campoStatus).toHaveValue('COMPLETED')
    await campoStatus.selectOption({ label: 'Pendente' })
    await page.getByRole('button', { name: 'Atualizar' }).click()

    // Assert: a alteração foi recusada (a J08 não exige mensagem de erro)
    await expect(page.getByRole('row').filter({ hasText: titulo })).toContainText('COMPLETED')

    // Assert: persistência — o banco continua com COMPLETED
    await page.reload()
    await expect(page.getByRole('row').filter({ hasText: titulo })).toContainText('COMPLETED')
  })
})
