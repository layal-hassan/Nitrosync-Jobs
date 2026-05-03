import { createRouter, createWebHistory } from 'vue-router'
import JobsListPage from '../pages/jobs/JobsListPage.vue'
import EmployeesCardPage from '../pages/employees/EmployeesCardPage.vue'
import EmployeeWorkspacePage from '../pages/employees/EmployeeWorkspacePage.vue'
import PostJobPage from '../pages/jobs/PostJobPage.vue'

const routes = [
  {
    path: '/',
    component: JobsListPage,
  },
  {
    path: '/jobs',
    component: JobsListPage,
  },
  {
    path: '/employees',
    component: EmployeesCardPage,
  },
  {
    path: '/employees/:employeeId/:section(profile|edit|permissions)',
    component: EmployeeWorkspacePage,
  },
  {
    path: '/jobs/post',
    component: PostJobPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
