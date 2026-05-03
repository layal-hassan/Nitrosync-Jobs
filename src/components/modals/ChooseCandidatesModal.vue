<script setup>
import { computed, reactive } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  selectedCandidates: {
    type: Array,
    default: () => [],
  },
  candidates: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'toggle-candidate'])

const filters = reactive({
  firstName: '',
  lastName: '',
  tags: '',
  position: '',
  country: '',
  rating: '',
})

const filteredCandidates = computed(() =>
  props.candidates.filter((candidate) => {
    const name = candidate.name.toLowerCase()

    return (
      (!filters.firstName || name.includes(filters.firstName.toLowerCase())) &&
      (!filters.lastName || name.includes(filters.lastName.toLowerCase())) &&
      (!filters.tags || candidate.tags.toLowerCase().includes(filters.tags.toLowerCase())) &&
      (!filters.position || candidate.position.toLowerCase().includes(filters.position.toLowerCase())) &&
      (!filters.country || candidate.country.toLowerCase().includes(filters.country.toLowerCase())) &&
      (!filters.rating || String(candidate.rating).includes(filters.rating))
    )
  }),
)

const isSelected = (id) => props.selectedCandidates.some((candidate) => candidate.id === id)
</script>

<template>
  <div v-if="open" class="choose-modal">
    <button class="choose-modal__overlay" aria-label="Close choose candidates modal" @click="$emit('close')"></button>

    <section class="choose-modal__panel" role="dialog" aria-modal="true" aria-label="choose candidates">
      <header class="choose-modal__header">
        <h2 class="choose-modal__title">choose candidates</h2>
        <button class="choose-modal__close" type="button" aria-label="Close choose candidates modal" @click="$emit('close')">
          <span></span>
          <span></span>
        </button>
      </header>

      <div class="choose-modal__body">
        <section class="choose-modal__filters">
          <div class="choose-modal__filters-title">
            <span class="choose-modal__filters-icon"></span>
            <span>Filters</span>
          </div>

          <div class="choose-modal__filters-grid">
            <input v-model="filters.firstName" class="choose-modal__input" type="text" placeholder="First Name" />
            <input v-model="filters.lastName" class="choose-modal__input" type="text" placeholder="Last Name" />
            <input v-model="filters.tags" class="choose-modal__input" type="text" placeholder="Tags" />
            <input v-model="filters.position" class="choose-modal__input" type="text" placeholder="Position" />
            <input v-model="filters.country" class="choose-modal__input" type="text" placeholder="Country" />
            <input v-model="filters.rating" class="choose-modal__input" type="text" placeholder="Rating" />
          </div>
        </section>

        <div class="choose-modal__cards">
          <button
            v-for="candidate in filteredCandidates"
            :key="candidate.id"
            type="button"
            class="choose-modal__card"
          >
            <span class="choose-modal__avatar"></span>
            <span class="choose-modal__name" :class="`choose-modal__name--${candidate.accent}`">
              {{ candidate.name }}
            </span>
            <span
              class="choose-modal__plus"
              :class="{ 'choose-modal__plus--selected': isSelected(candidate.id) }"
              @click.stop="$emit('toggle-candidate', candidate)"
            >
              +
            </span>
          </button>
        </div>
      </div>

      <footer class="choose-modal__footer">
        <button type="button" class="choose-modal__done" @click="$emit('close')">Done</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.choose-modal {
  position: fixed;
  inset: 0;
  z-index: 140;
  display: grid;
  place-items: center;
  padding: 20px;
}

.choose-modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(33, 24, 29, 0.42);
}

.choose-modal__panel {
  position: relative;
  width: min(452px, calc(100vw - 28px));
  max-height: calc(100vh - 40px);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 18px 34px rgba(32, 19, 26, 0.18);
  overflow: auto;
}

.choose-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0e9ed;
}

.choose-modal__title {
  margin: 0;
  color: #f04f92;
  font-size: 14px;
  font-weight: 500;
}

.choose-modal__close {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #f04f92;
  position: relative;
}

.choose-modal__close span {
  position: absolute;
  top: 8px;
  left: 4px;
  width: 10px;
  height: 1.5px;
  background: #ffffff;
}

.choose-modal__close span:first-child { transform: rotate(45deg); }
.choose-modal__close span:last-child { transform: rotate(-45deg); }

.choose-modal__body {
  padding: 16px;
}

.choose-modal__filters {
  border-radius: 16px;
  background: #fbfbfc;
  padding: 12px;
}

.choose-modal__filters-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f04f92;
  font-size: 12px;
  margin-bottom: 10px;
}

.choose-modal__filters-icon {
  width: 10px;
  height: 10px;
  background: currentColor;
  clip-path: polygon(0 0, 100% 0, 63% 44%, 63% 100%, 37% 100%, 37% 44%);
}

.choose-modal__filters-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.choose-modal__input {
  width: 100%;
  height: 25px;
  border: 1px solid #e8dde3;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 8px;
  color: #655b62;
  font: inherit;
  font-size: 10px;
  outline: 0;
}

.choose-modal__input::placeholder {
  color: #a99ca4;
}

.choose-modal__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin-top: 18px;
}

.choose-modal__card {
  min-height: 40px;
  background: #fcfcfd;
  border: 1px solid #f0eaee;
  padding: 0 10px 0 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.choose-modal__avatar {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #dedede;
  flex: 0 0 auto;
}

.choose-modal__name {
  flex: 1 1 auto;
  font-size: 11px;
}

.choose-modal__name--pink { color: #f04f92; }
.choose-modal__name--blue { color: #3664ff; }
.choose-modal__name--purple { color: #4b0cff; }
.choose-modal__name--gold { color: #eea800; }

.choose-modal__plus {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid currentColor;
  color: #f04f92;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-size: 13px;
  line-height: 0;
  padding-bottom: 1px;
}

.choose-modal__plus--selected {
  background: #f04f92;
  color: #ffffff;
  border-color: #f04f92;
}

.choose-modal__footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 16px 16px;
}

.choose-modal__done {
  min-width: 84px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: 11px;
  box-shadow: 0 10px 16px rgba(234, 79, 141, 0.18);
}

@media (max-width: 640px) {
  .choose-modal {
    padding: 12px;
  }

  .choose-modal__panel {
    width: 100%;
    max-height: calc(100vh - 24px);
  }

  .choose-modal__body,
  .choose-modal__header,
  .choose-modal__footer {
    padding-left: 14px;
    padding-right: 14px;
  }

  .choose-modal__filters-grid,
  .choose-modal__cards {
    grid-template-columns: 1fr;
  }
}
</style>
