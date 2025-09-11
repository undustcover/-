<template>
  <TaskCreateDialog
    v-model="visible"
    :task="task"
    :is-edit="true"
    @success="handleSuccess"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TaskCreateDialog from './TaskCreateDialog.vue'
import type { Task } from '@/types/task'

// Props
interface Props {
  modelValue: boolean
  task?: Task | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  task: null
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success', task: Task): void
}

const emit = defineEmits<Emits>()

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 处理成功事件
const handleSuccess = (task: Task) => {
  emit('success', task)
}
</script>

<style scoped>
/* 使用TaskCreateDialog的样式 */
</style>