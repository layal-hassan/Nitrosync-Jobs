<script setup>
import { reactive, watch } from 'vue'
import Dropdown from '../ui/Dropdown.vue'
import DatePicker from '../ui/DatePicker.vue'

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

        <div class="employee-filters-modal__field employee-filters-modal__field--date">
          <DatePicker v-model="form.rangeFrom" placeholder="From" />
        </div>

        <div class="employee-filters-modal__field employee-filters-modal__field--date">
          <DatePicker v-model="form.rangeTo" placeholder="To" />
        </div>

        <div class="employee-filters-modal__field employee-filters-modal__field--full employee-filters-modal__field--date">
          <DatePicker v-model="form.hireDate" placeholder="Hire date" />
        </div>

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
  padding: 28px;
}

.employee-filters-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(54, 35, 45, 0.34);
  backdrop-filter: blur(3px);
}

.employee-filters-modal__panel {
  --employee-filter-control-height: 36px;
  --employee-filter-control-radius: 13px;
  position: relative;
  width: min(552px, calc(100vw - 36px));
  padding: 12px;
  border: 1px solid #f3dbe5;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 26px 60px rgba(61, 36, 48, 0.2);
}

.employee-filters-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 4px 2px 0;
}

.employee-filters-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.employee-filters-modal__title-icon {
  width: 13px;
  height: 13px;
  background: #ef5a96;
  clip-path: polygon(0 0, 100% 0, 68% 36%, 68% 100%, 32% 100%, 32% 36%);
}

.employee-filters-modal__title {
  margin: 0;
  color: #ef5a96;
  font-size: 13px;
  font-weight: 600;
}

.employee-filters-modal__close {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ef5a96;
  box-shadow: 0 6px 14px rgba(239, 90, 150, 0.22);
}

.employee-filters-modal__close span {
  position: absolute;
  top: 11px;
  left: 6px;
  width: 12px;
  height: 1.6px;
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
.employee-filters-modal__field :deep(.dropdown__trigger),
.employee-filters-modal__field :deep(.date-picker__trigger) {
  width: 100%;
  min-height: var(--employee-filter-control-height) !important;
  height: var(--employee-filter-control-height) !important;
  max-height: var(--employee-filter-control-height) !important;
  padding: 0 13px !important;
  border: 1px solid #efdee5;
  border-radius: var(--employee-filter-control-radius);
  background: #fff;
  color: #746a70;
  font-size: 12px !important;
  line-height: var(--employee-filter-control-height) !important;
  box-sizing: border-box;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.employee-filters-modal__field input {
  display: block;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  outline: none;
  font-family: inherit;
  font-weight: 400;
  background-clip: padding-box;
}

.employee-filters-modal__field input:focus,
.employee-filters-modal__field :deep(.dropdown__trigger:focus-visible),
.employee-filters-modal__field :deep(.date-picker__trigger:focus-visible) {
  outline: none;
  border-color: #ef87b1;
  box-shadow: 0 0 0 3px rgba(239, 90, 150, 0.1);
}

.employee-filters-modal__field input::placeholder,
.employee-filters-modal__field :deep(.dropdown__trigger--placeholder),
.employee-filters-modal__field :deep(.date-picker__trigger--placeholder) {
  color: #b9afb5;
}

.employee-filters-modal__field :deep(.dropdown__trigger) {
  display: flex;
  align-items: center;
  padding-right: 34px !important;
  background: #fff;
}

.employee-filters-modal__field :deep(.dropdown__value) {
  font-size: 12px !important;
  line-height: 1;
}

.employee-filters-modal__field :deep(.date-picker__value) {
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0;
}

.employee-filters-modal__field :deep(.dropdown__arrow) {
  right: 14px;
  width: 7px;
  height: 7px;
  color: #c5bbc0;
}

.employee-filters-modal__range-label {
  margin-top: -2px;
  color: #2b2228;
  font-size: 12px;
  font-weight: 600;
}

.employee-filters-modal__field--date :deep(.date-picker__icon) {
  width: 14px;
  height: 14px;
}

.employee-filters-modal__field--date :deep(.date-picker__panel) {
  width: 272px;
  padding: 12px;
  border: 1px solid #f2dbe5;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff 0%, #fff8fb 100%);
  box-shadow: 0 18px 32px rgba(44, 24, 34, 0.14);
}

.employee-filters-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  padding: 0 2px 0;
}

.employee-filters-modal__apply,
.employee-filters-modal__clear {
  min-width: 92px;
  height: 36px;
  border-radius: 12px;
  font-size: 12px;
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

@media (max-width: 640px) {
  .employee-filters-modal {
    padding: 16px;
  }

  .employee-filters-modal__panel {
    width: min(100%, calc(100vw - 24px));
    padding: 12px;
    border-radius: 18px;
  }

  .employee-filters-modal__body {
    grid-template-columns: 1fr;
  }

  .employee-filters-modal__field--full,
  .employee-filters-modal__range-label {
    grid-column: auto;
  }
}
</style>
