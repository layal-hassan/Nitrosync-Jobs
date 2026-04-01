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

const addRecruiter = (name) => {
  if (!name || props.selectedRecruiters.includes(name)) return
  emit('update:selectedRecruiters', [...props.selectedRecruiters, name])
}

const removeRecruiter = (name) => {
  emit('update:selectedRecruiters', props.selectedRecruiters.filter((item) => item !== name))
}
</script>

<template>
  <div class="recruiter-step">
    <p class="recruiter-step__hint"><span>Recruiter:</span> Select your prefered tags from menu</p>

    <div class="recruiter-step__title">Top recruiters here</div>

    <div class="recruiter-step__grid">
      <div v-for="item in availableRecruiters" :key="item.name" class="recruiter-step__card">
        <div class="recruiter-step__avatar" :style="{ '--avatar-color': item.color }">{{ item.initials }}</div>
        <div class="recruiter-step__meta">
          <div class="recruiter-step__name">{{ item.name }}</div>
          <div class="recruiter-step__type" :style="{ color: item.color }">{{ item.type }}</div>
        </div>
        <button type="button" class="recruiter-step__plus" @click="addRecruiter(item.name)">+</button>
      </div>
    </div>

    <div class="recruiter-step__selected-title">Recruiter Selected</div>

    <div class="recruiter-step__selected">
      <div class="recruiter-step__selected-chips">
        <div v-for="item in selectedRecruiterObjects" :key="item.name" class="recruiter-step__selected-chip">
          <span class="recruiter-step__selected-avatar" :style="{ '--avatar-color': item.color }">{{ item.initials }}</span>
          <span>{{ item.name }}</span>
          <button type="button" class="recruiter-step__close" @click="removeRecruiter(item.name)">x</button>
        </div>
      </div>
      <button
        type="button"
        class="recruiter-step__add"
        :disabled="!availableRecruiters.length"
        @click="addRecruiter(availableRecruiters[0]?.name)"
      >
        Add
      </button>
    </div>

    <p class="recruiter-step__count">{{ selectedRecruiters.length }} recruiter{{ selectedRecruiters.length === 1 ? '' : 's' }} selected</p>
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

.recruiter-step__plus {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid #ffb6cd;
  color: #ff6a9d;
  font-size: 13px;
  line-height: 1;
}

.recruiter-step__selected {
  min-height: var(--control-height);
  padding: 8px 12px;
  border: 1px solid #e7dde2;
  border-radius: 6px;
  background: #faf9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.recruiter-step__add {
  min-width: 56px;
  height: 28px;
  border-radius: 999px;
  background: #ffd8e7;
  color: #f06a9a;
  font-size: var(--font-small);
}

.recruiter-step__add:disabled {
  opacity: 0.45;
}

.recruiter-step__count {
  margin: 6px 0 0;
  font-size: var(--font-small);
  color: #ff6a9d;
}
</style>
