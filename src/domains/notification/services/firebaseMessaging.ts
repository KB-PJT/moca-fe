import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Messaging,
} from 'firebase/messaging'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { registerFcmToken } from '@/domains/notification/api/fcm'

const firebaseOptions: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function hasFirebaseConfig(): boolean {
  return Boolean(
    firebaseOptions.apiKey &&
    firebaseOptions.projectId &&
    firebaseOptions.messagingSenderId &&
    firebaseOptions.appId &&
    import.meta.env.VITE_FIREBASE_VAPID_KEY,
  )
}

let messagingPromise: Promise<Messaging | null> | undefined

async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!hasFirebaseConfig() || typeof window === 'undefined' || !(await isSupported())) return null

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions)
  return getMessaging(app)
}

function resolveMessaging(): Promise<Messaging | null> {
  messagingPromise ??= getFirebaseMessaging()
  return messagingPromise
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

export function isPushNotificationConfigured(): boolean {
  return hasFirebaseConfig()
}

export async function getCurrentFcmToken(): Promise<string | null> {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null

  const [messaging, serviceWorkerRegistration] = await Promise.all([
    resolveMessaging(),
    getServiceWorkerRegistration(),
  ])
  if (!messaging || !serviceWorkerRegistration) return null

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  })
  return token || null
}

export async function synchronizeFcmToken(
  expectedAccessToken = useAuthStore().accessToken,
): Promise<string | null> {
  const token = await getCurrentFcmToken()
  if (!token) return null
  if (!expectedAccessToken || useAuthStore().accessToken !== expectedAccessToken) return null

  await registerFcmToken(token)
  return token
}

export async function requestAndRegisterPushNotifications(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'

  const permission = await Notification.requestPermission()
  if (permission === 'granted') await synchronizeFcmToken()
  return permission
}

export async function removeFcmToken(): Promise<void> {
  const messaging = await resolveMessaging()
  if (messaging) await deleteToken(messaging)
}

export async function listenForForegroundMessages(
  listener: (payload: MessagePayload) => void,
): Promise<(() => void) | null> {
  const messaging = await resolveMessaging()
  return messaging ? onMessage(messaging, listener) : null
}
