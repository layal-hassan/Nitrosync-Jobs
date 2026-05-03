<script setup>
import { reactive, watch } from 'vue'
import Dropdown from '../ui/Dropdown.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  initialFilters: {
    type: Object,
    default: () => ({}),
  },
  employmentStatusOptions: {
    type: Array,
    default: () => [],
  },
  jobTitleOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'apply', 'clear'])

const createForm = () => ({
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

const form = reactive(createForm())

const syncForm = (filters = {}) => {
  Object.assign(form, createForm(), {
    employmentStatus: String(filters.employmentStatus ?? ''),
    firstName: String(filters.firstName ?? ''),
    lastName: String(filters.lastName ?? ''),
    department: String(filters.department ?? ''),
    position: String(filters.position ?? ''),
    rangeFrom: String(filters.rangeFrom ?? ''),
    rangeTo: String(filters.rangeTo ?? ''),
    hireDate: String(filters.hireDate ?? ''),
    location: String(filters.location ?? ''),
    jobTitle: String(filters.jobTitle ?? ''),
  })
}

const handleApply = () => {
  emit('apply', { ...form })
}

const handleClear = () => {
  syncForm()
  emit('clear')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      syncForm(props.initialFilters)
    }
  },
)
</script>

<template>
  <div v-if="open" class="employee-filters-modal">
    <button class="employee-filters-modal__overlay" type="button" aria-label="Close filters modal" @click="$emit('close')"></button>

    <section class="employee-filters-modal__panel" role="dialog" aria-modal="true" aria-label="Filters">
      <header class="employee-filters-modal__header">
        <div class="employee-filters-modal__title-wrap">
          <span class="employee-filters-modal__title-icon" aria-hidden="true"></span>
          <h2 class="employee-filters-modal__title">Filters</h2>
        </div>

        <button class="employee-filters-modal__close" type="button" aria-label="Close filters modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="employee-filters-modal__body">
        <div class="employee-filters-modal__field employee-filters-modal__field--full">
          <Dropdown
            v-model="form.employmentStatus"
            :options="employmentStatusOptions"
            placeholder="Employment status"
          />
        </div>

        <label class="employee-filters-modal__field">
          <input v-model.trim="form.firstName" type="text" placeholder="First Name" />
        </label>

        <label class="employee-filters-modal__field">
          <input v-model.trim="form.lastName" type="text" placeholder="Last Name" />
        </label>

        <label class="employee-filters-modal__field">
          <input v-model.trim="form.department" type="text" placeholder="Department" />
        </label>

        <label class="employee-filters-modal__field">
          <input v-model.trim="form.position" type="text" placeholder="Position" />
        </label>

        <div class="employee-filters-modal__range-label">Employee Range</div>

        <label class="employee-filters-modal__field employee-filters-modal__field--date">
          <input v-model="form.rangeFrom" type="date" placeholder="From" />
          <span class="employee-filters-modal__calendar" aria-hidden="true"></span>
        </label>

        <label class="employee-filters-modal__field employee-filters-modal__field--date">
          <input v-model="form.rangeTo" type="date" placeholder="To" />
          <span class="employee-filters-modal__calendar" aria-hidden="true"></span>
        </label>

        <label class="employee-filters-modal__field employee-filters-modal__field--full employee-filters-modal__field--date">
          <input v-model="form.hireDate" type="date" placeholder="Hire date" />
          <span class="employee-filters-modal__calendar" aria-hidden="true"></span>
        </label>

        <label class="employee-filters-modal__field employee-filters-modal__field--full">
          <input v-model.trim="form.location" type="text" placeholder="Location" />
        </label>

        <div class="employee-filters-modal__field employee-filters-modal__field--full">
          <Dropdown
            v-model="form.jobTitle"
            :options="jobTitleOptions"
            placeholder="Job title"
          />
        </div>
      </div>

      <footer class="employee-filters-modal__footer">
        <button type="button" class="employee-filters-modal__apply" @click="handleApply">Apply</button>
        <button type="button" class="employee-filters-modal__clear" @click="handleClear">Clear All</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.employee-filters-modal {
  position: fixed;
  inset: 0;
  z-index: 145;
  display: grid;
  place-items: center;
  padding: 20px;
}

.employee-filters-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(34, 21, 28, 0.48);
}

.employee-filters-modal__panel {
  position: relative;
  width: min(438px, calc(100vw - 28px));
  padding: 10px;
  border: 1px solid #f0dfe6;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(44, 26, 34, 0.22);
}

.employee-filters-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.employee-filters-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.employee-filters-modal__title-icon {
  width: 11px;
  height: 11px;
  background: #ef5a96;
  clip-path: polygon(0 0, 100% 0, 68% 36%, 68% 100%, 32% 100%, 32% 36%);
}

.employee-filters-modal__title {
  margin: 0;
  color: #ef5a96;
  font-size: 12px;
  font-weight: 600;
}

.employee-filters-modal__close {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef5a96;
}

.employee-filters-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #fff;
}

.employee-filters-modal__close span:first-child {
  transform: rotate(45deg);
}

.employee-filters-modal__close span:last-child {
  transform: rotate(-45deg);
}

.employee-filters-modal__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.employee-filters-modal__field {
  position: relative;
}

.employee-filters-modal__field--full,
.employee-filters-modal__range-label {
  grid-column: 1 / -1;
}

.employee-filters-modal__field input,
.employee-filters-modal__field :deep(.dropdown__trigger) {
  width: 100%;
  min-height: 33px;
  height: 33px;
  padding: 0 12px;
  border: 1px solid #eee4e8;
  border-radius: 7px;
  background: #fff;
  color: #746a70;
  font-size: 11px;
}

.employee-filters-modal__field input {
  outline: none;
}

.employee-filters-modal__field input::placeholder,
.employee-filters-modal__field :deep(.dropdown__trigger--placeholder) {
  color: #b9afb5;
}

.employee-filters-modal__field :deep(.dropdown__trigger) {
  padding-right: 32px;
  background: #fff;
}

.employee-filters-modal__field :deep(.dropdown__arrow) {
  right: 12px;
  width: 7px;
  height: 7px;
  color: #c5bbc0;
}

.employee-filters-modal__range-label {
  margin-top: -2px;
  color: #2b2228;
  font-size: 11px;
  font-weight: 600;
}

.employee-filters-modal__field--date input {
  padding-right: 34px;
  color-scheme: light;
}

.employee-filters-modal__field--date input::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.employee-filters-modal__calendar {
  position: absolute;
  top: 50%;
  right: 10px;
  width: 13px;
  height: 13px;
  border: 1.4px solid #ef5a96;
  border-radius: 3px;
  background:
    linear-gradient(#ef5a96, #ef5a96) center 3px / 9px 1.2px no-repeat,
    linear-gradient(#ef5a96, #ef5a96) center 7px / 7px 1px no-repeat;
  transform: translateY(-50%);
  pointer-events: none;
}

.employee-filters-modal__calendar::before,
.employee-filters-modal__calendar::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 2px;
  height: 4px;
  border-radius: 999px;
  background: #ef5a96;
}

.employee-filters-modal__calendar::before {
  left: 3px;
}

.employee-filters-modal__calendar::after {
  right: 3px;
}

.employee-filters-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.employee-filters-modal__apply,
.employee-filters-modal__clear {
  min-width: 73px;
  height: 31px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
}

.employee-filters-modal__apply {
  background: linear-gradient(180deg, #ef5a96 0%, #e54889 100%);
  color: #fff;
}

.employee-filters-modal__clear {
  background: #f6f3f5;
  color: #b4a9af;
}
</style>
