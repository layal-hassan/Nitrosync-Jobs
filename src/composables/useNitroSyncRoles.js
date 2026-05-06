import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const getRolesEndpoint = buildNitroSyncEndpoint('/v1/roles/get-all')

const normalizeRole = (item, index = 0) => {
  if (typeof item === 'string') {
    const value = item.trim()
    return value
      ? {
          id: value,
          label: value,
          value,
        }
      : null
  }

  const value = String(
    item?.role_id
    ?? item?.id
    ?? item?.uuid
    ?? item?.value
    ?? item?.role_name
    ?? item?.name
    ?? `role-${index}`,
  ).trim()

  const label = String(
    item?.role_name
    ?? item?.name
    ?? item?.label
    ?? value,
  ).trim()

  if (!value) return null

  return {
    id: value,
    label: label || value,
    value,
  }
}

export const fetchNitroSyncRoles = async (
  relatedCompany,
  { timeout = nitroSyncRequestTimeoutMs } = {},
) => {
  try {
    const response = await axios.post(
      getRolesEndpoint,
      {
        related_company: String(relatedCompany || '').trim(),
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout,
      },
    )

    const rows = Array.isArray(response?.data?.data)
      ? response.data.data
      : Array.isArray(response?.data)
        ? response.data
        : []

    return rows
      .map(normalizeRole)
      .filter(Boolean)
  } catch (error) {
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to load roles.'))
  }
}

export { getRolesEndpoint }
