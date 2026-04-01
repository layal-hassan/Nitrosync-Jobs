<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number, Object, null],
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const triggerRef = ref(null)
const open = ref(false)
const highlightedIndex = ref(-1)

const normalizedOptions = computed(() =>
  props.options.map((option) =>
    typeof option === 'object'
      ? {
          label: option.label ?? String(option.value ?? ''),
          value: option.value ?? option.label ?? '',
        }
      : {
          label: String(option),
          value: option,
        },
  ),
)

const selectedIndex = computed(() =>
  normalizedOptions.value.findIndex((option) => option.value === props.modelValue),
)

const selectedLabel = computed(() => {
  const match = normalizedOptions.value[selectedIndex.value]
  return match ? match.label : props.placeholder || props.label
})

const openList = () => {
  open.value = true
  highlightedIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
}

const closeList = () => {
  open.value = false
  highlightedIndex.value = -1
}

const toggleList = () => {
  if (open.value) {
    closeList()
    return
  }

  openList()
}

const selectOption = (option) => {
  emit('update:modelValue', option.value)
  closeList()
  triggerRef.value?.focus()
}

const moveHighlight = (direction) => {
  if (!normalizedOptions.value.length) return

  if (!open.value) {
    openList()
    return
  }

  const lastIndex = normalizedOptions.value.length - 1

  if (highlightedIndex.value < 0) {
    highlightedIndex.value = 0
    return
  }

  highlightedIndex.value =
    direction > 0
      ? highlightedIndex.value >= lastIndex
        ? 0
        : highlightedIndex.value + 1
      : highlightedIndex.value <= 0
        ? lastIndex
        : highlightedIndex.value - 1
}

const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveHighlight(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveHighlight(-1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!open.value) {
        openList()
        return
      }
      if (highlightedIndex.value >= 0) {
        selectOption(normalizedOptions.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      if (open.value) {
        event.preventDefault()
        closeList()
      }
      break
    case 'Tab':
      closeList()
      break
  }
}

const handleDocumentClick = (event) => {
  if (!rootRef.value?.contains(event.target)) {
    closeList()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})

watch(
  () => props.modelValue,
  () => {
    if (!open.value) {
      highlightedIndex.value = selectedIndex.value
    }
  },
)
</script>

<template>
  <div ref="rootRef" class="dropdown" :class="{ 'dropdown--open': open }">
    <button
      ref="triggerRef"
      type="button"
      class="dropdown__trigger"
      :class="{ 'dropdown__trigger--placeholder': selectedIndex < 0 }"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggleList"
      @keydown="handleKeydown"
    >
      <span class="dropdown__value">{{ selectedLabel }}</span>
      <span class="dropdown__arrow" aria-hidden="true"></span>
    </button>

    <div v-if="open" class="dropdown__menu" role="listbox">
      <button
        v-for="(option, index) in normalizedOptions"
        :key="`${option.label}-${index}`"
        type="button"
        class="dropdown__option"
        :class="{
          'dropdown__option--active': highlightedIndex === index,
          'dropdown__option--selected': option.value === modelValue,
        }"
        role="option"
        :aria-selected="option.value === modelValue"
        @mouseenter="highlightedIndex = index"
        @click="selectOption(option)"
      >
        <span>{{ option.label }}</span>
        <span v-if="option.value === modelValue" class="dropdown__check" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dropdown {
  position: relative;
  width: 100%;
}

.dropdown__trigger {
  width: 100%;
  height: var(--control-height);
  padding: 0 40px 0 var(--control-padding-x);
  border: 1px solid #e4dbe0;
  border-radius: var(--control-radius);
  background: #f8f8f8;
  color: #85757d;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.dropdown__trigger:hover {
  border-color: #ddcfd7;
}

.dropdown__trigger:focus-visible {
  outline: none;
  border-color: #ee7ea9;
  box-shadow: 0 0 0 3px rgba(234, 79, 141, 0.08);
}

.dropdown__trigger--placeholder {
  color: #cfc3c9;
}

.dropdown__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-body);
  line-height: 1;
}

.dropdown__arrow {
  position: absolute;
  right: 16px;
  width: 8px;
  height: 8px;
  border-right: 1px solid #a46a82;
  border-bottom: 1px solid #a46a82;
  transform: rotate(45deg);
  transition: transform 0.18s ease;
}

.dropdown--open .dropdown__arrow {
  transform: rotate(-135deg);
}

.dropdown__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #ece1e6;
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(58, 39, 48, 0.12);
  padding: 6px;
  z-index: 20;
}

.dropdown__menu::-webkit-scrollbar {
  width: 8px;
}

.dropdown__menu::-webkit-scrollbar-thumb {
  background: #e5dbe0;
  border-radius: 999px;
}

.dropdown__option {
  width: 100%;
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #5f555c;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  font-size: var(--font-body);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown__option:hover,
.dropdown__option--active {
  background: #fcf5f8;
}

.dropdown__option--selected {
  color: #e34b8b;
  background: #fff2f7;
}

.dropdown__check {
  width: 14px;
  height: 14px;
  position: relative;
  flex: 0 0 auto;
}

.dropdown__check::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
}
</style>
