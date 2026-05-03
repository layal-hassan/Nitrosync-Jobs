import { getNitroSyncEmployees } from './useNitroSyncEmployees'
import { getNitroSyncEmployee } from './useNitroSyncEmployee'

export const relatedCompany =
  String(import.meta.env.VITE_NITROSYNC_RELATED_COMPANY || 'b00af2a4-2d77-432b-bd93-4e7ea120d154').trim()
  || 'b00af2a4-2d77-432b-bd93-4e7ea120d154'

export const fallbackEmployees = [
  {
    id: 'emp-1',
    name: 'Ellie Romi',
    role: 'Financial Manager',
    status: 'Active',
    email: 'elieromie@gmail.com',
    phone: '+963223454673',
    address: '2030 Romani St.',
    note: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    avatarBg: 'linear-gradient(135deg, #ecff4f 0%, #ffeb58 100%)',
    avatarAccent: '#0f1525',
    avatarText: 'ER',
    online: false,
  },
  {
    id: 'emp-2',
    name: 'Nancy Karam',
    role: 'HR Manager',
    status: 'Deactivated',
    email: 'nkaram@nitrosync.com',
    phone: '+963223454674',
    address: '2030 Romani St.',
    note: 'Profile is archived but still visible in employee records...',
    avatarBg: 'linear-gradient(135deg, #ffffff 0%, #f2f4ff 100%)',
    avatarAccent: '#5a57ff',
    avatarText: 'NK',
    online: false,
  },
  {
    id: 'emp-3',
    name: 'Mohamad Sami',
    role: 'Financial Manager',
    status: 'Active',
    email: 'msami@nitrosync.com',
    phone: '+963223454675',
    address: '2030 Port',
    note: 'Available for payroll approvals and budget coordination.',
    avatarBg: 'linear-gradient(135deg, #a7d9ff 0%, #86c8ff 100%)',
    avatarAccent: '#f28a1f',
    avatarText: 'MS',
    online: true,
  },
  {
    id: 'emp-4',
    name: 'Michael Augo',
    role: 'Financial Manager',
    status: 'Active',
    email: 'maugo@nitrosync.com',
    phone: '+963223454676',
    address: '2030 Romani St.',
    note: 'Senior finance lead with oversight across regional operations.',
    avatarBg: 'linear-gradient(135deg, #7b63ff 0%, #6d4fff 100%)',
    avatarAccent: '#ffd2bb',
    avatarText: 'MA',
    online: false,
  },
  {
    id: 'emp-5',
    name: 'Rami Bshara',
    role: 'Financial Manager',
    status: 'Active',
    email: 'rbshara@nitrosync.com',
    phone: '+963223454677',
    address: '2030 Romani St.',
    note: 'Owns daily reporting and internal finance dashboards.',
    avatarBg: 'linear-gradient(135deg, #e7ff5d 0%, #8cff7d 100%)',
    avatarAccent: '#c55240',
    avatarText: 'RB',
    online: false,
  },
  {
    id: 'emp-6',
    name: 'Ellie Romi',
    role: 'Financial Manager',
    status: 'Active',
    email: 'elieromie@gmail.com',
    phone: '+963223454673',
    address: '2030 Romani St.',
    note: 'Leads reconciliation and finance support for operations.',
    avatarBg: 'linear-gradient(135deg, #b0a0ff 0%, #9d90ff 100%)',
    avatarAccent: '#1f1f24',
    avatarText: 'ER',
    online: true,
  },
  {
    id: 'emp-7',
    name: 'Ellie Romi',
    role: 'Financial Manager',
    status: 'Deactivated',
    email: 'elieromie@gmail.com',
    phone: '+963223454673',
    address: '2030 Romani St.',
    note: 'Former account owner with read-only history retained.',
    avatarBg: 'linear-gradient(135deg, #8f66ff 0%, #7f50ff 100%)',
    avatarAccent: '#ffd870',
    avatarText: 'ER',
    online: true,
  },
  {
    id: 'emp-8',
    name: 'Ellie Romi',
    role: 'Financial Manager',
    status: 'Active',
    email: 'elieromie@gmail.com',
    phone: '+963223454673',
    address: '2030 Romani St.',
    note: 'Supports finance handoff, reporting and approvals.',
    avatarBg: 'linear-gradient(135deg, #ffd34f 0%, #ffbb53 100%)',
    avatarAccent: '#f25b8d',
    avatarText: 'ER',
    online: false,
  },
]

export const normalizeLabel = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

const coalesce = (...values) => values.find((value) => normalizeLabel(value))

const normalizeEmploymentStatus = (employee = {}) => {
  const additionalInfo = employee?.employee_additional_information || {}
  const workInfo = employee?.employee_work_information || {}
  const employmentDetails = employee?.employment_details || {}

  const rawCandidates = [
    employee?.is_active,
    employee?.active,
    employee?.active_status,
    employee?.status,
    employee?.user_status,
    employee?.employee_status,
    employee?.employment_status,
    employee?.current_status,
    employee?.account_status,
    employee?.record_status,
    employmentDetails?.status,
    employmentDetails?.employment_status,
    workInfo?.status,
    workInfo?.employment_status,
    additionalInfo?.status,
    additionalInfo?.employment_status,
  ]
    .map((value) => normalizeLabel(value))
    .filter(Boolean)

  for (const rawStatus of rawCandidates) {
    const lowered = rawStatus.toLowerCase()

    if (['1', 'true', 'yes', 'active', 'enabled'].includes(lowered)) return 'Active'
    if (['0', 'false', 'no', 'inactive', 'disabled', 'deactivated'].includes(lowered)) return 'Deactivated'
  }

  return 'Active'
}

const buildEmployeeAddress = (employee = {}, baseEmployee = {}) => {
  const additionalInfo = employee?.employee_additional_information || {}
  const locationParts = [
    additionalInfo?.city,
    additionalInfo?.state,
    additionalInfo?.country,
    employee?.location,
    employee?.time_zone,
  ]
    .map((value) => normalizeLabel(value))
    .filter(Boolean)

  return locationParts[0] ? locationParts.join(', ') : baseEmployee.address
}

export const buildInitials = (name = '') =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'EM'

export const normalizeEmployee = (employee = {}, index = 0) => {
  const additionalInfo = employee?.employee_additional_information || {}
  const workInfo = employee?.employee_work_information || {}
  const employmentDetails = employee?.employment_details || {}
  const department = employee?.department || {}
  const systemRole = employee?.system_role || {}
  const fullName = normalizeLabel(
    employee?.full_name
    ?? employee?.fullName
    ?? employee?.employee_name
    ?? employee?.employeeName
    ?? employee?.name,
  )
  const firstName = normalizeLabel(
    employee?.first_name
    ?? employee?.firstName
    ?? additionalInfo?.first_name
    ?? additionalInfo?.firstName,
  )
  const lastName = normalizeLabel(
    employee?.last_name
    ?? employee?.lastName
    ?? additionalInfo?.last_name
    ?? additionalInfo?.lastName,
  )
  const baseEmployee = fallbackEmployees[index % fallbackEmployees.length]
  const name = fullName || [firstName, lastName].filter(Boolean).join(' ').trim() || baseEmployee.name
  const role = normalizeLabel(
    coalesce(
      employmentDetails?.job_title,
      workInfo?.job_position,
      employee?.job_title,
      employee?.current_position,
      employmentDetails?.department,
      department?.department_name,
      employee?.department_name,
      systemRole?.role_name,
    ),
    baseEmployee.role,
  )
  const status = normalizeEmploymentStatus(employee)
  const note = normalizeLabel(
    coalesce(
      employee?.bio,
      employee?.description,
      employee?.notes,
      employmentDetails?.employment_type,
      systemRole?.description,
    ),
    baseEmployee.note,
  )

  return {
    id: normalizeLabel(
      employee?.employee_uuid
      ?? employee?.user_id
      ?? employee?.uuid
      ?? employee?.id,
      `employee-${index}`,
    ),
    employeeUuid: normalizeLabel(
      employee?.employee_uuid
      ?? employee?.user_id,
    ),
    employeeNumber: normalizeLabel(
      employee?.user_id
      ?? employee?.employee_id
      ?? employee?.employee_number
      ?? employee?.employee_code,
    ),
    roleId: normalizeLabel(
      systemRole?.role_id
      ?? systemRole?.id
      ?? employee?.role_id,
    ),
    name,
    role,
    status,
    department: normalizeLabel(
      coalesce(
        department?.department_name,
        employmentDetails?.department,
        employee?.department_name,
      ),
      role,
    ),
    position: normalizeLabel(
      coalesce(
        workInfo?.job_position,
        employmentDetails?.job_title,
        employee?.job_title,
      ),
      role,
    ),
    email: normalizeLabel(
      employee?.email
      ?? additionalInfo?.work_email
      ?? additionalInfo?.personal_email
      ?? employee?.work_email
      ?? employee?.employee_email,
      baseEmployee.email,
    ),
    phone: normalizeLabel(
      employee?.phone
      ?? additionalInfo?.mobile
      ?? additionalInfo?.work_phone
      ?? additionalInfo?.home_phone
      ?? employee?.mobile
      ?? employee?.phone_number,
      baseEmployee.phone,
    ),
    address: buildEmployeeAddress(employee, baseEmployee),
    note,
    avatarBg: baseEmployee.avatarBg,
    avatarAccent: baseEmployee.avatarAccent,
    avatarText: buildInitials(name),
    online: status === 'Active',
    hireDate: normalizeLabel(
      employee?.hire_date
      ?? employee?.hireDate
      ?? employmentDetails?.joining_date
      ?? employee?.joining_date
      ?? employee?.joiningDate
      ?? employee?.created_at
      ?? employee?.createdAt,
      `2026-0${(index % 8) + 1}-1${index % 9}`,
    ).slice(0, 10),
  }
}

export const loadEmployeesDirectory = async () => {
  try {
    const response = await getNitroSyncEmployees(relatedCompany)
    const rows = Array.isArray(response?.data) ? response.data : []

    return {
      employees: rows.map(normalizeEmployee),
      usedFallback: false,
    }
  } catch (error) {
    console.error('Failed to load employees directory', error)
  }

  return {
    employees: [],
    usedFallback: true,
  }
}

export const findEmployeeById = async (employeeId) => {
  const targetId = String(employeeId || '').trim()

  try {
    const response = await getNitroSyncEmployee({
      companyUuid: relatedCompany,
      employeeUuid: targetId,
    })
    const employee = response?.data ? normalizeEmployee(response.data) : null

    if (employee) {
      return {
        employee,
        employees: employee ? [employee] : [],
        usedFallback: false,
      }
    }
  } catch (error) {
    console.error('Failed to load employee by employee_uuid', error)
  }

  const { employees, usedFallback } = await loadEmployeesDirectory()
  const employee = employees.find((item) =>
    [
      item?.id,
      item?.employeeUuid,
      item?.employeeNumber,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .includes(targetId),
  ) || null

  return {
    employee,
    employees,
    usedFallback,
  }
}
