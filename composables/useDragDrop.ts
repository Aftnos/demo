import type { DragData, FieldDefinition } from '../types/field'
import { isContainerType } from '../types/field'

export type DropPosition = 'before' | 'after' | 'inside' | 'none'

export const useDragDrop = (fields: FieldDefinition[]) => {
  const parseDragData = (event: DragEvent): DragData | null => {
    const raw = event.dataTransfer?.getData('application/json')
    if (!raw) return null
    try {
      return JSON.parse(raw) as DragData
    } catch (error) {
      return null
    }
  }

  const checkIsDescendant = (draggedId: string, targetId: string): boolean => {
    const children = fields.filter((field) => field.parentId === draggedId)
    for (const child of children) {
      if (child.id === targetId) return true
      if (checkIsDescendant(child.id, targetId)) return true
    }
    return false
  }

  const getDropPosition = (
    event: DragEvent,
    target: HTMLElement,
    targetType: string
  ): DropPosition => {
    const rect = target.getBoundingClientRect()
    const offset = event.clientY - rect.top
    const height = rect.height

    if (isContainerType(targetType)) {
      if (offset <= height * 0.25) return 'before'
      if (offset >= height * 0.75) return 'after'
      return 'inside'
    }

    return offset <= height / 2 ? 'before' : 'after'
  }

  return {
    parseDragData,
    checkIsDescendant,
    getDropPosition
  }
}
