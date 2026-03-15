<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle'])
</script>

<template>
  <button
    type="button"
    class="position-chip"
    :class="{ 'position-chip--active': active }"
    @click="$emit('toggle')"
  >
    <span class="position-chip__check" aria-hidden="true"></span>
    <span class="position-chip__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.position-chip {
  min-height: 40px;
  padding: 0 16px 0 10px;
  border: 1px solid #e5dce1;
  border-radius: 999px;
  background: #ffffff;
  color: #59545a;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 1;
  box-shadow: 0 2px 5px rgba(52, 35, 43, 0.04);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.position-chip:hover {
  border-color: #dbcfd6;
  box-shadow: 0 4px 10px rgba(52, 35, 43, 0.08);
}

.position-chip__check {
  width: 22px;
  height: 22px;
  border: 1px solid #ddd5da;
  border-radius: 999px;
  background: #ffffff;
  position: relative;
  flex: 0 0 auto;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}

.position-chip__label {
  white-space: nowrap;
}

.position-chip--active .position-chip__check {
  border-color: transparent;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
}

.position-chip--active .position-chip__check::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 4px;
  width: 5px;
  height: 9px;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: rotate(45deg);
}

.position-chip--active {
  border-color: #f2c4d5;
  background: #fff3f8;
  color: #51474d;
  box-shadow: 0 6px 14px rgba(234, 79, 141, 0.1);
}
</style>
