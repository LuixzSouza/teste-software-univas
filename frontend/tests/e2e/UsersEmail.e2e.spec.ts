import { test, expect, emailUnico } from './support/fixtures'

// Jornada J07 (docs/especificacao.md): email já cadastrado (RF09 / API01).
test.describe('J07 — Email já cadastrado', () => {
  // DEFEITO (o mesmo do RF09 na Aula 12): ao receber 409, a tela exibe a mensagem
  // genérica "Erro ao salvar usuário" em vez de "Email já cadastrado".
  // Teste mantido conforme a jornada e marcado com test.fail() (regra da atividade).
  test.fail()

  test('exibe "Email já cadastrado" ao cadastrar um email existente', async ({ page, dados }) => {
    // Arrange: já existe um usuário com este email
    const email = emailUnico('j07')
    await dados.criarUsuario({ name: 'Original J07', email })

    // Act: tenta cadastrar outro usuário com o mesmo email
    await page.goto('/users')
    await page.getByRole('button', { name: 'Adicionar Usuário' }).click()
    await page.getByLabel('Nome:').fill('Repetido J07')
    await page.getByLabel('Email:').fill(email)
    await page.getByRole('button', { name: 'Criar' }).click()

    // Assert
    await expect(page.getByText('Email já cadastrado')).toBeVisible()
  })
})
