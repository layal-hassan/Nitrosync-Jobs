import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const getEmployeeEndpoint = buildNitroSyncEndpoint('/v1/employees/get-one')

const normalizeValue = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

const normalizeEmployeeResponse = (response) => {
  const responseData = response?.data

  if (responseData?.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
    return responseData.data
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data[0] || null
  }

  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData) && responseData.employee_uuid) {
    return responseData
  }

  return null
}

export const getNitroSyncEmployee = async (
  { companyUuid, employeeUuid },
  { timeout = nitroSyncRequestTimeoutMs } = {},
) => {
  const normalizedCompanyUuid = normalizeValue(companyUuid)
  const normalizedEmployeeUuid = normalizeValue(employeeUuid)

  if (!normalizedCompanyUuid) {
    throw new Error('company_uuid is required.')
  }

  if (!normalizedEmployeeUuid) {
    throw new Error('employee_uuid is required.')
  }

  try {
    const response = await axios.post(getEmployeeEndpoint, {
      company_uuid: normalizedCompanyUuid,
      employee_uuid: normalizedEmployeeUuid,
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
      throw new Error(responseMessage || 'Failed to load employee.')
    }

    return {
      code: responseCode,
      message: responseMessage,
      data: normalizeEmployeeResponse(response),
    }
  } catch (error) {
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to load employee.'))
  }
}

export { getEmployeeEndpoint }
