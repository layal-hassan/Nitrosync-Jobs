<script setup>
import { computed, ref, watch } from 'vue'
import Dropdown from '../ui/Dropdown.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  employees: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'confirm'])

const selectedIds = ref([])
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = 6

const roleOptions = computed(() =>
  [...new Set(
    props.employees
      .map((employee) => String(employee?.role ?? '').trim())
      .filter(Boolean),
  )],
)

const filteredEmployees = computed(() => {
  if (!roleFilter.value) return props.employees
  return props.employees.filter((employee) => employee.role === roleFilter.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredEmployees.value.length / pageSize)))

const pagedEmployees = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  return filteredEmployees.value.slice(startIndex, startIndex + pageSize)
})

const selectedEmployees = computed(() =>
  props.employees.filter((employee) => selectedIds.value.includes(employee.id)),
)

const toggleEmployee = (employeeId) => {
  selectedIds.value = selectedIds.value.includes(employeeId)
    ? selectedIds.value.filter((id) => id !== employeeId)
    : [...selectedIds.value, employeeId]
}

const removeSelected = (employeeId) => {
  selectedIds.value = selectedIds.value.filter((id) => id !== employeeId)
}

const confirmSelection = () => {
  emit('confirm', selectedEmployees.value)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      roleFilter.value = ''
      currentPage.value = 1
      return
    }

    selectedIds.value = []
  },
)

watch(roleFilter, () => {
  currentPage.value = 1
})

watch(totalPages, (pageCount) => {
  if (currentPage.value > pageCount) {
    currentPage.value = pageCount
  }
})
</script>

<template>
  <div v-if="open" class="available-modal">
    <button class="available-modal__overlay" type="button" aria-label="Close available employees modal" @click="$emit('close')"></button>

    <section class="available-modal__panel" role="dialog" aria-modal="true" aria-label="Available Employees">
      <header class="available-modal__header">
        <div class="available-modal__title-wrap">
          <span class="available-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.8" />
              <circle cx="12" cy="10" r="2.7" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path d="M7.7 16.4c1.3-2 2.8-3.1 4.3-3.1s3 1.1 4.3 3.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>

          <div class="available-modal__heading">
            <h2 class="available-modal__title">Available Employees</h2>
            <p class="available-modal__subtitle">
              <span class="available-modal__subtitle-link">Available Employees.</span>
              Handpick your team from the available employees
            </p>
          </div>
        </div>

        <button class="available-modal__close" type="button" aria-label="Close available employees modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="available-modal__controls">
        <div class="available-modal__filter">
          <span class="available-modal__filter-icon" aria-hidden="true"></span>
          <Dropdown v-model="roleFilter" :options="roleOptions" placeholder="Filter" />
        </div>
      </div>

      <div class="available-modal__list">
        <article
          v-for="(employee, index) in pagedEmployees"
          :key="employee.id"
          class="available-modal__item"
        >
          <div class="available-modal__person">
            <div class="available-modal__avatar" :style="{ background: employee.avatarBg, color: employee.avatarAccent }">
              <span>{{ employee.avatarText }}</span>
            </div>

            <div class="available-modal__identity">
              <h3 :class="`available-modal__identity-name--${index % 6}`">{{ employee.name }}</h3>
              <p>{{ employee.role }}</p>
            </div>
          </div>

          <button
            type="button"
            class="available-modal__toggle"
            :class="[
              `available-modal__toggle--${index % 6}`,
              { 'available-modal__toggle--selected': selectedIds.includes(employee.id) },
            ]"
            :aria-pressed="selectedIds.includes(employee.id)"
            @click="toggleEmployee(employee.id)"
          >
            <span></span>
            <span></span>
          </button>
        </article>
      </div>

      <div class="available-modal__pagination" v-if="totalPages > 1">
        <button type="button" class="available-modal__page-nav" :disabled="currentPage === 1" @click="currentPage -= 1">&lt;</button>
        <button
          v-for="page in totalPages"
          :key="page"
          type="button"
          class="available-modal__page-pill"
          :class="{ 'available-modal__page-pill--active': currentPage === page }"
          @click="currentPage = page"
        >
          {{ String(page).padStart(2, '0') }}
        </button>
        <button type="button" class="available-modal__page-nav" :disabled="currentPage === totalPages" @click="currentPage += 1">&gt;</button>
      </div>

      <div class="available-modal__selected">
        <div class="available-modal__selected-label">Employees Selected</div>

        <div class="available-modal__chips-shell">
          <div v-if="selectedEmployees.length" class="available-modal__chips">
            <button
              v-for="employee in selectedEmployees"
              :key="employee.id"
              type="button"
              class="available-modal__chip"
              @click="removeSelected(employee.id)"
            >
              <span class="available-modal__chip-avatar" :style="{ background: employee.avatarBg, color: employee.avatarAccent }">
                {{ employee.avatarText }}
              </span>
              <span>{{ employee.name }}</span>
              <span class="available-modal__chip-remove" aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>

        <p class="available-modal__helper">
          <template v-if="selectedEmployees.length">
            You've selected {{ selectedEmployees.length }} employee<span v-if="selectedEmployees.length > 1">s</span> – let's make some updates!
          </template>
          <template v-else>
            Select one or more employees to continue.
          </template>
        </p>
      </div>

      <footer class="available-modal__footer">
        <button
          type="button"
          class="available-modal__next"
          :disabled="!selectedEmployees.length"
          @click="confirmSelection"
        >
          NEXT STEP
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.available-modal {
  position: fixed;
  inset: 0;
  z-index: 140;
  display: grid;
  place-items: center;
  padding: 22px;
}

.available-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(40, 27, 33, 0.54);
}

.available-modal__panel {
  position: relative;
  width: min(1060px, calc(100vw - 44px));
  max-height: calc(100vh - 44px);
  display: flex;
  flex-direction: column;
  padding: 26px 24px 26px;
  border: 1px solid #f0dfe7;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 30px 70px rgba(48, 24, 36, 0.22);
  overflow: auto;
}

.available-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.available-modal__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.available-modal__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 0;
  background: #ea4e91;
  color: #fff;
  flex: 0 0 auto;
}

.available-modal__icon svg {
  width: 21px;
  height: 21px;
  display: block;
}

.available-modal__heading {
  padding-top: 1px;
}

.available-modal__title {
  margin: 0;
  color: #181317;
  font-size: 28px;
  line-height: 1.05;
  font-weight: 700;
}

.available-modal__subtitle {
  margin: 54px 0 0;
  color: #c8c3c8;
  font-size: 15px;
  line-height: 1.35;
}

.available-modal__subtitle-link {
  margin-right: 4px;
  color: #ef5a96;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.available-modal__close {
  position: relative;
  width: 26px;
  height: 26px;
  margin-top: 4px;
  border-radius: 50%;
  background: #ea4e91;
  flex: 0 0 auto;
}

.available-modal__close span {
  position: absolute;
  top: 12px;
  left: 6px;
  width: 14px;
  height: 2px;
  border-radius: 999px;
  background: #fff;
}

.available-modal__close span:first-child {
  transform: rotate(45deg);
}

.available-modal__close span:last-child {
  transform: rotate(-45deg);
}

.available-modal__controls {
  display: flex;
  justify-content: flex-end;
  margin: 10px 0 28px;
}

.available-modal__filter {
  position: relative;
  width: 128px;
}

.available-modal__filter-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  width: 13px;
  height: 13px;
  background: #ef5a96;
  clip-path: polygon(0 0, 100% 0, 68% 36%, 68% 100%, 32% 100%, 32% 36%);
  transform: translateY(-50%);
  z-index: 2;
}

.available-modal__filter :deep(.dropdown__trigger) {
  min-height: 48px;
  padding-left: 42px;
  padding-right: 38px;
  border: 0;
  border-radius: 10px;
  background: #f7d8e5;
  color: #ef5a96;
  font-weight: 600;
}

.available-modal__filter :deep(.dropdown__value) {
  font-size: 15px;
}

.available-modal__filter :deep(.dropdown__arrow) {
  right: 16px;
  width: 8px;
  height: 8px;
  color: #be8aa0;
}

.available-modal__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 34px;
}

.available-modal__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 62px;
  padding: 8px 16px;
  border: 1px solid #f5e4eb;
  border-radius: 6px;
  background: #fcfbfc;
}

.available-modal__person {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.available-modal__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.75);
  flex: 0 0 auto;
}

.available-modal__avatar span {
  font-size: 13px;
  font-weight: 800;
}

.available-modal__identity {
  min-width: 0;
}

.available-modal__identity h3 {
  margin: 0 0 4px;
  font-size: 15px;
  line-height: 1.1;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.available-modal__identity-name--0,
.available-modal__identity-name--5 {
  color: #ef5a96;
}

.available-modal__identity-name--1 {
  color: #255dff;
}

.available-modal__identity-name--2 {
  color: #7126d8;
}

.available-modal__identity-name--3 {
  color: #f0ae2b;
}

.available-modal__identity-name--4 {
  color: #23cb69;
}

.available-modal__identity p {
  margin: 0;
  color: #9a989c;
  font-size: 12px;
}

.available-modal__toggle {
  position: relative;
  width: 24px;
  height: 24px;
  border: 1.6px solid currentColor;
  border-radius: 50%;
  background: #fff;
  flex: 0 0 auto;
}

.available-modal__toggle span {
  position: absolute;
  top: 10px;
  left: 5px;
  width: 12px;
  height: 1.6px;
  border-radius: 999px;
  background: currentColor;
}

.available-modal__toggle span:last-child {
  transform: rotate(90deg);
}

.available-modal__toggle--0,
.available-modal__toggle--5 {
  color: #ef5a96;
}

.available-modal__toggle--1 {
  color: #255dff;
}

.available-modal__toggle--2 {
  color: #7126d8;
}

.available-modal__toggle--3 {
  color: #f0ae2b;
}

.available-modal__toggle--4 {
  color: #23cb69;
}

.available-modal__toggle--selected span:last-child {
  display: none;
}

.available-modal__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 20px 0 34px;
  color: #ef5a96;
}

.available-modal__page-nav,
.available-modal__page-pill {
  min-width: 26px;
  height: 26px;
  border-radius: 10px;
  font-size: 12px;
  color: inherit;
}

.available-modal__page-pill--active {
  background: #ea4e91;
  color: #fff;
  font-weight: 700;
}

.available-modal__page-nav:disabled {
  opacity: 0.3;
  cursor: default;
}

.available-modal__selected {
  border-top: 1px solid #f3e5eb;
  padding-top: 10px;
}

.available-modal__selected-label {
  margin-bottom: 14px;
  color: #212121;
  font-size: 14px;
  font-weight: 500;
}

.available-modal__chips-shell {
  min-height: 56px;
  padding: 10px 16px;
  border-radius: 12px;
  background: #f3f3f5;
}

.available-modal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.available-modal__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 4px 12px 4px 6px;
  border-radius: 10px;
  background: #fdf1f6;
  color: #333;
  font-size: 11px;
}

.available-modal__chip-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 9px;
  font-weight: 800;
}

.available-modal__chip-remove {
  color: #ef5a96;
  font-size: 15px;
  line-height: 1;
}

.available-modal__helper {
  margin: 8px 0 0;
  color: #ef5a96;
  font-size: 13px;
}

.available-modal__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 40px;
}

.available-modal__next {
  min-width: 206px;
  height: 50px;
  border-radius: 18px;
  background: #e5448d;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

.available-modal__next:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (max-width: 760px) {
  .available-modal {
    padding: 12px;
  }

  .available-modal__panel {
    width: min(100vw - 24px, 1060px);
    max-height: calc(100vh - 24px);
    padding: 16px;
    border-radius: 22px;
  }

  .available-modal__title {
    font-size: 22px;
  }

  .available-modal__subtitle {
    margin-top: 24px;
    font-size: 13px;
  }

  .available-modal__controls,
  .available-modal__footer {
    justify-content: stretch;
  }

  .available-modal__filter,
  .available-modal__next {
    width: 100%;
  }

  .available-modal__list {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
