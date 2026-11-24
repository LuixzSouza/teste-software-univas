import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import Users from '../../src/components/Users'
import { server } from '../msw/server'

// Requisitos RF08 e RF09 + contratos API01 e API02 (docs/especificacao.md).
// O componente faz requisições HTTP reais (Axios); o MSW responde no lugar do
// backend, sempre no formato do contrato ({ success, data } / { success, error }).

// Desmonta o componente após cada teste (sem globals, a Testing Library não o faz sozinha).
afterEach(() => cleanup())

type UsuarioApi = {
  id: string
  name: string
  email: string
  createdAt: string
  tasks: unknown[]
}

const ANA: UsuarioApi = {
  id: 'u1',
  name: 'Ana Souza',
  email: 'ana@email.com',
  createdAt: '2026-11-01T10:00:00.000Z',
  tasks: []
}

// "Banco" em memória do handler: GET devolve o conteúdo atual (contrato API02).
function registrarGetUsers(usuarios: UsuarioApi[]) {
  const chamadas = { get: 0 }
  server.use(
    http.get('*/api/users', () => {
      chamadas.get++
      return HttpResponse.json({ success: true, count: usuarios.length, data: [...usuarios] })
    })
  )
  return chamadas
}

// Abre o formulário, preenche Nome e Email e clica em "Criar".
async function criarUsuarioPelaTela(nome: string, email: string) {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'Adicionar Usuário' }))
  await user.type(screen.getByLabelText('Nome:'), nome)
  await user.type(screen.getByLabelText('Email:'), email)
  await user.click(screen.getByRole('button', { name: 'Criar' }))
}

describe('Users + API — criação de usuário (RF08 / API01)', () => {
  it('envia ao POST /api/users exatamente o nome e o email digitados', async () => {
    // Arrange
    const usuarios = [ANA]
    registrarGetUsers(usuarios)
    let corpoRecebido: unknown = null
    server.use(
      http.post('*/api/users', async ({ request }) => {
        corpoRecebido = await request.json()
        const novo = { ...ANA, id: 'u2', name: 'Bruno Lima', email: 'bruno@email.com' }
        usuarios.unshift(novo)
        return HttpResponse.json({ success: true, data: novo }, { status: 201 })
      })
    )
    render(<Users />)

    // Act
    await criarUsuarioPelaTela('Bruno Lima', 'bruno@email.com')

    // Assert: o corpo da requisição HTTP é o que o usuário digitou
    await screen.findByText('Bruno Lima')
    expect(corpoRecebido).toEqual({ name: 'Bruno Lima', email: 'bruno@email.com' })
  })

  it('após o 201, fecha o formulário e a lista recarregada exibe o novo usuário', async () => {
    // Arrange: lista inicial só com a Ana; o POST acrescenta o Bruno ao "banco"
    const usuarios = [ANA]
    const chamadas = registrarGetUsers(usuarios)
    server.use(
      http.post('*/api/users', async ({ request }) => {
        const body = (await request.json()) as { name: string; email: string }
        const novo = { ...body, id: 'u2', createdAt: '2026-11-02T10:00:00.000Z', tasks: [] }
        usuarios.unshift(novo)
        return HttpResponse.json({ success: true, data: novo }, { status: 201 })
      })
    )
    render(<Users />)
    await screen.findByText('Ana Souza')

    // Act
    await criarUsuarioPelaTela('Bruno Lima', 'bruno@email.com')

    // Assert: a lista foi buscada de novo e mostra o novo usuário em sua linha
    const linha = (await screen.findByText('Bruno Lima')).closest('tr')!
    expect(within(linha).getByText('bruno@email.com')).toBeInTheDocument()
    expect(within(linha).getByText('0')).toBeInTheDocument()
    expect(chamadas.get).toBe(2)
    // Assert: o formulário foi fechado
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Nome:')).not.toBeInTheDocument()
  })
})

describe('Users + API — email repetido (RF09 / API01 409)', () => {
  // Handler: POST responde 409 no formato de erro do contrato.
  function registrarConflito() {
    registrarGetUsers([ANA])
    server.use(
      http.post('*/api/users', () =>
        HttpResponse.json({ success: false, error: 'Email já cadastrado' }, { status: 409 })
      )
    )
  }

  // DEFEITO: o componente exibe a mensagem genérica "Erro ao salvar usuário"
  // em vez de "Email já cadastrado" exigida pela RF09. Teste mantido conforme a
  // especificação e marcado com it.fails (regra da atividade).
  it.fails('exibe a mensagem "Email já cadastrado" quando a API responde 409', async () => {
    // Arrange
    registrarConflito()
    render(<Users />)

    // Act
    await criarUsuarioPelaTela('Outra Ana', 'ana@email.com')

    // Assert
    expect(await screen.findByText('Email já cadastrado')).toBeInTheDocument()
  })

  it('mantém o formulário aberto com os dados digitados após o 409', async () => {
    // Arrange
    registrarConflito()
    render(<Users />)

    // Act
    await criarUsuarioPelaTela('Outra Ana', 'ana@email.com')

    // Assert: espera a resposta ser tratada (aparece alguma mensagem de erro)
    await screen.findByRole('button', { name: 'Criar' })
    await screen.findByText(/erro|já cadastrado/i)
    expect(screen.getByLabelText('Nome:')).toHaveValue('Outra Ana')
    expect(screen.getByLabelText('Email:')).toHaveValue('ana@email.com')
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
  })
})
