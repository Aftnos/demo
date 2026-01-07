<template>
  <div
    class="field-item"
    :class="{
      dragging: isCurrentlyDragging,
      'drop-before': showBeforeLine,
      'drop-after': dropPosition === 'after',
      'drop-inside': dropPosition === 'inside'
    }"
  >
    <div
      class="field-box"
      :data-order="config.order"
      :data-parent-id="parentIdForChildren"
      :data-real-parent-id="config.parentId ?? undefined"
      :data-type="config.type"
      :data-id="config.id"
      :data-drop-position="dropPosition"
      :draggable="isDraggingEnabled"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
    >
      <div class="field-header">
        <span class="field-title">{{ config.label }}</span>
        <span
          class="drag-handle"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
        >
          ↕
        </span>
      </div>
      <div v-if="dropPosition !== 'none'" class="drop-hint">
        <span v-if="dropPosition === 'before'" class="hint before">↑ 上方</span>
        <span v-else-if="dropPosition === 'after'" class="hint after">↓ 下方</span>
        <span v-else class="hint inside">⇢ 容器内部</span>
      </div>
    </div>

    <div v-if="isContainer" class="children">
      <FieldItem v-for="child in children" :key="child.id" :config="child" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { DropPosition } from '../composables/useDragDrop'
import { useDragDrop } from '../composables/useDragDrop'
import { useFormDesignerStore } from '../stores/formDesignerStore'
import type { FieldDefinition } from '../types/field'
import { isContainerType } from '../types/field'

type GlobalDragState = {
  draggedFieldId: { value: string | null }
  activeDropTargetId: { value: string | null }
}

const props = defineProps<{ config: FieldDefinition }>()

const { fields, addField, moveField } = useFormDesignerStore()
const { parseDragData, checkIsDescendant, getDropPosition } = useDragDrop(fields.value)

const globalDragState = inject<GlobalDragState>('globalDragState')

const dropPosition = ref<DropPosition>('none')
const isDraggingEnabled = ref(false)

const isContainer = computed(() => isContainerType(props.config.type))
const isCurrentlyDragging = computed(
  () => globalDragState?.draggedFieldId.value === props.config.id
)
const showBeforeLine = computed(
  () => dropPosition.value === 'before' && props.config.order === 0
)

const children = computed(() => {
  return fields.value
    .filter((field) => field.parentId === props.config.id)
    .sort((a, b) => a.order - b.order)
})

const parentIdForChildren = computed(() => props.config.id)

const handleMouseDown = () => {
  isDraggingEnabled.value = true
}

const handleMouseUp = () => {
  isDraggingEnabled.value = false
}

const handleDragStart = (event: DragEvent) => {
  if (!isDraggingEnabled.value || !event.dataTransfer) return
  globalDragState?.draggedFieldId.value = props.config.id
  event.dataTransfer.setData(
    'application/json',
    JSON.stringify({
      source: 'moveField',
      fieldType: props.config.type,
      config: {
        ...props.config,
        defaultConfig: props.config
      }
    })
  )
  event.dataTransfer.effectAllowed = 'move'
}

const handleDragEnd = () => {
  isDraggingEnabled.value = false
  if (globalDragState) {
    globalDragState.draggedFieldId.value = null
    globalDragState.activeDropTargetId.value = null
  }
}

const isInvalidMove = (position: DropPosition, dragged: FieldDefinition): boolean => {
  if (position === 'none' || position === 'inside') return false
  const sameParent = (dragged.parentId ?? null) === (props.config.parentId ?? null)

  if (position === 'before' && sameParent && dragged.order === 0) return true
  if (position === 'after' && sameParent && dragged.order === props.config.order + 1) return true
  return false
}

const handleDragOver = (event: DragEvent) => {
  if (!event.dataTransfer) return
  const data = parseDragData(event)
  if (!data) return
  if (data.config.id === props.config.id) return
  if (checkIsDescendant(data.config.id, props.config.id)) return

  const target = event.currentTarget as HTMLElement
  const position = getDropPosition(event, target, props.config.type)
  if (isInvalidMove(position, data.config)) {
    dropPosition.value = 'none'
    return
  }

  dropPosition.value = position
  if (globalDragState) {
    globalDragState.activeDropTargetId.value = props.config.id
  }
}

const handleDragLeave = () => {
  dropPosition.value = 'none'
}

const handleDrop = (event: DragEvent) => {
  const data = parseDragData(event)
  if (!data) return

  const source = data.source
  const config = data.config

  if (dropPosition.value === 'inside' && isContainer.value) {
    const insertParentId = props.config.id
    const insertIndex = fields.value.filter((field) => field.parentId === insertParentId).length

    if (source === 'toolbox') {
      addField(config, insertIndex, insertParentId)
    } else if (source === 'moveField') {
      moveField(config.id, insertIndex, insertParentId, config.parentId)
    }
  } else if (dropPosition.value === 'before' || dropPosition.value === 'after') {
    const insertIndex = dropPosition.value === 'before' ? props.config.order : props.config.order + 1
    const insertParentId = props.config.parentId ?? undefined

    if (source === 'toolbox') {
      addField(config, insertIndex, insertParentId)
    } else if (source === 'moveField') {
      moveField(config.id, insertIndex, insertParentId, config.parentId)
    }
  }

  dropPosition.value = 'none'
  if (globalDragState) {
    globalDragState.draggedFieldId.value = null
    globalDragState.activeDropTargetId.value = null
  }
}

watch(
  () => globalDragState?.activeDropTargetId.value,
  (newTargetId) => {
    if (newTargetId && newTargetId !== props.config.id && dropPosition.value !== 'none') {
      dropPosition.value = 'none'
    }
  }
)
</script>

<style scoped lang="scss">
.field-item {
  margin-bottom: 12px;
}

.field-box {
  border: 1px solid #e2e6ed;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  position: relative;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drag-handle {
  cursor: grab;
  font-size: 18px;
  padding: 4px;
}

.drag-handle:active {
  cursor: grabbing;
}

.dragging .field-box {
  opacity: 0.5;
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.drop-before .field-box::before,
.drop-after .field-box::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  animation: pulse 1.5s infinite;
}

.drop-before .field-box::before {
  top: 0;
  background: #2ecc71;
}

.drop-after .field-box::after {
  bottom: 0;
  background: #3498db;
}

.drop-inside .field-box {
  background: var(--el-color-primary-light-9, #edf5ff);
  border: 2px dashed var(--el-color-primary, #409eff);
}

.drop-hint {
  margin-top: 8px;
}

.hint {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.hint.before {
  background: #2ecc71;
}

.hint.after {
  background: #3498db;
}

.hint.inside {
  background: #909399;
}

.children {
  margin-top: 8px;
  padding-left: 16px;
  border-left: 2px dashed #d9dee7;
}

@keyframes pulse {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}
</style>
