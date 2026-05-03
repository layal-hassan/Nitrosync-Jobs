<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  fields: {
    type: Array,
    default: () => [],
  },
  selectedFieldKeys: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'next'])

const selectedKeys = ref([])

const groups = computed(() => {
  const grouped = new Map()
  for (const field of props.fields) {
    const current = grouped.get(field.group) ?? []
    current.push(field)
    grouped.set(field.group, current)
  }
  return [...grouped.entries()].map(([title, items]) => ({ title, items }))
})

const toggleField = (fieldKey) => {
  selectedKeys.value = selectedKeys.value.includes(fieldKey)
    ? selectedKeys.value.filter((key) => key !== fieldKey)
    : [...selectedKeys.value, fieldKey]
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selectedKeys.value = [...props.selectedFieldKeys]
    }
  },
)
</script>

<template>
  <div v-if="open" class="fields-edit-modal">
    <button class="fields-edit-modal__overlay" type="button" aria-label="Close fields to edit modal" @click="$emit('close')"></button>

    <section class="fields-edit-modal__panel" role="dialog" aria-modal="true" aria-label="Fields To Edit">
      <header class="fields-edit-modal__header">
        <div class="fields-edit-modal__title-wrap">
          <span class="fields-edit-modal__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 18.5V20h1.5L18 8.5 15.5 6 5 16.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
              <path d="m14.5 7 2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <h2 class="fields-edit-modal__title">Fields To Edit</h2>
        </div>

        <button class="fields-edit-modal__close" type="button" aria-label="Close fields to edit modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="fields-edit-modal__groups">
        <section v-for="group in groups" :key="group.title" class="fields-edit-modal__group">
          <h3 class="fields-edit-modal__group-title">{{ group.title }}</h3>

          <div class="fields-edit-modal__grid">
            <label
              v-for="field in group.items"
              :key="field.key"
              class="fields-edit-modal__item"
            >
              <input
                :checked="selectedKeys.includes(field.key)"
                type="checkbox"
                @change="toggleField(field.key)"
              />
              <span class="fields-edit-modal__fake-check" aria-hidden="true"></span>
              <span>{{ field.label }}</span>
            </label>
          </div>
        </section>
      </div>

      <footer class="fields-edit-modal__footer">
        <button
          type="button"
          class="fields-edit-modal__next"
          :disabled="!selectedKeys.length"
          @click="$emit('next', selectedKeys)"
        >
          NEXT STEP
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.fields-edit-modal {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 20px;
}

.fields-edit-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(36, 23, 30, 0.5);
}

.fields-edit-modal__panel {
  position: relative;
  width: min(1120px, calc(100vw - 40px));
  max-height: calc(100vh - 32px);
  padding: 18px 18px 22px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 24px 50px rgba(43, 24, 34, 0.2);
  overflow: auto;
}

.fields-edit-modal__header,
.fields-edit-modal__title-wrap {
  display: flex;
  align-items: center;
}

.fields-edit-modal__header {
  justify-content: space-between;
  padding-bottom: 14px;
  border-bottom: 1px solid #f2e6eb;
}

.fields-edit-modal__title-wrap {
  gap: 10px;
}

.fields-edit-modal__icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: #ef5a96;
  color: #fff;
}

.fields-edit-modal__icon svg {
  width: 17px;
  height: 17px;
}

.fields-edit-modal__title {
  margin: 0;
  color: #181317;
  font-size: 18px;
  font-weight: 700;
}

.fields-edit-modal__close {
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ef5a96;
}

.fields-edit-modal__close span {
  position: absolute;
  top: 10px;
  left: 4px;
  width: 14px;
  height: 1.8px;
  background: #fff;
}

.fields-edit-modal__close span:first-child { transform: rotate(45deg); }
.fields-edit-modal__close span:last-child { transform: rotate(-45deg); }

.fields-edit-modal__groups {
  padding: 16px 8px 0;
}

.fields-edit-modal__group + .fields-edit-modal__group {
  margin-top: 18px;
}

.fields-edit-modal__group-title {
  margin: 0 0 14px;
  color: #2b2228;
  font-size: 18px;
  font-weight: 600;
}

.fields-edit-modal__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 28px;
}

.fields-edit-modal__item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4a4147;
  font-size: 15px;
  cursor: pointer;
}

.fields-edit-modal__item input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.fields-edit-modal__fake-check {
  width: 16px;
  height: 16px;
  border: 1.5px solid #ef5a96;
  border-radius: 3px;
  flex: 0 0 auto;
}

.fields-edit-modal__item input:checked + .fields-edit-modal__fake-check {
  background: linear-gradient(180deg, #ef5a96 0%, #e74889 100%);
  box-shadow: inset 0 0 0 3px #fff;
}

.fields-edit-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 24px;
}

.fields-edit-modal__next {
  min-width: 150px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(180deg, #ef5a96 0%, #e74889 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.fields-edit-modal__next:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (max-width: 760px) {
  .fields-edit-modal__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
