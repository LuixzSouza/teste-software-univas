import { describe, it, expect } from 'vitest'
import { normalizeName } from '../../src/utils/normalize'

// RN03 (docs/especificacao.md) — Normalização de nomes, nesta ordem:
//   1. remove espaços em branco no início e no fim;
//   2. troca qualquer sequência de espaços internos (espaço, tab, quebra de linha) por um único espaço;
//   3. converte para minúsculas.
// Dois nomes com o mesmo resultado normalizado são duplicados.
describe('normalizeName', () => {
  it('caso 1: converte o exemplo da especificação ("  Trabalho   da  Faculdade ")', () => {
    // Arrange
    const nome = '  Trabalho   da  Faculdade '

    // Act
    const resultado = normalizeName(nome)

    // Assert
    expect(resultado).toBe('trabalho da faculdade')
  })

  it.each<[number, string, string, string]>([
    // passo 1 — bordas
    [2, 'remove espaços no início', '   estudo', 'estudo'],
    [3, 'remove espaços no fim', 'estudo   ', 'estudo'],
    [4, 'remove tab e quebra de linha nas bordas', '\t\nestudo\n\t', 'estudo'],
    // passo 2 — espaços internos
    [5, 'mantém um único espaço interno (valor-limite: 1 espaço)', 'casa nova', 'casa nova'],
    [6, 'reduz dois espaços internos a um (valor-limite: 2 espaços)', 'casa  nova', 'casa nova'],
    [7, 'troca tab interno por um espaço', 'casa\tnova', 'casa nova'],
    [8, 'troca quebra de linha interna por um espaço', 'casa\nnova', 'casa nova'],
    [9, 'reduz sequência mista de espaço, tab e quebra de linha a um espaço', 'casa \t\n nova', 'casa nova'],
    // passo 3 — minúsculas
    [10, 'converte maiúsculas para minúsculas', 'TRABALHO', 'trabalho'],
    [11, 'converte letras acentuadas maiúsculas', 'ÉPOCA ÁGIL', 'época ágil'],
    [12, 'mantém um nome já normalizado', 'trabalho da faculdade', 'trabalho da faculdade'],
    // valores-limite da entrada
    [13, 'retorna vazio para string vazia', '', ''],
    [14, 'retorna vazio para string só com espaços em branco', ' \t\n ', ''],
    [15, 'mantém nome de um único caractere', 'A', 'a']
  ])('caso %i: %s', (_caso, _descricao, entrada, esperado) => {
    expect(normalizeName(entrada)).toBe(esperado)
  })

  it('caso 16: nomes que diferem só em espaços e maiúsculas são duplicados', () => {
    // Arrange
    const nomeA = 'Trabalho da Faculdade'
    const nomeB = '  trabalho\tDA   faculdade\n'

    // Act / Assert
    expect(normalizeName(nomeA)).toBe(normalizeName(nomeB))
  })

  it('caso 17: nomes com palavras diferentes não são duplicados', () => {
    expect(normalizeName('Trabalho')).not.toBe(normalizeName('Trabalhos'))
  })
})
