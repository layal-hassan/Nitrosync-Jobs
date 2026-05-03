import axios from 'axios'
import {
  buildNitroSyncEndpoint,
  getNitroSyncErrorMessage,
  nitroSyncRequestTimeoutMs,
} from './nitroSyncApi'

const updateEmployeeEndpoint = buildNitroSyncEndpoint('/v1/employees/update')

const normalizeValue = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

const appendValue = (formData, key, value) => {
  formData.append(key, normalizeValue(value))
}

const appendOptionalValue = (formData, key, value) => {
  const normalized = normalizeValue(value)
  if (!normalized) return
  formData.append(key, normalized)
}

const appendFiles = (formData, key, files = []) => {
  files
    .filter((file) => file instanceof File || file instanceof Blob)
    .forEach((file) => {
      formData.append(key, file)
    })
}

const appendStringArray = (formData, key, values = [], { ensureKey = false } = {}) => {
  const normalizedValues = values
    .map((value) => normalizeValue(value))
    .filter(Boolean)

  if (!normalizedValues.length) {
    if (ensureKey) {
      formData.append(`${key}[]`, '')
    }

    return
  }

  normalizedValues.forEach((value) => {
    formData.append(`${key}[]`, value)
  })
}

const buildRestrictedFields = (settings = {}) => {
  const selectedFields = settings?.selectedFields || {}

  return Object.values(selectedFields)
    .flatMap((section) => Object.entries(section || {}))
    .filter(([, enabled]) => Boolean(enabled))
    .map(([field]) => normalizeValue(field))
    .filter(Boolean)
}

export const buildUpdateEmployeeFormData = (payload = {}, options = {}) => {
  const companyId = normalizeValue(options.relatedCompany ?? payload.relatedCompany, 'b00af2a4-2d77-432b-bd93-4e7ea120d154')
  const employeeUuid = normalizeValue(payload.employeeUuid ?? payload.employee_uuid)
  const employeeId = normalizeValue(payload.employeeId ?? payload.employee_id ?? payload.employeeNumber)
  const departmentId = normalizeValue(options.departmentId ?? payload.departmentId ?? payload.department)
  const restrictedFields = buildRestrictedFields(payload.restrictedAccessSettings)
  const openAccess = Boolean(payload?.openAccess)
  const accessLevel = normalizeValue(payload?.restrictedAccessSettings?.accessLevel, 'restricted')

  const formData = new FormData()

  appendValue(formData, 'related_company', companyId)
  appendValue(formData, 'employee_uuid', employeeUuid)
  appendValue(formData, 'employee_id', employeeId)

  appendValue(formData, 'first_name', payload.firstName)
  appendValue(formData, 'last_name', payload.lastName)
  appendValue(formData, 'gender', String(payload.gender || '').toLowerCase())
  appendValue(formData, 'birth_date', payload.birthDate)
  appendValue(formData, 'nationality', payload.nationality)
  appendValue(formData, 'country', payload.country)
  appendValue(formData, 'city', payload.city)
  appendOptionalValue(formData, 'state', payload.state)
  appendOptionalValue(formData, 'zip_code', payload.zipCode)
  appendValue(formData, 'work_phone', payload.workPhone)
  appendOptionalValue(formData, 'home_phone', payload.homePhone)
  appendValue(formData, 'mobile', payload.mobilePhone)
  appendValue(formData, 'work_email', payload.workEmail)
  appendOptionalValue(formData, 'personal_email', payload.personalEmail)

  appendValue(formData, 'bank_account_country', payload.bankCountry)
  appendValue(formData, 'bank_name', payload.bankName)
  appendValue(formData, 'bank_account_number', payload.accountNumber)
  appendValue(formData, 'bank_branch', payload.bankBranch)
  appendValue(formData, 'bank_account_type', payload.accountType)
  appendValue(formData, 'bank_address', payload.bankAddress)
  appendValue(formData, 'swift_bic_code', payload.swiftBicCode)
  appendValue(formData, 'iban', payload.iban)

  appendValue(formData, 'health_insurance_provider', payload.healthInsuranceProvider)
  appendValue(formData, 'policy_number', payload.healthPolicyNumber)
  appendValue(formData, 'coverage_level', payload.healthCoverageLevel)
  appendValue(formData, 'health_insurance_start_date', payload.healthStartDate)
  appendValue(formData, 'health_insurance_end_date', payload.healthEndDate)
  appendValue(formData, 'coverage_details', payload.healthCoverageDetails)
  appendValue(formData, 'retirement_plan_type', payload.retirementPlanType)
  appendValue(formData, 'retirement_coverage_level', payload.retirementCoverageLevel)
  appendValue(formData, 'contribution_type', payload.retirementContributionType)
  appendValue(formData, 'contribution_amount', payload.retirementContributionAmount)
  appendValue(formData, 'contribution_currency', payload.retirementContributionCurrency)
  appendValue(formData, 'employer_contribution_type', payload.employerContributionType)
  appendValue(formData, 'employer_contribution_amount', payload.employerContributionAmount)
  appendValue(formData, 'employer_contribution_currency', payload.employerContributionCurrency)
  appendValue(formData, 'other_benefits_coverage_level', payload.otherBenefitsCoverageLevel)
  appendValue(formData, 'life_insurance', payload.lifeInsurance)
  appendValue(formData, 'paid_time_off', payload.paidTimeOff)
  appendValue(formData, 'wellness_programs', payload.wellnessPrograms)
  appendValue(formData, 'details', payload.details)
  appendValue(formData, 'miscellaneous_start_date', payload.miscStartDate)
  appendValue(formData, 'miscellaneous_end_date', payload.miscEndDate)
  appendValue(formData, 'payment_method', payload.paymentMethod)
  appendValue(formData, 'performance_bonuses', payload.performanceBonuses)

  appendValue(formData, 'tax_identification_number', payload.taxIdentificationNumber)
  appendValue(formData, 'tax_filling_status', payload.taxFilingStatus)
  appendValue(formData, 'exemptions_allowances', payload.taxExemptionsAndAllowances)
  appendValue(formData, 'tax_rates', payload.localStateFederalTaxRates)

  appendValue(formData, 'job_position', payload.jobPosition)
  appendValue(formData, 'job_location', payload.jobLocation)
  appendValue(formData, 'team', payload.team)
  appendValue(formData, 'supervisor', payload.supervisor)
  appendValue(formData, 'manager', payload.manager)
  appendValue(formData, 'work_schedule', payload.workSchedule)

  appendValue(formData, 'job_title', payload.jobPosition)
  appendValue(formData, 'employment_type', payload.employmentType)
  appendValue(formData, 'grade', payload.grade)
  appendValue(formData, 'work_hours', payload.workHours)
  appendValue(formData, 'annual_leave_entitlement', payload.annualLeaveEntitlement)
  appendValue(formData, 'validity_of_contract', payload.validityOfContract)
  appendValue(formData, 'department_id', departmentId)
  appendValue(formData, 'joining_date', payload.joiningDate)
  appendValue(formData, 'base_salary', payload.baseSalary)
  appendValue(formData, 'currency', payload.currency)
  appendValue(formData, 'pay_frequency', payload.payFrequency)
  appendValue(formData, 'bonus_type', payload.bonusType)
  appendValue(formData, 'bonus_frequency', payload.bonusFrequency)
  appendValue(formData, 'bonus_calculation_basis', payload.calculationBasis)
  appendValue(formData, 'bonus_amount', payload.amountOrPercentage)
  appendValue(formData, 'bonus_currency', payload.bonusCurrency)
  appendValue(formData, 'bonus_eligibility', payload.eligibility)
  appendValue(formData, 'bonus_months', payload.months)
  appendValue(formData, 'overtime_rate_type', payload.overtimeRateType)
  appendValue(formData, 'overtime_amount', payload.overtimeAmount)
  appendValue(formData, 'overtime_currency', payload.overtimeCurrency)
  appendValue(formData, 'overtime_applies_after', payload.appliesAfter)
  appendOptionalValue(formData, 'overtime_eligibility_day', payload.eligibilityDay)
  appendValue(formData, 'allowances', payload.allowanceName)
  appendValue(formData, 'allowances_type', payload.allowanceType)
  appendValue(formData, 'allowances_amount', payload.allowanceAmount)
  appendValue(formData, 'overtime_max_hour_eligibility', payload.overtimeMaxHours)
  appendValue(formData, 'overtime_payout_frequency', payload.overtimePayoutFrequency)
  appendValue(formData, 'health_insurance_deduction', payload.healthInsurance)
  appendValue(formData, 'health_insurance_retirement_contributions', payload.retirementContributions)
  appendValue(formData, 'other_deductions_names', payload.deductionName)
  appendValue(formData, 'other_deductions_amount', payload.deductionAmount)
  appendValue(formData, 'other_deductions_currency', payload.deductionCurrency)

  appendOptionalValue(formData, 'attach_name', employeeId || `${normalizeValue(payload.firstName)} ${normalizeValue(payload.lastName)}`.trim())
  appendOptionalValue(formData, 'employee_profile_access_type', openAccess ? 'open' : 'restricted')
  if (!openAccess) {
    appendOptionalValue(formData, 'assign_access_level', accessLevel)
  }

  appendFiles(formData, 'files[]', payload.attachments)
  appendFiles(formData, 'non_disclosure_agreements[]', payload.ndaFiles)
  appendFiles(formData, 'employment_contracts[]', payload.employmentContractFiles)
  appendFiles(formData, 'local_labor_laws_regulations_compliance[]', payload.laborLawComplianceFiles)
  appendFiles(formData, 'attach_files[]', payload.attachments)
  if (!openAccess) {
    appendStringArray(formData, 'restrict_fields', restrictedFields)
  }

  return formData
}

export const updateNitroSyncEmployee = async (
  payload,
  {
    timeout = nitroSyncRequestTimeoutMs,
    relatedCompany,
    departmentId,
  } = {},
) => {
  const formData = buildUpdateEmployeeFormData(payload, {
    relatedCompany,
    departmentId,
  })

  console.debug(
    '[NitroSync update employee] FormData entries',
    Array.from(formData.entries()).map(([key, value]) => [
      key,
      value instanceof File ? { name: value.name, size: value.size, type: value.type } : value,
    ]),
  )

  try {
    const response = await axios.post(updateEmployeeEndpoint, formData, { timeout })
    console.debug('[NitroSync update employee] response.data', response?.data)
    const responseCode = String(response?.data?.code ?? '').trim()
    const responseMessage = String(response?.data?.message ?? '').trim()

    if (responseCode === '0') {
      throw new Error(responseMessage || 'Failed to update employee.')
    }

    return {
      code: responseCode,
      message: responseMessage || 'Employee updated successfully.',
      data: response?.data?.data ?? null,
    }
  } catch (error) {
    console.debug('[NitroSync update employee] error.response.data', error?.response?.data)
    throw new Error(getNitroSyncErrorMessage(error, 'Failed to update employee.'))
  }
}

export { updateEmployeeEndpoint }
