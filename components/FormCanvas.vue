<template>
  <section class="form-canvas" @dragover.prevent @drop.prevent="handleCanvasDrop">
    <div v-if="sortedFields.length === 0" class="empty-hint">拖拽字段到这里</div>
    <FieldItem v-for="field in rootFields" :key="field.id" :config="field" />
  </section>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import FieldItem from './FieldItem.vue'
import { useFormDesignerStore } from '../stores/formDesignerStore'
import type { DragData } from '../types/field'

const { addField, moveField, sortedFields } = useFormDesignerStore()

const globalDragState = {
  draggedFieldId: { value: null as string | null },
  activeDropTargetId: { value: null as string | null }
}

provide('globalDragState', globalDragState)

const rootFields = computed(() => {
  return sortedFields.value.filter((field) => !field.parentId)
})

const parseDragData = (event: DragEvent): DragData | null => {
  const raw = event.dataTransfer?.getData('application/json')
  if (!raw) return null
  try {
    return JSON.parse(raw) as DragData
  } catch (error) {
    return null
  }
}

const handleCanvasDrop = (event: DragEvent) => {
  const data = parseDragData(event)
  if (!data) return

  const insertIndex = rootFields.value.length
  const insertParentId = undefined

  if (data.source === 'toolbox') {
    addField(data.config, insertIndex, insertParentId)
  } else if (data.source === 'moveField') {
    moveField(data.config.id, insertIndex, insertParentId, data.config.parentId)
  }

  globalDragState.draggedFieldId.value = null
  globalDragState.activeDropTargetId.value = null
}
</script>

<style scoped lang="scss">
.form-canvas {
  flex: 1;
  padding: 24px;
  background: #f5f6f9;
  min-height: 100vh;
}

.empty-hint {
  border: 2px dashed #c9d1e1;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: #909399;
  background: #fff;
}
</style>
