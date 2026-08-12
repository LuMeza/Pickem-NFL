/// <reference types="vitest/config" />
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel expone el SHA del commit en build; en local (sin esa env var) usamos
// el timestamp del build como identificador. Este mismo id se embebe en el
// bundle (define, abajo) y se escribe en dist/version.json (plugin, abajo)
// para que el cliente pueda comparar "con qué versión cargué" vs "qué hay
// publicado ahora mismo" — ver useAppVersionCheck.
const buildId = process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now())

function writeVersionFile(): Plugin {
  return {
    name: 'write-version-file',
    closeBundle() {
      writeFileSync(resolve(__dirname, 'dist/version.json'), JSON.stringify({ buildId }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), writeVersionFile()],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
