import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const nitroSyncProxyPrefix = process.env.VITE_NITROSYNC_PROXY_PREFIX || '/nitrosync-api'
const nitroSyncProxyTarget = process.env.VITE_NITROSYNC_API_ORIGIN || 'https://www.nitrosync.cloud'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      [nitroSyncProxyPrefix]: {
        target: nitroSyncProxyTarget,
        changeOrigin: true,
        secure: true,
        timeout: 15000,
        proxyTimeout: 15000,
        rewrite: (path) => path.replace(new RegExp(`^${nitroSyncProxyPrefix}`), '/api'),
      },
    },
  },
})
