import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue')
        },
        {
          path: '/tasks',
          name: 'Tasks',
          component: () => import('@/views/tasks/TaskListView.vue')
        },
        {
          path: '/tasks/create',
          name: 'CreateTask',
          component: () => import('@/views/tasks/CreateTaskView.vue')
        },
        {
          path: '/tasks/:id',
          name: 'TaskDetail',
          component: () => import('@/views/tasks/TaskDetailView.vue')
        },
        {
          path: '/kanban',
          name: 'Kanban',
          component: () => import('@/views/kanban/KanbanView.vue')
        },
        {
          path: '/gantt',
          name: 'Gantt',
          component: () => import('@/views/gantt/GanttView.vue')
        },
        {
          path: '/files',
          name: 'Files',
          component: () => import('@/views/files/FileListView.vue')
        },
        {
          path: '/reports',
          name: 'Reports',
          component: () => import('@/views/reports/ReportsView.vue')
        },
        {
          path: '/profile',
          name: 'Profile',
          component: () => import('@/views/profile/ProfileView.vue')
        },
        {
          path: '/admin',
          name: 'Admin',
          component: () => import('@/views/admin/AdminView.vue'),
          meta: { requiresAdmin: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/NotFoundView.vue')
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果有token但没有用户信息，尝试重新初始化
  if (authStore.token && !authStore.user) {
    authStore.initializeAuth()
  }
  
  console.log('路由守卫执行:', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    user: authStore.user?.username,
    token: authStore.token ? '存在' : '不存在'
  })
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('需要认证但未登录，重定向到登录页')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    console.log('需要管理员权限但权限不足，重定向到首页')
    next('/')
    return
  }
  
  // 如果已登录用户访问登录页，重定向到首页
  if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    console.log('已登录用户访问登录页，重定向到首页')
    next('/')
    return
  }
  
  console.log('路由守卫通过，允许访问')
  next()
})

export default router