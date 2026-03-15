<script setup>
import Dropdown from './ui/Dropdown.vue'

const model = defineModel()

defineProps({
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
</script>

<template>
  <Dropdown
    v-if="type === 'select'"
    v-model="model"
    :label="label"
    :options="options"
    :placeholder="label"
  />

  <label v-else class="filter-input">
    <input
      v-model="model"
      :type="type"
      :placeholder="label"
      class="filter-input__control"
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
  min-height: 50px;
  border: 1px solid #e6dde2;
  border-radius: 11px;
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
  height: 48px;
  padding: 0 42px 0 16px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #645962;
  font-size: 14px;
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
  right: 16px;
  pointer-events: none;
}

.filter-input__icon--chevron {
  width: 8px;
  height: 8px;
  border-right: 1.5px solid #a7929d;
  border-bottom: 1.5px solid #a7929d;
  transform: rotate(45deg);
  margin-top: -4px;
}

.filter-input__icon--calendar {
  width: 15px;
  height: 15px;
  border: 1.5px solid #ea4f8d;
  border-radius: 4px;
  background:
    linear-gradient(#ea4f8d, #ea4f8d) center 4px / 11px 1.5px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 8px / 9px 1px no-repeat,
    linear-gradient(#ea4f8d, #ea4f8d) center 11px / 9px 1px no-repeat;
}

.filter-input__icon--calendar::before,
.filter-input__icon--calendar::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 2px;
  height: 5px;
  border-radius: 999px;
  background: #ea4f8d;
}

.filter-input__icon--calendar::before {
  left: 3px;
}

.filter-input__icon--calendar::after {
  right: 3px;
}
</style>
