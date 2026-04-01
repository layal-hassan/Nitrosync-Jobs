import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const getIntelligentScreenQuestionsEndpoint = buildNitroSyncEndpoint('/v1/intelligent-screen-job-questions/get-all')

const normalizeQuestionsResponse = (response) => {
  const responseData = response?.data

  if (Array.isArray(responseData?.data)) {
    return responseData.data
  }

  if (Array.isArray(responseData)) {
    return responseData
  }

  return []
}

export const getNitroSyncIntelligentScreenQuestions = async (
  { relatedCompany, jobId },
  { timeout = nitroSyncRequestTimeoutMs } = {},
) => {
  const response = await axios.post(
    getIntelligentScreenQuestionsEndpoint,
    {
      related_company: String(relatedCompany || '').trim(),
      job_uuid: String(jobId || '').trim(),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    },
  )

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: normalizeQuestionsResponse(response),
  }
}

export { getIntelligentScreenQuestionsEndpoint }
