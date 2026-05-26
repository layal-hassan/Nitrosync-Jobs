<script setup>
import { computed, ref } from 'vue'
import Dropdown from './ui/Dropdown.vue'

const model = defineModel()

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  options: {
    type: Array,
    default: () => [],
  },
})

const placeholder = props.type === 'date' ? 'MM/DD/YYYY' : props.label
const dateInputMode = ref(Boolean(model.value) ? 'date' : 'text')
const resolvedInputType = computed(() =>
  props.type === 'date' ? dateInputMode.value : props.type,
)

const handleDateFocus = () => {
  if (props.type !== 'date') return
  dateInputMode.value = 'date'
}

const handleDateBlur = () => {
  if (props.type !== 'date') return
  if (!model.value) {
    dateInputMode.value = 'text'
  }
}
</script>

<template>
  <Dropdown
    v-if="type === 'select'"
    v-model="model"
    :label="label"
    :options="options"
    :placeholder="placeholder"
  />

  <label v-else class="filter-input">
    <input
      v-model="model"
      :type="resolvedInputType"
      :placeholder="placeholder"
      class="filter-input__control"
      @focus="handleDateFocus"
      @blur="handleDateBlur"
    />

    <span
      v-if="type === 'date'"
      class="filter-input__icon filter-input__icon--calendar"
      aria-hidden="true"
    ></span>
  </label>
</template>

<style scoped>
.filter-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--control-height);
  border: 1px solid #e6dde2;
  border-radius: var(--control-radius);
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.filter-input:hover {
  border-color: #ddcfd7;
}

.filter-input:focus-within {
  border-color: #ee7ea9;
  box-shadow: 0 0 0 3px rgba(234, 79, 141, 0.08);
}

.filter-input__control {
  width: 100%;
  min-width: 0;
  height: var(--control-height);
  padding: 0 36px 0 var(--control-padding-x);
  border: 0;
  outline: 0;
  background: transparent;
  color: #645962;
  font-size: var(--font-body);
  line-height: 1;
}

.filter-input__control::placeholder {
  color: #b6a7af;
  opacity: 1;
}

.filter-input__control[type='date'] {
  color-scheme: light;
}

.filter-input__control[type='date']::-webkit-calendar-picker-indicator {
  opacity: 0;
  position: absolute;
  right: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.filter-input__icon {
  position: absolute;
  right: 13px;
  pointer-events: none;
}

.filter-input__icon--chevron {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid #a7929d;
  border-bottom: 1.5px solid #a7929d;
  transform: rotate(45deg);
  margin-top: -3px;
}

.filter-input__icon--calendar {
  width: 13px;
  height: 13px;
  border: 1.5px solid #ea4f8d;
  border-radius: 3px;
  background:
    linear-gradient(#ea4f8d, #ea4f8d) center 3px / 9px 1.5px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 7px / 7px 1px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 10px / 7px 1px no-repeat;
}

.filter-input__icon--calendar::before,
.filter-input__icon--calendar::after {
  content: '';
  position: absolute;
  top: -2px;
  width: 2px;
  height: 4px;
  border-radius: 999px;
  background: #ea4f8d;
}

.filter-input__icon--calendar::before {
  left: 2px;
}

.filter-input__icon--calendar::after {
  right: 2px;
}
</style>
