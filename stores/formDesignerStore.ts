import { computed, ref } from 'vue'
import type { FieldDefinition } from '../types/field'

const fields = ref<FieldDefinition[]>([])

const sortedFields = computed(() => {
  return [...fields.value].sort((a, b) => a.order - b.order)
})

const reorderSiblings = (parentId?: string | null) => {
  const siblings = fields.value
    .filter((field) => (field.parentId ?? null) === (parentId ?? null))
    .sort((a, b) => a.order - b.order)

  siblings.forEach((field, index) => {
    field.order = index
  })
}

const createId = () => `field_${Math.random().toString(36).slice(2, 10)}`

const addField = (config: FieldDefinition, insertIndex: number, parentId?: string | null) => {
  const field: FieldDefinition = {
    ...config,
    id: createId(),
    parentId: parentId ?? null,
    order: insertIndex
  }

  fields.value.push(field)
  reorderSiblings(parentId ?? null)
}

const moveField = (
  fieldId: string,
  insertIndex: number,
  targetParentId?: string | null,
  previousParentId?: string | null
) => {
  const field = fields.value.find((item) => item.id === fieldId)
  if (!field) return

  field.parentId = targetParentId ?? null
  field.order = insertIndex

  reorderSiblings(targetParentId ?? null)
  if ((targetParentId ?? null) !== (previousParentId ?? null)) {
    reorderSiblings(previousParentId ?? null)
  }
}

export const useFormDesignerStore = () => {
  return {
    fields,
    sortedFields,
    addField,
    moveField
  }
}
