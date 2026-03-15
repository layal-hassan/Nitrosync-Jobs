<script setup>
import { reactive, ref, watch } from 'vue'
import Dropdown from '../ui/Dropdown.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'save'])

const statusOptions = ['Active', 'Pending', 'On Leave']

const createForm = () => ({
  firstName: '',
  lastName: '',
  joiningDate: '',
  status: '',
  location: '',
  vacancyDeadline: '',
})

const form = reactive(createForm())
const errors = ref({})

const resetForm = () => {
  Object.assign(form, createForm())
  errors.value = {}
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  },
)

const validate = () => {
  const nextErrors = {}

  if (!form.firstName.trim()) nextErrors.firstName = 'Required'
  if (!form.lastName.trim()) nextErrors.lastName = 'Required'
  if (!form.joiningDate) nextErrors.joiningDate = 'Required'
  if (!form.status) nextErrors.status = 'Required'
  if (!form.location.trim()) nextErrors.location = 'Required'
  if (!form.vacancyDeadline) nextErrors.vacancyDeadline = 'Required'

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const day = date.getDate()
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th'
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()

  return `${month} ${day}${suffix},${year}`
}

const submit = () => {
  if (!validate()) return

  emit('save', {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    joiningDate: formatDate(form.joiningDate),
    status: form.status,
    location: form.location.trim(),
    vacancyDeadline: formatDate(form.vacancyDeadline),
    accent: 'pink',
  })

  emit('close')
}
</script>

<template>
  <div v-if="open" class="add-employee-modal">
    <button class="add-employee-modal__overlay" aria-label="Close add employee modal" @click="$emit('close')"></button>

    <section class="add-employee-modal__panel" role="dialog" aria-modal="true" aria-label="Add Employee">
      <header class="add-employee-modal__header">
        <div class="add-employee-modal__title-wrap">
          <span class="add-employee-modal__mail-icon" aria-hidden="true"></span>
          <h2 class="add-employee-modal__title">Add Employee</h2>
        </div>
        <button class="add-employee-modal__close" type="button" aria-label="Close add employee modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="add-employee-modal__body">
        <div class="add-employee-modal__grid">
          <label class="field">
            <span class="field__label">First Name</span>
            <input v-model="form.firstName" class="field__control" :class="{ 'field__control--error': errors.firstName }" type="text" />
            <span v-if="errors.firstName" class="field__error">{{ errors.firstName }}</span>
          </label>

          <label class="field">
            <span class="field__label">Last Name</span>
            <input v-model="form.lastName" class="field__control" :class="{ 'field__control--error': errors.lastName }" type="text" />
            <span v-if="errors.lastName" class="field__error">{{ errors.lastName }}</span>
          </label>

          <label class="field field--icon">
            <span class="field__label">Joining Date</span>
            <input
              v-model="form.joiningDate"
              class="field__control field__control--date"
              :class="{ 'field__control--error': errors.joiningDate }"
              type="date"
            />
            <span class="field__icon field__icon--calendar" aria-hidden="true"></span>
            <span v-if="errors.joiningDate" class="field__error">{{ errors.joiningDate }}</span>
          </label>

          <div class="field">
            <span class="field__label">Status</span>
            <Dropdown v-model="form.status" :options="statusOptions" placeholder="Status" />
            <span v-if="errors.status" class="field__error">{{ errors.status }}</span>
          </div>

          <label class="field field--icon">
            <span class="field__label">Location</span>
            <input
              v-model="form.location"
              class="field__control"
              :class="{ 'field__control--error': errors.location }"
              type="text"
            />
            <span class="field__icon field__icon--location" aria-hidden="true"></span>
            <span v-if="errors.location" class="field__error">{{ errors.location }}</span>
          </label>

          <label class="field field--icon">
            <span class="field__label">Vacancy Deadline</span>
            <input
              v-model="form.vacancyDeadline"
              class="field__control field__control--date"
              :class="{ 'field__control--error': errors.vacancyDeadline }"
              type="date"
            />
            <span class="field__icon field__icon--calendar" aria-hidden="true"></span>
            <span v-if="errors.vacancyDeadline" class="field__error">{{ errors.vacancyDeadline }}</span>
          </label>
        </div>
      </div>

      <footer class="add-employee-modal__footer">
        <button type="button" class="add-employee-modal__done" @click="submit">Done</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.add-employee-modal {
  position: fixed;
  inset: 0;
  z-index: 125;
  display: grid;
  place-items: center;
  padding: 20px;
}

.add-employee-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.add-employee-modal__panel {
  position: relative;
  width: min(458px, calc(100vw - 28px));
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 50px rgba(32, 19, 26, 0.24);
  overflow: hidden;
}

.add-employee-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 18px;
  border-bottom: 1px solid #f0e9ed;
}

.add-employee-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-employee-modal__mail-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  position: relative;
}

.add-employee-modal__mail-icon::before {
  content: '';
  position: absolute;
  inset: 7px 6px;
  border: 2px solid #ffffff;
  border-radius: 4px;
}

.add-employee-modal__mail-icon::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 11px;
  height: 7px;
  border-left: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  border-right: 2px solid #ffffff;
  transform: skewY(-28deg);
}

.add-employee-modal__title {
  margin: 0;
  color: #f04f92;
  font-size: 18px;
  font-weight: 500;
}

.add-employee-modal__close {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
  flex: 0 0 auto;
}

.add-employee-modal__close span {
  position: absolute;
  top: 13px;
  left: 6px;
  width: 16px;
  height: 2px;
  background: #ffffff;
}

.add-employee-modal__close span:first-child {
  transform: rotate(45deg);
}

.add-employee-modal__close span:last-child {
  transform: rotate(-45deg);
}

.add-employee-modal__body {
  padding: 28px 38px 18px;
}

.add-employee-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field__label {
  color: #1e171c;
  font-size: 14px;
}

.field__control {
  width: 100%;
  height: 40px;
  border: 1px solid #e7dde2;
  border-radius: 14px;
  background: #ffffff;
  padding: 0 14px;
  font-size: 14px;
  color: #5f5860;
  outline: none;
}

.field__control--date {
  padding-right: 42px;
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

.field__control--error {
  border-color: #ee7ea9;
}

.field__error {
  color: #e34789;
  font-size: 11px;
  line-height: 1;
}

.field--icon {
  position: relative;
}

.field__icon {
  position: absolute;
  right: 14px;
  top: 39px;
  pointer-events: none;
}

.field__icon--calendar {
  width: 15px;
  height: 15px;
  border: 1.5px solid #ea4f8d;
  border-radius: 4px;
  background:
    linear-gradient(#ea4f8d, #ea4f8d) center 4px / 11px 1.5px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 8px / 9px 1px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 11px / 9px 1px no-repeat;
}

.field__icon--calendar::before,
.field__icon--calendar::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 2px;
  height: 5px;
  border-radius: 999px;
  background: #ea4f8d;
}

.field__icon--calendar::before {
  left: 3px;
}

.field__icon--calendar::after {
  right: 3px;
}

.field__icon--location {
  width: 15px;
  height: 15px;
  border-radius: 999px 999px 999px 0;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  transform: rotate(-45deg);
}

.field__icon--location::before {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 999px;
  background: #ffffff;
}

.add-employee-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 26px 18px;
}

.add-employee-modal__done {
  min-width: 112px;
  height: 36px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 14px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}
</style>
