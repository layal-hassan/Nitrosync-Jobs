<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  employees: {
    type: Array,
    default: () => [],
  },
  employee: {
    type: Object,
    default: null,
  },
  fields: {
    type: Array,
    default: () => [],
  },
  values: {
    type: Object,
    default: () => ({}),
  },
  applyMode: {
    type: String,
    default: 'for-all',
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'finish'])

const localValues = reactive({})

watch(
  () => [props.open, props.values, props.employee?.id, props.currentIndex],
  ([isOpen]) => {
    if (!isOpen) return

    Object.keys(localValues).forEach((key) => delete localValues[key])
    for (const field of props.fields) {
      localValues[field.key] = props.values[field.key] ?? ''
    }
  },
  { deep: true },
)
</script>

<template>
  <div v-if="open" class="customized-edit-modal">
    <button class="customized-edit-modal__overlay" type="button" aria-label="Close customized edit modal" @click="$emit('close')"></button>

    <section class="customized-edit-modal__panel" role="dialog" aria-modal="true" aria-label="Customized Edit">
      <header class="customized-edit-modal__header">
        <div class="customized-edit-modal__title-wrap">
          <span class="customized-edit-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 18.5V20h1.5L18 8.5 15.5 6 5 16.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              <path d="m14.5 7 2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <h2 class="customized-edit-modal__title">Customized Edit</h2>
        </div>
      </header>

      <p class="customized-edit-modal__helper">
        <template v-if="applyMode === 'one-by-one'">
          Edit the selected fields for employee {{ currentIndex + 1 }} of {{ employees.length }}
        </template>
        <template v-else>
          Edit the selected fields for the selected employees
        </template>
      </p>

      <div v-if="applyMode === 'for-all' && employees.length" class="customized-edit-modal__employees">
        <div v-for="selectedEmployee in employees" :key="selectedEmployee.id" class="customized-edit-modal__employee">
          <div class="customized-edit-modal__employee-avatar" :style="{ background: selectedEmployee.avatarBg, color: selectedEmployee.avatarAccent }">
            {{ selectedEmployee.avatarText }}
          </div>
          <div>
            <div class="customized-edit-modal__employee-name">{{ selectedEmployee.name }}</div>
            <div class="customized-edit-modal__employee-role">{{ selectedEmployee.role }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="employee" class="customized-edit-modal__employee customized-edit-modal__employee--single">
        <div class="customized-edit-modal__employee-avatar" :style="{ background: employee.avatarBg, color: employee.avatarAccent }">
          {{ employee.avatarText }}
        </div>
        <div>
          <div class="customized-edit-modal__employee-name">{{ employee.name }}</div>
          <div class="customized-edit-modal__employee-role">{{ employee.role }}</div>
        </div>
      </div>

      <div class="customized-edit-modal__fields">
        <div v-for="field in fields" :key="field.key" class="customized-edit-modal__field">
          <div class="customized-edit-modal__label">{{ field.label }}</div>
          <input v-model="localValues[field.key]" type="text" placeholder="Edit Fields" />
        </div>
      </div>

      <footer class="customized-edit-modal__footer">
        <button type="button" class="customized-edit-modal__next" @click="$emit('finish', { ...localValues })">
          {{ applyMode === 'one-by-one' && currentIndex < employees.length - 1 ? 'NEXT Employee' : 'APPLY CHANGES' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.customized-edit-modal {
  position: fixed;
  inset: 0;
  z-index: 152;
  display: grid;
  place-items: center;
  padding: 20px;
}

.customized-edit-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(36, 23, 30, 0.5);
}

.customized-edit-modal__panel {
  position: relative;
  width: min(420px, calc(100vw - 28px));
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 50px rgba(43, 24, 34, 0.2);
}

.customized-edit-modal__header,
.customized-edit-modal__title-wrap,
.customized-edit-modal__employee {
  display: flex;
  align-items: center;
}

.customized-edit-modal__title-wrap { gap: 12px; }

.customized-edit-modal__icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  background: #ef5a96;
  color: #fff;
}

.customized-edit-modal__icon svg { width: 16px; height: 16px; }

.customized-edit-modal__title {
  margin: 0;
  color: #181317;
  font-size: 18px;
  font-weight: 700;
}

.customized-edit-modal__helper {
  margin: 12px 0 14px;
  color: #c1b7bd;
  font-size: 11px;
}

.customized-edit-modal__employee {
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.customized-edit-modal__employee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 800;
}

.customized-edit-modal__employee-name {
  color: #333;
  font-size: 11px;
  font-weight: 600;
}

.customized-edit-modal__employee-role {
  color: #aaa0a6;
  font-size: 9px;
}

.customized-edit-modal__employees {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}

.customized-edit-modal__employee--single {
  justify-content: flex-end;
  margin-bottom: 14px;
}

.customized-edit-modal__fields {
  display: grid;
  gap: 10px;
}

.customized-edit-modal__label {
  margin-bottom: 5px;
  color: #2b2228;
  font-size: 11px;
  font-weight: 600;
}

.customized-edit-modal__field input {
  width: 100%;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #f0e6ea;
  border-radius: 5px;
  color: #7a7076;
  font-size: 10px;
  outline: none;
}

.customized-edit-modal__field input::placeholder {
  color: #c1b7bd;
  font-size: 10px;
}

.customized-edit-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.customized-edit-modal__next {
  min-width: 128px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ef5a96 0%, #e74889 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
</style>
