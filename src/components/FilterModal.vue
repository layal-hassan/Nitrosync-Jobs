<script setup>
import { computed, ref, watch } from 'vue'
import FilterInput from './FilterInput.vue'
import PositionChip from './PositionChip.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  filters: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'update:filters', 'apply'])

const filterFields = [
  {
    key: 'job_title',
    label: 'Job Tittle',
    type: 'select',
    options: ['Site Engineer', 'Project Manager', 'Architect', 'Civil Engineer'],
  },
  { key: 'address', label: 'Address', type: 'text' },
  {
    key: 'country',
    label: 'country',
    type: 'select',
    options: ['Jordan', 'Saudi Arabia', 'UAE', 'Qatar'],
  },
  { key: 'job_id', label: 'Job ID', type: 'text' },
  {
    key: 'hiring_stage',
    label: 'Hiring Stage',
    type: 'select',
    options: ['Draft', 'Published', 'Screening', 'Interview', 'Closed'],
  },
  { key: 'rating', label: 'Raiting', type: 'select', options: ['1', '2', '3', '4', '5'] },
  { key: 'created_date', label: 'Create Date', type: 'date' },
  { key: 'recruiter', label: 'RECRUITER', type: 'text' },
  { key: 'tags_text', label: 'Tags', type: 'text' },
]

const positionOptions = [
  { label: 'Site engineer' },
  { label: 'Project Manager' },
  { label: 'Architect' },
  { label: 'Structural Engineer' },
  { label: 'Draftsman' },
  { label: 'Senior Engineer' },
  { label: 'Civil Engineer' },
]

const createLocalFilters = (source = {}) => ({
  job_title: source.job_title ?? '',
  address: source.address ?? '',
  country: source.country ?? '',
  job_id: source.job_id ?? '',
  hiring_stage: source.hiring_stage ?? '',
  rating: source.rating ?? '',
  created_date: source.created_date ?? '',
  recruiter: source.recruiter ?? '',
  tags_text: Array.isArray(source.tags) ? source.tags.join(', ') : '',
  positions: Array.isArray(source.positions) ? [...source.positions] : [],
})

const localFilters = ref(createLocalFilters(props.filters))

watch(
  () => props.filters,
  (value) => {
    localFilters.value = createLocalFilters(value)
  },
  { deep: true },
)

const normalizedFilters = computed(() => ({
  job_title: localFilters.value.job_title,
  address: localFilters.value.address,
  country: localFilters.value.country,
  job_id: localFilters.value.job_id,
  hiring_stage: localFilters.value.hiring_stage,
  rating: localFilters.value.rating,
  created_date: localFilters.value.created_date,
  recruiter: localFilters.value.recruiter,
  tags: localFilters.value.tags_text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
  positions: localFilters.value.positions,
}))

const syncFilters = () => {
  emit('update:filters', normalizedFilters.value)
}

watch(localFilters, syncFilters, { deep: true })

const togglePosition = (label) => {
  const positions = new Set(localFilters.value.positions)

  if (positions.has(label)) {
    positions.delete(label)
  } else {
    positions.add(label)
  }

  localFilters.value = {
    ...localFilters.value,
    positions: [...positions],
  }
}

const clearAll = () => {
  localFilters.value = createLocalFilters()
}

const applyFilters = () => {
  syncFilters()
  emit('apply', normalizedFilters.value)
  emit('close')
}
</script>

<template>
  <div v-if="open" class="filter-modal">
    <button class="filter-modal__overlay" aria-label="Close filter popup" @click="$emit('close')"></button>

    <section class="filter-modal__panel" role="dialog" aria-modal="true" aria-label="Filters">
      <header class="filter-modal__header">
        <div class="filter-modal__heading">
          <span class="filter-modal__funnel" aria-hidden="true"></span>
          <h2 class="filter-modal__title">Filters</h2>
        </div>

        <button class="filter-modal__close" type="button" aria-label="Close filter popup" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="filter-modal__body">
        <div class="filter-modal__grid">
          <FilterInput
            v-for="field in filterFields"
            :key="field.key"
            v-model="localFilters[field.key]"
            :label="field.label"
            :type="field.type"
            :options="field.options || []"
          />
        </div>

        <div class="filter-modal__divider"></div>

        <section class="filter-modal__positions">
          <h3 class="filter-modal__positions-title">Positions</h3>

          <div class="filter-modal__chips">
            <PositionChip
              v-for="position in positionOptions"
              :key="position.label"
              :label="position.label"
              :active="localFilters.positions.includes(position.label)"
              @toggle="togglePosition(position.label)"
            />
          </div>
        </section>
      </div>

      <footer class="filter-modal__actions">
        <button type="button" class="filter-modal__button filter-modal__button--primary" @click="applyFilters">
          Apply
        </button>
        <button type="button" class="filter-modal__button filter-modal__button--secondary" @click="clearAll">
          Clear All
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.filter-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 32px;
}

.filter-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(250, 246, 248, 0.58);
  backdrop-filter: blur(7px);
}

.filter-modal__panel {
  position: relative;
  width: min(972px, calc(100vw - 64px));
  background: #ffffff;
  border: 1px solid #f0e6ea;
  border-radius: 0;
  box-shadow: 0 22px 44px rgba(67, 46, 57, 0.18);
}

.filter-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 10px 14px 12px;
  border-bottom: 1px solid #f4ecef;
}

.filter-modal__heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-modal__funnel {
  width: 12px;
  height: 12px;
  background: #a86a82;
  clip-path: polygon(0 0, 100% 0, 62% 42%, 62% 100%, 38% 100%, 38% 42%);
}

.filter-modal__title {
  margin: 0;
  font-size: 25px;
  font-weight: 500;
  line-height: 1;
  color: #8f5a6f;
}

.filter-modal__close {
  width: 22px;
  height: 22px;
  border: 1px solid #b87f94;
  border-radius: 999px;
  position: relative;
  flex: 0 0 auto;
}

.filter-modal__close span {
  position: absolute;
  top: 10px;
  left: 4px;
  width: 12px;
  height: 1px;
  background: #b87f94;
}

.filter-modal__close span:first-child {
  transform: rotate(45deg);
}

.filter-modal__close span:last-child {
  transform: rotate(-45deg);
}

.filter-modal__body {
  padding: 28px 0 0;
}

.filter-modal__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 14px;
  padding: 0 26px 30px;
}

.filter-modal__divider {
  height: 1px;
  background: #f3eaee;
}

.filter-modal__positions {
  padding: 16px 26px 0;
}

.filter-modal__positions-title {
  margin: 0 0 18px;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 500;
  color: #372f35;
}

.filter-modal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 12px;
}

.filter-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding: 28px 46px 22px;
}

.filter-modal__button {
  min-width: 90px;
  height: 34px;
  border-radius: 11px;
  font-size: 14px;
  line-height: 1;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.filter-modal__button:hover {
  transform: translateY(-1px);
}

.filter-modal__button--primary {
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.22);
}

.filter-modal__button--secondary {
  background: #fbfbfc;
  border: 1px solid #e4dde1;
  color: #b8afb4;
  box-shadow: 0 4px 10px rgba(40, 29, 34, 0.06);
}

@media (max-width: 1100px) {
  .filter-modal__panel {
    width: min(972px, calc(100vw - 32px));
  }

  .filter-modal__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .filter-modal {
    padding: 16px;
  }

  .filter-modal__panel {
    width: 100%;
  }

  .filter-modal__grid {
    grid-template-columns: 1fr;
    padding-left: 16px;
    padding-right: 16px;
  }

  .filter-modal__positions {
    padding-left: 16px;
    padding-right: 16px;
  }

  .filter-modal__actions {
    flex-direction: column-reverse;
    gap: 12px;
    padding: 20px 16px 16px;
  }

  .filter-modal__button {
    width: 100%;
    height: 42px;
  }
}
</style>
