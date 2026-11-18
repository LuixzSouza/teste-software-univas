import { describe, it, expect } from 'vitest'
import { canTransition, type Status } from '../../src/utils/taskRules'

// RN01 (docs/especificacao.md) — Transição de status de tarefa.
//   PENDING     → IN_PROGRESS, CANCELLED
//   IN_PROGRESS → COMPLETED, CANCELLED
//   COMPLETED   → nenhum (status final)
//   CANCELLED   → nenhum (status final)
// Qualquer transição não listada é proibida; manter o mesmo status não é transição.
describe('canTransition', () => {
  // Casos 1 a 4: partição "transições permitidas"
  describe('transições permitidas pela RN01', () => {
    // DEFEITO ENCONTRADO — viola a RN01: "Uma tarefa pendente pode ser cancelada
    // antes de ser iniciada" (PENDING → CANCELLED é permitido), mas o código
    // retorna false. O valor esperado segue a especificação e NÃO deve ser
    // alterado; it.fails registra o defeito até o código ser corrigido.
    it.fails('caso 2: permite PENDING → CANCELLED', () => {
      // Arrange
      const from: Status = 'PENDING'
      const to: Status = 'CANCELLED'

      // Act
      const resultado = canTransition(from, to)

      // Assert
      expect(resultado).toBe(true)
    })

    it.each<[number, Status, Status]>([
      [1, 'PENDING', 'IN_PROGRESS'],
      [3, 'IN_PROGRESS', 'COMPLETED'],
      [4, 'IN_PROGRESS', 'CANCELLED']
    ])('caso %i: permite %s → %s', (_caso, from, to) => {
      // Act
      const resultado = canTransition(from, to)

      // Assert
      expect(resultado).toBe(true)
    })
  })

  // Casos 5 e 6: partição "transições não listadas" (caminhos inválidos a partir de status não finais)
  describe('transições não listadas são proibidas', () => {
    it.each<[number, Status, Status]>([
      [5, 'PENDING', 'COMPLETED'],
      [6, 'IN_PROGRESS', 'PENDING']
    ])('caso %i: impede %s → %s', (_caso, from, to) => {
      expect(canTransition(from, to)).toBe(false)
    })
  })

  // Casos 7 a 10: valor-limite "mesmo status" (não é uma transição)
  describe('manter o mesmo status não é transição', () => {
    it.each<[number, Status, Status]>([
      [7, 'PENDING', 'PENDING'],
      [8, 'IN_PROGRESS', 'IN_PROGRESS'],
      [9, 'COMPLETED', 'COMPLETED'],
      [10, 'CANCELLED', 'CANCELLED']
    ])('caso %i: impede %s → %s (mesmo status)', (_caso, from, to) => {
      expect(canTransition(from, to)).toBe(false)
    })
  })

  // Casos 11 a 16: status finais não podem mudar para nenhum outro
  describe('status finais (COMPLETED e CANCELLED) não podem mudar', () => {
    it.each<[number, Status, Status]>([
      [11, 'COMPLETED', 'PENDING'],
      [12, 'COMPLETED', 'IN_PROGRESS'],
      [13, 'COMPLETED', 'CANCELLED'],
      [14, 'CANCELLED', 'PENDING'],
      [15, 'CANCELLED', 'IN_PROGRESS'],
      [16, 'CANCELLED', 'COMPLETED']
    ])('caso %i: impede %s → %s', (_caso, from, to) => {
      expect(canTransition(from, to)).toBe(false)
    })
  })
})
