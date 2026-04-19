import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const getEmployeesEndpoint = buildNitroSyncEndpoint('/v1/employees/get-all')

const normalizeEmployeesResponse = (response) => {
  const responseData = response?.data

  if (Array.isArray(responseData?.data)) {
    return responseData.data
  }

  if (Array.isArray(responseData)) {
    return responseData
  }

  return []
}

export const getNitroSyncEmployees = async (relatedCompany, { timeout = nitroSyncRequestTimeoutMs } = {}) => {
  const response = await axios.get(getEmployeesEndpoint, {
    params: {
      related_company: String(relatedCompany || '').trim(),
    },
    headers: {
      'Content-Type': 'application/json',
    },
    timeout,
  })

  return {
    code: response?.data?.code || '',
    message: response?.data?.message || '',
    data: normalizeEmployeesResponse(response),
  }
}

export { getEmployeesEndpoint }
