import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const changeJobStageEndpoint = buildNitroSyncEndpoint('/v1/candidates/change-job-stage')
const changeEvaluationEndpoint = buildNitroSyncEndpoint('/v1/candidates/change-evaluation')

export const changeNitroSyncCandidatesJobStage = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(changeJobStageEndpoint, payload, {
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

export const changeNitroSyncCandidatesEvaluation = async (payload, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.post(changeEvaluationEndpoint, payload, {
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

export { changeEvaluationEndpoint, changeJobStageEndpoint }
