import { execSync } from 'node:child_process'

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres123@postgres:5432/teste_software_test_db'

// Executado uma vez antes dos testes de integração:
// cria/sincroniza o schema no banco de teste (zerando os dados).
export default function setup() {
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit'
  })
}
