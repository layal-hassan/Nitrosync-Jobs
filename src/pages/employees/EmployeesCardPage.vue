<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AddEmployeeModal from '../../components/modals/AddEmployeeModal.vue'
import AvailableEmployeesModal from '../../components/modals/AvailableEmployeesModal.vue'
import EmployeeDeleteModal from '../../components/modals/EmployeeDeleteModal.vue'
import EmployeeMessageModal from '../../components/modals/EmployeeMessageModal.vue'
import CustomizedEditModal from '../../components/modals/CustomizedEditModal.vue'
import EditValuesModal from '../../components/modals/EditValuesModal.vue'
import EditPreviewModal from '../../components/modals/EditPreviewModal.vue'
import EmployeesFilterModal from '../../components/modals/EmployeesFilterModal.vue'
import FieldsToEditModal from '../../components/modals/FieldsToEditModal.vue'
import ConfirmBulkUpdateModal from '../../components/modals/ConfirmBulkUpdateModal.vue'
import UpdateSuccessModal from '../../components/modals/UpdateSuccessModal.vue'
import { createNitroSyncEmployee } from '../../composables/useNitroSyncCreateEmployee'
import { changeNitroSyncEmployeeStatus } from '../../composables/useNitroSyncChangeEmployeeStatus'
import { deleteNitroSyncEmployee } from '../../composables/useNitroSyncDeleteEmployee'
import { resetNitroSyncEmployeePassword } from '../../composables/useNitroSyncResetEmployeePassword'
import { updateNitroSyncEmployee } from '../../composables/useNitroSyncUpdateEmployee'
import { bulkEditNitroSyncEmployees } from '../../composables/useNitroSyncBulkEditEmployees'
import {
  buildEmployeeUpdatePayload,
  buildInitials,
  fallbackEmployees,
  loadEmployeesDirectory,
  relatedCompany,
} from '../../composables/useEmployeeDirectory'

const router = useRouter()
const searchQuery = ref('')
const viewMode = ref('list')
const loading = ref(false)
const loadError = ref('')
const openMenuKey = ref('')
const openExportMenuKey = ref('')
const isAddEmployeeModalOpen = ref(false)
const isAvailableEmployeesModalOpen = ref(false)
const isFilterModalOpen = ref(false)
const isFieldsToEditModalOpen = ref(false)
const isEditValuesModalOpen = ref(false)
const isCustomizedEditModalOpen = ref(false)
const isEditPreviewModalOpen = ref(false)
const isConfirmBulkUpdateModalOpen = ref(false)
const isUpdateSuccessModalOpen = ref(false)
const isEmployeeMessageModalOpen = ref(false)
const isEmployeeResetModalOpen = ref(false)
const isEmployeeDeleteModalOpen = ref(false)
const activeEmployee = ref(null)
const selectedEmployeesForEdit = ref([])
const currentEmployeeEditIndex = ref(0)
const selectedEditFieldKeys = ref([])
const editFieldValues = reactive({})
const previewValuesByEmployee = reactive({})
const editApplyMode = ref('for-all')

const filterState = reactive({
  employmentStatus: '',
  firstName: '',
  lastName: '',
  department: '',
  position: '',
  rangeFrom: '',
  rangeTo: '',
  hireDate: '',
  location: '',
  jobTitle: '',
})

const employees = ref([])
const availableEmployees = computed(() =>
  employees.value.filter((employee) => String(employee?.employeeUuid || '').trim()),
)
const suggestedEmployeeId = computed(() => {
  const employeeNumbers = employees.value
    .map((employee) => String(employee?.employeeNumber || employee?.id || '').trim())
    .map((value) => value.replace(/\D/g, ''))
    .filter(Boolean)

  if (!employeeNumbers.length) {
    return '00001'
  }

  const maxLength = Math.max(...employeeNumbers.map((value) => value.length), 5)
  const maxValue = Math.max(...employeeNumbers.map((value) => Number.parseInt(value, 10)).filter(Number.isFinite))

  return String(maxValue + 1).padStart(maxLength, '0')
})

const employmentStatusOptions = ['LoggedOut', 'Verified', 'LoggedIn', 'UnVerified']
const jobTitleOptions = ['Financial Manager', 'HR Manager', 'Recruiter', 'Operations']
const editableFieldCatalog = [
  { key: 'team', label: 'Team', group: 'Work Information' },
  { key: 'manager', label: 'Manager', group: 'Work Information' },
  { key: 'supervisor', label: 'Supervisor', group: 'Work Information' },
  { key: 'employmentType', label: 'Employment Type', group: 'Employment Details' },
  { key: 'department', label: 'Department', group: 'Employment Details' },
  { key: 'payFrequency', label: 'Pay Frequency', group: 'Employment Details' },
  { key: 'overtimeRate', label: 'Overtime Rate', group: 'Employment Details' },
  { key: 'allowances', label: 'Allowances', group: 'Employment Details' },
  { key: 'basicSalary', label: 'Basic Salary', group: 'Compensation' },
  { key: 'currency', label: 'Currency', group: 'Compensation' },
  { key: 'taxes', label: 'Taxes', group: 'Compensation' },
  { key: 'socialSecurity', label: 'Social Security', group: 'Compensation' },
  { key: 'healthInsurance', label: 'Health Insurance', group: 'Compensation' },
  { key: 'deductions', label: 'Deductions', group: 'Compensation' },
  { key: 'healthInsuranceProvider', label: 'Health Insurance Provider', group: 'Benefits & Reimbursements' },
  { key: 'retirementPlanType', label: 'Retirement Plan Type', group: 'Benefits & Reimbursements' },
  { key: 'leaveType', label: 'Leave Type', group: 'Benefits & Reimbursements' },
  { key: 'welfarePrograms', label: 'Wellness Programs', group: 'Benefits & Reimbursements' },
  { key: 'paidTimeOff', label: 'Paid time off', group: 'Benefits & Reimbursements' },
  { key: 'lifeInsurance', label: 'Life insurance', group: 'Benefits & Reimbursements' },
  { key: 'payrollStartDate', label: 'Payroll Start Date', group: 'Miscellaneous' },
  { key: 'paymentMethod', label: 'Payment Method', group: 'Miscellaneous' },
  { key: 'employmentContractType', label: 'Employment Contract Type', group: 'Miscellaneous' },
]
const selectedEditableFields = computed(() =>
  editableFieldCatalog.filter((field) => selectedEditFieldKeys.value.includes(field.key)),
)

const editableFieldPayloadMap = {
  team: { updateKey: 'team', apiField: 'team' },
  manager: { updateKey: 'manager', apiField: 'manager' },
  supervisor: { updateKey: 'supervisor', apiField: 'supervisor' },
  employmentType: { updateKey: 'employmentType', apiField: 'employment_type' },
  department: { updateKey: 'department', apiField: 'department_id' },
  payFrequency: { updateKey: 'payFrequency', apiField: 'pay_frequency' },
  overtimeRate: { updateKey: 'overtimeRateType', apiField: 'overtime_rate_type' },
  allowances: { updateKey: 'allowanceName', apiField: 'allowances' },
  basicSalary: { updateKey: 'baseSalary', apiField: 'base_salary' },
  currency: { updateKey: 'currency', apiField: 'currency' },
  taxes: { updateKey: 'localStateFederalTaxRates', apiField: 'tax_rates' },
  socialSecurity: { updateKey: 'retirementContributions', apiField: 'health_insurance_retirement_contributions' },
  healthInsurance: { updateKey: 'healthInsurance', apiField: 'health_insurance_deduction' },
  deductions: { updateKey: 'deductionAmount', apiField: 'other_deductions_amount' },
  healthInsuranceProvider: { updateKey: 'healthInsuranceProvider', apiField: 'health_insurance_provider' },
  retirementPlanType: { updateKey: 'retirementPlanType', apiField: 'retirement_plan_type' },
  leaveType: { updateKey: 'annualLeaveEntitlement', apiField: 'annual_leave_entitlement' },
  welfarePrograms: { updateKey: 'wellnessPrograms', apiField: 'wellness_programs' },
  paidTimeOff: { updateKey: 'paidTimeOff', apiField: 'paid_time_off' },
  lifeInsurance: { updateKey: 'lifeInsurance', apiField: 'life_insurance' },
  payrollStartDate: { updateKey: 'miscStartDate', apiField: 'miscellaneous_start_date' },
  paymentMethod: { updateKey: 'paymentMethod', apiField: 'payment_method' },
  employmentContractType: { updateKey: 'validityOfContract', apiField: 'validity_of_contract' },
}

const filteredEmployees = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  const firstNameQuery = filterState.firstName.trim().toLowerCase()
  const lastNameQuery = filterState.lastName.trim().toLowerCase()
  const departmentQuery = filterState.department.trim().toLowerCase()
  const positionQuery = filterState.position.trim().toLowerCase()
  const locationQuery = filterState.location.trim().toLowerCase()

  return employees.value.filter((employee) => {
    const [firstName = '', ...restName] = employee.name.split(/\s+/)
    const lastName = restName.join(' ')

    if (filterState.employmentStatus && employee.status !== filterState.employmentStatus) return false
    if (filterState.jobTitle && employee.role !== filterState.jobTitle) return false
    if (firstNameQuery && !firstName.toLowerCase().includes(firstNameQuery)) return false
    if (lastNameQuery && !lastName.toLowerCase().includes(lastNameQuery)) return false
    if (departmentQuery && !String(employee.department || employee.role).toLowerCase().includes(departmentQuery)) return false
    if (positionQuery && !String(employee.position || employee.role).toLowerCase().includes(positionQuery)) return false
    if (locationQuery && !employee.address.toLowerCase().includes(locationQuery)) return false
    if (filterState.hireDate && employee.hireDate !== filterState.hireDate) return false
    if (filterState.rangeFrom && employee.hireDate < filterState.rangeFrom) return false
    if (filterState.rangeTo && employee.hireDate > filterState.rangeTo) return false
    if (!query) return true

    return [
      employee.name,
      employee.role,
      employee.email,
      employee.phone,
      employee.address,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

const totalEmployeesLabel = computed(() => String(filteredEmployees.value.length).padStart(2, '0'))

const formatEmployeeRowId = (employee, index) =>
  String(employee?.employeeNumber || employee?.id || '').replace(/\D/g, '').slice(-5) || String(10000 + index)

const formatEmployeeHireDate = (employee) => {
  if (!employee?.hireDate) return 'N/A'

  const date = new Date(employee.hireDate)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-GB')
}

const menuItems = [
  'View profile',
  'Edit info',
  'Deactivate/activate',
  'Send message/Email',
  'Reset password',
  'Permission/Assign Role',
  'Export info',
  'Delete employee',
]

const toggleEmployeeStatusLocally = (targetEmployee) => {
  const targetId = String(targetEmployee?.id || '').trim()
  const targetEmployeeUuid = String(targetEmployee?.employeeUuid || '').trim()

  return employees.value.map((itemEmployee) => {
    const itemId = String(itemEmployee?.id || '').trim()
    const itemEmployeeUuid = String(itemEmployee?.employeeUuid || '').trim()
    const isTarget = (
      (targetEmployeeUuid && itemEmployeeUuid === targetEmployeeUuid)
      || (targetId && itemId === targetId)
    )

    if (!isTarget) return itemEmployee

    const nextStatus = itemEmployee.status === 'LoggedIn' ? 'LoggedOut' : 'LoggedIn'

    return {
      ...itemEmployee,
      status: nextStatus,
      online: nextStatus === 'LoggedIn',
    }
  })
}

const fetchEmployees = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const { employees: nextEmployees, usedFallback } = await loadEmployeesDirectory()
    employees.value = nextEmployees

    if (usedFallback) {
      loadError.value = 'Employees could not be loaded from NitroSync.'
    }
  } finally {
    loading.value = false
  }
}

const toggleMenu = (employeeId) => {
  openMenuKey.value = openMenuKey.value === employeeId ? '' : employeeId
  openExportMenuKey.value = ''
}

const handleEmployeeMenuAction = async (item, employee) => {
  if (item === 'Export info') {
    openExportMenuKey.value = openExportMenuKey.value === employee.id ? '' : employee.id
    return
  }

  activeEmployee.value = employee
  openMenuKey.value = ''
  openExportMenuKey.value = ''

  if (item === 'View profile') {
    router.push(`/employees/${employee.id}/profile`)
    return
  }

  if (item === 'Edit info') {
    router.push(`/employees/${employee.id}/edit`)
    return
  }

  if (item === 'Permission/Assign Role') {
    router.push(`/employees/${employee.id}/permissions`)
    return
  }

  if (item === 'Send message/Email') {
    isEmployeeMessageModalOpen.value = true
    return
  }

  if (item === 'Reset password') {
    isEmployeeResetModalOpen.value = true
    return
  }

  if (item === 'Deactivate/activate') {
    const employeeUuid = String(employee.employeeUuid || '').trim()

    if (!employeeUuid) {
      loadError.value = 'This employee is missing NitroSync employee_uuid and cannot be updated.'
      return
    }

    loading.value = true
    loadError.value = ''

    try {
      const result = await changeNitroSyncEmployeeStatus(
        {
          employeeUuid,
        },
        {
          relatedCompany,
        },
      )

      loadError.value = result.message || 'Employee status updated successfully.'

      const { employees: freshEmployees, usedFallback } = await loadEmployeesDirectory()
      if (freshEmployees.length) {
        const targetEmployeeUuid = String(employee.employeeUuid || '').trim()
        const stillExists = freshEmployees.some((itemEmployee) =>
          String(itemEmployee?.employeeUuid || '').trim() === targetEmployeeUuid,
        )

        employees.value = stillExists
          ? freshEmployees
          : toggleEmployeeStatusLocally(employee)
      } else {
        employees.value = toggleEmployeeStatusLocally(employee)
      }

      if (usedFallback) {
        loadError.value = 'Employee status updated, but the employees list could not be refreshed from the API yet.'
      }
    } catch (error) {
      loadError.value = error?.message || 'Failed to change employee status.'
    } finally {
      loading.value = false
    }

    return
  }

  if (item === 'Delete employee') {
    isEmployeeDeleteModalOpen.value = true
  }
}

const handleAddEmployees = (selectedEmployees) => {
  selectedEmployeesForEdit.value = selectedEmployees
  currentEmployeeEditIndex.value = 0
  Object.keys(previewValuesByEmployee).forEach((key) => delete previewValuesByEmployee[key])
  isAvailableEmployeesModalOpen.value = false
  isFieldsToEditModalOpen.value = true
}

const handleAddEmployeeSave = async (payload) => {
  loading.value = true
  loadError.value = ''

  try {
    const result = await createNitroSyncEmployee(payload, {
      relatedCompany,
    })
    loadError.value = result.message || 'Employee created successfully.'

    const { employees: freshEmployees, usedFallback } = await loadEmployeesDirectory()
    if (freshEmployees.length) {
      employees.value = freshEmployees
    }

    isAddEmployeeModalOpen.value = false

    if (usedFallback) {
      loadError.value = 'Employee created, but the employees list could not be refreshed from the API yet.'
    }
  } catch (error) {
    loadError.value = error?.message || 'Failed to create employee.'
  } finally {
    loading.value = false
  }
}

const clearAddEmployeeSubmitError = () => {
  if (!isAddEmployeeModalOpen.value) return
  loadError.value = ''
}

const handleApplyFilters = (nextFilters) => {
  Object.assign(filterState, nextFilters)
  isFilterModalOpen.value = false
}

const handleClearFilters = () => {
  Object.assign(filterState, {
    employmentStatus: '',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    rangeFrom: '',
    rangeTo: '',
    hireDate: '',
    location: '',
    jobTitle: '',
  })
}

const handleFieldsToEditNext = (selectedKeys) => {
  selectedEditFieldKeys.value = selectedKeys
  isFieldsToEditModalOpen.value = false
  isEditValuesModalOpen.value = true
}

const handleEditValuesNext = ({ values, applyMode }) => {
  Object.keys(editFieldValues).forEach((key) => delete editFieldValues[key])
  Object.assign(editFieldValues, values)
  editApplyMode.value = applyMode
  currentEmployeeEditIndex.value = 0
  isEditValuesModalOpen.value = false
  isCustomizedEditModalOpen.value = true
}

const upsertSelectedEmployees = () => {
  const existingIds = new Set(employees.value.map((employee) => employee.id))
  const nextEmployees = selectedEmployeesForEdit.value.filter((employee) => !existingIds.has(employee.id))

  if (nextEmployees.length) {
    employees.value = [...employees.value, ...nextEmployees]
  }
}

const applyCustomEditsToEmployees = (targetIds, nextValues) => {
  employees.value = employees.value.map((employee) => {
    if (!targetIds.includes(employee.id)) {
      return employee
    }

    return {
      ...employee,
      customEdits: {
        ...(employee.customEdits || {}),
        ...nextValues,
      },
    }
  })
}

const storePreviewValues = (employeeId, nextValues) => {
  previewValuesByEmployee[employeeId] = {
    ...(previewValuesByEmployee[employeeId] || {}),
    ...nextValues,
  }
}

const handleFinishCustomizedEdit = (nextValues) => {
  Object.keys(editFieldValues).forEach((key) => delete editFieldValues[key])
  Object.assign(editFieldValues, nextValues)

  upsertSelectedEmployees()

  if (editApplyMode.value === 'one-by-one') {
    const currentEmployee = selectedEmployeesForEdit.value[currentEmployeeEditIndex.value]
    if (currentEmployee) {
      storePreviewValues(currentEmployee.id, nextValues)
    }

    if (currentEmployeeEditIndex.value < selectedEmployeesForEdit.value.length - 1) {
      currentEmployeeEditIndex.value += 1
      return
    }
  } else {
    selectedEmployeesForEdit.value.forEach((employee) => {
      storePreviewValues(employee.id, nextValues)
    })
  }

  isCustomizedEditModalOpen.value = false
  isEditPreviewModalOpen.value = true
}

const handleConfirmPreview = () => {
  isEditPreviewModalOpen.value = false
  isConfirmBulkUpdateModalOpen.value = true
}

const handleConfirmBulkUpdate = async () => {
  const selectedEmployees = [...selectedEmployeesForEdit.value]
  const employeeUuids = selectedEmployees
    .map((employee) => String(employee?.employeeUuid || '').trim())
    .filter(Boolean)

  if (!selectedEmployees.length) {
    loadError.value = 'Select at least one employee to update.'
    return
  }

  if (!employeeUuids.length) {
    loadError.value = 'The selected employees are missing NitroSync employee_uuid values.'
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const apiFields = selectedEditFieldKeys.value
      .map((fieldKey) => editableFieldPayloadMap[fieldKey]?.apiField)
      .filter(Boolean)

    if (apiFields.length) {
      await bulkEditNitroSyncEmployees({
        relatedCompany,
        employeeUuids,
        editFields: apiFields,
      })
    }

    for (const selectedEmployee of selectedEmployees) {
      const previewValues = previewValuesByEmployee[selectedEmployee.id] || {}
      const overrides = Object.entries(previewValues).reduce((accumulator, [fieldKey, value]) => {
        const mappedField = editableFieldPayloadMap[fieldKey]
        if (!mappedField) return accumulator
        accumulator[mappedField.updateKey] = value
        return accumulator
      }, {})

      const payload = buildEmployeeUpdatePayload(selectedEmployee, overrides)
      await updateNitroSyncEmployee(payload, {
        relatedCompany,
        departmentId: payload.departmentId,
      })
    }

    const { employees: freshEmployees, usedFallback } = await loadEmployeesDirectory()

    if (freshEmployees.length) {
      employees.value = freshEmployees
    } else {
      employees.value = employees.value.map((employee) => {
        const previewValues = previewValuesByEmployee[employee.id]
        if (!previewValues) return employee

        return {
          ...employee,
          customEdits: {
            ...(employee.customEdits || {}),
            ...previewValues,
          },
        }
      })
    }

    isConfirmBulkUpdateModalOpen.value = false
    isUpdateSuccessModalOpen.value = true
    selectedEmployeesForEdit.value = []
    currentEmployeeEditIndex.value = 0
    selectedEditFieldKeys.value = []
    Object.keys(editFieldValues).forEach((key) => delete editFieldValues[key])
    Object.keys(previewValuesByEmployee).forEach((key) => delete previewValuesByEmployee[key])
    editApplyMode.value = 'for-all'
    loadError.value = usedFallback
      ? 'Employees updated, but the employees list could not be refreshed from the API yet.'
      : 'Employees updated successfully.'
  } catch (error) {
    loadError.value = error?.message || 'Failed to bulk update employees.'
  } finally {
    loading.value = false
  }
}

const handleEditPreviewAgain = () => {
  isEditPreviewModalOpen.value = false
  currentEmployeeEditIndex.value = 0
  isCustomizedEditModalOpen.value = true
}

const handleDeleteEmployee = async () => {
  const employeeUuid = String(activeEmployee.value?.employeeUuid || '').trim()

  if (!activeEmployee.value) return

  if (!employeeUuid) {
    loadError.value = 'This employee cannot be deleted because NitroSync employee_uuid is missing.'
    isEmployeeDeleteModalOpen.value = true
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const result = await deleteNitroSyncEmployee(
      {
        employeeUuid,
      },
      {
        relatedCompany,
      },
    )

    loadError.value = result.message || 'Employee deleted successfully.'

    const deletedEmployeeId = activeEmployee.value.id
    const { employees: freshEmployees, usedFallback } = await loadEmployeesDirectory()

    if (freshEmployees.length) {
      employees.value = freshEmployees
    } else {
      employees.value = employees.value.filter((employee) => employee.id !== deletedEmployeeId)
    }

    isEmployeeDeleteModalOpen.value = false
    activeEmployee.value = null

    if (usedFallback) {
      loadError.value = 'Employee deleted, but the employees list could not be refreshed from the API yet.'
    }
  } catch (error) {
    loadError.value = error?.message || 'Failed to delete employee.'
  } finally {
    loading.value = false
  }
}

const handleResetEmployeePassword = async ({ password } = {}) => {
  const employeeUuid = String(activeEmployee.value?.employeeUuid || '').trim()
  const nextPassword = String(password || '').trim()

  if (!activeEmployee.value) return

  if (!employeeUuid) {
    loadError.value = 'This employee cannot be updated because NitroSync employee_uuid is missing.'
    return
  }

  if (!nextPassword) {
    loadError.value = 'Password is required.'
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const result = await resetNitroSyncEmployeePassword(
      {
        employeeUuid,
        password: nextPassword,
      },
      {
        relatedCompany,
      },
    )

    loadError.value = result.message || 'Employee password reset successfully.'
    isEmployeeResetModalOpen.value = false
  } catch (error) {
    loadError.value = error?.message || 'Failed to reset employee password.'
  } finally {
    loading.value = false
  }
}

const handleDocumentClick = (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (!target.closest('.employee-card__menu-shell')) {
    openMenuKey.value = ''
    openExportMenuKey.value = ''
  }
}

onMounted(() => {
  fetchEmployees()
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})
</script>

<template>
  <div class="page-container employee-page">
    <div class="breadcrumb-row employee-page__breadcrumb">
      <span class="crumb-home"></span>
      <span class="breadcrumb-sep"></span>
      <span class="breadcrumb-text">Employees</span>
    </div>

    <section class="employee-shell">
      <header class="employee-toolbar">
        <div class="employee-toolbar__summary">
          Total Employees <span>({{ totalEmployeesLabel }})</span>
        </div>

        <div class="employee-toolbar__actions">
          <label class="employee-search">
            <span class="employee-search__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="5.5" fill="none" stroke="currentColor" stroke-width="1.9" />
                <path d="M15.2 15.2 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
              </svg>
            </span>
            <input v-model.trim="searchQuery" type="search" placeholder="Search..." spellcheck="false" />
          </label>

          <button type="button" class="employee-filter" @click="isFilterModalOpen = true">
            <span class="employee-filter__icon"></span>
            <span class="employee-filter__label">Filter</span>
          </button>

          <div class="employee-view-toggle" aria-label="Employee view switcher">
            <button
              type="button"
              class="employee-view-toggle__btn employee-view-toggle__btn--grid"
              :class="{ 'is-active': viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            ></button>
            <button
              type="button"
              class="employee-view-toggle__btn employee-view-toggle__btn--list"
              :class="{ 'is-active': viewMode === 'list' }"
              @click="viewMode = 'list'"
            ></button>
          </div>

          <button type="button" class="employee-toolbar__bulk" @click="isAvailableEmployeesModalOpen = true">Bulk Edit</button>
          <button type="button" class="employee-toolbar__add" @click="isAddEmployeeModalOpen = true">Add Employee</button>
        </div>
      </header>

      <p v-if="loadError" class="employee-page__feedback employee-page__feedback--warning">{{ loadError }}</p>
      <p v-else-if="loading" class="employee-page__feedback">Loading employees...</p>

      <div v-if="viewMode === 'list'" class="employee-table">
        <div class="employee-table__header">
          <div class="employee-table__head employee-table__head--id">Employee ID</div>
          <div class="employee-table__head employee-table__head--name">Employee Name</div>
          <div class="employee-table__head employee-table__head--position">Position</div>
          <div class="employee-table__head employee-table__head--status">Status</div>
          <div class="employee-table__head employee-table__head--date">Hire Date</div>
          <div class="employee-table__head employee-table__head--phone">Phone Number</div>
          <div class="employee-table__head employee-table__head--email">Email Address</div>
          <div class="employee-table__head employee-table__head--action">Action</div>
        </div>

        <article
          v-for="(employee, index) in filteredEmployees"
          :key="employee.id"
          class="employee-table__row"
          :class="{ 'employee-table__row--menu-open': openMenuKey === employee.id }"
        >
          <div class="employee-table__cell employee-table__cell--id">{{ formatEmployeeRowId(employee, index) }}</div>
          <div class="employee-table__cell employee-table__cell--name">{{ employee.name }}</div>
          <div class="employee-table__cell employee-table__cell--position">{{ employee.role }}</div>
          <div class="employee-table__cell employee-table__cell--status">
            <span class="employee-table__status" :class="{ 'employee-table__status--inactive': employee.status !== 'LoggedIn' }">
              {{ employee.status }}
            </span>
          </div>
          <div class="employee-table__cell employee-table__cell--date">{{ formatEmployeeHireDate(employee) }}</div>
          <div class="employee-table__cell employee-table__cell--phone">{{ employee.phone }}</div>
          <div class="employee-table__cell employee-table__cell--email">{{ employee.email }}</div>
          <div class="employee-table__cell employee-table__cell--action">
            <div class="employee-card__menu-shell employee-card__menu-shell--table">
              <button type="button" class="employee-table__dots" @click.stop="toggleMenu(employee.id)">
                <span></span>
                <span></span>
                <span></span>
              </button>

              <div v-if="openMenuKey === employee.id" class="employee-card__menu employee-card__menu--table">
                <button
                  v-for="item in menuItems"
                  :key="item"
                  type="button"
                  class="employee-card__menu-item"
                  :class="{ 'employee-card__menu-item--submenu': item === 'Export info' }"
                  @mouseenter="openExportMenuKey = item === 'Export info' ? employee.id : ''"
                  @click="handleEmployeeMenuAction(item, employee)"
                >
                  {{ item }}
                  <span v-if="item === 'Export info'" class="employee-card__menu-arrow" aria-hidden="true"></span>
                </button>

                <div
                  v-if="openExportMenuKey === employee.id"
                  class="employee-card__submenu"
                  @mouseenter="openExportMenuKey = employee.id"
                >
                  <button type="button" class="employee-card__submenu-item employee-card__submenu-item--pdf">PDF</button>
                  <button type="button" class="employee-card__submenu-item employee-card__submenu-item--excel">EXCL</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="employee-grid" :class="{ 'employee-grid--list': viewMode === 'list' }">
        <article
          v-for="(employee, index) in filteredEmployees"
          :key="employee.id"
          class="employee-card"
          :class="{ 'employee-card--menu-open': openMenuKey === employee.id }"
        >
          <div class="employee-card__pin" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="employee-card__pin-svg">
              <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M11.5 11.5 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M17 17h2.5v2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <div class="employee-card__menu-shell">
            <button
              type="button"
              class="employee-card__menu-trigger"
              :class="{ 'employee-card__menu-trigger--open': openMenuKey === employee.id }"
              aria-label="Open employee actions"
              @click.stop="toggleMenu(employee.id)"
            >
              <span class="employee-card__menu-trigger-icon" aria-hidden="true"></span>
            </button>

            <div v-if="openMenuKey === employee.id" class="employee-card__menu">
              <button
                v-for="item in menuItems"
                :key="item"
                type="button"
                class="employee-card__menu-item"
                :class="{ 'employee-card__menu-item--submenu': item === 'Export info' }"
                @mouseenter="openExportMenuKey = item === 'Export info' ? employee.id : ''"
                @click="handleEmployeeMenuAction(item, employee)"
              >
                {{ item }}
                <span v-if="item === 'Export info'" class="employee-card__menu-arrow" aria-hidden="true"></span>
              </button>

              <div
                v-if="openExportMenuKey === employee.id"
                class="employee-card__submenu"
                @mouseenter="openExportMenuKey = employee.id"
              >
                <button type="button" class="employee-card__submenu-item employee-card__submenu-item--pdf">PDF</button>
                <button type="button" class="employee-card__submenu-item employee-card__submenu-item--excel">EXCL</button>
              </div>
            </div>
          </div>

          <div class="employee-card__top">
            <div class="employee-card__avatar" :style="{ background: employee.avatarBg, color: employee.avatarAccent }">
              <span>{{ employee.avatarText }}</span>
              <span v-if="employee.online" class="employee-card__online"></span>
            </div>

            <div class="employee-card__identity">
              <h3>{{ employee.name }}</h3>
              <p>{{ employee.role }}</p>
              <span class="employee-card__status" :class="{ 'employee-card__status--muted': employee.status !== 'LoggedIn' }">
                {{ employee.status }}
              </span>
            </div>
          </div>

          <div class="employee-card__info">
            <div class="employee-card__info-item">
              <span class="employee-card__info-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s-5.5-5.6-5.5-10A5.5 5.5 0 1 1 17.5 11c0 4.4-5.5 10-5.5 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                  <circle cx="12" cy="11" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8" />
                </svg>
              </span>
              <span>{{ employee.address }}</span>
            </div>
            <div class="employee-card__info-item">
              <span class="employee-card__info-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="3.5" y="6" width="17" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.8" />
                  <path d="M5.5 8 12 13l6.5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span>{{ employee.email }}</span>
            </div>
            <div class="employee-card__info-item">
              <span class="employee-card__info-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M7.4 4.8h2.2l1.1 3.3-1.5 1.3a13.8 13.8 0 0 0 5.4 5.4l1.3-1.5 3.3 1.1v2.2a1.8 1.8 0 0 1-1.9 1.8A14.9 14.9 0 0 1 5.6 6.7 1.8 1.8 0 0 1 7.4 4.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                </svg>
              </span>
              <span>{{ employee.phone }}</span>
            </div>
          </div>

          <div class="employee-card__note">
            <span class="employee-card__note-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="5" y="3.5" width="14" height="17" rx="3" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path d="M9 9h6M9 13h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span>{{ employee.note }}</span>
          </div>
        </article>
      </div>
    </section>

    <AvailableEmployeesModal
      :open="isAvailableEmployeesModalOpen"
      :employees="availableEmployees"
      @close="isAvailableEmployeesModalOpen = false"
      @confirm="handleAddEmployees"
    />

    <AddEmployeeModal
      :open="isAddEmployeeModalOpen"
      :suggested-employee-id="suggestedEmployeeId"
      :submitting="loading"
      :submit-error="isAddEmployeeModalOpen ? loadError : ''"
      @close="isAddEmployeeModalOpen = false"
      @save="handleAddEmployeeSave"
      @clear-submit-error="clearAddEmployeeSubmitError"
    />

    <FieldsToEditModal
      :open="isFieldsToEditModalOpen"
      :fields="editableFieldCatalog"
      :selected-field-keys="selectedEditFieldKeys"
      @close="isFieldsToEditModalOpen = false"
      @next="handleFieldsToEditNext"
    />

    <EditValuesModal
      :open="isEditValuesModalOpen"
      :fields="selectedEditableFields"
      :values="editFieldValues"
      :apply-mode="editApplyMode"
      @close="isEditValuesModalOpen = false"
      @next="handleEditValuesNext"
    />

    <CustomizedEditModal
      :open="isCustomizedEditModalOpen"
      :employees="selectedEmployeesForEdit"
      :employee="selectedEmployeesForEdit[currentEmployeeEditIndex] || null"
      :fields="selectedEditableFields"
      :values="editFieldValues"
      :apply-mode="editApplyMode"
      :current-index="currentEmployeeEditIndex"
      @close="isCustomizedEditModalOpen = false"
      @finish="handleFinishCustomizedEdit"
    />

    <EditPreviewModal
      :open="isEditPreviewModalOpen"
      :employees="selectedEmployeesForEdit"
      :fields="selectedEditableFields"
      :preview-values-by-employee="previewValuesByEmployee"
      :apply-mode="editApplyMode"
      @close="isEditPreviewModalOpen = false"
      @edit="handleEditPreviewAgain"
      @confirm="handleConfirmPreview"
    />

    <ConfirmBulkUpdateModal
      :open="isConfirmBulkUpdateModalOpen"
      :employee-count="selectedEmployeesForEdit.length"
      @close="isConfirmBulkUpdateModalOpen = false"
      @confirm="handleConfirmBulkUpdate"
    />

    <UpdateSuccessModal
      :open="isUpdateSuccessModalOpen"
      @done="isUpdateSuccessModalOpen = false"
    />

    <EmployeeMessageModal
      :open="isEmployeeMessageModalOpen"
      :employee="activeEmployee"
      mode="email"
      @close="isEmployeeMessageModalOpen = false"
      @send="isEmployeeMessageModalOpen = false"
    />

    <EmployeeMessageModal
      :open="isEmployeeResetModalOpen"
      :employee="activeEmployee"
      mode="reset-password"
      @close="isEmployeeResetModalOpen = false"
      @send="handleResetEmployeePassword"
    />

    <EmployeeDeleteModal
      :open="isEmployeeDeleteModalOpen"
      :employee="activeEmployee"
      :submitting="loading"
      :submit-error="isEmployeeDeleteModalOpen ? loadError : ''"
      @close="isEmployeeDeleteModalOpen = false"
      @confirm="handleDeleteEmployee"
    />

    <EmployeesFilterModal
      :open="isFilterModalOpen"
      :initial-filters="filterState"
      :employment-status-options="employmentStatusOptions"
      :job-title-options="jobTitleOptions"
      @close="isFilterModalOpen = false"
      @apply="handleApplyFilters"
      @clear="handleClearFilters"
    />
  </div>
</template>

<style scoped>
.employee-page {
  padding-top: 10px;
}

.employee-page__breadcrumb {
  margin-left: 0;
  margin-bottom: 14px;
}

.employee-shell {
  padding: 6px 14px 18px;
  border: 1px solid #f4e7ec;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 8px 30px rgba(76, 41, 58, 0.05);
}

.employee-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 6px 16px;
  border-bottom: 1px solid #f5e9ee;
}

.employee-toolbar__summary {
  color: #2b2228;
  font-size: 24px;
  font-weight: 700;
}

.employee-toolbar__summary span {
  color: #f15a94;
}

.employee-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.employee-search {
  width: 400px;
  display: flex;
  align-items: center;
  flex: 0 0 400px;
  gap: 10px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid #efe3e8;
  border-radius: 16px;
  background: #ffffff;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.employee-search input {
  display: block;
  width: 100%;
  min-width: 0;
  min-height: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #4b5563;
  font-size: 14px;
  font: inherit;
  line-height: 1.2;
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
}

.employee-search__icon {
  width: 15px;
  height: 15px;
  color: #9ca3af;
  display: flex;
  flex: 0 0 15px;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.employee-search__icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.employee-search input::placeholder {
  color: #b7aab2;
  opacity: 1;
}

.employee-search input::-webkit-search-cancel-button,
.employee-search input::-webkit-search-decoration,
.employee-search input::-webkit-search-results-button,
.employee-search input::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.employee-search input:focus {
  outline: none;
}

.employee-search:focus-within {
  border-color: #f1c6d7;
  box-shadow: 0 0 0 3px rgba(241, 91, 149, 0.08);
}

.employee-filter {
  min-width: 98px;
  height: 38px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 11px;
  background: #f3bfd2;
  color: #ea4f8d;
  font-size: 13px;
  white-space: nowrap;
}

.employee-filter__icon {
  width: 12px;
  height: 12px;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, 68% 36%, 68% 100%, 32% 100%, 32% 36%);
}

.employee-filter__label {
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.employee-view-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 92px;
  height: 38px;
  padding: 5px;
  border-radius: 12px;
  background: #f8d8e7;
}

.employee-view-toggle__btn {
  width: 38px;
  height: 26px;
  border-radius: 9px;
  position: relative;
  background: transparent;
}

.employee-view-toggle__btn.is-active {
  background: #f4b8cc;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.employee-view-toggle__btn--list::before,
.employee-view-toggle__btn--grid::before {
  content: '';
  position: absolute;
  inset: 11px 10px;
}

.employee-view-toggle__btn--list::before {
  background:
    linear-gradient(currentColor, currentColor) left top/100% 2px no-repeat,
    linear-gradient(currentColor, currentColor) left center/100% 2px no-repeat,
    linear-gradient(currentColor, currentColor) left bottom/100% 2px no-repeat;
  color: #ef5d97;
}

.employee-view-toggle__btn--grid::before {
  background:
    linear-gradient(currentColor, currentColor) left top/8px 8px no-repeat,
    linear-gradient(currentColor, currentColor) right top/8px 8px no-repeat,
    linear-gradient(currentColor, currentColor) left bottom/8px 8px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom/8px 8px no-repeat;
  color: #ef5d97;
}

.employee-view-toggle__btn.is-active::before {
  color: #fff;
}

.employee-toolbar__bulk,
.employee-toolbar__add {
  height: 38px;
  padding: 0 16px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.employee-toolbar__bulk {
  background: #f3bfd2;
  color: #ef5d97;
}

.employee-toolbar__add {
  border: 1px solid #ef5d97;
  color: #ef5d97;
  background: #fff;
}

.employee-page__feedback {
  margin: 16px 6px 0;
  color: #9a8791;
  font-size: 14px;
}

.employee-page__feedback--warning {
  color: #d15b89;
}

.employee-table {
  --employee-table-columns:
    minmax(88px, 0.8fr)
    minmax(170px, 1.45fr)
    minmax(150px, 1.2fr)
    minmax(118px, 0.9fr)
    minmax(122px, 1fr)
    minmax(146px, 1.15fr)
    minmax(190px, 1.5fr)
    minmax(82px, 0.72fr);
  margin-top: 18px;
  border: 1px solid #f4e7ec;
  border-radius: 18px;
  background: #fff;
  overflow: visible;
}

.employee-table__header,
.employee-table__row {
  display: grid;
  grid-template-columns: var(--employee-table-columns);
  gap: 0;
  align-items: center;
  padding: 14px 18px;
}

.employee-table__header {
  color: #6b7280;
  font-size: 10px;
  font-weight: 500;
  background: #f4f5f8;
  border-bottom: 1px solid #f4e8ed;
  border-radius: 16px;
}

.employee-table__head {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  font-size: 10px;
  text-align: center;
}

.employee-table__head--date,
.employee-table__head--phone,
.employee-table__head--email {
  justify-content: flex-start;
  text-align: left;
}

.employee-table__row {
  position: relative;
  min-height: 0;
  border-bottom: 1px solid #f6ebef;
  background: #fff;
}

.employee-table__row--menu-open {
  z-index: 60;
}

.employee-table__row:last-child {
  border-bottom: 0;
}

.employee-table__cell {
  min-width: 0;
  color: #2d252b;
  font-size: 10px;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.employee-table__cell--id {
  font-weight: 600;
}

.employee-table__cell--date,
.employee-table__cell--phone,
.employee-table__cell--email {
  justify-content: flex-start;
  text-align: left;
}

.employee-table__cell--name {
  color: #ef5d97;
  font-weight: 500;
}

.employee-table__cell--position {
  color: #2f272d;
  word-break: break-word;
}

.employee-table__cell--phone,
.employee-table__cell--email {
  word-break: break-word;
}

.employee-table__cell--email {
  color: #285dff;
}

.employee-table__cell--action {
  position: relative;
  justify-content: center;
  overflow: visible;
}

.employee-table__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 20px;
  background: #ffe9f1;
  color: #ef5d97;
  font-size: 10px;
  font-weight: 600;
}

.employee-table__status--inactive {
  background: #f0b21f;
  color: #fff;
}

.employee-table__dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}

.employee-table__dots span {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #ef5d97;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 18px 0 6px;
  overflow: visible;
}

.employee-grid--list {
  grid-template-columns: 1fr;
}

.employee-card {
  position: relative;
  min-height: 342px;
  padding: 16px 14px 14px;
  border: 1px solid #f6dbe4;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff 0%, #fffafb 100%);
  box-shadow: 0 10px 24px rgba(88, 53, 69, 0.04);
  overflow: visible;
}

.employee-card--list {
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: center;
  padding: 22px 18px 18px;
}

.employee-card--menu-open {
  z-index: 40;
}

.employee-card__pin {
  position: absolute;
  top: 18px;
  left: 16px;
  width: 18px;
  height: 18px;
  color: #c9d456;
}

.employee-card__pin-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.employee-card__menu-shell {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 30;
}

.employee-card__menu-shell--table {
  position: relative;
  top: auto;
  right: auto;
  z-index: 50;
}

.employee-card__menu-trigger {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #c6b5bd;
  background: rgba(255, 246, 250, 0.9);
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.employee-card__menu-trigger:hover {
  color: #ee5d97;
  background: #fff0f6;
}

.employee-card__menu-trigger--open {
  color: #ee5d97;
  background: #ffe7f0;
}

.employee-card__menu-trigger-icon {
  width: 8px;
  height: 8px;
  border-right: 1.8px solid currentColor;
  border-bottom: 1.8px solid currentColor;
  transform: rotate(45deg);
  margin-top: -3px;
  transition: transform 0.18s ease;
}

.employee-card__menu-trigger--open .employee-card__menu-trigger-icon {
  transform: rotate(-135deg);
  margin-top: 3px;
}

.employee-card__menu {
  position: absolute;
  top: 30px;
  right: 0;
  width: 188px;
  padding: 10px 0;
  border: 1px solid #f2dce6;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fff9fb 100%);
  box-shadow: 0 20px 40px rgba(88, 53, 69, 0.1);
  z-index: 35;
}

.employee-card__menu--table {
  top: calc(100% + 8px);
  right: -10px;
}

.employee-card__menu-item {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  color: #a79aa2;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.employee-card__menu-item:nth-child(1),
.employee-card__menu-item:nth-child(2) {
  color: #ff86b6;
}

.employee-card__menu-item:nth-child(3),
.employee-card__menu-item:nth-child(8) {
  color: #6f2cff;
}

.employee-card__menu-item:nth-child(4) {
  color: #f2b313;
}

.employee-card__menu-item:nth-child(5) {
  color: #73df93;
}

.employee-card__menu-item:nth-child(6) {
  color: #f08ab2;
}

.employee-card__menu-item:nth-child(7) {
  color: #4d8fff;
}

.employee-card__menu-item:hover {
  background: #fff2f7;
}

.employee-card__menu-item--submenu {
  position: relative;
}

.employee-card__menu-arrow {
  width: 7px;
  height: 7px;
  border-top: 1.5px solid #8f7f88;
  border-right: 1.5px solid #8f7f88;
  transform: rotate(45deg);
  flex: 0 0 auto;
}

.employee-card__submenu {
  position: absolute;
  top: calc(100% - 44px);
  left: calc(100% + 10px);
  min-width: 94px;
  padding: 8px 0;
  border: 1px solid #f2dce6;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fff9fb 100%);
  box-shadow: 0 18px 34px rgba(88, 53, 69, 0.1);
  z-index: 6;
}

.employee-card__submenu-item {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  font-size: 12px;
}

.employee-card__submenu-item:hover {
  background: #fff2f7;
}

.employee-card__submenu-item--pdf {
  color: #ff8db8;
}

.employee-card__submenu-item--excel {
  color: #5ba0ff;
}

.employee-card__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 14px;
}

.employee-card--list .employee-card__top {
  flex-direction: row;
  align-items: center;
  gap: 18px;
  padding-top: 4px;
}

.employee-card__avatar {
  position: relative;
  width: 78px;
  height: 78px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.7);
}

.employee-card__avatar span:first-child {
  font-size: 28px;
  font-weight: 800;
}

.employee-card__online {
  position: absolute;
  right: 2px;
  bottom: 4px;
  width: 14px;
  height: 14px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #1ce154;
}

.employee-card__identity {
  text-align: center;
}

.employee-card--list .employee-card__identity {
  text-align: left;
}

.employee-card__identity h3 {
  margin: 16px 0 4px;
  font-size: 26px;
  line-height: 1.1;
  font-weight: 700;
  color: #ef5d97;
}

.employee-card--list .employee-card__identity h3 {
  margin-top: 0;
}

.employee-card__identity p {
  margin: 0;
  font-size: 14px;
  color: #b5a4ac;
}

.employee-card__status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  margin-top: 16px;
  padding: 0 16px;
  border-radius: 12px;
  background: #ffe9f1;
  color: #ef5d97;
  font-size: 15px;
  font-weight: 600;
}

.employee-card__status--muted {
  background: #eadce2;
  color: #a6929c;
}

.employee-card__info {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #f6edf1;
}

.employee-card--list .employee-card__info {
  margin-top: 0;
}

.employee-card__info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #b0a0a9;
  font-size: 14px;
}

.employee-card__info-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  color: #f3a4c2;
}

.employee-card__info-icon svg,
.employee-card__note-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.employee-card__note {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px dashed #f2b9ce;
  border-radius: 12px;
  color: #bbb0b6;
  font-size: 13px;
  line-height: 1.35;
}

.employee-card--list .employee-card__note {
  min-height: 112px;
  margin-top: 0;
  align-self: stretch;
}

.employee-card__note-icon {
  width: 18px;
  height: 18px;
  color: #f29fc0;
  flex: 0 0 auto;
}

@media (max-width: 1400px) {
  .employee-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .employee-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .employee-toolbar__actions {
    justify-content: stretch;
  }

  .employee-search {
    width: 100%;
  }

  .employee-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .employee-card--list {
    grid-template-columns: 1fr;
  }

  .employee-card--list .employee-card__note {
    min-height: 0;
  }

  .employee-table {
    overflow-x: auto;
  }

  .employee-table__header,
  .employee-table__row {
    min-width: 1060px;
  }
}

@media (max-width: 760px) {
  .employee-shell {
    padding: 10px;
    border-radius: 18px;
  }

  .employee-toolbar__summary {
    font-size: 18px;
  }

  .employee-toolbar__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .employee-filter,
  .employee-toolbar__bulk,
  .employee-toolbar__add,
  .employee-view-toggle {
    width: 100%;
  }

  .employee-grid {
    grid-template-columns: 1fr;
  }

  .employee-card {
    min-height: 0;
  }

  .employee-card__identity h3 {
    font-size: 22px;
  }
}
</style>
