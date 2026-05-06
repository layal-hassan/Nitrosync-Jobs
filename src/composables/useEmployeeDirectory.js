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

const getEmployeeSections = (employee = {}) => ({
  additionalInfo: employee?.employee_additional_information || {},
  workInfo: employee?.employee_work_information || {},
  employmentDetails: employee?.employment_details || {},
  department: employee?.department || {},
  systemRole: employee?.system_role || {},
  bankInfo: employee?.employee_bank_information || employee?.bank_information || {},
  benefitsInfo: employee?.employee_benefits_information || employee?.benefits_information || {},
  taxInfo: employee?.employee_tax_information || employee?.tax_information || {},
  miscInfo: employee?.employee_miscellaneous_information || employee?.miscellaneous_information || {},
})

const normalizeEmploymentStatus = (employee = {}) => {
  const { additionalInfo, workInfo, employmentDetails } = getEmployeeSections(employee)

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
  const { additionalInfo } = getEmployeeSections(employee)
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
  const { additionalInfo, workInfo, employmentDetails, department, systemRole } = getEmployeeSections(employee)
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
    firstName,
    lastName,
    raw: employee,
  }
}

export const buildEmployeeUpdatePayload = (employee = {}, overrides = {}) => {
  const raw = employee?.raw || employee || {}
  const {
    additionalInfo,
    workInfo,
    employmentDetails,
    department,
    bankInfo,
    benefitsInfo,
    taxInfo,
    miscInfo,
  } = getEmployeeSections(raw)

  const payload = {
    employeeUuid: normalizeLabel(overrides.employeeUuid ?? employee?.employeeUuid ?? raw?.employee_uuid ?? raw?.user_id),
    employeeId: normalizeLabel(
      overrides.employeeId
      ?? employee?.employeeNumber
      ?? raw?.user_id
      ?? raw?.employee_id
      ?? raw?.employee_number
      ?? raw?.employee_code,
    ),
    firstName: normalizeLabel(overrides.firstName ?? employee?.firstName ?? raw?.first_name ?? additionalInfo?.first_name),
    lastName: normalizeLabel(overrides.lastName ?? employee?.lastName ?? raw?.last_name ?? additionalInfo?.last_name),
    gender: normalizeLabel(overrides.gender ?? raw?.gender ?? additionalInfo?.gender),
    birthDate: normalizeLabel(overrides.birthDate ?? raw?.birth_date ?? additionalInfo?.birth_date),
    nationality: normalizeLabel(overrides.nationality ?? raw?.nationality ?? additionalInfo?.nationality),
    country: normalizeLabel(overrides.country ?? raw?.country ?? additionalInfo?.country),
    city: normalizeLabel(overrides.city ?? raw?.city ?? additionalInfo?.city),
    state: normalizeLabel(overrides.state ?? raw?.state ?? additionalInfo?.state),
    zipCode: normalizeLabel(overrides.zipCode ?? raw?.zip_code ?? additionalInfo?.zip_code),
    workPhone: normalizeLabel(overrides.workPhone ?? raw?.work_phone ?? additionalInfo?.work_phone),
    homePhone: normalizeLabel(overrides.homePhone ?? raw?.home_phone ?? additionalInfo?.home_phone),
    mobilePhone: normalizeLabel(overrides.mobilePhone ?? employee?.phone ?? raw?.mobile ?? additionalInfo?.mobile),
    workEmail: normalizeLabel(overrides.workEmail ?? employee?.email ?? raw?.work_email ?? additionalInfo?.work_email ?? raw?.email),
    personalEmail: normalizeLabel(overrides.personalEmail ?? raw?.personal_email ?? additionalInfo?.personal_email),
    bankCountry: normalizeLabel(overrides.bankCountry ?? bankInfo?.bank_account_country ?? raw?.bank_account_country),
    bankName: normalizeLabel(overrides.bankName ?? bankInfo?.bank_name ?? raw?.bank_name),
    accountNumber: normalizeLabel(overrides.accountNumber ?? bankInfo?.bank_account_number ?? raw?.bank_account_number),
    bankBranch: normalizeLabel(overrides.bankBranch ?? bankInfo?.bank_branch ?? raw?.bank_branch),
    accountType: normalizeLabel(overrides.accountType ?? bankInfo?.bank_account_type ?? raw?.bank_account_type),
    bankAddress: normalizeLabel(overrides.bankAddress ?? bankInfo?.bank_address ?? raw?.bank_address),
    swiftBicCode: normalizeLabel(overrides.swiftBicCode ?? bankInfo?.swift_bic_code ?? raw?.swift_bic_code),
    iban: normalizeLabel(overrides.iban ?? bankInfo?.iban ?? raw?.iban),
    healthInsuranceProvider: normalizeLabel(overrides.healthInsuranceProvider ?? benefitsInfo?.health_insurance_provider ?? raw?.health_insurance_provider),
    healthPolicyNumber: normalizeLabel(overrides.healthPolicyNumber ?? benefitsInfo?.policy_number ?? raw?.policy_number),
    healthCoverageLevel: normalizeLabel(overrides.healthCoverageLevel ?? benefitsInfo?.coverage_level ?? raw?.coverage_level),
    healthStartDate: normalizeLabel(overrides.healthStartDate ?? benefitsInfo?.health_insurance_start_date ?? raw?.health_insurance_start_date),
    healthEndDate: normalizeLabel(overrides.healthEndDate ?? benefitsInfo?.health_insurance_end_date ?? raw?.health_insurance_end_date),
    healthCoverageDetails: normalizeLabel(overrides.healthCoverageDetails ?? benefitsInfo?.coverage_details ?? raw?.coverage_details),
    retirementPlanType: normalizeLabel(overrides.retirementPlanType ?? benefitsInfo?.retirement_plan_type ?? raw?.retirement_plan_type),
    retirementCoverageLevel: normalizeLabel(overrides.retirementCoverageLevel ?? benefitsInfo?.retirement_coverage_level ?? raw?.retirement_coverage_level),
    retirementContributionType: normalizeLabel(overrides.retirementContributionType ?? benefitsInfo?.contribution_type ?? raw?.contribution_type),
    retirementContributionAmount: normalizeLabel(overrides.retirementContributionAmount ?? benefitsInfo?.contribution_amount ?? raw?.contribution_amount),
    retirementContributionCurrency: normalizeLabel(overrides.retirementContributionCurrency ?? benefitsInfo?.contribution_currency ?? raw?.contribution_currency),
    employerContributionType: normalizeLabel(overrides.employerContributionType ?? benefitsInfo?.employer_contribution_type ?? raw?.employer_contribution_type),
    employerContributionAmount: normalizeLabel(overrides.employerContributionAmount ?? benefitsInfo?.employer_contribution_amount ?? raw?.employer_contribution_amount),
    employerContributionCurrency: normalizeLabel(overrides.employerContributionCurrency ?? benefitsInfo?.employer_contribution_currency ?? raw?.employer_contribution_currency),
    otherBenefitsCoverageLevel: normalizeLabel(overrides.otherBenefitsCoverageLevel ?? benefitsInfo?.other_benefits_coverage_level ?? raw?.other_benefits_coverage_level),
    lifeInsurance: normalizeLabel(overrides.lifeInsurance ?? benefitsInfo?.life_insurance ?? raw?.life_insurance),
    paidTimeOff: normalizeLabel(overrides.paidTimeOff ?? benefitsInfo?.paid_time_off ?? raw?.paid_time_off),
    wellnessPrograms: normalizeLabel(overrides.wellnessPrograms ?? benefitsInfo?.wellness_programs ?? raw?.wellness_programs),
    details: normalizeLabel(overrides.details ?? benefitsInfo?.details ?? raw?.details),
    miscStartDate: normalizeLabel(overrides.miscStartDate ?? miscInfo?.miscellaneous_start_date ?? raw?.miscellaneous_start_date),
    miscEndDate: normalizeLabel(overrides.miscEndDate ?? miscInfo?.miscellaneous_end_date ?? raw?.miscellaneous_end_date),
    paymentMethod: normalizeLabel(overrides.paymentMethod ?? miscInfo?.payment_method ?? raw?.payment_method),
    performanceBonuses: normalizeLabel(overrides.performanceBonuses ?? miscInfo?.performance_bonuses ?? raw?.performance_bonuses),
    taxIdentificationNumber: normalizeLabel(overrides.taxIdentificationNumber ?? taxInfo?.tax_identification_number ?? raw?.tax_identification_number),
    taxFilingStatus: normalizeLabel(overrides.taxFilingStatus ?? taxInfo?.tax_filling_status ?? raw?.tax_filling_status),
    taxExemptionsAndAllowances: normalizeLabel(overrides.taxExemptionsAndAllowances ?? taxInfo?.exemptions_allowances ?? raw?.exemptions_allowances),
    localStateFederalTaxRates: normalizeLabel(overrides.localStateFederalTaxRates ?? taxInfo?.tax_rates ?? raw?.tax_rates),
    jobPosition: normalizeLabel(overrides.jobPosition ?? employee?.position ?? workInfo?.job_position ?? raw?.job_position),
    jobLocation: normalizeLabel(overrides.jobLocation ?? workInfo?.job_location ?? raw?.job_location),
    team: normalizeLabel(overrides.team ?? workInfo?.team ?? raw?.team),
    supervisor: normalizeLabel(overrides.supervisor ?? workInfo?.supervisor ?? raw?.supervisor),
    manager: normalizeLabel(overrides.manager ?? workInfo?.manager ?? raw?.manager),
    workSchedule: normalizeLabel(overrides.workSchedule ?? workInfo?.work_schedule ?? raw?.work_schedule),
    employmentType: normalizeLabel(overrides.employmentType ?? employmentDetails?.employment_type ?? raw?.employment_type),
    grade: normalizeLabel(overrides.grade ?? employmentDetails?.grade ?? raw?.grade),
    workHours: normalizeLabel(overrides.workHours ?? employmentDetails?.work_hours ?? raw?.work_hours),
    annualLeaveEntitlement: normalizeLabel(overrides.annualLeaveEntitlement ?? employmentDetails?.annual_leave_entitlement ?? raw?.annual_leave_entitlement),
    validityOfContract: normalizeLabel(overrides.validityOfContract ?? employmentDetails?.validity_of_contract ?? raw?.validity_of_contract),
    department: normalizeLabel(overrides.department ?? employee?.department ?? department?.department_name ?? employmentDetails?.department ?? raw?.department_name),
    departmentId: normalizeLabel(overrides.departmentId ?? department?.id ?? raw?.department_id),
    joiningDate: normalizeLabel(overrides.joiningDate ?? employee?.hireDate ?? employmentDetails?.joining_date ?? raw?.joining_date),
    baseSalary: normalizeLabel(overrides.baseSalary ?? employmentDetails?.base_salary ?? raw?.base_salary),
    currency: normalizeLabel(overrides.currency ?? employmentDetails?.currency ?? raw?.currency),
    payFrequency: normalizeLabel(overrides.payFrequency ?? employmentDetails?.pay_frequency ?? raw?.pay_frequency),
    bonusType: normalizeLabel(overrides.bonusType ?? employmentDetails?.bonus_type ?? raw?.bonus_type),
    bonusFrequency: normalizeLabel(overrides.bonusFrequency ?? employmentDetails?.bonus_frequency ?? raw?.bonus_frequency),
    calculationBasis: normalizeLabel(overrides.calculationBasis ?? employmentDetails?.bonus_calculation_basis ?? raw?.bonus_calculation_basis),
    amountOrPercentage: normalizeLabel(overrides.amountOrPercentage ?? employmentDetails?.bonus_amount ?? raw?.bonus_amount),
    bonusCurrency: normalizeLabel(overrides.bonusCurrency ?? employmentDetails?.bonus_currency ?? raw?.bonus_currency),
    eligibility: normalizeLabel(overrides.eligibility ?? employmentDetails?.bonus_eligibility ?? raw?.bonus_eligibility),
    months: normalizeLabel(overrides.months ?? employmentDetails?.bonus_months ?? raw?.bonus_months),
    overtimeRateType: normalizeLabel(overrides.overtimeRateType ?? employmentDetails?.overtime_rate_type ?? raw?.overtime_rate_type),
    overtimeAmount: normalizeLabel(overrides.overtimeAmount ?? employmentDetails?.overtime_amount ?? raw?.overtime_amount),
    overtimeCurrency: normalizeLabel(overrides.overtimeCurrency ?? employmentDetails?.overtime_currency ?? raw?.overtime_currency),
    appliesAfter: normalizeLabel(overrides.appliesAfter ?? employmentDetails?.overtime_applies_after ?? raw?.overtime_applies_after),
    eligibilityDay: normalizeLabel(overrides.eligibilityDay ?? employmentDetails?.overtime_eligibility_day ?? raw?.overtime_eligibility_day),
    allowanceName: normalizeLabel(overrides.allowanceName ?? employmentDetails?.allowances ?? raw?.allowances),
    allowanceType: normalizeLabel(overrides.allowanceType ?? employmentDetails?.allowances_type ?? raw?.allowances_type),
    allowanceAmount: normalizeLabel(overrides.allowanceAmount ?? employmentDetails?.allowances_amount ?? raw?.allowances_amount),
    overtimeMaxHours: normalizeLabel(overrides.overtimeMaxHours ?? employmentDetails?.overtime_max_hour_eligibility ?? raw?.overtime_max_hour_eligibility),
    overtimePayoutFrequency: normalizeLabel(overrides.overtimePayoutFrequency ?? employmentDetails?.overtime_payout_frequency ?? raw?.overtime_payout_frequency),
    healthInsurance: normalizeLabel(overrides.healthInsurance ?? employmentDetails?.health_insurance_deduction ?? raw?.health_insurance_deduction),
    retirementContributions: normalizeLabel(overrides.retirementContributions ?? employmentDetails?.health_insurance_retirement_contributions ?? raw?.health_insurance_retirement_contributions),
    deductionName: normalizeLabel(overrides.deductionName ?? employmentDetails?.other_deductions_names ?? raw?.other_deductions_names),
    deductionAmount: normalizeLabel(overrides.deductionAmount ?? employmentDetails?.other_deductions_amount ?? raw?.other_deductions_amount),
    deductionCurrency: normalizeLabel(overrides.deductionCurrency ?? employmentDetails?.other_deductions_currency ?? raw?.other_deductions_currency),
    openAccess: String(raw?.employee_profile_access_type || '').trim().toLowerCase() === 'open',
    restrictedAccessSettings: {
      accessLevel: normalizeLabel(raw?.assign_access_level, 'restricted'),
      selectedFields: {},
    },
  }

  return payload
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
