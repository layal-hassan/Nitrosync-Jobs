<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import Dropdown from '../ui/Dropdown.vue'
import DatePicker from '../ui/DatePicker.vue'
import RestrictedAccessModal from './RestrictedAccessModal.vue'
import { departmentOptions } from '../../data/jobPostingOptions'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  suggestedEmployeeId: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  submitError: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'save', 'clear-submit-error'])

const stepItems = [
  { label: 'Basic Information', color: '#ef5a96' },
  { label: 'Work Information', color: '#4f78ff' },
  { label: 'Employment Details', color: '#5c15d8' },
  { label: 'Tax Information', color: '#e1a600' },
  { label: 'Bank Account Information', color: '#24d56a' },
  { label: 'Benefits and Reimbursements', color: '#ef5a96' },
  { label: 'Employee End Login', color: '#4f78ff' },
]

const dropdownPalette = ['#ef5a96', '#4f78ff', '#5c15d8', '#e1a600', '#24d56a']
const buildColoredOptions = (items, customMatchers = []) =>
  items.map((item, index) => {
    const label = typeof item === 'object' ? item.label ?? String(item.value ?? '') : String(item)
    const value = typeof item === 'object' ? item.value ?? item.label ?? '' : item
    const normalizedKey = String(value || label).trim().toLowerCase()

    return {
      label,
      value,
      color: typeof item === 'object' && item.color ? item.color : dropdownPalette[index % dropdownPalette.length],
      allowsCustom:
        typeof item === 'object' && 'allowsCustom' in item
          ? Boolean(item.allowsCustom)
          : customMatchers.includes(normalizedKey),
    }
  })

const genderOptions = ['Male', 'Female', 'Non Binary', 'Prefer Not to Say']
const nationalityOptions = ['Syrian', 'Saudi', 'Jordanian', 'Lebanese']
const countryOptions = ['Syria', 'Saudi Arabia', 'UAE', 'Jordan']
const stateOptions = ['Damascus', 'Riyadh', 'Dubai', 'Amman']
const zipCodeOptions = ['1000', '11564', '21111', '51931']
const jobLocationOptions = ['On site', 'Hybrid', 'Remote']
const teamOptions = ['Finance Team', 'HR Team', 'Recruitment Team', 'Operations Team']
const managerOptions = ['Tony Awad', 'Nadia Alromani', 'Michael Augo', 'Mohamad Sami']
const supervisorOptions = ['Rami Bshara', 'Ellie Romi', 'Nancy Karam', 'Sara Nabulsi']
const workScheduleOptions = ['Full time', 'Part time', 'Flexible', 'Night shift']
const employmentTypeOptions = buildColoredOptions(['Full-time', 'Part-time', 'contract', 'intern', 'Shift based', 'freelance', 'On-call'])
const currencyOptions = ['USD', 'EUR', 'SAR', 'AED']
const payFrequencyOptions = buildColoredOptions(['Monthly', 'Sami-Monthly', 'Weekly', 'Bi-Weekly', 'Quarterly', 'Daily', 'Hourly', 'Annually', 'Per Project'])
const bonusTypeOptions = buildColoredOptions(
  ['Performance Bonus', 'Sales Incentive', 'Sign-on Bonus', 'Retention', 'Referral', 'Holiday/end of year Bonus', 'custom'],
  ['custom'],
)
const bonusFrequencyOptions = buildColoredOptions(['One-time', 'Monthly', 'Quarterly', 'Yearly', 'Per Project'])
const calculationBasisOptions = buildColoredOptions(['Fixed Amount', '% of Salary', '% of Revenue'])
const eligibilityOptions = ['Immediate', 'After X months']
const overtimeRateTypeOptions = buildColoredOptions(['1.25X', '1.5x', '2.0x', 'Fixed Amount per Hour', 'custom'], ['custom'])
const overtimeCurrencyOptions = ['USD', 'EUR', 'SAR', 'AED']
const appliesAfterOptions = buildColoredOptions(['40 hours/week', '8 hours/day', 'custom'], ['custom'])
const eligibilityDayOptions = buildColoredOptions(['Weekdays', 'Weekends', 'Holidays', 'All Days'])
const allowanceTypeOptions = ['Amount', 'Percentage']
const allowanceNameOptions = buildColoredOptions(
  ['Housing', 'Transport', 'Medical', 'Entertainment', { label: 'Other', value: 'Other', allowsCustom: true }],
  ['other'],
)
const payoutFrequencyOptions = ['Monthly', 'Semi-Monthly', 'Weekly', 'Bi-Weekly', 'Quarterly', 'Daily', 'Hourly', 'Annually', 'Per project']
const taxFilingStatusOptions = buildColoredOptions([
  'Single',
  'Married Filing Jointly',
  'Married Filing Separately',
  'Head of Household',
  'Qualifying Widow(er) with Dependent Child',
  { label: 'Other', value: 'Other', allowsCustom: true },
])
const accountTypeOptions = buildColoredOptions([
  'checking',
  'savings',
  { label: 'Other', value: 'other', allowsCustom: true },
])
const dependentCoverageOptions = buildColoredOptions(['Employee-only', 'Employee + spouse', 'family'])
const retirementPlanTypeOptions = buildColoredOptions(['Public', 'Private', 'Company Pension', 'Provident Fund', 'End-of-service'])
const contributionTypeOptions = buildColoredOptions(['Percentage', 'Fixed amount', 'Number'])
const benefitsCurrencyOptions = ['USD', 'EUR', 'SAR', 'AED']
const createOtherDeductionEntry = () => ({
  name: '',
  amount: '',
  currency: '',
})
const createOtherBenefitEntry = () => ({
  coverageLevel: '',
  lifeInsurance: '',
  paidTimeOff: '',
  wellnessPrograms: '',
  details: '',
})

const createForm = (suggestedEmployeeId = '') => ({
  employeeId: suggestedEmployeeId,
  firstName: '',
  lastName: '',
  gender: '',
  birthDate: '',
  nationality: '',
  country: '',
  city: '',
  state: '',
  zipCode: '',
  workPhone: '',
  mobilePhone: '',
  homePhone: '',
  workEmail: '',
  personalEmail: '',
  jobPosition: '',
  jobLocation: '',
  team: '',
  manager: '',
  supervisor: '',
  workSchedule: '',
  attachments: [],
  employmentType: '',
  grade: '',
  workHours: '',
  annualLeaveEntitlement: '',
  validityOfContract: '',
  department: '',
  joiningDate: '',
  baseSalary: '',
  currency: 'USD',
  payFrequency: '',
  bonusType: '',
  bonusFrequency: '',
  calculationBasis: '',
  amountOrPercentage: '',
  bonusCurrency: 'USD',
  eligibility: '',
  months: '',
  overtimeRateType: '',
  overtimeAmount: '',
  overtimeCurrency: '',
  appliesAfter: '',
  eligibilityDay: '',
  allowanceName: '',
  allowanceType: '',
  allowanceAmount: '',
  overtimeMaxHours: '',
  overtimePayoutFrequency: '',
  healthInsurance: '',
  retirementContributions: '',
  otherDeductions: [createOtherDeductionEntry()],
  taxIdentificationNumber: '',
  taxFilingStatus: '',
  taxExemptionsAndAllowances: '',
  localStateFederalTaxRates: '',
  bankCountry: '',
  bankName: '',
  accountNumber: '',
  bankBranch: '',
  accountType: '',
  bankAddress: '',
  swiftBicCode: '',
  iban: '',
  healthInsuranceProvider: '',
  healthPolicyNumber: '',
  healthCoverageLevel: '',
  healthStartDate: '',
  healthCoverageDetails: '',
  retirementPlan: '',
  retirementPlanType: '',
  retirementCoverageLevel: '',
  retirementContributionType: '',
  retirementContributionAmount: '',
  retirementContributionCurrency: '',
  employerContributionType: '',
  employerContributionAmount: '',
  employerContributionCurrency: '',
  otherBenefits: [createOtherBenefitEntry()],
  miscStartDate: '',
  employmentContracts: '',
  paymentMethod: '',
  performanceBonuses: '',
  ndaFiles: [],
  employmentContractFiles: [],
  laborLawComplianceFiles: [],
  restrictedAccess: false,
  restrictedAccessSettings: {},
  openAccess: false,
})

const form = reactive(createForm(props.suggestedEmployeeId))
const errors = ref({})
const panelRef = ref(null)
const fileInputRef = ref(null)
const currentStepIndex = ref(0)
const furthestStepIndex = ref(0)
const legalUploadContext = ref('')
const isRestrictedAccessModalOpen = ref(false)
const hasAttemptedStepSubmit = ref(false)

const lettersOnlyPattern = /^[A-Za-z\s'-]+$/
const numbersOnlyPattern = /^\d+$/
const decimalNumberPattern = /^\d+(\.\d+)?$/
const alphaNumericPattern = /^[A-Za-z0-9\s-]+$/

const isEndDateBeforeStartDate = (startDate, endDate) => {
  if (!startDate || !endDate) return false

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  return end < start
}

const liveValidationRules = {
  employeeId: (value) => !value || numbersOnlyPattern.test(value) ? '' : 'Use numbers only',
  firstName: (value) => !value || lettersOnlyPattern.test(value) ? '' : 'Use letters only',
  lastName: (value) => !value || lettersOnlyPattern.test(value) ? '' : 'Use letters only',
  city: (value) => !value || lettersOnlyPattern.test(value) ? '' : 'Use letters only',
  workPhone: (value) => !value || numbersOnlyPattern.test(value) ? '' : 'Use numbers only',
  mobilePhone: (value) => !value || numbersOnlyPattern.test(value) ? '' : 'Use numbers only',
  homePhone: (value) => !value || numbersOnlyPattern.test(value) ? '' : 'Use numbers only',
  jobPosition: (value) => !value || lettersOnlyPattern.test(value) ? '' : 'Use letters only',
  grade: (value) => !value || alphaNumericPattern.test(value) ? '' : 'Use letters and numbers only',
  department: (value) => !value || lettersOnlyPattern.test(value) ? '' : 'Use letters only',
  baseSalary: (value) => !value || decimalNumberPattern.test(value) ? '' : 'Use numbers only',
  months: (value) => !value || numbersOnlyPattern.test(value) ? '' : 'Use numbers only',
  overtimeMaxHours: (value) => !value || decimalNumberPattern.test(value) ? '' : 'Use numbers only',
  taxIdentificationNumber: (value) => !value || alphaNumericPattern.test(value) ? '' : 'Use letters and numbers only',
  bankName: (value) => !value || lettersOnlyPattern.test(value) ? '' : 'Use letters only',
  accountNumber: (value) => !value || numbersOnlyPattern.test(value) ? '' : 'Use numbers only',
  bankBranch: (value) => !value || lettersOnlyPattern.test(value) ? '' : 'Use letters only',
  healthPolicyNumber: (value) => !value || numbersOnlyPattern.test(value) ? '' : 'Use numbers only',
  retirementContributionAmount: (value) => !value || decimalNumberPattern.test(value) ? '' : 'Use numbers only',
  employerContributionAmount: (value) => !value || decimalNumberPattern.test(value) ? '' : 'Use numbers only',
  amountOrPercentage: (value) => !value || decimalNumberPattern.test(value) ? '' : 'Use numbers only',
  overtimeAmount: (value) => !value || decimalNumberPattern.test(value) ? '' : 'Use numbers only',
  allowanceAmount: (value) => !value || decimalNumberPattern.test(value) ? '' : 'Use numbers only',
}

const getLiveValidationError = (fieldKey, rawValue) => {
  const validator = liveValidationRules[fieldKey]

  if (!validator) return ''
  return validator(String(rawValue ?? '').trim())
}

const syncLiveValidationError = (fieldKey, rawValue) => {
  const message = getLiveValidationError(fieldKey, rawValue)
  const normalizedValue = String(rawValue ?? '').trim()

  if (message) {
    errors.value[fieldKey] = message
    return
  }

  if (errors.value[fieldKey] === 'Required' && normalizedValue) {
    delete errors.value[fieldKey]
    return
  }

  if (errors.value[fieldKey] && errors.value[fieldKey] !== 'Required' && !String(rawValue ?? '').trim()) {
    delete errors.value[fieldKey]
    return
  }

  if (errors.value[fieldKey] && errors.value[fieldKey] !== 'Required') {
    delete errors.value[fieldKey]
  }
}

const collectLiveValidationErrors = (fieldKeys = []) =>
  Object.fromEntries(
    fieldKeys
      .map((fieldKey) => [fieldKey, getLiveValidationError(fieldKey, form[fieldKey])])
      .filter(([, message]) => Boolean(message)),
  )

const countRestrictedFields = (settings = {}) =>
  Object.values(settings?.selectedFields || {})
    .flatMap((section) => Object.values(section || {}))
    .filter(Boolean)
    .length

const resetForm = () => {
  Object.assign(form, createForm(props.suggestedEmployeeId))
  errors.value = {}
  hasAttemptedStepSubmit.value = false
}

const activeStep = computed(() => stepItems[currentStepIndex.value])
const eligibilityRequiresMonths = computed(() => form.eligibility === 'After X months')
const canReviewStep = (index) => index <= furthestStepIndex.value

const goToStep = async (index) => {
  if (!canReviewStep(index) || index === currentStepIndex.value) return

  currentStepIndex.value = index
  hasAttemptedStepSubmit.value = false
  await nextTick()
  panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
}

const addOtherDeduction = () => {
  form.otherDeductions.push(createOtherDeductionEntry())
}

const removeOtherDeduction = (index) => {
  if (form.otherDeductions.length === 1) return

  form.otherDeductions.splice(index, 1)
  delete errors.value[`otherDeductionName-${index}`]
  delete errors.value[`otherDeductionAmount-${index}`]
  delete errors.value[`otherDeductionCurrency-${index}`]

  const nextErrors = {}
  Object.entries(errors.value).forEach(([key, value]) => {
    if (key.startsWith('otherDeduction')) {
      const match = key.match(/^(otherDeduction(?:Name|Amount|Currency)-)(\d+)$/)
      if (match && Number(match[2]) > index) {
        nextErrors[`${match[1]}${Number(match[2]) - 1}`] = value
      } else if (!match) {
        nextErrors[key] = value
      }
      return
    }

    nextErrors[key] = value
  })
  errors.value = nextErrors
}

const addOtherBenefit = () => {
  form.otherBenefits.push(createOtherBenefitEntry())
}

const removeOtherBenefit = (index) => {
  if (form.otherBenefits.length === 1) return

  form.otherBenefits.splice(index, 1)

  const nextErrors = {}
  Object.entries(errors.value).forEach(([key, value]) => {
    const match = key.match(/^(otherBenefit(?:CoverageLevel|LifeInsurance|PaidTimeOff|WellnessPrograms|Details)-)(\d+)$/)
    if (!match) {
      nextErrors[key] = value
      return
    }

    const keyIndex = Number(match[2])
    if (keyIndex < index) {
      nextErrors[key] = value
      return
    }

    if (keyIndex > index) {
      nextErrors[`${match[1]}${keyIndex - 1}`] = value
    }
  })

  errors.value = nextErrors
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      resetForm()
      currentStepIndex.value = 0
      furthestStepIndex.value = 0
      if (props.submitError) {
        emit('clear-submit-error')
      }
      await nextTick()
      panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    }
  },
)

watch(
  () => form.eligibility,
  (value) => {
    if (value !== 'After X months') {
      form.months = ''
      delete errors.value.months
    }
  },
)

watch(
  () => Object.keys(liveValidationRules).map((fieldKey) => form[fieldKey]),
  () => {
    if (props.submitError) {
      emit('clear-submit-error')
    }

    Object.keys(liveValidationRules).forEach((fieldKey) => {
      syncLiveValidationError(fieldKey, form[fieldKey])
    })

    if (hasAttemptedStepSubmit.value) {
      validateCurrentStepLive()
    }
  },
)

watch(
  () => [
    currentStepIndex.value,
    form.gender,
    form.birthDate,
    form.nationality,
    form.country,
    form.state,
    form.workEmail,
    form.personalEmail,
    form.jobLocation,
    form.team,
    form.manager,
    form.supervisor,
    form.workSchedule,
    form.employmentType,
    form.annualLeaveEntitlement,
    form.validityOfContract,
    form.joiningDate,
    form.currency,
    form.payFrequency,
    form.bonusType,
    form.bonusFrequency,
    form.calculationBasis,
    form.bonusCurrency,
    form.eligibility,
    form.overtimeRateType,
    form.overtimeCurrency,
    form.appliesAfter,
    form.allowanceName,
    form.allowanceType,
    form.overtimePayoutFrequency,
    JSON.stringify(form.otherDeductions),
    form.taxFilingStatus,
    form.bankCountry,
    form.accountType,
    form.healthInsuranceProvider,
    form.healthCoverageLevel,
    form.healthStartDate,
    form.retirementPlanType,
    form.retirementCoverageLevel,
    form.retirementContributionType,
    form.retirementContributionCurrency,
    form.employerContributionType,
    form.employerContributionCurrency,
    JSON.stringify(form.otherBenefits),
    form.miscStartDate,
    form.openAccess,
    form.restrictedAccess,
    form.ndaFiles.length,
    form.employmentContractFiles.length,
    form.laborLawComplianceFiles.length,
    form.restrictedAccessSettings?.accessLevel,
  ],
  () => {
    if (props.submitError) {
      emit('clear-submit-error')
    }

    if (hasAttemptedStepSubmit.value) {
      validateCurrentStepLive()
    }
  },
)

const validateBasicInformation = () => {
  const nextErrors = collectLiveValidationErrors([
    'employeeId',
    'firstName',
    'lastName',
    'city',
    'zipCode',
    'workPhone',
    'mobilePhone',
    'homePhone',
  ])

  if (!form.employeeId.trim()) nextErrors.employeeId = 'Required'
  if (!form.firstName.trim()) nextErrors.firstName = 'Required'
  if (!form.lastName.trim()) nextErrors.lastName = 'Required'
  if (!form.gender) nextErrors.gender = 'Required'
  if (!form.birthDate) nextErrors.birthDate = 'Required'
  if (!form.nationality) nextErrors.nationality = 'Required'
  if (!form.country) nextErrors.country = 'Required'
  if (!form.city.trim()) nextErrors.city = 'Required'
  if (!form.state) nextErrors.state = 'Required'
  if (!form.zipCode) nextErrors.zipCode = 'Required'
  if (!form.workPhone.trim()) nextErrors.workPhone = 'Required'
  if (!form.mobilePhone.trim()) nextErrors.mobilePhone = 'Required'
  if (!form.workEmail.trim()) nextErrors.workEmail = 'Required'
  if (!form.personalEmail.trim()) nextErrors.personalEmail = 'Required'

  if (form.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail)) {
    nextErrors.workEmail = 'Invalid email'
  }

  if (form.personalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.personalEmail)) {
    nextErrors.personalEmail = 'Invalid email'
  }

  Object.assign(errors.value, nextErrors)
  return Object.keys(nextErrors).length === 0
}

const validateWorkInformation = () => {
  const nextErrors = collectLiveValidationErrors([
    'jobPosition',
  ])

  if (!form.jobPosition.trim()) nextErrors.jobPosition = 'Required'
  if (!form.jobLocation) nextErrors.jobLocation = 'Required'
  if (!form.team) nextErrors.team = 'Required'
  if (!form.manager) nextErrors.manager = 'Required'
  if (!form.supervisor) nextErrors.supervisor = 'Required'
  if (!form.workSchedule) nextErrors.workSchedule = 'Required'

  Object.assign(errors.value, nextErrors)
  return Object.keys(nextErrors).length === 0
}

const validateEmploymentDetails = () => {
  const nextErrors = collectLiveValidationErrors([
    'grade',
    'department',
    'baseSalary',
    'amountOrPercentage',
    'months',
    'overtimeAmount',
    'allowanceAmount',
    'overtimeMaxHours',
    'retirementContributionAmount',
    'employerContributionAmount',
  ])

  if (!form.employmentType) nextErrors.employmentType = 'Required'
  if (!form.grade.trim()) nextErrors.grade = 'Required'
  if (!form.workHours) nextErrors.workHours = 'Required'
  if (!form.annualLeaveEntitlement) nextErrors.annualLeaveEntitlement = 'Required'
  if (!form.validityOfContract) nextErrors.validityOfContract = 'Required'
  if (!form.department.trim()) nextErrors.department = 'Required'
  if (!form.joiningDate) nextErrors.joiningDate = 'Required'
  if (!form.baseSalary.trim()) nextErrors.baseSalary = 'Required'
  if (!form.currency) nextErrors.currency = 'Required'
  if (!form.payFrequency) nextErrors.payFrequency = 'Required'
  if (!form.bonusType) nextErrors.bonusType = 'Required'
  if (!form.bonusFrequency) nextErrors.bonusFrequency = 'Required'
  if (!form.calculationBasis) nextErrors.calculationBasis = 'Required'
  if (!form.amountOrPercentage.trim()) nextErrors.amountOrPercentage = 'Required'
  if (!form.bonusCurrency) nextErrors.bonusCurrency = 'Required'
  if (!form.eligibility) nextErrors.eligibility = 'Required'
  if (eligibilityRequiresMonths.value && !form.months.trim()) nextErrors.months = 'Required'
  if (!form.overtimeRateType) nextErrors.overtimeRateType = 'Required'
  if (!form.overtimeAmount.trim()) nextErrors.overtimeAmount = 'Required'
  if (!form.overtimeCurrency) nextErrors.overtimeCurrency = 'Required'
  if (!form.appliesAfter) nextErrors.appliesAfter = 'Required'
  if (!form.allowanceName) nextErrors.allowanceName = 'Required'
  if (!form.allowanceType) nextErrors.allowanceType = 'Required'
  if (!form.allowanceAmount.trim()) nextErrors.allowanceAmount = 'Required'
  if (!form.overtimeMaxHours.trim()) nextErrors.overtimeMaxHours = 'Required'
  if (!form.overtimePayoutFrequency) nextErrors.overtimePayoutFrequency = 'Required'
  if (!form.healthInsurance.trim()) nextErrors.healthInsurance = 'Required'
  if (!form.retirementContributions.trim()) nextErrors.retirementContributions = 'Required'
  form.otherDeductions.forEach((deduction, index) => {
    if (!String(deduction.name || '').trim()) nextErrors[`otherDeductionName-${index}`] = 'Required'
    if (!String(deduction.amount || '').trim()) {
      nextErrors[`otherDeductionAmount-${index}`] = 'Required'
    } else if (!decimalNumberPattern.test(String(deduction.amount).trim())) {
      nextErrors[`otherDeductionAmount-${index}`] = 'Use numbers only'
    }
    if (!deduction.currency) nextErrors[`otherDeductionCurrency-${index}`] = 'Required'
  })

  Object.assign(errors.value, nextErrors)
  return Object.keys(nextErrors).length === 0
}

const validateTaxInformation = () => {
  const nextErrors = collectLiveValidationErrors([
    'taxIdentificationNumber',
  ])

  if (!form.taxIdentificationNumber.trim()) nextErrors.taxIdentificationNumber = 'Required'
  if (!form.taxFilingStatus) nextErrors.taxFilingStatus = 'Required'
  if (!form.taxExemptionsAndAllowances.trim()) nextErrors.taxExemptionsAndAllowances = 'Required'
  if (!form.localStateFederalTaxRates.trim()) nextErrors.localStateFederalTaxRates = 'Required'

  Object.assign(errors.value, nextErrors)
  return Object.keys(nextErrors).length === 0
}

const validateBankInformation = () => {
  const nextErrors = collectLiveValidationErrors([
    'bankName',
    'accountNumber',
    'bankBranch',
  ])

  if (!form.bankCountry) nextErrors.bankCountry = 'Required'
  if (!form.bankName.trim()) nextErrors.bankName = 'Required'
  if (!form.accountNumber.trim()) nextErrors.accountNumber = 'Required'
  if (!form.bankBranch.trim()) nextErrors.bankBranch = 'Required'
  if (!form.accountType) nextErrors.accountType = 'Required'
  if (!form.bankAddress.trim()) nextErrors.bankAddress = 'Required'
  if (!form.swiftBicCode.trim()) nextErrors.swiftBicCode = 'Required'

  Object.assign(errors.value, nextErrors)
  return Object.keys(nextErrors).length === 0
}

const validateBenefitsInformation = () => {
  const nextErrors = collectLiveValidationErrors([
    'healthPolicyNumber',
    'retirementContributionAmount',
    'employerContributionAmount',
  ])

  if (!form.healthInsuranceProvider) nextErrors.healthInsuranceProvider = 'Required'
  if (!form.healthCoverageLevel) nextErrors.healthCoverageLevel = 'Required'
  if (!form.healthStartDate) nextErrors.healthStartDate = 'Required'
  if (!form.healthCoverageDetails.trim()) nextErrors.healthCoverageDetails = 'Required'
  if (!form.retirementPlanType) nextErrors.retirementPlanType = 'Required'
  if (!form.retirementCoverageLevel) nextErrors.retirementCoverageLevel = 'Required'
  if (!form.retirementContributionType) nextErrors.retirementContributionType = 'Required'
  if (!form.retirementContributionAmount.trim()) nextErrors.retirementContributionAmount = 'Required'
  if (!form.retirementContributionCurrency) nextErrors.retirementContributionCurrency = 'Required'
  if (!form.employerContributionType) nextErrors.employerContributionType = 'Required'
  if (!form.employerContributionAmount.trim()) nextErrors.employerContributionAmount = 'Required'
  if (!form.employerContributionCurrency) nextErrors.employerContributionCurrency = 'Required'
  form.otherBenefits.forEach((benefit, index) => {
    if (!benefit.coverageLevel) nextErrors[`otherBenefitCoverageLevel-${index}`] = 'Required'
    if (!String(benefit.lifeInsurance || '').trim()) nextErrors[`otherBenefitLifeInsurance-${index}`] = 'Required'
    if (!String(benefit.paidTimeOff || '').trim()) nextErrors[`otherBenefitPaidTimeOff-${index}`] = 'Required'
    if (!String(benefit.wellnessPrograms || '').trim()) nextErrors[`otherBenefitWellnessPrograms-${index}`] = 'Required'
    if (!String(benefit.details || '').trim()) nextErrors[`otherBenefitDetails-${index}`] = 'Required'
  })
  if (!form.miscStartDate) nextErrors.miscStartDate = 'Required'
  if (!form.paymentMethod.trim()) nextErrors.paymentMethod = 'Required'
  if (!form.performanceBonuses.trim()) nextErrors.performanceBonuses = 'Required'

  Object.assign(errors.value, nextErrors)
  return Object.keys(nextErrors).length === 0
}

const validateComplianceInformation = () => {
  const nextErrors = {}
  const restrictedFieldsCount = countRestrictedFields(form.restrictedAccessSettings)

  if (!form.openAccess && !form.restrictedAccess) nextErrors.accessProfile = 'Choose open or restricted access'
  if (form.restrictedAccess && !String(form.restrictedAccessSettings?.accessLevel || '').trim()) {
    nextErrors.restrictedAccessSettings = 'Configure restricted access level'
  }
  Object.assign(errors.value, nextErrors)
  return Object.keys(nextErrors).length === 0
}

const validateCurrentStepLive = () => {
  if (!props.open) return

  if (currentStepIndex.value === 0) return void validateBasicInformation()
  if (currentStepIndex.value === 1) return void validateWorkInformation()
  if (currentStepIndex.value === 2) return void validateEmploymentDetails()
  if (currentStepIndex.value === 3) return void validateTaxInformation()
  if (currentStepIndex.value === 4) return void validateBankInformation()
  if (currentStepIndex.value === 5) return void validateBenefitsInformation()

  validateComplianceInformation()
}

const clearStepErrors = (keys) => {
  for (const key of keys) {
    delete errors.value[key]
  }
}

const goToNextStep = async () => {
  if (currentStepIndex.value === 0) {
    hasAttemptedStepSubmit.value = true
    clearStepErrors([
      'employeeId',
      'firstName',
      'lastName',
      'gender',
      'birthDate',
      'nationality',
      'country',
      'city',
      'state',
      'zipCode',
      'workPhone',
      'mobilePhone',
      'workEmail',
      'personalEmail',
    ])

    if (!validateBasicInformation()) return

    hasAttemptedStepSubmit.value = false
    currentStepIndex.value = 1
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 1)
    await nextTick()
    panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  if (currentStepIndex.value === 1) {
    hasAttemptedStepSubmit.value = true
    clearStepErrors([
      'jobPosition',
      'jobLocation',
      'team',
      'manager',
      'supervisor',
      'workSchedule',
    ])

    if (!validateWorkInformation()) return

    hasAttemptedStepSubmit.value = false
    currentStepIndex.value = 2
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 2)
    await nextTick()
    panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  if (currentStepIndex.value === 2) {
    hasAttemptedStepSubmit.value = true
    clearStepErrors([
      'employmentType',
      'grade',
      'workHours',
      'annualLeaveEntitlement',
      'validityOfContract',
      'department',
      'joiningDate',
      'baseSalary',
      'currency',
      'payFrequency',
      'bonusType',
      'bonusFrequency',
      'calculationBasis',
      'amountOrPercentage',
      'bonusCurrency',
      'eligibility',
      'months',
      'overtimeRateType',
      'overtimeAmount',
      'overtimeCurrency',
      'appliesAfter',
      'allowanceName',
      'allowanceType',
      'allowanceAmount',
      'overtimeMaxHours',
      'overtimePayoutFrequency',
      'healthInsurance',
      'retirementContributions',
    ])

    Object.keys(errors.value)
      .filter((key) => key.startsWith('otherDeduction'))
      .forEach((key) => delete errors.value[key])

    if (!validateEmploymentDetails()) return

    hasAttemptedStepSubmit.value = false
    currentStepIndex.value = 3
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 3)
    await nextTick()
    panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  if (currentStepIndex.value === 3) {
    hasAttemptedStepSubmit.value = true
    clearStepErrors([
      'taxIdentificationNumber',
      'taxFilingStatus',
      'taxExemptionsAndAllowances',
      'localStateFederalTaxRates',
    ])

    if (!validateTaxInformation()) return

    hasAttemptedStepSubmit.value = false
    currentStepIndex.value = 4
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 4)
    await nextTick()
    panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  if (currentStepIndex.value === 4) {
    hasAttemptedStepSubmit.value = true
    clearStepErrors([
      'bankCountry',
      'bankName',
      'accountNumber',
      'bankBranch',
      'accountType',
      'bankAddress',
      'swiftBicCode',
    ])

    if (!validateBankInformation()) return

    hasAttemptedStepSubmit.value = false
    currentStepIndex.value = 5
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 5)
    await nextTick()
    panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  if (currentStepIndex.value === 5) {
    hasAttemptedStepSubmit.value = true
    clearStepErrors([
      'healthInsuranceProvider',
      'healthPolicyNumber',
      'healthCoverageLevel',
      'healthStartDate',
      'healthCoverageDetails',
      'retirementPlanType',
      'retirementCoverageLevel',
      'retirementContributionType',
      'retirementContributionAmount',
      'retirementContributionCurrency',
      'employerContributionType',
      'employerContributionAmount',
      'employerContributionCurrency',
      'miscStartDate',
      'paymentMethod',
      'performanceBonuses',
    ])

    Object.keys(errors.value)
      .filter((key) => key.startsWith('otherBenefit'))
      .forEach((key) => delete errors.value[key])

    if (!validateBenefitsInformation()) return

    hasAttemptedStepSubmit.value = false
    currentStepIndex.value = 6
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 6)
    await nextTick()
    panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
    return
  }

  hasAttemptedStepSubmit.value = true
  clearStepErrors([
    'ndaFiles',
    'employmentContractFiles',
    'laborLawComplianceFiles',
  ])

  if (!validateComplianceInformation()) return

  hasAttemptedStepSubmit.value = false
  emit('save', {
    ...form,
    employeeId: form.employeeId.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    city: form.city.trim(),
    workPhone: form.workPhone.trim(),
    mobilePhone: form.mobilePhone.trim(),
    homePhone: form.homePhone.trim(),
    workEmail: form.workEmail.trim(),
    personalEmail: form.personalEmail.trim(),
    jobPosition: form.jobPosition.trim(),
    department: form.department.trim(),
    taxIdentificationNumber: form.taxIdentificationNumber.trim(),
    bankName: form.bankName.trim(),
    accountNumber: form.accountNumber.trim(),
    iban: form.iban.trim(),
    healthPolicyNumber: form.healthPolicyNumber.trim(),
    otherDeductions: form.otherDeductions.map((deduction) => ({
      name: String(deduction.name || '').trim(),
      amount: String(deduction.amount || '').trim(),
      currency: deduction.currency,
    })),
    restrictedAccess: form.restrictedAccess,
    openAccess: form.openAccess,
    attachments: [...form.attachments],
  })

}

const goToPreviousStep = async () => {
  if (currentStepIndex.value === 0) return
  hasAttemptedStepSubmit.value = false
  currentStepIndex.value -= 1
  await nextTick()
  panelRef.value?.scrollTo({ top: 0, behavior: 'auto' })
}

const triggerFileSelect = () => {
  legalUploadContext.value = 'attachments'
  fileInputRef.value?.click()
}

const appendFiles = (fileList) => {
  const nextFiles = Array.from(fileList || [])
  if (!nextFiles.length) return

  const key = legalUploadContext.value || 'attachments'
  const currentFiles = Array.isArray(form[key]) ? form[key] : []
  const existingKeys = new Set(currentFiles.map((file) => `${file.name}-${file.size}`))
  form[key] = [
    ...currentFiles,
    ...nextFiles.filter((file) => !existingKeys.has(`${file.name}-${file.size}`)),
  ]
}

const handleFileChange = (event) => {
  appendFiles(event.target.files)
  event.target.value = ''
}

const handleDrop = (event) => {
  appendFiles(event.dataTransfer?.files)
}

const removeAttachment = (fileName) => {
  form.attachments = form.attachments.filter((file) => file.name !== fileName)
}

const triggerLegalFileSelect = (context) => {
  legalUploadContext.value = context
  fileInputRef.value?.click()
}

const removeLegalAttachment = (context, fileName) => {
  form[context] = form[context].filter((file) => file.name !== fileName)
}

const handleRestrictedAccessChange = (event) => {
  const checked = event.target.checked
  form.restrictedAccess = checked

  if (checked) {
    isRestrictedAccessModalOpen.value = true
    return
  }

  form.restrictedAccessSettings = {}
}

const handleSaveRestrictedAccess = (payload) => {
  form.restrictedAccess = true
  form.restrictedAccessSettings = payload
  isRestrictedAccessModalOpen.value = false
}
</script>

<template>
  <div v-if="open" class="add-employee-modal">
    <div class="add-employee-modal__overlay" aria-hidden="true"></div>

    <section ref="panelRef" class="add-employee-modal__panel" role="dialog" aria-modal="true" aria-label="Add New Employee">
      <header class="add-employee-modal__header">
        <div class="add-employee-modal__title-wrap">
          <span class="add-employee-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.8" />
              <circle cx="12" cy="10" r="2.7" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M7.7 16.4c1.3-2 2.8-3.1 4.3-3.1s3 1.1 4.3 3.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <h2 class="add-employee-modal__title">Add New Employee</h2>
        </div>

        <button class="add-employee-modal__close" type="button" aria-label="Close add employee modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="add-employee-modal__steps">
        <div
          v-for="(step, index) in stepItems"
          :key="step.label"
          class="add-employee-modal__step"
          :class="{
            'add-employee-modal__step--active': step === activeStep,
            'add-employee-modal__step--completed': index <= furthestStepIndex,
            'add-employee-modal__step--reviewable': canReviewStep(index),
          }"
          :style="{ '--step-color': step.color }"
          @click="goToStep(index)"
        >
          {{ step.label }}
        </div>
      </div>

      <div class="add-employee-modal__body">
        <div v-if="currentStepIndex === 0" class="add-employee-modal__grid">
          <label class="field field--full">
            <span class="field__label">Employee ID</span>
            <input
              v-model="form.employeeId"
              class="field__control"
              :class="{ 'field__control--error': errors.employeeId }"
              type="text"
              name="employee-id"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="Employee ID"
            />
            <span v-if="errors.employeeId" class="field__error">{{ errors.employeeId }}</span>
          </label>

          <label class="field">
            <span class="field__label">First Name</span>
            <input v-model="form.firstName" class="field__control" :class="{ 'field__control--error': errors.firstName }" type="text" placeholder="First Name" />
            <span v-if="errors.firstName" class="field__error">{{ errors.firstName }}</span>
          </label>

          <label class="field">
            <span class="field__label">Last Name</span>
            <input v-model="form.lastName" class="field__control" :class="{ 'field__control--error': errors.lastName }" type="text" placeholder="Last Name" />
            <span v-if="errors.lastName" class="field__error">{{ errors.lastName }}</span>
          </label>

          <div class="field">
            <span class="field__label">Gender</span>
            <Dropdown v-model="form.gender" :options="genderOptions" placeholder="Add" />
            <span v-if="errors.gender" class="field__error">{{ errors.gender }}</span>
          </div>

          <label class="field">
            <span class="field__label">Birth Date</span>
            <DatePicker v-model="form.birthDate" />
            <span v-if="errors.birthDate" class="field__error">{{ errors.birthDate }}</span>
          </label>

          <div class="field field--full">
            <span class="field__label">Nationality</span>
            <Dropdown v-model="form.nationality" :options="nationalityOptions" placeholder="Please select" />
            <span v-if="errors.nationality" class="field__error">{{ errors.nationality }}</span>
          </div>

          <div class="field">
            <span class="field__label">Country</span>
            <Dropdown v-model="form.country" :options="countryOptions" placeholder="Please select" />
            <span v-if="errors.country" class="field__error">{{ errors.country }}</span>
          </div>

          <label class="field">
            <span class="field__label">City</span>
            <input v-model="form.city" class="field__control" :class="{ 'field__control--error': errors.city }" type="text" placeholder="City" />
            <span v-if="errors.city" class="field__error">{{ errors.city }}</span>
          </label>

          <div class="field">
            <span class="field__label">State</span>
            <Dropdown v-model="form.state" :options="stateOptions" placeholder="State" />
            <span v-if="errors.state" class="field__error">{{ errors.state }}</span>
          </div>

          <div class="field">
            <span class="field__label">Zip code</span>
            <Dropdown v-model="form.zipCode" :options="zipCodeOptions" placeholder="Zip" />
            <span v-if="errors.zipCode" class="field__error">{{ errors.zipCode }}</span>
          </div>

          <label class="field">
            <span class="field__label">Work Phone</span>
            <input v-model="form.workPhone" class="field__control" :class="{ 'field__control--error': errors.workPhone }" type="text" placeholder="Work Phone" />
            <span v-if="errors.workPhone" class="field__error">{{ errors.workPhone }}</span>
          </label>

          <label class="field">
            <span class="field__label">Mobile Phone</span>
            <input v-model="form.mobilePhone" class="field__control" :class="{ 'field__control--error': errors.mobilePhone }" type="text" placeholder="Mobile Phone" />
            <span v-if="errors.mobilePhone" class="field__error">{{ errors.mobilePhone }}</span>
          </label>

          <label class="field">
            <span class="field__label">Home Phone</span>
            <input v-model="form.homePhone" class="field__control" type="text" placeholder="Home Phone" />
          </label>

          <label class="field">
            <span class="field__label">Work Email</span>
            <input v-model="form.workEmail" class="field__control" :class="{ 'field__control--error': errors.workEmail }" type="email" placeholder="Work Email" />
            <span v-if="errors.workEmail" class="field__error">{{ errors.workEmail }}</span>
          </label>

          <label class="field">
            <span class="field__label">Personal Email</span>
            <input v-model="form.personalEmail" class="field__control" :class="{ 'field__control--error': errors.personalEmail }" type="email" placeholder="Personal Email" />
            <span v-if="errors.personalEmail" class="field__error">{{ errors.personalEmail }}</span>
          </label>

        </div>

        <div v-else-if="currentStepIndex === 1" class="add-employee-modal__work-step">
          <label class="field field--full">
            <span class="field__label">Job Position</span>
            <input v-model="form.jobPosition" class="field__control" :class="{ 'field__control--error': errors.jobPosition }" type="text" placeholder="Job Position" />
            <span v-if="errors.jobPosition" class="field__error">{{ errors.jobPosition }}</span>
          </label>

          <div class="field field--full">
            <span class="field__label">Job Location</span>
            <Dropdown v-model="form.jobLocation" :options="jobLocationOptions" placeholder="Please select" />
            <span v-if="errors.jobLocation" class="field__error">{{ errors.jobLocation }}</span>
          </div>

          <div class="field field--full">
            <span class="field__label">Team</span>
            <Dropdown v-model="form.team" :options="teamOptions" placeholder="Please Select" />
            <span v-if="errors.team" class="field__error">{{ errors.team }}</span>
          </div>

          <div class="add-employee-modal__grid">
            <div class="field">
              <span class="field__label">Manager</span>
              <Dropdown v-model="form.manager" :options="managerOptions" placeholder="Please select" />
              <span v-if="errors.manager" class="field__error">{{ errors.manager }}</span>
            </div>

            <div class="field">
              <span class="field__label">Supervisor</span>
              <Dropdown v-model="form.supervisor" :options="supervisorOptions" placeholder="Please select" />
              <span v-if="errors.supervisor" class="field__error">{{ errors.supervisor }}</span>
            </div>
          </div>

          <div class="field field--full">
            <span class="field__label">Work Schedule</span>
            <Dropdown v-model="form.workSchedule" :options="workScheduleOptions" placeholder="Please select" />
            <span v-if="errors.workSchedule" class="field__error">{{ errors.workSchedule }}</span>
          </div>

          <div class="field field--full">
            <span class="field__label">Attach Files</span>
            <input ref="fileInputRef" class="add-employee-modal__file-input" type="file" multiple @change="handleFileChange" />

            <div
              class="add-employee-modal__dropzone"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <button type="button" class="add-employee-modal__dropzone-button" @click="triggerFileSelect">
                <span class="add-employee-modal__upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 16.5V7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="m8.5 11 3.5-3.5 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6 17.5h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </span>
                <span>Drag and Drop to upload files</span>
                <span class="add-employee-modal__dropzone-link">or select files</span>
              </button>
            </div>

            <div v-if="form.attachments.length" class="add-employee-modal__attachments">
              <div v-for="file in form.attachments" :key="`${file.name}-${file.size}`" class="add-employee-modal__attachment">
                <span class="add-employee-modal__attachment-name">{{ file.name }}</span>
                <button type="button" class="add-employee-modal__attachment-remove" @click="removeAttachment(file.name)">Remove</button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentStepIndex === 2" class="add-employee-modal__work-step">
          <div class="add-employee-modal__grid add-employee-modal__grid--employment">
            <label class="field">
              <span class="field__label">Job Title</span>
              <input v-model="form.jobPosition" class="field__control" type="text" placeholder="Job title" />
            </label>

            <div class="field">
              <span class="field__label">Employment Type</span>
              <Dropdown v-model="form.employmentType" :options="employmentTypeOptions" placeholder="Please select" />
              <span v-if="errors.employmentType" class="field__error">{{ errors.employmentType }}</span>
            </div>

            <label class="field">
              <span class="field__label">Grade</span>
              <input v-model="form.grade" class="field__control" :class="{ 'field__control--error': errors.grade }" type="text" placeholder="Grade" />
              <span v-if="errors.grade" class="field__error">{{ errors.grade }}</span>
            </label>

              <label class="field">
                <span class="field__label">Work Hours</span>
                <input
                  v-model="form.workHours"
                  class="field__control"
                  :class="{ 'field__control--error': errors.workHours }"
                  type="text"
                  placeholder="Work Hours"
                />
                <span v-if="errors.workHours" class="field__error">{{ errors.workHours }}</span>
              </label>

              <label class="field">
                <span class="field__label">Annual Leave Entitlement</span>
                <input
                  v-model="form.annualLeaveEntitlement"
                  class="field__control"
                  :class="{ 'field__control--error': errors.annualLeaveEntitlement }"
                  type="text"
                  placeholder="Annual Leave Entitlement"
                />
                <span v-if="errors.annualLeaveEntitlement" class="field__error">{{ errors.annualLeaveEntitlement }}</span>
              </label>

            <label class="field">
              <span class="field__label">validity of contract</span>
              <DatePicker v-model="form.validityOfContract" />
              <span v-if="errors.validityOfContract" class="field__error">{{ errors.validityOfContract }}</span>
            </label>

            <div class="field">
              <span class="field__label">Department</span>
              <Dropdown v-model="form.department" :options="departmentOptions" placeholder="Department" />
              <span v-if="errors.department" class="field__error">{{ errors.department }}</span>
            </div>

            <label class="field">
              <span class="field__label">Joining Date</span>
              <DatePicker v-model="form.joiningDate" />
              <span v-if="errors.joiningDate" class="field__error">{{ errors.joiningDate }}</span>
            </label>

            <label class="field">
              <span class="field__label">Base salary</span>
              <input v-model="form.baseSalary" class="field__control" :class="{ 'field__control--error': errors.baseSalary }" type="text" placeholder="Base sal" />
              <span v-if="errors.baseSalary" class="field__error">{{ errors.baseSalary }}</span>
            </label>

            <div class="field">
              <span class="field__label">currency</span>
              <Dropdown v-model="form.currency" :options="currencyOptions" placeholder="USD" />
              <span v-if="errors.currency" class="field__error">{{ errors.currency }}</span>
            </div>

            <div class="field field--span-2">
              <span class="field__label">Pay Frequency</span>
              <Dropdown v-model="form.payFrequency" :options="payFrequencyOptions" placeholder="Please Select" />
              <span v-if="errors.payFrequency" class="field__error">{{ errors.payFrequency }}</span>
            </div>
          </div>

          <section class="add-employee-modal__section">
            <h3 class="add-employee-modal__section-title">Bonus and incentives</h3>
            <div class="add-employee-modal__grid add-employee-modal__grid--employment">
              <div class="field field--span-2">
                <span class="field__label">Type</span>
                <Dropdown v-model="form.bonusType" :options="bonusTypeOptions" placeholder="Please select" />
                <span v-if="errors.bonusType" class="field__error">{{ errors.bonusType }}</span>
              </div>

              <div class="field field--span-2">
                <span class="field__label">Frequency</span>
                <Dropdown v-model="form.bonusFrequency" :options="bonusFrequencyOptions" placeholder="Please Select" />
                <span v-if="errors.bonusFrequency" class="field__error">{{ errors.bonusFrequency }}</span>
              </div>

              <div class="field field--span-2">
                <span class="field__label">Calculation basis</span>
                <Dropdown v-model="form.calculationBasis" :options="calculationBasisOptions" placeholder="Please Select" />
                <span v-if="errors.calculationBasis" class="field__error">{{ errors.calculationBasis }}</span>
              </div>

              <label class="field">
                <span class="field__label">Amount / Percentage</span>
                <input v-model="form.amountOrPercentage" class="field__control" :class="{ 'field__control--error': errors.amountOrPercentage }" type="text" placeholder="Amount / Percentage" />
                <span v-if="errors.amountOrPercentage" class="field__error">{{ errors.amountOrPercentage }}</span>
              </label>

              <div class="field">
                <span class="field__label">Currency</span>
                <Dropdown v-model="form.bonusCurrency" :options="currencyOptions" placeholder="USD" />
                <span v-if="errors.bonusCurrency" class="field__error">{{ errors.bonusCurrency }}</span>
              </div>

              <div class="field field--span-2">
                <span class="field__label">Eligibility</span>
                <Dropdown v-model="form.eligibility" :options="eligibilityOptions" placeholder="Eligibility" />
                <span v-if="errors.eligibility" class="field__error">{{ errors.eligibility }}</span>
              </div>

              <label v-if="eligibilityRequiresMonths" class="field">
                <span class="field__label">Months</span>
                <input v-model="form.months" class="field__control" :class="{ 'field__control--error': errors.months }" type="text" placeholder="e.g 6" />
                <span v-if="errors.months" class="field__error">{{ errors.months }}</span>
              </label>
            </div>
          </section>

          <section class="add-employee-modal__section">
            <div class="add-employee-modal__grid add-employee-modal__grid--employment">
              <div class="field">
                <span class="field__label">Overtime Rate Type</span>
                <Dropdown v-model="form.overtimeRateType" :options="overtimeRateTypeOptions" placeholder="Please Select" />
                <span v-if="errors.overtimeRateType" class="field__error">{{ errors.overtimeRateType }}</span>
              </div>

              <label class="field">
                <span class="field__label">Amount</span>
                <input v-model="form.overtimeAmount" class="field__control" :class="{ 'field__control--error': errors.overtimeAmount }" type="text" placeholder="2500" />
                <span v-if="errors.overtimeAmount" class="field__error">{{ errors.overtimeAmount }}</span>
              </label>

              <div class="field">
                <span class="field__label">Currency</span>
                <Dropdown v-model="form.overtimeCurrency" :options="overtimeCurrencyOptions" placeholder="Please Select" />
                <span v-if="errors.overtimeCurrency" class="field__error">{{ errors.overtimeCurrency }}</span>
              </div>

              <div class="field field--span-2">
                <span class="field__label">Applies After</span>
                <Dropdown v-model="form.appliesAfter" :options="appliesAfterOptions" placeholder="Please select" />
                <span v-if="errors.appliesAfter" class="field__error">{{ errors.appliesAfter }}</span>
              </div>

              <div class="field field--span-2">
                <span class="field__label">Eligibility Day (optional)</span>
                <Dropdown v-model="form.eligibilityDay" :options="eligibilityDayOptions" placeholder="Please Select" />
              </div>
            </div>
          </section>

          <section class="add-employee-modal__section">
            <h3 class="add-employee-modal__section-title">Additional compensation</h3>
            <div class="add-employee-modal__grid add-employee-modal__grid--employment">
              <div class="field">
                <span class="field__label">Allowance name</span>
                <Dropdown v-model="form.allowanceName" :options="allowanceNameOptions" placeholder="Please Select" />
                <span v-if="errors.allowanceName" class="field__error">{{ errors.allowanceName }}</span>
              </div>

              <div class="field">
                <span class="field__label">Type</span>
                <Dropdown v-model="form.allowanceType" :options="allowanceTypeOptions" placeholder="Please Select" />
                <span v-if="errors.allowanceType" class="field__error">{{ errors.allowanceType }}</span>
              </div>

              <label class="field">
                <span class="field__label">Amount</span>
                <input v-model="form.allowanceAmount" class="field__control" :class="{ 'field__control--error': errors.allowanceAmount }" type="text" placeholder="Amount" />
                <span v-if="errors.allowanceAmount" class="field__error">{{ errors.allowanceAmount }}</span>
              </label>
            </div>
          </section>

          <section class="add-employee-modal__section">
            <h3 class="add-employee-modal__section-title">Overtime Pay</h3>
            <div class="add-employee-modal__grid add-employee-modal__grid--employment">
              <label class="field">
                <span class="field__label">max hours eligible</span>
                <input v-model="form.overtimeMaxHours" class="field__control" :class="{ 'field__control--error': errors.overtimeMaxHours }" type="text" placeholder="2" />
                <span v-if="errors.overtimeMaxHours" class="field__error">{{ errors.overtimeMaxHours }}</span>
              </label>

              <div class="field field--span-2">
                <span class="field__label">Frequency of payout</span>
                <Dropdown v-model="form.overtimePayoutFrequency" :options="payoutFrequencyOptions" placeholder="Please select" />
                <span v-if="errors.overtimePayoutFrequency" class="field__error">{{ errors.overtimePayoutFrequency }}</span>
              </div>
            </div>
          </section>

          <section class="add-employee-modal__section">
            <h3 class="add-employee-modal__section-title">Deductions</h3>
            <div class="add-employee-modal__grid add-employee-modal__grid--employment">
              <label class="field">
                <span class="field__label">Health Insurance</span>
                <input v-model="form.healthInsurance" class="field__control" :class="{ 'field__control--error': errors.healthInsurance }" type="text" placeholder="Health Insurance" />
                <span v-if="errors.healthInsurance" class="field__error">{{ errors.healthInsurance }}</span>
              </label>

              <label class="field">
                <span class="field__label">Retirement Contributions</span>
                <input v-model="form.retirementContributions" class="field__control" :class="{ 'field__control--error': errors.retirementContributions }" type="text" placeholder="Retirement Contributions" />
                <span v-if="errors.retirementContributions" class="field__error">{{ errors.retirementContributions }}</span>
              </label>
            </div>
          </section>

          <section class="add-employee-modal__section">
            <div class="add-employee-modal__section-head">
              <h3 class="add-employee-modal__section-title">Other Deductions</h3>
              <button type="button" class="add-employee-modal__add-row" @click="addOtherDeduction">+</button>
            </div>
            <div
              v-for="(deduction, index) in form.otherDeductions"
              :key="`other-deduction-${index}`"
              class="add-employee-modal__grid add-employee-modal__grid--employment add-employee-modal__repeat-row"
            >
              <label class="field">
                <span class="field__label">Names</span>
                <input
                  v-model="deduction.name"
                  class="field__control"
                  :class="{ 'field__control--error': errors[`otherDeductionName-${index}`] }"
                  type="text"
                  placeholder="Names"
                />
                <span v-if="errors[`otherDeductionName-${index}`]" class="field__error">{{ errors[`otherDeductionName-${index}`] }}</span>
              </label>

              <label class="field">
                <span class="field__label">Amount</span>
                <input
                  v-model="deduction.amount"
                  class="field__control"
                  :class="{ 'field__control--error': errors[`otherDeductionAmount-${index}`] }"
                  type="text"
                  placeholder="Amount"
                />
                <span v-if="errors[`otherDeductionAmount-${index}`]" class="field__error">{{ errors[`otherDeductionAmount-${index}`] }}</span>
              </label>

              <div class="field">
                <span class="field__label">Currency</span>
                <Dropdown v-model="deduction.currency" :options="currencyOptions" placeholder="Please select" />
                <span v-if="errors[`otherDeductionCurrency-${index}`]" class="field__error">{{ errors[`otherDeductionCurrency-${index}`] }}</span>
              </div>

              <div v-if="form.otherDeductions.length > 1" class="field field--actions">
                <span class="field__label field__label--hidden">Remove</span>
                <button type="button" class="add-employee-modal__remove-row" @click="removeOtherDeduction(index)">Remove</button>
              </div>
            </div>
          </section>
        </div>

        <div v-else-if="currentStepIndex === 3" class="add-employee-modal__work-step">
          <div class="field field--full">
            <span class="field__label">Tax Identification Number</span>
            <input
              v-model="form.taxIdentificationNumber"
              class="field__control"
              :class="{ 'field__control--error': errors.taxIdentificationNumber }"
              type="text"
              placeholder="Tax Identification Number"
            />
            <span v-if="errors.taxIdentificationNumber" class="field__error">{{ errors.taxIdentificationNumber }}</span>
          </div>

          <div class="field field--full">
            <span class="field__label">Tax Filing Status</span>
            <Dropdown
              v-model="form.taxFilingStatus"
              :options="taxFilingStatusOptions"
              placeholder="Please select"
              teleport
              menu-size="small"
            />
            <span v-if="errors.taxFilingStatus" class="field__error">{{ errors.taxFilingStatus }}</span>
          </div>

          <div class="add-employee-modal__grid">
            <label class="field">
              <span class="field__label">Exemptions and allowances</span>
              <input
                v-model="form.taxExemptionsAndAllowances"
                class="field__control"
                :class="{ 'field__control--error': errors.taxExemptionsAndAllowances }"
                type="text"
                placeholder="Exemptions and allowances"
              />
              <span v-if="errors.taxExemptionsAndAllowances" class="field__error">{{ errors.taxExemptionsAndAllowances }}</span>
            </label>

            <label class="field">
              <span class="field__label">Local, State,Federal Tax Rates</span>
              <input
                v-model="form.localStateFederalTaxRates"
                class="field__control"
                :class="{ 'field__control--error': errors.localStateFederalTaxRates }"
                type="text"
                placeholder="Local, State,Federal Tax Rates"
              />
              <span v-if="errors.localStateFederalTaxRates" class="field__error">{{ errors.localStateFederalTaxRates }}</span>
            </label>
          </div>
        </div>

        <div v-else-if="currentStepIndex === 4" class="add-employee-modal__work-step">
          <div class="field field--full">
            <span class="field__label">Country</span>
            <Dropdown
              v-model="form.bankCountry"
              :options="countryOptions"
              placeholder="Please select"
            />
            <span v-if="errors.bankCountry" class="field__error">{{ errors.bankCountry }}</span>
          </div>

          <div class="field field--full">
            <span class="field__label">Bank Name</span>
            <input
              v-model="form.bankName"
              class="field__control"
              :class="{ 'field__control--error': errors.bankName }"
              type="text"
              placeholder="Bank Name"
            />
            <span v-if="errors.bankName" class="field__error">{{ errors.bankName }}</span>
          </div>

          <div class="field field--full">
            <span class="field__label">Account Number</span>
            <input
              v-model="form.accountNumber"
              class="field__control"
              :class="{ 'field__control--error': errors.accountNumber }"
              type="text"
              placeholder="Account Number"
            />
            <span v-if="errors.accountNumber" class="field__error">{{ errors.accountNumber }}</span>
          </div>

          <div class="add-employee-modal__grid">
            <label class="field">
              <span class="field__label">Bank Branch</span>
              <input
                v-model="form.bankBranch"
                class="field__control"
                :class="{ 'field__control--error': errors.bankBranch }"
                type="text"
                placeholder="Bank Branch"
              />
              <span v-if="errors.bankBranch" class="field__error">{{ errors.bankBranch }}</span>
            </label>

            <div class="field">
              <span class="field__label">Account Type</span>
              <Dropdown
                v-model="form.accountType"
                :options="accountTypeOptions"
                placeholder="Please select"
              />
              <span v-if="errors.accountType" class="field__error">{{ errors.accountType }}</span>
            </div>
          </div>

          <div class="field field--full">
            <span class="field__label">Bank Address</span>
            <input
              v-model="form.bankAddress"
              class="field__control"
              :class="{ 'field__control--error': errors.bankAddress }"
              type="text"
              placeholder="Bank Address"
            />
            <span v-if="errors.bankAddress" class="field__error">{{ errors.bankAddress }}</span>
          </div>

          <div class="add-employee-modal__grid">
            <label class="field">
              <span class="field__label">Swift BIC Code</span>
              <input
                v-model="form.swiftBicCode"
                class="field__control"
                :class="{ 'field__control--error': errors.swiftBicCode }"
                type="text"
                placeholder="Swift BIC Code"
              />
              <span v-if="errors.swiftBicCode" class="field__error">{{ errors.swiftBicCode }}</span>
            </label>

            <label class="field">
              <span class="field__label">IBAN</span>
              <input
                v-model="form.iban"
                class="field__control"
                type="text"
                placeholder="IBAN"
              />
            </label>
          </div>
        </div>

        <div v-else-if="currentStepIndex === 5" class="add-employee-modal__work-step">
          <div class="add-employee-modal__grid add-employee-modal__grid--employment">
            <label class="field field--span-3">
              <span class="field__label">Health Insurance Provider</span>
              <input
                v-model="form.healthInsuranceProvider"
                class="field__control"
                :class="{ 'field__control--error': errors.healthInsuranceProvider }"
                type="text"
                placeholder="Swift BIC code"
              />
              <span v-if="errors.healthInsuranceProvider" class="field__error">{{ errors.healthInsuranceProvider }}</span>
            </label>

              <label class="field field--span-3">
                <span class="field__label">policy number</span>
                <input v-model="form.healthPolicyNumber" class="field__control" :class="{ 'field__control--error': errors.healthPolicyNumber }" type="text" placeholder="swift BIC code" />
                <span v-if="errors.healthPolicyNumber" class="field__error">{{ errors.healthPolicyNumber }}</span>
              </label>

            <div class="field">
              <span class="field__label">Coverage level</span>
              <Dropdown v-model="form.healthCoverageLevel" :options="dependentCoverageOptions" placeholder="Please select" />
              <span v-if="errors.healthCoverageLevel" class="field__error">{{ errors.healthCoverageLevel }}</span>
            </div>

            <label class="field">
              <span class="field__label">start date</span>
              <DatePicker v-model="form.healthStartDate" />
              <span v-if="errors.healthStartDate" class="field__error">{{ errors.healthStartDate }}</span>
            </label>

            <label class="field field--full">
              <span class="field__label">Coverage details</span>
              <input
                v-model="form.healthCoverageDetails"
                class="field__control"
                :class="{ 'field__control--error': errors.healthCoverageDetails }"
                type="text"
                placeholder="Coverage details"
              />
              <span v-if="errors.healthCoverageDetails" class="field__error">{{ errors.healthCoverageDetails }}</span>
            </label>
          </div>

          <section class="add-employee-modal__section">
            <h3 class="add-employee-modal__section-title">Retirement Plan</h3>
            <div class="add-employee-modal__grid add-employee-modal__grid--employment">
              <div class="field field--span-3">
                <span class="field__label">Retirement Plan Type</span>
                <Dropdown v-model="form.retirementPlanType" :options="retirementPlanTypeOptions" placeholder="Please select" />
                <span v-if="errors.retirementPlanType" class="field__error">{{ errors.retirementPlanType }}</span>
              </div>

              <div class="field field--span-3">
                <span class="field__label">coverage level</span>
                <Dropdown v-model="form.retirementCoverageLevel" :options="dependentCoverageOptions" placeholder="Please select" />
                <span v-if="errors.retirementCoverageLevel" class="field__error">{{ errors.retirementCoverageLevel }}</span>
              </div>

              <div class="field">
                <span class="field__label">Type</span>
                <Dropdown v-model="form.retirementContributionType" :options="contributionTypeOptions" placeholder="Please select" />
                <span v-if="errors.retirementContributionType" class="field__error">{{ errors.retirementContributionType }}</span>
              </div>

              <label class="field">
                <span class="field__label">contribution amount</span>
                <input v-model="form.retirementContributionAmount" class="field__control" :class="{ 'field__control--error': errors.retirementContributionAmount }" type="text" placeholder="contribution amount" />
                <span v-if="errors.retirementContributionAmount" class="field__error">{{ errors.retirementContributionAmount }}</span>
              </label>

              <div class="field">
                <span class="field__label">currency</span>
                <Dropdown v-model="form.retirementContributionCurrency" :options="benefitsCurrencyOptions" placeholder="Please Select" />
                <span v-if="errors.retirementContributionCurrency" class="field__error">{{ errors.retirementContributionCurrency }}</span>
              </div>

              <div class="field">
                <span class="field__label">Type</span>
                <Dropdown v-model="form.employerContributionType" :options="contributionTypeOptions" placeholder="Please select" />
                <span v-if="errors.employerContributionType" class="field__error">{{ errors.employerContributionType }}</span>
              </div>

              <label class="field">
                <span class="field__label">employer contribution</span>
                <input v-model="form.employerContributionAmount" class="field__control" :class="{ 'field__control--error': errors.employerContributionAmount }" type="text" placeholder="employer contribution" />
                <span v-if="errors.employerContributionAmount" class="field__error">{{ errors.employerContributionAmount }}</span>
              </label>

              <div class="field">
                <span class="field__label">currency</span>
                <Dropdown v-model="form.employerContributionCurrency" :options="benefitsCurrencyOptions" placeholder="Please select" />
                <span v-if="errors.employerContributionCurrency" class="field__error">{{ errors.employerContributionCurrency }}</span>
              </div>
            </div>
          </section>

          <section class="add-employee-modal__section">
            <div class="add-employee-modal__section-head">
              <h3 class="add-employee-modal__section-title">Other benefits</h3>
              <button type="button" class="add-employee-modal__add-row" @click="addOtherBenefit">+</button>
            </div>
            <div
              v-for="(benefit, index) in form.otherBenefits"
              :key="`other-benefit-${index}`"
              class="add-employee-modal__grid add-employee-modal__grid--employment add-employee-modal__repeat-row"
            >
              <div class="field field--full">
                <span class="field__label">coverage level</span>
                <Dropdown v-model="benefit.coverageLevel" :options="dependentCoverageOptions" placeholder="Please select" />
                <span v-if="errors[`otherBenefitCoverageLevel-${index}`]" class="field__error">{{ errors[`otherBenefitCoverageLevel-${index}`] }}</span>
              </div>

              <label class="field field--full">
                <span class="field__label">Life insurance</span>
                <input
                  v-model="benefit.lifeInsurance"
                  class="field__control"
                  :class="{ 'field__control--error': errors[`otherBenefitLifeInsurance-${index}`] }"
                  type="text"
                  placeholder="Life insurance"
                />
                <span v-if="errors[`otherBenefitLifeInsurance-${index}`]" class="field__error">{{ errors[`otherBenefitLifeInsurance-${index}`] }}</span>
              </label>

              <label class="field field--span-3">
                <span class="field__label">Paid time off</span>
                <input
                  v-model="benefit.paidTimeOff"
                  class="field__control"
                  :class="{ 'field__control--error': errors[`otherBenefitPaidTimeOff-${index}`] }"
                  type="text"
                  placeholder="paid time off"
                />
                <span v-if="errors[`otherBenefitPaidTimeOff-${index}`]" class="field__error">{{ errors[`otherBenefitPaidTimeOff-${index}`] }}</span>
              </label>

              <label class="field field--span-3">
                <span class="field__label">wellness programs</span>
                <input
                  v-model="benefit.wellnessPrograms"
                  class="field__control"
                  :class="{ 'field__control--error': errors[`otherBenefitWellnessPrograms-${index}`] }"
                  type="text"
                  placeholder="wellness programs"
                />
                <span v-if="errors[`otherBenefitWellnessPrograms-${index}`]" class="field__error">{{ errors[`otherBenefitWellnessPrograms-${index}`] }}</span>
              </label>

              <label class="field field--full">
                <span class="field__label">Details</span>
                <input
                  v-model="benefit.details"
                  class="field__control"
                  :class="{ 'field__control--error': errors[`otherBenefitDetails-${index}`] }"
                  type="text"
                  placeholder="Details"
                />
                <span v-if="errors[`otherBenefitDetails-${index}`]" class="field__error">{{ errors[`otherBenefitDetails-${index}`] }}</span>
              </label>

              <div v-if="form.otherBenefits.length > 1" class="field field--actions">
                <span class="field__label field__label--hidden">Remove</span>
                <button type="button" class="add-employee-modal__remove-row" @click="removeOtherBenefit(index)">Remove</button>
              </div>
            </div>
          </section>

          <section class="add-employee-modal__section">
            <h3 class="add-employee-modal__section-title">Miscellaneous</h3>
            <div class="add-employee-modal__grid add-employee-modal__grid--employment">
              <label class="field">
                <span class="field__label">start date</span>
                <DatePicker v-model="form.miscStartDate" />
                <span v-if="errors.miscStartDate" class="field__error">{{ errors.miscStartDate }}</span>
              </label>

              <label class="field">
                <span class="field__label">employment contracts</span>
                <input v-model="form.employmentContracts" class="field__control" type="text" placeholder="Employment contracts" />
              </label>

              <label class="field field--span-3">
                <span class="field__label">Payment Method</span>
                <input
                  v-model="form.paymentMethod"
                  class="field__control"
                  :class="{ 'field__control--error': errors.paymentMethod }"
                  type="text"
                  placeholder="payment method"
                />
                <span v-if="errors.paymentMethod" class="field__error">{{ errors.paymentMethod }}</span>
              </label>

              <label class="field field--span-3">
                <span class="field__label">Performance Bonuses</span>
                <input
                  v-model="form.performanceBonuses"
                  class="field__control"
                  :class="{ 'field__control--error': errors.performanceBonuses }"
                  type="text"
                  placeholder="Performance bonuses"
                />
                <span v-if="errors.performanceBonuses" class="field__error">{{ errors.performanceBonuses }}</span>
              </label>
            </div>
          </section>
        </div>

        <div v-else class="add-employee-modal__work-step">
          <input ref="fileInputRef" class="add-employee-modal__file-input" type="file" multiple @change="handleFileChange" />

          <div class="add-employee-modal__section">
            <label class="field field--full">
              <span class="field__label">non disclosure agreements (NDA)</span>
            </label>
            <div class="add-employee-modal__dropzone" @dragover.prevent="legalUploadContext = 'ndaFiles'" @drop.prevent="legalUploadContext = 'ndaFiles'; handleDrop($event)">
              <button type="button" class="add-employee-modal__dropzone-button" @click="triggerLegalFileSelect('ndaFiles')">
                <span class="add-employee-modal__upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 16.5V7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="m8.5 11 3.5-3.5 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6 17.5h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </span>
                <span>Drag and Drop to upload files</span>
                <span class="add-employee-modal__dropzone-link">or select files</span>
              </button>
            </div>
            <span v-if="errors.ndaFiles" class="field__error">{{ errors.ndaFiles }}</span>
            <div v-if="form.ndaFiles.length" class="add-employee-modal__attachments">
              <div v-for="file in form.ndaFiles" :key="`nda-${file.name}-${file.size}`" class="add-employee-modal__attachment">
                <span class="add-employee-modal__attachment-name">{{ file.name }}</span>
                <button type="button" class="add-employee-modal__attachment-remove" @click="removeLegalAttachment('ndaFiles', file.name)">Remove</button>
              </div>
            </div>
          </div>

          <div class="add-employee-modal__section">
            <label class="field field--full">
              <span class="field__label">Employment contracts</span>
            </label>
            <div class="add-employee-modal__dropzone" @dragover.prevent="legalUploadContext = 'employmentContractFiles'" @drop.prevent="legalUploadContext = 'employmentContractFiles'; handleDrop($event)">
              <button type="button" class="add-employee-modal__dropzone-button" @click="triggerLegalFileSelect('employmentContractFiles')">
                <span class="add-employee-modal__upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 16.5V7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="m8.5 11 3.5-3.5 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6 17.5h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </span>
                <span>Drag and Drop to upload files</span>
                <span class="add-employee-modal__dropzone-link">or select files</span>
              </button>
            </div>
            <span v-if="errors.employmentContractFiles" class="field__error">{{ errors.employmentContractFiles }}</span>
            <div v-if="form.employmentContractFiles.length" class="add-employee-modal__attachments">
              <div v-for="file in form.employmentContractFiles" :key="`contract-${file.name}-${file.size}`" class="add-employee-modal__attachment">
                <span class="add-employee-modal__attachment-name">{{ file.name }}</span>
                <button type="button" class="add-employee-modal__attachment-remove" @click="removeLegalAttachment('employmentContractFiles', file.name)">Remove</button>
              </div>
            </div>
          </div>

          <div class="add-employee-modal__section">
            <label class="field field--full">
              <span class="field__label">Local labor laws and regulations compliance</span>
            </label>
            <div class="add-employee-modal__dropzone" @dragover.prevent="legalUploadContext = 'laborLawComplianceFiles'" @drop.prevent="legalUploadContext = 'laborLawComplianceFiles'; handleDrop($event)">
              <button type="button" class="add-employee-modal__dropzone-button" @click="triggerLegalFileSelect('laborLawComplianceFiles')">
                <span class="add-employee-modal__upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 16.5V7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="m8.5 11 3.5-3.5 3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M6 17.5h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </span>
                <span>Drag and Drop to upload files</span>
                <span class="add-employee-modal__dropzone-link">or select files</span>
              </button>
            </div>
            <span v-if="errors.laborLawComplianceFiles" class="field__error">{{ errors.laborLawComplianceFiles }}</span>
            <div v-if="form.laborLawComplianceFiles.length" class="add-employee-modal__attachments">
              <div v-for="file in form.laborLawComplianceFiles" :key="`law-${file.name}-${file.size}`" class="add-employee-modal__attachment">
                <span class="add-employee-modal__attachment-name">{{ file.name }}</span>
                <button type="button" class="add-employee-modal__attachment-remove" @click="removeLegalAttachment('laborLawComplianceFiles', file.name)">Remove</button>
              </div>
              <button
                type="button"
                class="add-employee-modal__add-link add-employee-modal__add-link--inline"
                @click="triggerLegalFileSelect('laborLawComplianceFiles')"
              >
                <span class="add-employee-modal__add-link-icon">+</span>
                <span>Add</span>
              </button>
            </div>
          </div>

          <section class="add-employee-modal__section">
            <h3 class="add-employee-modal__section-title">Nitrosync employee profile</h3>
            <span v-if="errors.accessProfile" class="field__error">{{ errors.accessProfile }}</span>
            <label class="add-employee-modal__toggle-row">
              <input :checked="form.restrictedAccess" type="checkbox" @change="handleRestrictedAccessChange" />
              <span class="add-employee-modal__toggle-box"></span>
              <span>Restricted Access</span>
            </label>
            <button
              v-if="form.restrictedAccess"
              type="button"
              class="add-employee-modal__configure-link"
              @click="isRestrictedAccessModalOpen = true"
            >
              Configure restricted access
            </button>
            <span v-if="errors.restrictedAccessSettings" class="field__error">{{ errors.restrictedAccessSettings }}</span>
            <label class="add-employee-modal__toggle-row">
              <input v-model="form.openAccess" type="checkbox" />
              <span class="add-employee-modal__toggle-box"></span>
              <span>Open</span>
            </label>
          </section>
        </div>
      </div>

      <footer class="add-employee-modal__footer">
        <p v-if="submitError" class="add-employee-modal__submit-error">{{ submitError }}</p>
        <button v-if="currentStepIndex > 0" type="button" class="add-employee-modal__secondary" @click="goToPreviousStep">Back</button>
        <button type="button" class="add-employee-modal__next" :disabled="submitting" @click="goToNextStep">{{ currentStepIndex === 6 ? (submitting ? 'Saving...' : 'Save') : 'Next Step' }}</button>
        <button type="button" class="add-employee-modal__cancel" :disabled="submitting" @click="$emit('close')">Cancel</button>
      </footer>
    </section>

    <RestrictedAccessModal
      :open="isRestrictedAccessModalOpen"
      :model-value="form.restrictedAccessSettings"
      @close="isRestrictedAccessModalOpen = false"
      @save="handleSaveRestrictedAccess"
    />
  </div>
</template>

<style scoped>
.add-employee-modal {
  position: fixed;
  inset: 0;
  z-index: 125;
  display: grid;
  place-items: center;
  padding: 28px;
}

.add-employee-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.add-employee-modal__panel {
  position: relative;
  width: min(860px, calc(100vw - 56px));
  max-height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #f2dbe5;
  border-radius: 16px;
  box-shadow: 0 22px 48px rgba(32, 19, 26, 0.16);
  overflow: hidden;
  scrollbar-gutter: stable;
}

.add-employee-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 10px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 2;
}

.add-employee-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-employee-modal__icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #ef5a96;
  color: #fff;
  flex: 0 0 auto;
}

.add-employee-modal__icon svg {
  width: 15px;
  height: 15px;
}

.add-employee-modal__title {
  margin: 0;
  color: #29212a;
  font-size: 17px;
  font-weight: 600;
}

.add-employee-modal__close {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ef5a96;
  position: relative;
  flex: 0 0 auto;
}

.add-employee-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.4px;
  background: #ffffff;
}

.add-employee-modal__close span:first-child {
  transform: rotate(45deg);
}

.add-employee-modal__close span:last-child {
  transform: rotate(-45deg);
}

.add-employee-modal__steps {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  padding: 0 20px 14px;
  border-bottom: 1px solid #f6e2ea;
}

.add-employee-modal__step {
  position: relative;
  padding-top: 10px;
  color: var(--step-color);
  font-size: 10px;
  line-height: 1.2;
  text-transform: none;
  opacity: 0.34;
  cursor: default;
  transition: opacity 0.18s ease, color 0.18s ease, font-weight 0.18s ease;
}

.add-employee-modal__step::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 10px;
  height: 2px;
  background: var(--step-color);
  opacity: 0.34;
}

.add-employee-modal__step--active {
  opacity: 1;
}

.add-employee-modal__step--active::before {
  opacity: 1;
}

.add-employee-modal__step--completed {
  opacity: 1;
  font-weight: 600;
}

.add-employee-modal__step--completed::before {
  opacity: 1;
}

.add-employee-modal__step--reviewable {
  opacity: 0.88;
  font-weight: 600;
  cursor: pointer;
}

.add-employee-modal__step--reviewable::before {
  opacity: 0.88;
}

.add-employee-modal__step--reviewable:hover {
  opacity: 1;
  font-weight: 600;
}

.add-employee-modal__step--reviewable:hover::before {
  opacity: 1;
}

.add-employee-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 20px 8px;
  overflow: auto;
}

.add-employee-modal__work-step {
  display: grid;
  gap: 12px;
}

.add-employee-modal__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 10px;
}

.add-employee-modal__grid--employment {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-column: span 2;
}

.field--full {
  grid-column: 1 / -1;
}

.field--span-2 {
  grid-column: span 2;
}

.field--span-3 {
  grid-column: span 3;
}

.field--actions {
  grid-column: span 1;
  justify-content: flex-end;
}

.field__label {
  color: #8f8790;
  font-size: 11px;
  line-height: 1.2;
  text-transform: none;
  letter-spacing: 0.04em;
}

.field__label--hidden {
  visibility: hidden;
}

.add-employee-modal__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.add-employee-modal__add-row,
.add-employee-modal__remove-row {
  min-width: 36px;
  height: 36px;
  border: 1px solid #f0d7e3;
  border-radius: 10px;
  background: #fff7fa;
  color: #ea4f8d;
  font-size: 12px;
  font-weight: 600;
}

.add-employee-modal__add-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 20px;
  line-height: 1;
}

.add-employee-modal__repeat-row {
  margin-top: 10px;
}

.field__control,
.field :deep(.dropdown__trigger),
.field :deep(.date-picker__trigger) {
  width: 100%;
  min-height: 36px;
  height: 36px;
  max-height: 36px;
  border: 1px solid #ece6ea;
  border-radius: 9px;
  background: #ffffff;
  padding: 0 11px;
  color: #736a72;
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: none;
  box-sizing: border-box;
  box-shadow: none;
  vertical-align: top;
}

.field__control {
  display: block;
  width: 100%;
  min-height: 36px !important;
  height: 36px !important;
  max-height: 36px !important;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-clip: padding-box;
  padding: 0 11px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  font-family: inherit;
  font-size: 10px !important;
  font-weight: 400;
  line-height: 36px !important;
  border-radius: 9px;
}

.field :deep(.dropdown__trigger) {
  display: flex;
  align-items: center;
  appearance: none;
  -webkit-appearance: none;
  padding-left: 11px;
  padding-right: 26px;
  border-radius: 9px;
}

.field :deep(.dropdown__value),
.field :deep(.date-picker__value) {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field :deep(.dropdown__arrow) {
  right: 11px;
  width: 6px;
  height: 6px;
}

.field :deep(.date-picker__trigger) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 11px;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 9px;
}

.field :deep(.date-picker__icon) {
  width: 12px;
  height: 12px;
}

.field__control::placeholder {
  color: #c8c0c6;
  font-size: 10px;
  font-weight: 400;
  line-height: 36px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field :deep(.dropdown__trigger--placeholder .dropdown__value),
.field :deep(.date-picker__trigger--placeholder .date-picker__value) {
  color: #c8c0c6;
  font-size: 10px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field :deep(.dropdown__option) {
  font-size: 10px;
  line-height: 1;
}

.field__control:focus,
.field :deep(.dropdown__trigger:focus-visible),
.field :deep(.date-picker__trigger:focus-visible) {
  outline: none;
  border-color: #ef8ab3;
  box-shadow: 0 0 0 2px rgba(239, 90, 150, 0.06);
}

.field__control--date {
  padding-right: 28px;
  color-scheme: light;
}

.field__control--date::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.field__control--error,
.field :deep(.dropdown__trigger.field__control--error) {
  border-color: #ece6ea;
  box-shadow: none;
}

.field__error {
  color: #e34789;
  font-size: 10px;
  line-height: 1;
}

.add-employee-modal__section {
  display: grid;
  gap: 10px;
}

.add-employee-modal__section-headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.add-employee-modal__section-title {
  margin: 0;
  color: #2e252d;
  font-size: 14px;
  font-weight: 600;
}

.add-employee-modal__add-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #ef5a96;
  font-size: 12px;
  white-space: nowrap;
}

.add-employee-modal__add-link--inline {
  margin-top: 2px;
  justify-self: start;
}

.add-employee-modal__add-link-icon {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 16px;
  line-height: 1;
}

.add-employee-modal__toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #544b52;
  font-size: 12px;
}

.add-employee-modal__toggle-row input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.add-employee-modal__toggle-box {
  width: 14px;
  height: 14px;
  border: 1px solid #f0bfd2;
  border-radius: 3px;
  background: #fff;
  position: relative;
  flex: 0 0 auto;
}

.add-employee-modal__toggle-row input:checked + .add-employee-modal__toggle-box {
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  border-color: transparent;
}

.add-employee-modal__toggle-row input:checked + .add-employee-modal__toggle-box::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
}

.add-employee-modal__configure-link {
  width: fit-content;
  color: #ef5a96;
  font-size: 12px;
  text-decoration: underline;
}

.add-employee-modal__file-input {
  display: none;
}

.add-employee-modal__dropzone {
  border: 1.5px dashed #f2a8c3;
  border-radius: 12px;
  background: linear-gradient(180deg, #fffefe 0%, #fff7fa 100%);
  padding: 24px 18px;
}

.add-employee-modal__dropzone-button {
  width: 100%;
  background: transparent;
  color: #7b6973;
  display: grid;
  place-items: center;
  gap: 6px;
  font-size: 12px;
  text-align: center;
}

.add-employee-modal__upload-icon {
  width: 22px;
  height: 22px;
  color: #ef5a96;
}

.add-employee-modal__upload-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.add-employee-modal__dropzone-link {
  color: #ef5a96;
  text-decoration: underline;
}

.add-employee-modal__attachments {
  display: grid;
  gap: 8px;
}

.add-employee-modal__attachment {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #f0e5ea;
  border-radius: 10px;
  background: #fff;
}

.add-employee-modal__attachment-name {
  min-width: 0;
  color: #5e555c;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-employee-modal__attachment-remove {
  color: #ef5a96;
  font-size: 12px;
}

.field--icon {
  position: relative;
}

.field__icon {
  position: absolute;
  right: 17px;
  top: 46px;
  pointer-events: none;
}

.field__icon--calendar {
  width: 13px;
  height: 13px;
  border: 1.5px solid #ea4f8d;
  border-radius: 4px;
  background:
    linear-gradient(#ea4f8d, #ea4f8d) center 4px / 9px 1px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 7px / 7px 1px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 10px / 7px 1px no-repeat;
}

.field__icon--calendar::before,
.field__icon--calendar::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 2px;
  height: 4px;
  border-radius: 999px;
  background: #ea4f8d;
}

.field__icon--calendar::before {
  left: 2px;
}

.field__icon--calendar::after {
  right: 2px;
}

.add-employee-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  padding: 14px 20px 18px;
  background: #fff;
  position: sticky;
  bottom: 0;
  z-index: 2;
}

.add-employee-modal__submit-error {
  width: 100%;
  margin: 0;
  color: #d6336c;
  font-size: 13px;
  line-height: 1.4;
}

.add-employee-modal__next,
.add-employee-modal__secondary,
.add-employee-modal__cancel {
  min-width: 100px;
  height: 36px;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 12px;
}

.add-employee-modal__next {
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}

.add-employee-modal__next:disabled,
.add-employee-modal__cancel:disabled,
.add-employee-modal__secondary:disabled {
  opacity: 0.6;
  cursor: default;
}

.add-employee-modal__secondary {
  border: 1px solid #f0dbe5;
  background: #fff7fa;
  color: #ef5a96;
}

.add-employee-modal__cancel {
  border: 1px solid #eee6ea;
  background: #ffffff;
  color: #bdb1b8;
}

@media (max-width: 760px) {
  .add-employee-modal {
    padding: 12px;
  }

  .add-employee-modal__panel {
    width: min(100vw - 24px, 920px);
    max-height: calc(100vh - 24px);
    border-radius: 14px;
  }

  .add-employee-modal__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 0 16px 12px;
  }

  .add-employee-modal__grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .add-employee-modal__grid--employment {
    grid-template-columns: 1fr;
  }

  .field {
    grid-column: span 1;
  }

  .field--full {
    grid-column: span 1;
  }

  .field--span-2 {
    grid-column: span 1;
  }

  .field--span-3 {
    grid-column: span 1;
  }

  .add-employee-modal__title {
    font-size: 16px;
  }

  .field__label {
    font-size: 11px;
  }

  .field__control,
  .field :deep(.dropdown__trigger),
  .field :deep(.dropdown__value),
  .field :deep(.date-picker__trigger),
  .field :deep(.date-picker__value) {
    font-size: 10px;
  }
}
</style>
