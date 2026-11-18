import { defineConfig } from 'vitest/config'

// Banco separado para os testes de integração (nunca usa o banco de desenvolvimento)
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres123@postgres:5432/teste_software_test_db'

// Testes de integração precisam do Postgres no ar: só rodam com INTEGRATION=1.
// Sem a variável, `npm run test` roda apenas os testes unitários.
const RUN_INTEGRATION = process.env.INTEGRATION === '1'

export default defineConfig({
  test: {
    // Opções comuns, herdadas pelos projetos via `extends: true`
    environment: 'node',
    restoreMocks: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      reporter: ['text', 'html']
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts']
        }
      },
      ...(RUN_INTEGRATION ? [{
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/setup.ts'],
          // Os arquivos compartilham o mesmo banco: rodam em sequência
          fileParallelism: false,
          env: {
            DATABASE_URL: TEST_DATABASE_URL,
            NODE_ENV: 'test',
            // index.ts chama app.listen(): porta 0 = porta livre aleatória
            PORT: '0'
          }
        }
      }] : [])
    ]
  }
})
