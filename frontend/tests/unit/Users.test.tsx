import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Users from '../../src/components/Users'
import { api } from '../../src/services/api'

// Testes do componente Users derivados de docs/especificacao.md (RF01, RF02, RF04–RF07).
// RF03 é coberto pelo teste de referência Users.error.test.tsx.
// A API é isolada com vi.spyOn: nenhuma requisição real é enviada.

// Sem `globals: true` no Vitest, a Testing Library não desmonta o componente
// automaticamente entre os testes; a limpeza é feita aqui.
afterEach(() => {
  cleanup()
})

type UsuarioFake = {
  id: string
  name: string
  email: string
  createdAt: string
  tasks?: { id: string }[]
}

const ana: UsuarioFake = { id: '1', name: 'Ana', email: 'ana@email.com', createdAt: '2026-11-01' }

function mockListaDeUsuarios(usuarios: UsuarioFake[]) {
  return vi.spyOn(api, 'get').mockResolvedValue({ data: { data: usuarios } } as any)
}

// Renderiza com a API devolvendo a lista e aguarda o fim do carregamento
async function renderizarCarregado(usuarios: UsuarioFake[] = []) {
  mockListaDeUsuarios(usuarios)
  const user = userEvent.setup()
  render(<Users />)
  await screen.findByRole('button', { name: 'Adicionar Usuário' })
  return user
}

async function abrirFormulario(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Adicionar Usuário' }))
}

// Linhas de dados da tabela (a primeira linha é o cabeçalho)
function linhasDeDados() {
  return screen.getAllByRole('row').slice(1)
}

describe('Users — carregamento (RF01)', () => {
  it('exibe "Carregando usuários..." enquanto a lista é carregada', () => {
    // Arrange: a promessa nunca se resolve, mantendo o estado de carregamento
    vi.spyOn(api, 'get').mockReturnValue(new Promise(() => {}))

    // Act
    render(<Users />)

    // Assert
    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument()
  })

  it('remove o texto de carregamento após a lista ser carregada', async () => {
    await renderizarCarregado([ana])

    expect(screen.queryByText('Carregando usuários...')).not.toBeInTheDocument()
  })
})

describe('Users — listagem (RF02)', () => {
  it('exibe uma linha na tabela para cada usuário', async () => {
    await renderizarCarregado([
      ana,
      { id: '2', name: 'Bruno', email: 'bruno@email.com', createdAt: '2026-11-02' },
    ])

    expect(linhasDeDados()).toHaveLength(2)
  })

  it('não exibe linhas de dados quando a lista está vazia', async () => {
    await renderizarCarregado([])

    expect(linhasDeDados()).toHaveLength(0)
  })

  it('exibe nome e email do usuário na sua linha', async () => {
    await renderizarCarregado([ana])

    const [linha] = linhasDeDados()
    expect(within(linha).getByRole('cell', { name: 'Ana' })).toBeInTheDocument()
    expect(within(linha).getByRole('cell', { name: 'ana@email.com' })).toBeInTheDocument()
  })

  it.each([
    { caso: 'sem o campo tasks', tasks: undefined, esperado: '0' },
    { caso: 'com lista de tarefas vazia', tasks: [], esperado: '0' },
    { caso: 'com 1 tarefa', tasks: [{ id: 't1' }], esperado: '1' },
    { caso: 'com 3 tarefas', tasks: [{ id: 't1' }, { id: 't2' }, { id: 't3' }], esperado: '3' },
  ])('exibe $esperado como quantidade de tarefas para usuário $caso', async ({ tasks, esperado }) => {
    await renderizarCarregado([{ ...ana, tasks }])

    const [linha] = linhasDeDados()
    expect(within(linha).getByRole('cell', { name: esperado })).toBeInTheDocument()
  })
})

describe('Users — abrir formulário (RF04)', () => {
  it('não exibe o formulário antes de clicar em "Adicionar Usuário"', async () => {
    await renderizarCarregado([])

    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })

  it('exibe o botão "Criar" ao clicar em "Adicionar Usuário"', async () => {
    const user = await renderizarCarregado([])

    await abrirFormulario(user)

    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument()
  })

  // DEFEITO RF07: rótulo não associado ao campo (ver relatório, seção 5)
  it.fails('exibe o campo Nome ao clicar em "Adicionar Usuário"', async () => {
    const user = await renderizarCarregado([])

    await abrirFormulario(user)

    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument()
  })

  // DEFEITO RF07: rótulo não associado ao campo (ver relatório, seção 5)
  it.fails('exibe o campo Email ao clicar em "Adicionar Usuário"', async () => {
    const user = await renderizarCarregado([])

    await abrirFormulario(user)

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })
})

describe('Users — cancelar formulário (RF05)', () => {
  it('fecha o formulário ao clicar em "Cancelar"', async () => {
    const user = await renderizarCarregado([])
    await abrirFormulario(user)

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })

  // DEFEITO RF07: rótulo não associado ao campo (ver relatório, seção 5)
  it.fails('limpa os campos digitados ao clicar em "Cancelar"', async () => {
    // Arrange: abre o formulário e digita nos campos
    const user = await renderizarCarregado([])
    await abrirFormulario(user)
    await user.type(screen.getByLabelText(/Nome/i), 'Carlos')
    await user.type(screen.getByLabelText(/Email/i), 'carlos@email.com')

    // Act: cancela e reabre o formulário
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await abrirFormulario(user)

    // Assert: os campos voltam vazios
    expect(screen.getByLabelText(/Nome/i)).toHaveValue('')
    expect(screen.getByLabelText(/Email/i)).toHaveValue('')
  })
})

describe('Users — editar usuário (RF06)', () => {
  it('troca o botão do formulário para "Atualizar" ao clicar em "Editar"', async () => {
    const user = await renderizarCarregado([ana])

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Criar' })).not.toBeInTheDocument()
  })

  // DEFEITO RF07: rótulo não associado ao campo (ver relatório, seção 5)
  it.fails('abre o formulário com o nome do usuário preenchido', async () => {
    const user = await renderizarCarregado([ana])

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.getByLabelText(/Nome/i)).toHaveValue('Ana')
  })

  // DEFEITO RF07: rótulo não associado ao campo (ver relatório, seção 5)
  it.fails('abre o formulário com o email do usuário preenchido', async () => {
    const user = await renderizarCarregado([ana])

    await user.click(screen.getByRole('button', { name: 'Editar' }))

    expect(screen.getByLabelText(/Email/i)).toHaveValue('ana@email.com')
  })

  // DEFEITO RF07: rótulo não associado ao campo (ver relatório, seção 5)
  it.fails('preenche o formulário com os dados da linha clicada, não de outra', async () => {
    // Arrange: dois usuários; o clique é na segunda linha
    const user = await renderizarCarregado([
      ana,
      { id: '2', name: 'Bruno', email: 'bruno@email.com', createdAt: '2026-11-02' },
    ])
    const linhaBruno = linhasDeDados()[1]

    // Act
    await user.click(within(linhaBruno).getByRole('button', { name: 'Editar' }))

    // Assert
    expect(screen.getByLabelText(/Nome/i)).toHaveValue('Bruno')
  })
})

describe('Users — acessibilidade do formulário (RF07)', () => {
  // DEFEITO RF07: os <label> não estão associados aos <input> (sem htmlFor/id
  // nem input dentro do label). Ver relatório, seção 5.
  it.fails.each(['Nome', 'Email'])('associa o campo %s ao seu rótulo', async (rotulo) => {
    const user = await renderizarCarregado([])
    await abrirFormulario(user)

    // getByRole com name só encontra o campo se o rótulo estiver associado a ele
    expect(screen.getByRole('textbox', { name: new RegExp(rotulo, 'i') })).toBeInTheDocument()
  })
})
