import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  plugins: [nitro(), react(), tailwindcss()],
  server: { port: 5177 },
  environments: {
    client: {
      build: { rollupOptions: { input: './src/entry-client.tsx' } },
    },
  },
})
