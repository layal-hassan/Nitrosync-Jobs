import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const getEmployeesEndpoint = buildNitroSyncEndpoint('/v1/employees/get-all')

const normalizeValue = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

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
  const companyUuid = normalizeValue(relatedCompany)

  if (!companyUuid) {
    throw new Error('company_uuid is required.')
  }

  try {
    const response = await axios.post(getEmployeesEndpoint, {
      company_uuid: companyUuid,
    }, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout,
    })

    const responseCode = String(response?.data?.code ?? '').trim()
    const responseMessage = String(response?.data?.message ?? '').trim()

    if (responseCode === '0') {
      throw new Error(responseMessage || 'Failed to load employees.')
    }

    return {
      code: responseCode,
      message: responseMessage,
      data: normalizeEmployeesResponse(response),
    }
  } catch (error) {
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to load employees.'))
  }
}

export { getEmployeesEndpoint }
