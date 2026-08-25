import type { RouteLocationRaw } from 'vue-router'
import { FCM_NOTIFICATION_TYPES, type FcmNotificationData } from '@/domains/notification/types/fcm'

export function resolveNotificationRoute(data?: FcmNotificationData): RouteLocationRaw {
  if (data?.type === FCM_NOTIFICATION_TYPES.PERFORMANCE_DEADLINE || data?.target === 'REPORT') {
    return { name: 'report', query: { from: 'notification' } }
  }

  if (data?.type === FCM_NOTIFICATION_TYPES.TIME_BASED_BENEFIT || data?.target === 'MAP') {
    return { name: 'map', query: { from: 'notification' } }
  }

  return { name: 'home' }
}

export function resolveNotificationPath(data?: FcmNotificationData): string {
  if (data?.type === FCM_NOTIFICATION_TYPES.PERFORMANCE_DEADLINE || data?.target === 'REPORT') {
    return '/report?from=notification'
  }

  if (data?.type === FCM_NOTIFICATION_TYPES.TIME_BASED_BENEFIT || data?.target === 'MAP') {
    return '/map?from=notification'
  }

  return '/home'
}
