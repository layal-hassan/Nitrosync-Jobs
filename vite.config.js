import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '')
const trimApiSuffix = (value) => trimTrailingSlash(value).replace(/\/api$/i, '')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const nitroSyncProxyPrefix = env.VITE_NITROSYNC_PROXY_PREFIX || '/nitrosync-api'
  const nitroSyncApiBase = trimTrailingSlash(env.VITE_NITROSYNC_API_BASE || '')
  const nitroSyncOrigin = trimApiSuffix(env.VITE_NITROSYNC_API_ORIGIN || '') || 'https://www.nitrosync.cloud'
  const nitroSyncProxyTarget = nitroSyncOrigin
  const nitroSyncProxyRewriteBase = nitroSyncApiBase
    ? nitroSyncApiBase.replace(new RegExp(`^${nitroSyncOrigin}`), '') || '/api'
    : '/api'

  return {
    plugins: [vue()],
    server: {
      proxy: {
        [nitroSyncProxyPrefix]: {
          target: nitroSyncProxyTarget,
          changeOrigin: true,
          secure: true,
          timeout: 15000,
          proxyTimeout: 15000,
          rewrite: (path) => path.replace(new RegExp(`^${nitroSyncProxyPrefix}`), nitroSyncProxyRewriteBase),
        },
      },
    },
  }
})
