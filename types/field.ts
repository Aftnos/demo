export interface FieldDefinition {
  id: string
  type: string
  label: string
  order: number
  parentId?: string | null
  children?: FieldDefinition[]
}

export interface FieldToolConfig {
  type: string
  label: string
  defaultConfig: Omit<FieldDefinition, 'id' | 'order' | 'parentId'>
}

export interface DragData {
  source: 'toolbox' | 'moveField'
  fieldType: string
  config: FieldDefinition
}

export const containerTypes = new Set(['group-header', 'container', 'payment', 'receipt'])

export const isContainerType = (type: string): boolean => containerTypes.has(type)
