<template>
  <aside class="field-toolbox">
    <h3>字段工具箱</h3>
    <div class="tool-list">
      <div
        v-for="field in fields"
        :key="field.type"
        class="tool-item"
        draggable="true"
        @dragstart="handleDragStart($event, field)"
      >
        {{ field.label }}
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { FieldToolConfig } from '../types/field'

const fields: FieldToolConfig[] = [
  { type: 'text', label: '文本', defaultConfig: { type: 'text', label: '文本' } },
  { type: 'number', label: '数字', defaultConfig: { type: 'number', label: '数字' } },
  { type: 'container', label: '容器', defaultConfig: { type: 'container', label: '容器' } },
  { type: 'group-header', label: '分组', defaultConfig: { type: 'group-header', label: '分组' } },
  { type: 'payment', label: '付款', defaultConfig: { type: 'payment', label: '付款' } },
  { type: 'receipt', label: '收据', defaultConfig: { type: 'receipt', label: '收据' } }
]

const handleDragStart = (event: DragEvent, config: FieldToolConfig) => {
  if (!event.dataTransfer) return
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      source: 'toolbox',
      fieldType: config.type,
      config: {
        ...config.defaultConfig,
        id: '',
        order: 0,
        parentId: null
      }
    })
  )
}
</script>

<style scoped lang="scss">
.field-toolbox {
  width: 220px;
  padding: 16px;
  border-right: 1px solid #e2e6ed;
  background: #f8f9fb;
}

.tool-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.tool-item {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #dde3ec;
  border-radius: 8px;
  cursor: grab;
}

.tool-item:active {
  cursor: grabbing;
}
</style>
