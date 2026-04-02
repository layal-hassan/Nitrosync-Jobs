<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedRecruiters: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:selectedRecruiters'])

const recruiterOptions = [
  { name: 'Manal Oraby', type: 'Lead Recruiter', color: '#ff6a9d', initials: 'MO' },
  { name: 'Tareq Ahmad', type: 'Technical Recruiter', color: '#f1b32a', initials: 'TA' },
  { name: 'Lina Saleh', type: 'Operations Recruiter', color: '#4f7dff', initials: 'LS' },
  { name: 'Omar Khaled', type: 'HR Recruiter', color: '#48d873', initials: 'OK' },
  { name: 'Dana Samir', type: 'Campus Recruiter', color: '#7028e4', initials: 'DS' },
]

const availableRecruiters = computed(() =>
  recruiterOptions.filter((item) => !props.selectedRecruiters.includes(item.name)),
)

const selectedRecruiterObjects = computed(() =>
  props.selectedRecruiters
    .map((name) => recruiterOptions.find((item) => item.name === name))
    .filter(Boolean),
)

const selectRecruiter = (name) => {
  if (!name) return
  emit('update:selectedRecruiters', [name])
}

const removeRecruiter = (name) => {
  emit('update:selectedRecruiters', props.selectedRecruiters.filter((item) => item !== name))
}
</script>

<template>
  <div class="recruiter-step">
    <p class="recruiter-step__hint"><span>Recruiter:</span> One recruiter must be selected</p>

    <div class="recruiter-step__title">Choose one recruiter</div>

    <div class="recruiter-step__grid">
      <button
        v-for="item in recruiterOptions"
        :key="item.name"
        type="button"
        class="recruiter-step__card"
        :class="{ 'recruiter-step__card--selected': selectedRecruiters.includes(item.name) }"
        @click="selectRecruiter(item.name)"
      >
        <div class="recruiter-step__avatar" :style="{ '--avatar-color': item.color }">{{ item.initials }}</div>
        <div class="recruiter-step__meta">
          <div class="recruiter-step__name">{{ item.name }}</div>
          <div class="recruiter-step__type" :style="{ color: item.color }">{{ item.type }}</div>
        </div>
        <span class="recruiter-step__selector" :class="{ 'recruiter-step__selector--active': selectedRecruiters.includes(item.name) }"></span>
      </button>
    </div>

    <div class="recruiter-step__selected-title">Selected Recruiter</div>

    <div class="recruiter-step__selected">
      <div class="recruiter-step__selected-chips">
        <div v-for="item in selectedRecruiterObjects" :key="item.name" class="recruiter-step__selected-chip">
          <span class="recruiter-step__selected-avatar" :style="{ '--avatar-color': item.color }">{{ item.initials }}</span>
          <span>{{ item.name }}</span>
          <button type="button" class="recruiter-step__close" @click="removeRecruiter(item.name)">x</button>
        </div>
      </div>
    </div>

    <p class="recruiter-step__count">
      {{ selectedRecruiters.length ? `Selected: ${selectedRecruiters[0]}` : 'No recruiter selected yet' }}
    </p>
  </div>
</template>

<style scoped>
.recruiter-step__hint {
  margin: 0 0 14px;
  font-size: var(--font-small);
  color: #d2c4cb;
}

.recruiter-step__hint span {
  color: #ff6a9d;
}

.recruiter-step__title,
.recruiter-step__selected-title {
  font-size: var(--font-label);
  color: #1d171f;
}

.recruiter-step__selected-title {
  margin-top: 20px;
}

.recruiter-step__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
  margin-top: 10px;
}

.recruiter-step__card {
  min-height: 52px;
  padding: 10px 12px;
  background: #faf9fa;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 12px;
}

.recruiter-step__card--selected {
  border-color: #f3bdd1;
  background: #fff5f9;
}

.recruiter-step__avatar,
.recruiter-step__selected-avatar {
  border-radius: 999px;
  background: color-mix(in srgb, var(--avatar-color) 78%, white);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
}

.recruiter-step__avatar {
  width: 28px;
  height: 28px;
}

.recruiter-step__meta {
  flex: 1;
  min-width: 0;
}

.recruiter-step__name,
.recruiter-step__type {
  font-size: var(--font-small);
}

.recruiter-step__name {
  color: #1d171f;
}

.recruiter-step__selector {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1.5px solid #dcb9c6;
  background: #ffffff;
  display: inline-block;
  position: relative;
  flex: 0 0 auto;
}

.recruiter-step__selector--active {
  border-color: #ff6a9d;
}

.recruiter-step__selector--active::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 999px;
  background: #ff6a9d;
}

.recruiter-step__selected {
  min-height: var(--control-height);
  padding: 8px 12px;
  border: 1px solid #e7dde2;
  border-radius: 6px;
  background: #faf9fa;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.recruiter-step__selected-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.recruiter-step__selected-chip {
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #ffe1ec;
  color: #f06a9a;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-small);
}

.recruiter-step__selected-avatar {
  width: 16px;
  height: 16px;
}

.recruiter-step__close {
  color: #cfa2b3;
}

.recruiter-step__count {
  margin: 6px 0 0;
  font-size: var(--font-small);
  color: #ff6a9d;
}
</style>
