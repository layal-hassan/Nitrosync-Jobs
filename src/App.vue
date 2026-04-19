<script setup>
import { computed, onMounted, ref } from 'vue'
import logoImage from './assets/logo.png'
import { getNitroSyncEmployees } from './composables/useNitroSyncEmployees'

const navItems = ['Job', 'Employee', 'Reports', 'Payroll', 'Adbuilder', 'Survey', 'Support']
const mobileMenuOpen = ref(false)
const companyId = 'b00af2a4-2d77-432b-bd93-4e7ea120d154'
const profile = ref({
  name: 'Team member',
  email: 'member@nitrosync.com',
})

const normalizeLabel = (value, fallback = '') => {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

const getEmployeeName = (employee) => {
  const firstName = normalizeLabel(employee?.first_name ?? employee?.firstName)
  const lastName = normalizeLabel(employee?.last_name ?? employee?.lastName)
  const fullName = normalizeLabel(
    employee?.full_name
    ?? employee?.fullName
    ?? employee?.employee_name
    ?? employee?.employeeName
    ?? employee?.name,
  )

  return fullName || [firstName, lastName].filter(Boolean).join(' ').trim()
}

const getEmployeeEmail = (employee) =>
  normalizeLabel(
    employee?.email
    ?? employee?.work_email
    ?? employee?.workEmail
    ?? employee?.employee_email
    ?? employee?.employeeEmail,
  )

const pickProfileFromStorage = () => {
  const storageKeys = [
    'nitrosync-user',
    'nitrosync-profile',
    'user',
    'profile',
    'auth-user',
    'currentUser',
  ]

  for (const key of storageKeys) {
    for (const storage of [globalThis.localStorage, globalThis.sessionStorage]) {
      try {
        const rawValue = storage?.getItem?.(key)
        if (!rawValue) continue

        const parsed = JSON.parse(rawValue)
        const name = getEmployeeName(parsed)
        const email = getEmployeeEmail(parsed)

        if (name || email) {
          return {
            name: name || 'Team member',
            email: email || 'member@nitrosync.com',
          }
        }
      } catch {
        continue
      }
    }
  }

  return null
}

const profileInitials = computed(() => {
  const parts = String(profile.value.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'TM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
})

const loadProfile = async () => {
  const storedProfile = pickProfileFromStorage()
  if (storedProfile) {
    profile.value = storedProfile
    return
  }

  try {
    const response = await getNitroSyncEmployees(companyId)
    const rows = Array.isArray(response?.data) ? response.data : []
    const firstEmployee = rows.find((item) => getEmployeeName(item) || getEmployeeEmail(item))

    if (!firstEmployee) return

    profile.value = {
      name: getEmployeeName(firstEmployee) || profile.value.name,
      email: getEmployeeEmail(firstEmployee) || profile.value.email,
    }
  } catch (error) {
    console.error('Failed to load topbar profile', error)
  }
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="page-bg">
    <div class="page-canvas">
      <header class="topbar" :class="{ 'topbar--menu-open': mobileMenuOpen }">
        <div class="brand">
          <img :src="logoImage" alt="Nitrosync logo" class="brand__mark" />
          <div class="brand__text">
            <div class="brand__title">NitroSync</div>
            <div class="brand__subtitle">Recruitment in another perspective</div>
          </div>
        </div>

        <button
          type="button"
          class="menu-toggle"
          :class="{ 'menu-toggle--open': mobileMenuOpen }"
          :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
          aria-label="Toggle navigation menu"
          @click="toggleMobileMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav class="nav-tabs" :class="{ 'nav-tabs--open': mobileMenuOpen }">
          <a
            v-for="item in navItems"
            :key="item"
            href="#"
            class="nav-tabs__item"
            :class="{ 'nav-tabs__item--active': item === 'Job' }"
            @click="closeMobileMenu"
          >
            {{ item }}
          </a>
        </nav>

        <div class="topbar-actions">
          <div class="topbar-actions__panel">
            <button class="icon-btn icon-btn--surface" aria-label="Search">
              <svg class="icon-svg icon-svg--search" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="7.25" fill="none" stroke="currentColor" stroke-width="2" />
                <path d="M16.2 16.2 21 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
            <div class="quick-icons">
              <button class="icon-btn icon-btn--chip" aria-label="Settings">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10.35 3.84h3.3l.44 2.03c.38.12.74.27 1.08.46l1.86-.93 2.33 2.33-.93 1.86c.19.34.34.7.46 1.08l2.03.44v3.3l-2.03.44c-.12.38-.27.74-.46 1.08l.93 1.86-2.33 2.33-1.86-.93c-.34.19-.7.34-1.08.46l-.44 2.03h-3.3l-.44-2.03a6.86 6.86 0 0 1-1.08-.46l-1.86.93-2.33-2.33.93-1.86a6.86 6.86 0 0 1-.46-1.08l-2.03-.44v-3.3l2.03-.44c.12-.38.27-.74.46-1.08l-.93-1.86L7.7 5.4l1.86.93c.34-.19.7-.34 1.08-.46l.44-2.03Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" />
                  <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" stroke-width="1.9" />
                </svg>
              </button>
              <button class="icon-btn icon-btn--chip" aria-label="Notifications">
                <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4.75a3.25 3.25 0 0 0-3.25 3.25v1.32c0 .85-.22 1.69-.64 2.43l-1.06 1.84a1 1 0 0 0 .87 1.5h8.16a1 1 0 0 0 .87-1.5l-1.06-1.84a4.93 4.93 0 0 1-.64-2.43V8A3.25 3.25 0 0 0 12 4.75Z" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linejoin="round" />
                  <path d="M10.2 17.5a1.8 1.8 0 0 0 3.6 0" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" />
                  <path d="M12 3.25v1.5" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <div class="profile-chip">
              <div class="profile-chip__avatar">{{ profileInitials }}</div>
              <div class="profile-chip__meta">
                <div class="profile-chip__eyebrow">Workspace member</div>
                <div class="profile-chip__name">{{ profile.name }}</div>
                <div class="profile-chip__mail">{{ profile.email }}</div>
              </div>
              <span class="profile-chip__caret"></span>
            </div>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
