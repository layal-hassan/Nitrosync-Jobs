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
  { label: 'High Salary', color: '#ff4f93' },
  { label: 'Finance', color: '#4f7dff' },
  { label: 'Professional', color: '#f5b31f' },
  { label: 'Senior', color: '#35d06a' },
  { label: 'Accounting', color: '#b687ff' },
  { label: 'Remote', color: '#ff87b2' },
]

const pendingTag = ref('')

const selectedTagObjects = computed(() =>
  props.selectedTags.map((label) => tagOptions.find((item) => item.label === label) ?? { label, color: '#ff4f93' }),
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
        <span class="tags-step__icon-badge tags-step__icon-badge--plus" aria-hidden="true"></span>
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
          <button type="button" class="tags-step__icon-badge tags-step__icon-badge--remove" aria-label="Remove tag" @click="removeTag(tag.label)"></button>
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
  color: #ab93a1;
}

.tags-step__hint span {
  color: #ff4f93;
}

.tags-step__picker {
  min-height: 56px;
  padding: 10px;
  border: 1px solid #f1d9e4;
  border-radius: 14px;
  background: linear-gradient(180deg, #fffefe 0%, #fff8fb 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
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
  border: 1px solid #edd9e3;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fffafc 100%);
  color: #40363c;
  font: inherit;
  font-size: var(--font-body);
}

.tags-step__input::placeholder {
  color: #c3b1ba;
}

.tags-step__input-add {
  min-width: 96px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff6ca3 0%, #ff4f93 55%, #f03a83 100%);
  color: #ffffff;
  font-size: var(--font-small);
  box-shadow: 0 12px 24px rgba(255, 79, 147, 0.22);
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
  background: color-mix(in srgb, var(--chip-color) 16%, white);
  border: 1px solid color-mix(in srgb, var(--chip-color) 28%, white);
  color: color-mix(in srgb, var(--chip-color) 72%, #4a3c44);
  box-shadow: 0 6px 14px rgba(255, 255, 255, 0.8);
}

.tags-step__icon-badge {
  width: 16px;
  height: 16px;
  min-width: 16px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.96);
  color: var(--chip-color);
  font-size: 0;
  line-height: 0;
  font-weight: 600;
  padding: 0;
  text-align: center;
  vertical-align: middle;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.tags-step__icon-badge--plus,
.tags-step__icon-badge--remove {
  border: 0;
  appearance: none;
  font-family: Arial, sans-serif;
}

.tags-step__icon-badge::before {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--chip-color);
  font-family: Arial, sans-serif;
  font-weight: 600;
  line-height: 1;
}

.tags-step__icon-badge--plus::before {
  content: '+';
  font-size: 15px;
}

.tags-step__icon-badge--remove::before {
  content: '×';
  font-size: 14px;
}

.tags-step__section-title {
  margin: 12px 0 8px;
  font-size: var(--font-label);
  color: #1d171f;
}

.tags-step__selected {
  min-height: var(--control-height);
  padding: 8px 12px;
  border: 1px solid #f0d8e3;
  border-radius: 14px;
  background: linear-gradient(180deg, #fffdfd 0%, #fff7fb 100%);
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
  background: linear-gradient(135deg, color-mix(in srgb, var(--chip-color) 92%, white), var(--chip-color));
  color: #ffffff;
  box-shadow: 0 10px 18px color-mix(in srgb, var(--chip-color) 30%, transparent);
}

.tags-step__empty {
  font-size: var(--font-small);
  color: #b49faa;
}

.tags-step__count {
  margin: 6px 0 0;
  font-size: var(--font-small);
  color: #ff4f93;
}

@media (max-width: 700px) {
  .tags-step__input-row {
    grid-template-columns: 1fr;
  }
}
</style>
