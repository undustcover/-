<template>
  <div class="test-delete">
    <h2>删除功能测试</h2>
    <div class="debug-info">
      <h3>认证信息</h3>
      <p>已认证: {{ authStore.isAuthenticated }}</p>
      <p>是管理员: {{ authStore.isAdmin }}</p>
      <p>用户: {{ authStore.user?.username }}</p>
      <p>角色: {{ authStore.user?.role }}</p>
      <p>Token: {{ authStore.token ? '存在' : '不存在' }}</p>
    </div>
    
    <div class="test-section">
      <h3>测试删除用户</h3>
      <el-input v-model="testUserId" placeholder="输入要删除的用户ID" style="width: 200px; margin-right: 10px;" />
      <el-button @click="testDelete" type="danger">测试删除</el-button>
    </div>
    
    <div class="logs">
      <h3>日志</h3>
      <div v-for="(log, index) in logs" :key="index" class="log-item">
        {{ log }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/api/users'

const authStore = useAuthStore()
const testUserId = ref('')
const logs = ref<string[]>([])

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push(`[${timestamp}] ${message}`)
  console.log(message)
}

const testDelete = async () => {
  if (!testUserId.value) {
    ElMessage.error('请输入用户ID')
    return
  }
  
  addLog(`开始测试删除用户: ${testUserId.value}`)
  addLog(`当前用户: ${authStore.user?.username} (${authStore.user?.role})`)
  addLog(`Token: ${authStore.token ? '存在' : '不存在'}`)
  addLog(`完整Token: ${authStore.token}`)
  addLog(`API Base URL: ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}`)
  
  try {
    addLog(`发送DELETE请求到: /api/users/${testUserId.value}`)
    addLog(`完整URL: ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/users/${testUserId.value}`)
    
    // 手动发送请求以获取更详细的信息
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/users/${testUserId.value}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    addLog(`响应状态: ${response.status} ${response.statusText}`)
    
    const responseText = await response.text()
    addLog(`响应内容: ${responseText}`)
    
    if (response.ok) {
      const data = JSON.parse(responseText)
      addLog(`删除成功: ${JSON.stringify(data)}`)
      ElMessage.success('删除成功')
    } else {
      const errorData = JSON.parse(responseText)
      addLog(`删除失败: ${JSON.stringify(errorData)}`)
      ElMessage.error(`删除失败: ${errorData.error || '未知错误'}`)
    }
  } catch (error: any) {
    addLog(`网络错误: ${error.message}`)
    addLog(`错误详情: ${JSON.stringify(error)}`)
    ElMessage.error(`删除失败: ${error.message}`)
  }
}
</script>

<style scoped>
.test-delete {
  padding: 20px;
}

.debug-info, .test-section, .logs {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.log-item {
  font-family: monospace;
  font-size: 12px;
  margin: 2px 0;
  padding: 2px 5px;
  background: #f5f5f5;
}
</style>