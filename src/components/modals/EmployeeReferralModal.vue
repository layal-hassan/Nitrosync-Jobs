<script setup>
import { ref, watch } from 'vue'
import { getNitroSyncEmployees } from '../../composables/useNitroSyncEmployees'
import AddEmployeeModal from './AddEmployeeModal.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  job: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'next'])

const isAddEmployeeOpen = ref(false)
const employees = ref([])
const employeesLoading = ref(false)
const employeesError = ref('')
const hasLoadedEmployees = ref(false)

const accents = ['pink', 'blue', 'green']

const normalizeLabel = (value, fallback = '-') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

const toDisplayDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const mapEmployeeRow = (employee, index) => {
  const firstName = normalizeLabel(employee?.first_name ?? employee?.firstName, '')
  const lastName = normalizeLabel(employee?.last_name ?? employee?.lastName, '')
  const fullName = normalizeLabel(
    employee?.full_name ?? employee?.fullName ?? employee?.employee_name ?? employee?.employeeName ?? employee?.name,
    '',
  )
  const [derivedFirstName = '', ...restName] = fullName ? fullName.split(' ') : []
  const derivedLastName = restName.join(' ')

  return {
    id: employee?.id ?? employee?._id ?? `${fullName || `${firstName}-${lastName}`}-${index}`,
    firstName: firstName || derivedFirstName || '-',
    lastName: lastName || derivedLastName || '-',
    joiningDate: toDisplayDate(
      employee?.joining_date ?? employee?.joiningDate ?? employee?.created_at ?? employee?.createdAt,
    ),
    status: normalizeLabel(employee?.status, 'Active'),
    location: normalizeLabel(
      employee?.location ??
        employee?.address ??
        employee?.city ??
        employee?.country ??
        employee?.department_name ??
        employee?.departmentName,
    ),
    vacancyDeadline: toDisplayDate(
      employee?.vacancy_deadline ?? employee?.vacancyDeadline ?? employee?.deadline ?? employee?.due_date,
    ),
    accent: accents[index % accents.length],
  }
}

const fetchEmployees = async () => {
  const companyId = String(props.job?.relatedCompany || '').trim()

  if (!companyId) {
    employeesError.value = 'This job is missing related company, so employee list cannot be loaded.'
    employees.value = []
    return
  }

  employeesLoading.value = true
  employeesError.value = ''

  try {
    const response = await getNitroSyncEmployees(companyId)
    const rows = Array.isArray(response?.data) ? response.data : []

    employees.value = rows.map(mapEmployeeRow)
    hasLoadedEmployees.value = true
  } catch (error) {
    console.error('Failed to fetch employee referral list', error)
    employeesError.value = 'Could not load employee list from API.'
    employees.value = []
  } finally {
    employeesLoading.value = false
  }
}

const addEmployee = (employee) => {
  employees.value = [
    ...employees.value,
    {
      id: `${employee.firstName}-${employee.lastName}-${employees.value.length}`,
      ...employee,
      accent: accents[employees.value.length % accents.length],
    },
  ]
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && !hasLoadedEmployees.value) {
      fetchEmployees()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="props.open" class="employee-modal">
    <button class="employee-modal__overlay" aria-label="Close employee referral modal" @click="$emit('close')"></button>

    <section class="employee-modal__panel" role="dialog" aria-modal="true" aria-label="Employee Referral">
      <header class="employee-modal__header">
        <h2 class="employee-modal__title">Employee Referral</h2>
        <button
          class="employee-modal__close"
          type="button"
          aria-label="Close employee referral modal"
          @click="$emit('close')"
        >
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="employee-modal__body">
        <div class="employee-modal__toolbar">
          <h3 class="employee-modal__section-title">Employee List</h3>
          <button type="button" class="employee-modal__add" @click="isAddEmployeeOpen = true">Add Employee</button>
        </div>

        <div class="employee-modal__table-wrap">
          <div class="employee-modal__table employee-modal__table--head">
            <div class="employee-modal__head-marker"></div>
            <div>First Name</div>
            <div>Last Name</div>
            <div>Joining Date</div>
            <div>Status</div>
            <div>Location</div>
            <div>Vacancy Deadline</div>
          </div>

          <div v-if="employeesLoading" class="employee-modal__state">
            Loading employees...
          </div>

          <div v-else-if="employeesError" class="employee-modal__state employee-modal__state--error">
            {{ employeesError }}
          </div>

          <div v-else-if="!employees.length" class="employee-modal__state">
            No employees were returned by the API.
          </div>

          <div
            v-for="employee in employees"
            :key="employee.id"
            class="employee-modal__table employee-modal__table--row"
          >
            <div class="employee-modal__radio"></div>

            <div class="employee-chip employee-chip--name" :class="`employee-chip--${employee.accent}`">
              <span class="employee-chip__avatar"></span>
              <span>{{ employee.firstName }}</span>
            </div>

            <div class="employee-chip employee-chip--last" :class="`employee-chip--${employee.accent}`">
              {{ employee.lastName }}
            </div>

            <div>{{ employee.joiningDate }}</div>
            <div>
              <span class="employee-status">{{ employee.status }}</span>
            </div>
            <div>{{ employee.location }}</div>
            <div>{{ employee.vacancyDeadline }}</div>
          </div>
        </div>
      </div>

      <footer class="employee-modal__footer">
        <button type="button" class="employee-modal__next" @click="$emit('next')">Next</button>
      </footer>
    </section>

    <AddEmployeeModal
      :open="isAddEmployeeOpen"
      @close="isAddEmployeeOpen = false"
      @save="addEmployee"
    />
  </div>
</template>

<style scoped>
.employee-modal {
  position: fixed;
  inset: 0;
  z-index: 115;
  display: grid;
  place-items: center;
  padding: 20px;
}

.employee-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.employee-modal__panel {
  position: relative;
  width: min(872px, calc(100vw - 28px));
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 50px rgba(32, 19, 26, 0.24);
  overflow: hidden;
}

.employee-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 54px 22px;
  border-bottom: 1px solid #f0e9ed;
}

.employee-modal__title {
  margin: 0;
  color: #f04f92;
  font-size: 20px;
  font-weight: 600;
}

.employee-modal__close {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
  flex: 0 0 auto;
}

.employee-modal__close span {
  position: absolute;
  top: 13px;
  left: 6px;
  width: 16px;
  height: 2px;
  background: #ffffff;
}

.employee-modal__close span:first-child {
  transform: rotate(45deg);
}

.employee-modal__close span:last-child {
  transform: rotate(-45deg);
}

.employee-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 20px 8px;
  overflow: auto;
}

.employee-modal__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.employee-modal__section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1b171b;
}

.employee-modal__add {
  min-width: 134px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 12px;
}

.employee-modal__table-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 100%;
  overflow: auto;
  padding-right: 4px;
}

.employee-modal__state {
  min-height: 88px;
  border-radius: 8px;
  background: #faf8f9;
  color: #a6969f;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.employee-modal__state--error {
  color: #e15b8f;
}

.employee-modal__table {
  display: grid;
  grid-template-columns: 26px 1.25fr 1fr 1.1fr 0.8fr 0.95fr 1.1fr;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.employee-modal__table--head {
  background: #f6e7ec;
  padding: 11px 14px;
  color: #1d171b;
}

.employee-modal__head-marker {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #b98f9b;
}

.employee-modal__table--row {
  background: #f8f8f9;
  padding: 10px 14px;
  color: #171318;
}

.employee-modal__radio {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ececee;
}

.employee-chip {
  min-height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  width: fit-content;
  font-size: 12px;
}

.employee-chip__avatar {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #3a1dff, #ffbdcb);
}

.employee-chip--name {
  padding-left: 6px;
}

.employee-chip--pink {
  background: #ede7fb;
  color: #8b73ff;
}

.employee-chip--blue {
  background: #e6f5ff;
  color: #56baff;
}

.employee-chip--green {
  background: #e2f6ea;
  color: #47d67f;
}

.employee-chip--last {
  justify-content: center;
}

.employee-status {
  min-width: 66px;
  height: 30px;
  border-radius: 12px;
  background: #fae5ec;
  color: #f04f92;
  display: inline-grid;
  place-items: center;
}

.employee-modal__footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  padding: 26px 28px 34px;
}

@media (max-width: 900px) {
  .employee-modal {
    padding: 12px;
  }

  .employee-modal__panel {
    width: min(100vw - 24px, 872px);
    max-height: calc(100vh - 24px);
  }

  .employee-modal__header {
    padding: 18px 18px 16px;
  }

  .employee-modal__body {
    padding: 14px 14px 8px;
  }

  .employee-modal__footer {
    padding: 18px 14px 18px;
  }
}

.employee-modal__next {
  min-width: 120px;
  height: 38px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 14px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}
</style>
