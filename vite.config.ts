import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

function localSummaryApi(): Plugin {
  return {
    name: 'local-send-summary-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== '/api/send-summary') {
          next()
          return
        }

        void server
          .ssrLoadModule('/api/send-summary.ts')
          .then(async (mod) => {
            const handler = mod.default as (
              request: IncomingMessage,
              response: ServerResponse,
            ) => Promise<void>
            await handler(req, res)
          })
          .catch(() => {
            if (!res.headersSent) {
              res.statusCode = 500
              res.setHeader('content-type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: 'No se pudo enviar el resumen. Intentá de nuevo.' }))
            }
          })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localSummaryApi()],
  ssr: {
    external: ['@aws-sdk/client-ses'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
