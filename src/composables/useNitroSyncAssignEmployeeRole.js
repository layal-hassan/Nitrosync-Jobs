import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const assignEmployeeRoleEndpoint = buildNitroSyncEndpoint('/v1/employees/assign-role')

const normalizeValue = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

export const assignNitroSyncEmployeeRole = async (
  payload,
  {
    timeout = nitroSyncRequestTimeoutMs,
    relatedCompany,
  } = {},
) => {
  const requestBody = {
    related_company: normalizeValue(relatedCompany ?? payload?.relatedCompany),
    employee_uuid: normalizeValue(payload?.employeeUuid),
    role_id: normalizeValue(payload?.roleId),
  }

  if (!requestBody.related_company) {
    throw new Error('related_company is required.')
  }

  if (!requestBody.employee_uuid) {
    throw new Error('employee_uuid is required.')
  }

  if (!requestBody.role_id) {
    throw new Error('role_id is required.')
  }

  try {
    const response = await axios.post(assignEmployeeRoleEndpoint, requestBody, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout,
    })
    const responseCode = String(response?.data?.code ?? '').trim()
    const responseMessage = String(response?.data?.message ?? '').trim()

    if (responseCode === '0') {
      throw new Error(responseMessage || 'Failed to assign employee role.')
    }

    return {
      code: responseCode,
      message: responseMessage || 'Employee role assigned successfully.',
      data: response?.data?.data ?? null,
    }
  } catch (error) {
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to assign employee role.'))
  }
}

export { assignEmployeeRoleEndpoint }
