import { describe, it, expect } from 'vitest'
import { canDeleteCategory } from '../../src/utils/categoryRules'

// RN02 (docs/especificacao.md): uma categoria só pode ser excluída quando não
// possui nenhuma tarefa associada (tasksCount === 0). Com uma ou mais tarefas
// associadas, a exclusão é proibida.
describe('canDeleteCategory', () => {
  // Caso 1 da tabela: tasksCount 0 → true (valor-limite)
  it('permite excluir uma categoria sem tarefas', () => {
    // Arrange
    const quantidadeDeTarefas = 0

    // Act
    const resultado = canDeleteCategory(quantidadeDeTarefas)

    // Assert
    expect(resultado).toBe(true)
  })

  // Caso 2 da tabela: tasksCount 1 → false (valor-limite)
  it('impede excluir uma categoria com uma tarefa (valor-limite)', () => {
    // Arrange
    const quantidadeDeTarefas = 1

    // Act
    const resultado = canDeleteCategory(quantidadeDeTarefas)

    // Assert
    expect(resultado).toBe(false)
  })

  // Caso 3 da tabela: tasksCount 10 → false (partição "com tarefas")
  it('impede excluir uma categoria com várias tarefas', () => {
    // Arrange
    const quantidadeDeTarefas = 10

    // Act
    const resultado = canDeleteCategory(quantidadeDeTarefas)

    // Assert
    expect(resultado).toBe(false)
  })
})
