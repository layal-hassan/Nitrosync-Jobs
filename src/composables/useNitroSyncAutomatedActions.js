import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const automatedActionsCreateEndpoint = buildNitroSyncEndpoint('/v1/automated-actions/create')
const automatedActionsUpdateEndpoint = buildNitroSyncEndpoint('/v1/automated-actions/update')
const automatedActionsDeleteEndpoint = buildNitroSyncEndpoint('/v1/automated-actions/delete')
const automatedActionsGetAllEndpoint = buildNitroSyncEndpoint('/v1/automated-actions/get-all')
const automatedActionsGetOneEndpoint = buildNitroSyncEndpoint('/v1/automated-actions/get-one')

const normalizeRows = (response) => {
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : []

  return rows
    .map((item) => ({
      automated_action_uuid: String(item?.automated_action_uuid ?? item?.uuid ?? '').trim(),
      condition: String(item?.condition ?? '').trim(),
      related_company: String(item?.related_company ?? '').trim(),
      assigned_recruiter: String(item?.assigned_recruiter ?? '').trim(),
      assign_message: String(item?.assign_message ?? '').trim(),
      actions: Array.isArray(item?.actions)
        ? item.actions.map((action) => String(action).trim()).filter(Boolean)
        : [],
      raw: item,
    }))
    .filter((item) => item.automated_action_uuid)
}

export const fetchNitroSyncAutomatedActions = async (relatedCompany, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(
    automatedActionsGetAllEndpoint,
    {
      related_company: String(relatedCompany || '').trim(),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    },
  )

  return normalizeRows(response)
}

export const fetchNitroSyncAutomatedAction = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(automatedActionsGetOneEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  const rows = normalizeRows(response)
  return rows[0] || null
}

export const createNitroSyncAutomatedAction = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(automatedActionsCreateEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const updateNitroSyncAutomatedAction = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(automatedActionsUpdateEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export const deleteNitroSyncAutomatedAction = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(automatedActionsDeleteEndpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: response?.data?.data ?? null,
  }
}

export {
  automatedActionsCreateEndpoint,
  automatedActionsDeleteEndpoint,
  automatedActionsGetAllEndpoint,
  automatedActionsGetOneEndpoint,
  automatedActionsUpdateEndpoint,
}
