<template>
  <div class="not-found-view">
    <div class="not-found-container">
      <div class="not-found-illustration">
        <el-icon class="not-found-icon">
          <WarningFilled />
        </el-icon>
        <div class="not-found-code">404</div>
      </div>
      
      <div class="not-found-content">
        <h1 class="not-found-title">页面未找到</h1>
        <p class="not-found-description">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        
        <div class="not-found-suggestions">
          <h3>可能的原因：</h3>
          <ul>
            <li>页面地址输入错误</li>
            <li>页面已被删除或移动</li>
            <li>您没有访问权限</li>
            <li>服务器暂时无法响应</li>
          </ul>
        </div>
        
        <div class="not-found-actions">
          <el-button type="primary" @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回上页
          </el-button>
          
          <el-button @click="refresh">
            <el-icon><Refresh /></el-icon>
            刷新页面
          </el-button>
        </div>
        
        <div class="not-found-help">
          <p>
            如果问题持续存在，请
            <el-button type="text" @click="contactSupport">
              联系技术支持
            </el-button>
          </p>
        </div>
      </div>
    </div>
    
    <!-- 快速导航 -->
    <div class="quick-navigation">
      <h3>快速导航</h3>
      <div class="nav-grid">
        <div class="nav-item" @click="navigateTo('/dashboard')">
          <el-icon><DataBoard /></el-icon>
          <span>工作台</span>
        </div>
        
        <div class="nav-item" @click="navigateTo('/tasks')">
          <el-icon><List /></el-icon>
          <span>任务管理</span>
        </div>
        
        <div class="nav-item" @click="navigateTo('/kanban')">
          <el-icon><Grid /></el-icon>
          <span>看板视图</span>
        </div>
        
        <div class="nav-item" @click="navigateTo('/files')">
          <el-icon><Folder /></el-icon>
          <span>文件管理</span>
        </div>
        
        <div class="nav-item" @click="navigateTo('/reports')">
          <el-icon><PieChart /></el-icon>
          <span>报表统计</span>
        </div>
        
        <div class="nav-item" @click="navigateTo('/profile')">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  WarningFilled,
  HomeFilled,
  ArrowLeft,
  Refresh,
  DataBoard,
  List,
  Grid,
  Folder,
  PieChart,
  User
} from '@element-plus/icons-vue'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}

// 刷新页面
const refresh = () => {
  window.location.reload()
}

// 联系技术支持
const contactSupport = () => {
  ElMessage.info('请发送邮件至 support@example.com 或拨打客服电话 400-123-4567')
}

// 导航到指定页面
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.not-found-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.not-found-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 60px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.not-found-illustration {
  margin-bottom: 40px;
}

.not-found-icon {
  font-size: 80px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.not-found-code {
  font-size: 120px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1;
  margin-bottom: 20px;
  background: linear-gradient(45deg, var(--el-color-primary), #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.not-found-content {
  color: var(--el-text-color-primary);
}

.not-found-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--el-text-color-primary);
}

.not-found-description {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.not-found-suggestions {
  text-align: left;
  margin-bottom: 32px;
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border-left: 4px solid var(--el-color-warning);
}

.not-found-suggestions h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.not-found-suggestions ul {
  margin: 0;
  padding-left: 20px;
  color: var(--el-text-color-regular);
}

.not-found-suggestions li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.not-found-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.not-found-help {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.not-found-help p {
  margin: 0;
}

.quick-navigation {
  max-width: 600px;
  width: 100%;
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.quick-navigation h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: center;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color);
}

.nav-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-item .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.nav-item span {
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.nav-item:hover span {
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .not-found-view {
    padding: 20px 16px;
  }
  
  .not-found-container {
    padding: 40px 24px;
  }
  
  .not-found-code {
    font-size: 80px;
  }
  
  .not-found-title {
    font-size: 24px;
  }
  
  .not-found-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .not-found-actions .el-button {
    width: 200px;
  }
  
  .quick-navigation {
    padding: 24px 20px;
  }
  
  .nav-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .nav-item {
    padding: 16px 12px;
  }
}

@media (max-width: 480px) {
  .not-found-icon {
    font-size: 60px;
  }
  
  .not-found-code {
    font-size: 60px;
  }
  
  .not-found-title {
    font-size: 20px;
  }
  
  .nav-grid {
    grid-template-columns: 1fr;
  }
}
</style>