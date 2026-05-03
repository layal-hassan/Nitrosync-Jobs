<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findEmployeeById, relatedCompany } from '../../composables/useEmployeeDirectory'
import { assignNitroSyncEmployeeRole } from '../../composables/useNitroSyncAssignEmployeeRole'

const route = useRoute()
const loading = ref(true)
const loadError = ref('')
const employee = ref(null)
const roleSaving = ref(false)
const roleError = ref('')
const roleFeedback = ref('')
const roleForm = reactive({
  roleId: '',
})

const sectionLabels = {
  profile: 'Profile',
  edit: 'Edit Info',
  permissions: 'Permission / Assign Role',
}

const sectionCards = {
  profile: [
    { title: 'Contact', items: ['Email', 'Phone', 'Address'] },
    { title: 'Employment', items: ['Status', 'Position', 'Department'] },
    { title: 'Summary', items: ['Profile note', 'Hire date', 'Workspace identity'] },
  ],
  edit: [
    { title: 'Personal Details', items: ['Full name', 'Work email', 'Mobile number'] },
    { title: 'Employment Details', items: ['Job title', 'Department', 'Employment status'] },
    { title: 'Location', items: ['Office address', 'City', 'Country'] },
  ],
  permissions: [
    { title: 'Access Scope', items: ['Workspace access', 'Module visibility', 'Approval limits'] },
    { title: 'Role Setup', items: ['Primary role', 'Secondary permissions', 'Reporting line'] },
    { title: 'Security', items: ['Password reset policy', 'Login restrictions', 'Audit visibility'] },
  ],
}

const currentSection = computed(() => {
  const section = String(route.params.section || 'profile')
  return sectionLabels[section] ? section : 'profile'
})

const infoRows = computed(() => {
  if (!employee.value) return []

  return [
    { label: 'Employee ID', value: employee.value.employeeNumber || employee.value.id },
    { label: 'Employee UUID', value: employee.value.employeeUuid || 'N/A' },
    { label: 'Name', value: employee.value.name },
    { label: 'Role', value: employee.value.role },
    { label: 'Role ID', value: employee.value.roleId || 'N/A' },
    { label: 'Status', value: employee.value.status },
    { label: 'Email', value: employee.value.email },
    { label: 'Phone', value: employee.value.phone },
    { label: 'Address', value: employee.value.address },
    { label: 'Hire date', value: employee.value.hireDate || 'N/A' },
    { label: 'Notes', value: employee.value.note },
  ]
})

const loadEmployee = async () => {
  loading.value = true
  loadError.value = ''
  roleError.value = ''
  roleFeedback.value = ''

  const { employee: currentEmployee, usedFallback } = await findEmployeeById(route.params.employeeId)
  employee.value = currentEmployee
  roleForm.roleId = currentEmployee?.roleId || ''

  if (usedFallback) {
    loadError.value = 'Employee details could not be loaded from NitroSync.'
  }

  if (!currentEmployee) {
    loadError.value = 'Employee was not found in the current directory.'
  }

  loading.value = false
}

const handleAssignRole = async () => {
  const employeeUuid = String(employee.value?.employeeUuid || '').trim()
  const roleId = String(roleForm.roleId || '').trim()

  roleError.value = ''
  roleFeedback.value = ''

  if (!employee.value) {
    roleError.value = 'Employee was not found.'
    return
  }

  if (!employeeUuid) {
    roleError.value = 'This employee does not have a NitroSync employee UUID.'
    return
  }

  if (!roleId) {
    roleError.value = 'Role ID is required.'
    return
  }

  roleSaving.value = true

  try {
    const result = await assignNitroSyncEmployeeRole(
      {
        employeeUuid,
        roleId,
      },
      {
        relatedCompany,
      },
    )

    roleFeedback.value = result.message || 'Employee role assigned successfully.'
    await loadEmployee()
  } catch (error) {
    roleError.value = error?.message || 'Failed to assign employee role.'
  } finally {
    roleSaving.value = false
  }
}

onMounted(loadEmployee)

watch(
  () => [route.params.employeeId, route.params.section],
  () => {
    loadEmployee()
  },
)
</script>

<template>
  <div class="employee-workspace page-container">
    <div class="breadcrumb-row employee-workspace__breadcrumb">
      <span class="crumb-home"></span>
      <span class="breadcrumb-sep"></span>
      <RouterLink to="/employees" class="employee-workspace__breadcrumb-link">Employees</RouterLink>
      <span class="breadcrumb-sep"></span>
      <span class="breadcrumb-text">{{ sectionLabels[currentSection] }}</span>
    </div>

    <section class="workspace-shell">
      <header class="workspace-hero">
        <div>
          <p class="workspace-hero__eyebrow">Employee Workspace</p>
          <h1>{{ sectionLabels[currentSection] }}</h1>
          <p class="workspace-hero__copy">
            <template v-if="employee">
              Manage {{ employee.name }} from a dedicated page instead of the dropdown only.
            </template>
            <template v-else>
              Open employee details, editing, and role access from dedicated routes.
            </template>
          </p>
        </div>

        <div v-if="employee" class="workspace-hero__identity">
          <div class="workspace-hero__avatar" :style="{ background: employee.avatarBg, color: employee.avatarAccent }">
            {{ employee.avatarText }}
          </div>
          <div>
            <div class="workspace-hero__name">{{ employee.name }}</div>
            <div class="workspace-hero__meta">{{ employee.role }} · {{ employee.status }}</div>
          </div>
        </div>
      </header>

      <nav class="workspace-tabs" aria-label="Employee sections">
        <RouterLink
          v-for="(label, key) in sectionLabels"
          :key="key"
          :to="`/employees/${route.params.employeeId}/${key}`"
          class="workspace-tabs__item"
          :class="{ 'workspace-tabs__item--active': currentSection === key }"
        >
          {{ label }}
        </RouterLink>
      </nav>

      <p v-if="loadError" class="workspace-feedback">{{ loadError }}</p>
      <p v-else-if="loading" class="workspace-feedback">Loading employee workspace...</p>

      <div v-if="employee" class="workspace-grid">
        <article class="workspace-panel workspace-panel--summary">
          <h2>Employee Snapshot</h2>
          <div class="workspace-details">
            <div v-for="row in infoRows" :key="row.label" class="workspace-details__row">
              <span>{{ row.label }}</span>
              <strong>{{ row.value }}</strong>
            </div>
          </div>
        </article>

        <article class="workspace-panel">
          <template v-if="currentSection === 'permissions'">
            <h2>Assign Role</h2>
            <div class="workspace-form">
              <label class="workspace-field">
                <span>Current role</span>
                <strong>{{ employee.role || 'N/A' }}</strong>
              </label>

              <label class="workspace-field">
                <span>Current role id</span>
                <strong>{{ employee.roleId || 'N/A' }}</strong>
              </label>

              <label class="workspace-field workspace-field--full">
                <span>Role ID</span>
                <input v-model.trim="roleForm.roleId" type="text" placeholder="Enter NitroSync role id" />
              </label>

              <p v-if="roleError" class="workspace-feedback workspace-feedback--error">{{ roleError }}</p>
              <p v-else-if="roleFeedback" class="workspace-feedback workspace-feedback--success">{{ roleFeedback }}</p>

              <button type="button" class="workspace-submit" :disabled="roleSaving" @click="handleAssignRole">
                {{ roleSaving ? 'Saving...' : 'Assign Role' }}
              </button>
            </div>
          </template>

          <template v-else>
            <h2>{{ sectionLabels[currentSection] }} Checklist</h2>
            <div class="workspace-checklist">
              <section v-for="card in sectionCards[currentSection]" :key="card.title" class="workspace-checklist__card">
                <h3>{{ card.title }}</h3>
                <ul>
                  <li v-for="item in card.items" :key="item">{{ item }}</li>
                </ul>
              </section>
            </div>
          </template>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.employee-workspace {
  padding-top: 10px;
}

.employee-workspace__breadcrumb {
  margin-bottom: 14px;
}

.employee-workspace__breadcrumb-link {
  color: #ef5d97;
  text-decoration: none;
}

.workspace-shell {
  padding: 24px;
  border: 1px solid #f4e7ec;
  border-radius: 24px;
  background: linear-gradient(180deg, #fff 0%, #fff9fb 100%);
  box-shadow: 0 10px 28px rgba(76, 41, 58, 0.06);
}

.workspace-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.workspace-hero__eyebrow {
  margin: 0 0 8px;
  color: #f08ab2;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.workspace-hero h1 {
  margin: 0;
  color: #241d23;
  font-size: 34px;
  line-height: 1.1;
}

.workspace-hero__copy {
  max-width: 620px;
  margin: 12px 0 0;
  color: #7f6d77;
  font-size: 15px;
  line-height: 1.6;
}

.workspace-hero__identity {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 240px;
  padding: 14px 16px;
  border: 1px solid #f2dfe7;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
}

.workspace-hero__avatar {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.7);
  font-size: 24px;
  font-weight: 800;
}

.workspace-hero__name {
  color: #241d23;
  font-size: 18px;
  font-weight: 700;
}

.workspace-hero__meta {
  margin-top: 4px;
  color: #9b8791;
  font-size: 14px;
}

.workspace-tabs {
  display: flex;
  gap: 12px;
  margin-top: 22px;
  padding: 6px;
  border-radius: 18px;
  background: #fff1f6;
}

.workspace-tabs__item {
  padding: 12px 16px;
  border-radius: 14px;
  color: #d35e93;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
}

.workspace-tabs__item--active {
  background: linear-gradient(180deg, #f15b95 0%, #e9498a 100%);
  color: #fff;
}

.workspace-feedback {
  margin-top: 18px;
  color: #a2838f;
  font-size: 14px;
}

.workspace-feedback--error {
  color: #d6427b;
}

.workspace-feedback--success {
  color: #3a9d58;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 18px;
  margin-top: 20px;
}

.workspace-panel {
  padding: 20px;
  border: 1px solid #f2dce6;
  border-radius: 20px;
  background: #fff;
}

.workspace-panel h2 {
  margin: 0 0 16px;
  color: #241d23;
  font-size: 20px;
}

.workspace-details {
  display: grid;
  gap: 12px;
}

.workspace-details__row {
  display: grid;
  gap: 4px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f6ebf0;
}

.workspace-details__row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.workspace-details__row span {
  color: #aa97a0;
  font-size: 13px;
}

.workspace-details__row strong {
  color: #2b2329;
  font-size: 15px;
  line-height: 1.45;
}

.workspace-checklist {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.workspace-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.workspace-field {
  display: grid;
  gap: 8px;
}

.workspace-field--full {
  grid-column: 1 / -1;
}

.workspace-field span {
  color: #aa97a0;
  font-size: 13px;
}

.workspace-field strong {
  color: #2b2329;
  font-size: 15px;
}

.workspace-field input {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid #ecdfe5;
  border-radius: 14px;
  background: #fff;
  color: #5a4e55;
  font-size: 15px;
  box-sizing: border-box;
}

.workspace-field input:focus {
  outline: none;
  border-color: #ef8ab3;
  box-shadow: 0 0 0 3px rgba(239, 90, 150, 0.08);
}

.workspace-submit {
  width: fit-content;
  min-width: 140px;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f15b95 0%, #e9498a 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.workspace-submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.workspace-checklist__card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff7fa 0%, #fff 100%);
  border: 1px solid #f5dde7;
}

.workspace-checklist__card h3 {
  margin: 0 0 12px;
  color: #ef5d97;
  font-size: 16px;
}

.workspace-checklist__card ul {
  margin: 0;
  padding-left: 18px;
  color: #735f69;
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 980px) {
  .workspace-hero,
  .workspace-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .workspace-tabs,
  .workspace-checklist,
  .workspace-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .workspace-shell {
    padding: 16px;
    border-radius: 18px;
  }

  .workspace-hero h1 {
    font-size: 28px;
  }

  .workspace-hero__identity {
    min-width: 0;
  }
}
</style>
