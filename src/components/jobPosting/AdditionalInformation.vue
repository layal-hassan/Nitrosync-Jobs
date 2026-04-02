<script setup>
import Dropdown from '../ui/Dropdown.vue'
import {
  careerLevelOptions,
  contractOptions,
  currencyOptions,
  degreeOptions,
  industryOptions,
  salaryOptions,
} from '../../data/jobPostingOptions'

defineProps({
  form: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div class="step-form">
    <div class="step-form__field">
      <label class="step-form__label">Degree Level</label>
      <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.degreeLevel }">
        <Dropdown v-model="form.degreeLevel" :options="degreeOptions" placeholder="Please select your degree level" />
      </div>
      <p v-if="errors.degreeLevel" class="step-form__error">{{ errors.degreeLevel }}</p>
    </div>

    <div class="step-form__grid step-form__grid--two">
      <div class="step-form__field">
        <label class="step-form__label">Career Level</label>
        <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.careerLevel }">
          <Dropdown v-model="form.careerLevel" :options="careerLevelOptions" placeholder="select one of the list..." />
        </div>
        <p v-if="errors.careerLevel" class="step-form__error">{{ errors.careerLevel }}</p>
      </div>

      <div class="step-form__field">
        <label class="step-form__label">Industry</label>
        <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.industry }">
          <Dropdown v-model="form.industry" :options="industryOptions" placeholder="select one of the list..." />
        </div>
        <p v-if="errors.industry" class="step-form__error">{{ errors.industry }}</p>
      </div>
    </div>

    <div class="step-form__field">
      <label class="step-form__label">Contract type</label>
      <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.contractType }">
        <Dropdown v-model="form.contractType" :options="contractOptions" placeholder="select one of the list..." />
      </div>
      <p v-if="errors.contractType" class="step-form__error">{{ errors.contractType }}</p>
    </div>

    <div class="step-form__field">
      <label class="step-form__label">Currency</label>
      <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.currency }">
        <Dropdown v-model="form.currency" :options="currencyOptions" placeholder="select one of the list..." />
      </div>
      <p v-if="errors.currency" class="step-form__error">{{ errors.currency }}</p>
    </div>

    <div class="step-form__grid step-form__grid--two">
      <div class="step-form__field">
        <label class="step-form__label">Start from</label>
        <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.salaryFrom }">
          <Dropdown v-model="form.salaryFrom" :options="salaryOptions" placeholder="$0" />
        </div>
        <p v-if="errors.salaryFrom" class="step-form__error">{{ errors.salaryFrom }}</p>
      </div>

      <div class="step-form__field">
        <label class="step-form__label">to</label>
        <div class="step-form__dropdown" :class="{ 'step-form__dropdown--error': errors.salaryTo }">
          <Dropdown v-model="form.salaryTo" :options="salaryOptions" placeholder="$0" />
        </div>
        <p v-if="errors.salaryTo" class="step-form__error">{{ errors.salaryTo }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-fields);
}

.step-form__grid {
  display: grid;
  gap: var(--space-fields);
}

.step-form__grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.step-form__field {
  min-width: 0;
}

.step-form__label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--font-label);
  color: #1f1720;
}

.step-form__input {
  width: 100%;
  border: 1px solid #e6dfe3;
  border-radius: var(--control-radius);
  background: #f8f8f8;
  color: #5f565c;
  min-height: var(--control-height);
  padding: 12px var(--control-padding-x);
  font: inherit;
  font-size: var(--font-body);
}

.step-form__input::placeholder {
  color: #cfc3c9;
}

.step-form__error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #e15b8f;
}

.step-form__input--error {
  border-color: #e15b8f;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}

.step-form__dropdown--error :deep(.dropdown__trigger) {
  border-color: #e15b8f;
  box-shadow: 0 0 0 3px rgba(225, 91, 143, 0.08);
}
</style>
