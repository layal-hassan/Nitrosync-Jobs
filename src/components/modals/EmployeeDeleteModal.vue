<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  employee: {
    type: Object,
    default: null,
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

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <div v-if="open" class="employee-delete-modal">
    <button class="employee-delete-modal__overlay" type="button" aria-label="Close delete employee modal" @click="$emit('close')"></button>

    <section class="employee-delete-modal__panel" role="dialog" aria-modal="true" aria-label="Delete Employee">
      <header class="employee-delete-modal__header">
        <div class="employee-delete-modal__title-wrap">
          <span class="employee-delete-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M7 7h10M9 7V5.5h6V7m-7 0v10m4-10v10m4-10v10M6 7.5h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <h2 class="employee-delete-modal__title">Delete Employee</h2>
        </div>

        <button class="employee-delete-modal__close" type="button" aria-label="Close delete employee modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="employee-delete-modal__body">
        <p>
          Are you sure you want to delete
          <strong>{{ employee?.name || 'this employee' }}</strong
          >?
        </p>
        <p v-if="submitError" class="employee-delete-modal__error">{{ submitError }}</p>
      </div>

      <footer class="employee-delete-modal__footer">
        <button type="button" class="employee-delete-modal__yes" :disabled="submitting" @click="$emit('confirm')">
          {{ submitting ? 'Deleting...' : 'Yes' }}
        </button>
        <button type="button" class="employee-delete-modal__no" :disabled="submitting" @click="$emit('close')">No</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.employee-delete-modal {
  position: fixed;
  inset: 0;
  z-index: 154;
  display: grid;
  place-items: center;
  padding: 20px;
}

.employee-delete-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(35, 22, 29, 0.48);
  z-index: 0;
}

.employee-delete-modal__panel {
  position: relative;
  z-index: 1;
  width: min(370px, calc(100vw - 28px));
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 50px rgba(43, 24, 34, 0.2);
  overflow: hidden;
}

.employee-delete-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f2e7eb;
}

.employee-delete-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-delete-modal__icon {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: #ef5a96;
  color: #fff;
}

.employee-delete-modal__icon svg {
  width: 12px;
  height: 12px;
}

.employee-delete-modal__title {
  margin: 0;
  color: #ef5a96;
  font-size: 12px;
  font-weight: 700;
}

.employee-delete-modal__close {
  position: relative;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef5a96;
}

.employee-delete-modal__close span {
  position: absolute;
  top: 7px;
  left: 3px;
  width: 10px;
  height: 1.4px;
  background: #fff;
}

.employee-delete-modal__close span:first-child { transform: rotate(45deg); }
.employee-delete-modal__close span:last-child { transform: rotate(-45deg); }

.employee-delete-modal__body {
  padding: 18px 18px 8px;
  text-align: center;
}

.employee-delete-modal__body p {
  margin: 0;
  color: #262026;
  font-size: 11px;
  font-weight: 600;
}

.employee-delete-modal__error {
  margin-top: 10px !important;
  color: #d6427b !important;
  line-height: 1.5;
}

.employee-delete-modal__footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px 18px 20px;
}

.employee-delete-modal__yes,
.employee-delete-modal__no {
  min-width: 62px;
  height: 24px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.employee-delete-modal__yes {
  background: linear-gradient(180deg, #ef5a96 0%, #e74789 100%);
  color: #fff;
}

.employee-delete-modal__no {
  border: 1px solid #f5dce6;
  color: #f1a0be;
  background: #fff;
}

.employee-delete-modal__yes:disabled,
.employee-delete-modal__no:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
