import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import gerarPlanoHandler from './api/gerar-plano.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env para process.env no Node do Vite
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      react(),
      {
        name: 'api-dev-routes',
        configureServer(server) {
          server.middlewares.use('/api/gerar-plano', async (req, res) => {
            try {
              await gerarPlanoHandler(req, res)
            } catch (err: any) {
              console.error('Erro no endpoint dev /api/gerar-plano:', err)
              if (!res.headersSent) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(
                  JSON.stringify({
                    error: 'Erro no servidor local ao processar /api/gerar-plano',
                    detalhes: err?.message,
                  })
                )
              }
            }
          })
        },
      },
    ],
  }
})

