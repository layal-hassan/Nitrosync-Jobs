import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const createCandidatesTagsEndpoint = buildNitroSyncEndpoint('/v1/candidates-tags/create')

export const createNitroSyncCandidatesTag = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(createCandidatesTagsEndpoint, payload, {
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

export { createCandidatesTagsEndpoint }
