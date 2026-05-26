<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
  placement: {
    type: String,
    default: 'bottom',
  },
  teleport: {
    type: Boolean,
    default: false,
  },
  menuSize: {
    type: String,
    default: 'default',
  },
})

const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const triggerRef = ref(null)
const menuRef = ref(null)
const open = ref(false)
const highlightedIndex = ref(-1)
const customInput = ref('')
const customEditorOpen = ref(false)
const customOptions = ref([])
const menuStyles = ref({})
const dropdownPalette = ['#ef5a96', '#4f78ff', '#5c15d8', '#e1a600', '#24d56a']

const normalizeOption = (option, index = 0) =>
  typeof option === 'object'
    ? {
        label: option.label ?? String(option.value ?? ''),
        value: option.value ?? option.label ?? '',
        color: option.color ?? dropdownPalette[index % dropdownPalette.length],
        allowsCustom: Boolean(option.allowsCustom),
      }
    : {
        label: String(option),
        value: option,
        color: dropdownPalette[index % dropdownPalette.length],
        allowsCustom: false,
      }

const baseOptions = computed(() =>
  props.options.map((option, index) =>
    typeof option === 'object'
      ? normalizeOption(option, index)
      : normalizeOption(option, index),
  ),
)

const normalizedOptions = computed(() => [...baseOptions.value, ...customOptions.value])

const isCustomOption = (option) => {
  if (option.allowsCustom) return true

  const normalizedLabel = String(option.label ?? '').trim().toLowerCase()
  const normalizedValue = String(option.value ?? '').trim().toLowerCase()
  return normalizedLabel === 'custom' || normalizedValue === 'custom'
}

const selectedIndex = computed(() =>
  normalizedOptions.value.findIndex((option) => option.value === props.modelValue),
)

const selectedLabel = computed(() => {
  const match = normalizedOptions.value[selectedIndex.value]
  return match ? match.label : props.placeholder || props.label
})

const updateMenuPosition = () => {
  if (!props.teleport || !open.value || !triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const spacing = 6
  const minWidth = rect.width

  menuStyles.value =
    props.placement === 'top'
      ? {
          position: 'fixed',
          left: `${rect.left}px`,
          top: 'auto',
          bottom: `${window.innerHeight - rect.top + spacing}px`,
          width: `${minWidth}px`,
          zIndex: '1000',
        }
      : {
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.bottom + spacing}px`,
          bottom: 'auto',
          width: `${minWidth}px`,
          zIndex: '1000',
        }
}

const openList = () => {
  open.value = true
  customEditorOpen.value = false
  customInput.value = ''
  highlightedIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
  nextTick(updateMenuPosition)
}

const closeList = () => {
  open.value = false
  highlightedIndex.value = -1
  customEditorOpen.value = false
  customInput.value = ''
}

const toggleList = () => {
  if (open.value) {
    closeList()
    return
  }

  openList()
}

const selectOption = (option) => {
  if (isCustomOption(option)) {
    customEditorOpen.value = true
    customInput.value = ''
    highlightedIndex.value = -1
    return
  }

  emit('update:modelValue', option.value)
  closeList()
  triggerRef.value?.focus()
}

const saveCustomOption = () => {
  const nextValue = customInput.value.trim()
  if (!nextValue) return

  const existingOption = normalizedOptions.value.find(
    (option) => String(option.label).trim().toLowerCase() === nextValue.toLowerCase()
      || String(option.value).trim().toLowerCase() === nextValue.toLowerCase(),
  )

  if (existingOption && !isCustomOption(existingOption)) {
    emit('update:modelValue', existingOption.value)
  } else {
    const nextOption = normalizeOption({ label: nextValue, value: nextValue }, normalizedOptions.value.length)
    customOptions.value.push(nextOption)
    emit('update:modelValue', nextOption.value)
  }

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
  if (customEditorOpen.value) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        saveCustomOption()
        break
      case 'Escape':
        event.preventDefault()
        customEditorOpen.value = false
        customInput.value = ''
        break
      case 'Tab':
        closeList()
        break
    }
    return
  }

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
  if (!rootRef.value?.contains(event.target) && !menuRef.value?.contains(event.target)) {
    closeList()
  }
}

const handleViewportChange = () => {
  updateMenuPosition()
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
  window.addEventListener('resize', handleViewportChange)
  window.addEventListener('scroll', handleViewportChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('scroll', handleViewportChange, true)
})

watch(
  () => props.modelValue,
  () => {
    if (!open.value) {
      highlightedIndex.value = selectedIndex.value
    }
  },
)

watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(updateMenuPosition)
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="dropdown"
    :class="{
      'dropdown--open': open,
      'dropdown--top': placement === 'top',
    }"
  >
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

    <Teleport to="body" :disabled="!teleport">
      <div
        v-if="open"
        ref="menuRef"
        class="dropdown__menu"
        :class="{
          'dropdown__menu--small': menuSize === 'small',
        }"
        :style="teleport ? menuStyles : undefined"
        role="listbox"
      >
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
          <span :style="option.color ? { color: option.color } : undefined">{{ option.label }}</span>
          <span v-if="option.value === modelValue" class="dropdown__check" aria-hidden="true"></span>
        </button>

        <div v-if="customEditorOpen" class="dropdown__custom">
          <input
            v-model="customInput"
            class="dropdown__custom-input"
            type="text"
            placeholder="Enter custom value"
            @keydown.enter.prevent="saveCustomOption"
          />
          <button type="button" class="dropdown__custom-save" @click="saveCustomOption">Save</button>
        </div>
      </div>
    </Teleport>
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
  background: #ffffff;
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

.dropdown--top .dropdown__menu {
  top: auto;
  bottom: calc(100% + 6px);
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

.dropdown__menu--small .dropdown__option {
  min-height: 36px;
  font-size: 10px;
}

.dropdown__option:hover,
.dropdown__option--active {
  background: #fcf5f8;
}

.dropdown__option--selected {
  color: #e34b8b;
  background: #fff2f7;
}

.dropdown__custom {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px 2px;
}

.dropdown__custom-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #e4dbe0;
  border-radius: 8px;
  background: #ffffff;
  color: #5f555c;
  font-size: 11px;
}

.dropdown__custom-input::placeholder {
  color: #cfc3c9;
}

.dropdown__custom-input:focus {
  outline: none;
  border-color: #ee7ea9;
  box-shadow: 0 0 0 3px rgba(234, 79, 141, 0.08);
}

.dropdown__custom-save {
  flex: 0 0 auto;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #ea4f8d;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
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
