<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <img v-if="!isCollapse" src="/logo.svg" alt="Logo" class="logo-img">
        <span v-if="!isCollapse" class="logo-text">任务管理系统</span>
        <el-icon v-else class="logo-icon"><Management /></el-icon>
      </div>
      
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>
        
        <el-menu-item index="/tasks">
          <el-icon><List /></el-icon>
          <template #title>任务管理</template>
        </el-menu-item>
        
        <el-menu-item index="/kanban">
          <el-icon><Grid /></el-icon>
          <template #title>看板视图</template>
        </el-menu-item>
        
        <el-menu-item index="/gantt">
          <el-icon><TrendCharts /></el-icon>
          <template #title>甘特图</template>
        </el-menu-item>
        
        <el-menu-item index="/files">
          <el-icon><Folder /></el-icon>
          <template #title>文件管理</template>
        </el-menu-item>
        
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>报表统计</template>
        </el-menu-item>
        
        <el-menu-item v-if="authStore.isAdmin" index="/admin">
          <el-icon><Setting /></el-icon>
          <template #title>系统管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapse ? Expand : Fold"
            @click="toggleSidebar"
            text
            class="collapse-btn"
          />
          
          <!-- 面包屑导航 -->
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 通知 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button :icon="Bell" text @click="showNotifications" />
          </el-badge>
          
          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="authStore.user?.avatar">
                {{ authStore.user?.full_name?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ authStore.user?.full_name }}</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 主内容 -->
      <el-main class="main-content" :class="{ 'no-padding': $route.path === '/gantt' }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
  
  <!-- 通知抽屉 -->
  <el-drawer
    v-model="notificationDrawer"
    title="通知消息"
    direction="rtl"
    size="400px"
  >
    <NotificationList />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Management, Odometer, List, Grid, TrendCharts, Folder, DataAnalysis, Setting,
  Expand, Fold, Bell, User, ArrowDown, SwitchButton
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import NotificationList from '@/components/notifications/NotificationList.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 通知相关
const notificationDrawer = ref(false)
const unreadCount = ref(0)

// 面包屑导航
const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  const breadcrumbItems = []
  
  // 根据路由生成面包屑
  switch (route.path) {
    case '/':
      breadcrumbItems.push({ title: '工作台', path: '/' })
      break
    case '/tasks':
      breadcrumbItems.push({ title: '任务管理', path: '/tasks' })
      break
    case '/tasks/create':
      breadcrumbItems.push({ title: '任务管理', path: '/tasks' })
      breadcrumbItems.push({ title: '创建任务', path: '/tasks/create' })
      break
    case '/kanban':
      breadcrumbItems.push({ title: '看板视图', path: '/kanban' })
      break
    case '/gantt':
      breadcrumbItems.push({ title: '甘特图', path: '/gantt' })
      break
    case '/files':
      breadcrumbItems.push({ title: '文件管理', path: '/files' })
      break
    case '/reports':
      breadcrumbItems.push({ title: '报表统计', path: '/reports' })
      break
    case '/profile':
      breadcrumbItems.push({ title: '个人资料', path: '/profile' })
      break
    case '/admin':
      breadcrumbItems.push({ title: '系统管理', path: '/admin' })
      break
    default:
      if (route.path.startsWith('/tasks/')) {
        breadcrumbItems.push({ title: '任务管理', path: '/tasks' })
        breadcrumbItems.push({ title: '任务详情', path: route.path })
      }
  }
  
  return breadcrumbItems
})

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 显示通知
const showNotifications = () => {
  notificationDrawer.value = true
}

// 处理用户菜单命令
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      // TODO: 打开设置对话框
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        authStore.logout()
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}

// 监听路由变化，自动收起移动端侧边栏
watch(
  () => route.path,
  () => {
    if (window.innerWidth < 768) {
      isCollapse.value = true
    }
  }
)
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden; /* 防止整体页面滚动 */
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0; /* 防止侧边栏被压缩 */
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  background-color: #2b3a4b;
  color: white;
}

.logo-img {
  height: 32px;
  margin-right: 8px;
}

.logo-text {
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
}

.logo-icon {
  font-size: 24px;
}

.sidebar-menu {
  border: none;
  background-color: #304156;
}

.sidebar-menu :deep(.el-menu-item) {
  color: #bfcbd9;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #263445;
  color: #409eff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #409eff;
  color: white;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 60px; /* 固定header高度 */
  flex-shrink: 0; /* 防止header被压缩 */
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  margin-right: 16px;
  font-size: 18px;
}

.breadcrumb {
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.arrow-down {
  font-size: 12px;
  color: #909399;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
  flex: 1; /* 占满剩余空间 */
  min-height: 0; /* 允许flex子项收缩 */
}

.main-content.no-padding {
  padding: 0 !important;
  overflow: hidden !important; /* 完全交由甘特图内部管理滚动 */
  display: flex !important;
  flex-direction: column !important;
  background-color: #ffffff !important; /* 甘特图页面使用白色背景 */
}

/* 为甘特图页面特别优化的全屏布局 */
.main-layout:has(.main-content.no-padding) {
  .header {
    height: 50px; /* 甘特图页面减小header高度 */
    padding: 0 12px; /* 减小左右padding */
  }
  
  .sidebar {
    width: 180px !important; /* 甘特图页面时缩小侧边栏 */
  }
  
  .sidebar.collapsed {
    width: 50px !important;
  }
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
    height: 100vh;
  }
  
  .username {
    display: none;
  }
  
  .breadcrumb {
    display: none;
  }
}
</style>