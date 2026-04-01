import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const createCandidatesDisqualificantEndpoint = buildNitroSyncEndpoint('/v1/candidates-disqualificants/create')

export const createNitroSyncCandidatesDisqualificant = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(createCandidatesDisqualificantEndpoint, payload, {
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

export { createCandidatesDisqualificantEndpoint }
