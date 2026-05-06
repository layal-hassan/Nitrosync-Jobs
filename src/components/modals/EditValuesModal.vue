<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
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
})

const emit = defineEmits(['close', 'next'])

const localValues = reactive({})
const localMode = reactive({ value: 'for-all' })

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      Object.keys(localValues).forEach((key) => delete localValues[key])
      for (const field of props.fields) {
        localValues[field.key] = props.values[field.key] ?? ''
      }
      localMode.value = props.applyMode
    }
  },
)
</script>

<template>
  <div v-if="open" class="edit-values-modal">
    <button class="edit-values-modal__overlay" type="button" aria-label="Close edit values modal" @click="$emit('close')"></button>

    <section class="edit-values-modal__panel" role="dialog" aria-modal="true" aria-label="Fields To Edit Values">
      <header class="edit-values-modal__header">
        <div class="edit-values-modal__title-wrap">
          <span class="edit-values-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 18.5V20h1.5L18 8.5 15.5 6 5 16.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              <path d="m14.5 7 2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <h2 class="edit-values-modal__title">Fields To Edit</h2>
        </div>

        <button class="edit-values-modal__close" type="button" aria-label="Close edit values modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="edit-values-modal__mode">
        <label class="edit-values-modal__mode-item">
          <span>One By One</span>
          <input v-model="localMode.value" type="radio" value="one-by-one" />
          <span class="edit-values-modal__radio edit-values-modal__radio--gray"></span>
        </label>
        <label class="edit-values-modal__mode-item">
          <span>For all</span>
          <input v-model="localMode.value" type="radio" value="for-all" />
          <span class="edit-values-modal__radio edit-values-modal__radio--green"></span>
        </label>
      </div>

      <div class="edit-values-modal__fields">
        <label v-for="field in fields" :key="field.key" class="edit-values-modal__field">
          <input v-model="localValues[field.key]" type="text" :placeholder="field.label" />
          <span class="edit-values-modal__field-dot" :class="{ 'is-active': localMode.value === 'for-all' }"></span>
        </label>
      </div>

      <footer class="edit-values-modal__footer">
        <button
          type="button"
          class="edit-values-modal__next"
          @click="$emit('next', { values: { ...localValues }, applyMode: localMode.value })"
        >
          NEXT STEP
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.edit-values-modal {
  position: fixed;
  inset: 0;
  z-index: 151;
  display: grid;
  place-items: center;
  padding: 20px;
}

.edit-values-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(36, 23, 30, 0.5);
}

.edit-values-modal__panel {
  position: relative;
  width: min(520px, calc(100vw - 28px));
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 50px rgba(43, 24, 34, 0.2);
}

.edit-values-modal__header,
.edit-values-modal__title-wrap,
.edit-values-modal__mode-item {
  display: flex;
  align-items: center;
}

.edit-values-modal__header {
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #f2e6eb;
}

.edit-values-modal__title-wrap { gap: 12px; }

.edit-values-modal__icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  background: #ef5a96;
  color: #fff;
}

.edit-values-modal__icon svg { width: 16px; height: 16px; }

.edit-values-modal__title {
  margin: 0;
  color: #181317;
  font-size: 18px;
  font-weight: 700;
}

.edit-values-modal__close {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef5a96;
}

.edit-values-modal__close span {
  position: absolute;
  top: 9px;
  left: 4px;
  width: 12px;
  height: 1.6px;
  background: #fff;
}

.edit-values-modal__close span:first-child { transform: rotate(45deg); }
.edit-values-modal__close span:last-child { transform: rotate(-45deg); }

.edit-values-modal__mode {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin: 14px 0 16px;
}

.edit-values-modal__mode-item {
  gap: 10px;
  color: #231c21;
  font-size: 11px;
}

.edit-values-modal__mode-item input {
  position: absolute;
  opacity: 0;
}

.edit-values-modal__radio {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #ccd0d5;
}

.edit-values-modal__radio--gray {
  background: #d5d8dc;
}

.edit-values-modal__radio--green {
  background: #74dd95;
}

.edit-values-modal__fields {
  display: grid;
  gap: 8px;
}

.edit-values-modal__field {
  position: relative;
}

.edit-values-modal__field input {
  width: 100%;
  height: 34px;
  padding: 0 30px 0 10px;
  border: 1px solid #f0e6ea;
  border-radius: 5px;
  color: #7a7076;
  font-size: 11px;
  outline: none;
}

.edit-values-modal__field input::placeholder {
  color: #bbb1b7;
}

.edit-values-modal__field-dot {
  position: absolute;
  top: 50%;
  right: 9px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d0d3d7;
  transform: translateY(-50%);
}

.edit-values-modal__field-dot.is-active {
  background: #79dd95;
}

.edit-values-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.edit-values-modal__next {
  min-width: 118px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ef5a96 0%, #e74889 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
</style>
