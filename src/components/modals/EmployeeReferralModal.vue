<script setup>
import { ref } from 'vue'
import AddEmployeeModal from './AddEmployeeModal.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'next'])

const isAddEmployeeOpen = ref(false)

const employees = ref([
  {
    firstName: 'Tareq',
    lastName: 'Ahmad',
    joiningDate: 'Dec 2nd,2024',
    status: 'Active',
    location: 'Street 22,',
    vacancyDeadline: 'Dec 28th,2024',
    accent: 'pink',
  },
  {
    firstName: 'Lama',
    lastName: 'Ahmad',
    joiningDate: 'Dec 2nd,2024',
    status: 'Active',
    location: 'Street 22,',
    vacancyDeadline: 'Dec 28th,2024',
    accent: 'blue',
  },
  {
    firstName: 'Reki',
    lastName: 'Ahmad',
    joiningDate: 'Dec 2nd,2024',
    status: 'Active',
    location: 'Street 22,',
    vacancyDeadline: 'Dec 28th,2024',
    accent: 'green',
  },
])

const addEmployee = (employee) => {
  const accents = ['pink', 'blue', 'green']
  employees.value = [
    ...employees.value,
    {
      ...employee,
      accent: accents[employees.value.length % accents.length],
    },
  ]
}
</script>

<template>
  <div v-if="open" class="employee-modal">
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

          <div
            v-for="employee in employees"
            :key="`${employee.firstName}-${employee.lastName}`"
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
  padding: 16px 20px 8px;
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
  display: flex;
  justify-content: flex-end;
  padding: 26px 28px 34px;
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
