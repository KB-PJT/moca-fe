export type ConditionStatus = 'met' | 'unmet' | 'na'

export interface ConditionItem {
  key: string
  title: string
  description?: string
  status: ConditionStatus
}
