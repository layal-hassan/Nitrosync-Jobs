import { createRouter, createWebHistory } from 'vue-router'
import JobsListPage from '../pages/jobs/JobsListPage.vue'
import PostJobPage from '../pages/jobs/PostJobPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/jobs',
  },
  {
    path: '/jobs',
    component: JobsListPage,
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
