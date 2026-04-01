import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const createCandidatesAssignEndpoint = buildNitroSyncEndpoint('/v1/candidates-assigns/create')

export const createNitroSyncCandidatesAssign = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(createCandidatesAssignEndpoint, payload, {
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

export { createCandidatesAssignEndpoint }
