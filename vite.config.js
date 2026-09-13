import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

let config;

export default defineConfig({
  plugins: [
    {
      name: 'vite-plugin-spa-fallback',
      configResolved(cfg) {
        config = cfg
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const requestPath = req.url?.split('?')[0]
          if (config?.command === 'serve' && (requestPath === '/' || requestPath === '/index.html')) {
            try {
              const storefrontPath = path.join(process.cwd(), 'public', 'storefront.html')
              res.statusCode = 200
              res.setHeader('Content-Type', 'text/html')
              res.end(fs.readFileSync(storefrontPath, 'utf-8'))
              return
            } catch (err) {
              console.error('Failed to read storefront.html:', err)
            }
          }
          next()
        })
      }
    },
    react()
  ],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})

