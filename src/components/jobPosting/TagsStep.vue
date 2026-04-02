<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  selectedTags: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:selectedTags'])

const tagOptions = [
  { label: 'High Salary', color: '#ea4f8d' },
  { label: 'Finance', color: '#4f7dff' },
  { label: 'Professional', color: '#f1b32a' },
  { label: 'Senior', color: '#48d873' },
  { label: 'Accounting', color: '#c4a1e8' },
  { label: 'Remote', color: '#f08db2' },
]

const pendingTag = ref('')

const selectedTagObjects = computed(() =>
  props.selectedTags.map((label) => tagOptions.find((item) => item.label === label) ?? { label, color: '#ea4f8d' }),
)

const availableTagOptions = computed(() =>
  tagOptions.filter((item) => !props.selectedTags.includes(item.label)),
)

const addTag = (label) => {
  const value = String(label || '').trim()
  if (!value || props.selectedTags.includes(value)) return
  emit('update:selectedTags', [...props.selectedTags, value])
  pendingTag.value = ''
}

const removeTag = (label) => {
  emit('update:selectedTags', props.selectedTags.filter((item) => item !== label))
}

const addPendingTag = () => {
  addTag(pendingTag.value)
}
</script>

<template>
  <div class="tags-step">
    <p class="tags-step__hint"><span>Tags:</span> Write your own tag or pick from suggestions</p>

    <div class="tags-step__input-row">
      <input
        v-model="pendingTag"
        type="text"
        class="tags-step__input"
        placeholder="Write tag name and press Enter"
        @keyup.enter="addPendingTag"
      />
      <button type="button" class="tags-step__input-add" :disabled="!pendingTag.trim()" @click="addPendingTag">
        Add Tag
      </button>
    </div>

    <div class="tags-step__section-title">Suggested Tags</div>

    <div class="tags-step__picker">
      <button
        v-for="tag in availableTagOptions"
        :key="tag.label"
        type="button"
        class="tags-step__picker-chip"
        :style="{ '--chip-color': tag.color }"
        @click="addTag(tag.label)"
      >
        <span>{{ tag.label }}</span>
        <span>+</span>
      </button>
      <span v-if="!availableTagOptions.length" class="tags-step__empty">All suggested tags are already selected</span>
    </div>

    <div class="tags-step__section-title">Tags Selected</div>

    <div class="tags-step__selected">
      <div class="tags-step__chips">
        <span
          v-for="tag in selectedTagObjects"
          :key="tag.label"
          class="tags-step__chip"
          :style="{ '--chip-color': tag.color }"
        >
          <span>{{ tag.label }}</span>
          <button type="button" @click="removeTag(tag.label)">x</button>
        </span>
        <span v-if="!selectedTagObjects.length" class="tags-step__empty">No tags selected yet</span>
      </div>
    </div>

    <p class="tags-step__count">{{ selectedTags.length }} tags have been selected</p>
  </div>
</template>

<style scoped>
.tags-step__hint {
  margin: 0 0 14px;
  font-size: var(--font-small);
  color: #d2c4cb;
}

.tags-step__hint span {
  color: #ff6a9d;
}

.tags-step__picker {
  min-height: 56px;
  padding: 10px;
  border: 1px solid #ddd4d9;
  border-radius: 6px;
  background: #ffffff;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tags-step__input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin-bottom: 12px;
}

.tags-step__input {
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #e7dde2;
  border-radius: 10px;
  background: #ffffff;
  color: #40363c;
  font: inherit;
  font-size: var(--font-body);
}

.tags-step__input::placeholder {
  color: #b8aab2;
}

.tags-step__input-add {
  min-width: 96px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  background: linear-gradient(180deg, #ef5d97 0%, #e34789 100%);
  color: #ffffff;
  font-size: var(--font-small);
}

.tags-step__input-add:disabled {
  opacity: 0.45;
}

.tags-step__picker-chip,
.tags-step__chip {
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-small);
}

.tags-step__picker-chip {
  background: color-mix(in srgb, var(--chip-color) 20%, white);
  color: #3a3136;
}

.tags-step__picker-chip span:last-child,
.tags-step__chip button {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: #fff;
  color: var(--chip-color);
  font-size: 12px;
  line-height: 1;
}

.tags-step__section-title {
  margin: 12px 0 8px;
  font-size: var(--font-label);
  color: #1d171f;
}

.tags-step__selected {
  min-height: var(--control-height);
  padding: 8px 12px;
  border: 1px solid #e7dde2;
  border-radius: 6px;
  background: #faf9fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tags-step__chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tags-step__chip {
  background: var(--chip-color);
  color: #ffffff;
}

.tags-step__empty {
  font-size: var(--font-small);
  color: #b49faa;
}

.tags-step__count {
  margin: 6px 0 0;
  font-size: var(--font-small);
  color: #ff6a9d;
}

@media (max-width: 700px) {
  .tags-step__input-row {
    grid-template-columns: 1fr;
  }
}
</style>
