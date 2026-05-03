<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'MM / DD / YYYY',
  },
})

const emit = defineEmits(['update:modelValue'])

const rootRef = ref(null)
const open = ref(false)
const currentMonth = ref(new Date())

const weekdayLabels = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

const parseDate = (value) => {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  const parsed = new Date(year, month - 1, day)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDisplay = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month} / ${day} / ${year}`
}

const selectedDate = computed(() => parseDate(props.modelValue))

const displayValue = computed(() =>
  selectedDate.value ? formatDisplay(selectedDate.value) : props.placeholder,
)

const monthLabel = computed(() =>
  currentMonth.value.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  }).toUpperCase(),
)

const calendarDays = computed(() => {
  const start = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
  const startDay = start.getDay()
  const firstCell = new Date(start)
  firstCell.setDate(firstCell.getDate() - startDay)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell)
    date.setDate(firstCell.getDate() + index)
    return {
      key: formatValue(date),
      label: date.getDate(),
      value: formatValue(date),
      isCurrentMonth: date.getMonth() === currentMonth.value.getMonth(),
      isSelected: props.modelValue === formatValue(date),
      isToday: formatValue(date) === formatValue(new Date()),
    }
  })
})

const syncMonthFromValue = () => {
  currentMonth.value = selectedDate.value
    ? new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1)
    : new Date()
}

const toggleOpen = () => {
  open.value = !open.value
  if (open.value) {
    syncMonthFromValue()
  }
}

const close = () => {
  open.value = false
}

const selectDate = (value) => {
  emit('update:modelValue', value)
  close()
}

const changeMonth = (offset) => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + offset,
    1,
  )
}

const handleDocumentClick = (event) => {
  if (!rootRef.value?.contains(event.target)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})

watch(() => props.modelValue, syncMonthFromValue, { immediate: true })
</script>

<template>
  <div ref="rootRef" class="date-picker">
    <button
      type="button"
      class="date-picker__trigger"
      :class="{ 'date-picker__trigger--placeholder': !modelValue }"
      @click="toggleOpen"
    >
      <span class="date-picker__value">{{ displayValue }}</span>
      <span class="date-picker__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="4" y="5.5" width="16" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.8" />
          <path d="M8 3.8v3.4M16 3.8v3.4M4.8 9.2h14.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M9 12h2M13 12h2M9 15.5h2M13 15.5h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </span>
    </button>

    <div v-if="open" class="date-picker__panel">
      <div class="date-picker__header">
        <button type="button" class="date-picker__nav" @click="changeMonth(-1)">&#8249;</button>
        <div class="date-picker__month">{{ monthLabel }}</div>
        <button type="button" class="date-picker__nav" @click="changeMonth(1)">&#8250;</button>
      </div>

      <div class="date-picker__weekdays">
        <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
      </div>

      <div class="date-picker__days">
        <button
          v-for="day in calendarDays"
          :key="day.key"
          type="button"
          class="date-picker__day"
          :class="{
            'date-picker__day--muted': !day.isCurrentMonth,
            'date-picker__day--selected': day.isSelected,
            'date-picker__day--today': day.isToday && !day.isSelected,
          }"
          @click="selectDate(day.value)"
        >
          {{ day.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-picker {
  position: relative;
  width: 100%;
}

.date-picker__trigger {
  width: 100%;
  min-height: 54px;
  height: 54px;
  border: 1px solid #ece6ea;
  border-radius: 12px;
  background: #fff;
  color: #736a72;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.date-picker__trigger:hover {
  border-color: #f0c3d5;
}

.date-picker__trigger:focus-visible {
  outline: none;
  border-color: #ef8ab3;
  box-shadow: 0 0 0 3px rgba(239, 90, 150, 0.08);
}

.date-picker__trigger--placeholder {
  color: #b6aab0;
}

.date-picker__value {
  font-size: 15px;
  letter-spacing: 0.08em;
}

.date-picker__icon {
  width: 18px;
  height: 18px;
  color: #ef5a96;
  flex: 0 0 auto;
}

.date-picker__icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.date-picker__panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 50;
  width: 272px;
  padding: 12px;
  border: 1px solid #f2dbe5;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff 0%, #fff8fb 100%);
  box-shadow: 0 18px 32px rgba(44, 24, 34, 0.14);
}

.date-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.date-picker__month {
  color: #2f2530;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.date-picker__nav {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #fff1f7;
  color: #ef5a96;
  font-size: 16px;
}

.date-picker__weekdays,
.date-picker__days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.date-picker__weekdays {
  margin-bottom: 6px;
}

.date-picker__weekdays span {
  color: #9d8f97;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.08em;
}

.date-picker__day {
  height: 30px;
  border-radius: 8px;
  color: #443a43;
  font-size: 11px;
  background: transparent;
}

.date-picker__day:hover {
  background: #fff0f6;
  color: #ef5a96;
}

.date-picker__day--muted {
  color: #ccbfc6;
}

.date-picker__day--today {
  border: 1px solid #f2b4cd;
}

.date-picker__day--selected {
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #fff;
  box-shadow: 0 8px 14px rgba(234, 79, 141, 0.22);
}
</style>
