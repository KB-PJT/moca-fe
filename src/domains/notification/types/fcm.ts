export const FCM_NOTIFICATION_TYPES = {
  PERFORMANCE_DEADLINE: 'PERFORMANCE_DEADLINE',
  TIME_BASED_BENEFIT: 'TIME_BASED_BENEFIT',
} as const

export type FcmNotificationType =
  (typeof FCM_NOTIFICATION_TYPES)[keyof typeof FCM_NOTIFICATION_TYPES]

export interface FcmNotificationData {
  type?: string
  userCardId?: string
  target?: string
  title?: string
  body?: string
  [key: string]: string | undefined
}

export interface FcmServiceWorkerMessage {
  type: 'FCM_NOTIFICATION_CLICK'
  data?: FcmNotificationData
}
