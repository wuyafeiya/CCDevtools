import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Overview',
      component: () => import('@/views/OverviewView.vue')
    },
    {
      path: '/config',
      name: 'Config',
      component: () => import('@/views/ConfigView.vue')
    },
    {
      path: '/context',
      name: 'Context',
      component: () => import('@/views/ContextView.vue')
    },
    {
      path: '/timeline',
      name: 'Timeline',
      component: () => import('@/views/TimelineView.vue')
    },
    {
      path: '/tools',
      name: 'Tools',
      component: () => import('@/views/ToolsView.vue')
    }
  ]
})

export default router
