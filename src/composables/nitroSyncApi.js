const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '')
const trimApiSuffix = (value) => trimTrailingSlash(value).replace(/\/api$/i, '')

const configuredApiBase = trimTrailingSlash(import.meta.env.VITE_NITROSYNC_API_BASE)
const configuredOrigin = trimApiSuffix(import.meta.env.VITE_NITROSYNC_API_ORIGIN)
const defaultOrigin = 'https://www.nitrosync.cloud'
const nitroSyncOrigin = configuredOrigin || defaultOrigin
const nitroSyncApiBase = configuredApiBase || `${nitroSyncOrigin}/api`

const configuredProxyPrefix = String(import.meta.env.VITE_NITROSYNC_PROXY_PREFIX || '/nitrosync-api').trim() || '/nitrosync-api'
const useDevProxy = import.meta.env.DEV && import.meta.env.VITE_NITROSYNC_USE_PROXY !== 'false'

const parsedTimeout = Number(import.meta.env.VITE_NITROSYNC_TIMEOUT_MS)
const nitroSyncTimeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : 15000

export const nitroSyncApiOrigin = nitroSyncOrigin
export { nitroSyncApiBase }
export const nitroSyncProxyPrefix = configuredProxyPrefix
export const nitroSyncUsesDevProxy = useDevProxy
export const nitroSyncRequestTimeoutMs = nitroSyncTimeoutMs

export const buildNitroSyncEndpoint = (path) => {
  const normalizedPath = `/${String(path || '').replace(/^\/+/, '')}`

  if (useDevProxy) {
    return `${configuredProxyPrefix}${normalizedPath}`
  }

  return `${nitroSyncApiBase}${normalizedPath}`
}

export const getNitroSyncErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ||
  error?.response?.data?.detail ||
  error?.response?.data?.msg ||
  (error?.code === 'ECONNABORTED' ? 'NitroSync API timed out.' : '') ||
  error?.message ||
  fallbackMessage
