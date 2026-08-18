import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { fetchMyCards, resolveCardAccessState } from '@/domains/card/api/cardManagement'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import { restoreInitialMocaSession } from '@/shared/api/client'
import { capturePageview } from '@/plugins/posthog'

// 지도/상세 라우트가 같은 컴포넌트 인스턴스를 재사용하도록 import를 하나로 공유한다.
const MapView = () => import('@/domains/map/views/MapView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/domains/auth/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/auth/callback',
      name: 'google-callback',
      component: () => import('@/domains/auth/views/GoogleCallbackView.vue'),
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/domains/auth/views/OnboardingView.vue'),
    },
    {
      path: '/cards',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'connect',
          name: 'card-connect',
          component: () => import('@/domains/card/views/CardConnectView.vue'),
        },
        {
          path: 'connect/all',
          name: 'card-bulk-connect',
          component: () => import('@/domains/card/views/CardBulkConnectView.vue'),
        },
        {
          path: 'connect/select',
          name: 'card-issuer-select',
          component: () => import('@/domains/card/views/CardIssuerSelectView.vue'),
        },
        {
          path: 'connect/select/:issuerId',
          name: 'card-issuer-connect',
          component: () => import('@/domains/card/views/CardIssuerConnectView.vue'),
        },
        {
          path: 'connect/select/:issuerId/progress',
          name: 'card-issuer-connect-progress',
          component: () => import('@/domains/card/views/CardIssuerLookupView.vue'),
        },
        {
          path: 'connect/select/:issuerId/cards',
          name: 'card-issuer-card-select',
          component: () => import('@/domains/card/views/CardIssuerCardSelectView.vue'),
        },
        {
          path: 'connect/select/:issuerId/sync',
          name: 'card-issuer-sync-progress',
          component: () => import('@/domains/card/views/CardIssuerSyncView.vue'),
        },
        {
          path: 'connect/select/:issuerId/complete',
          name: 'card-issuer-connect-complete',
          component: () => import('@/domains/card/views/CardIssuerConnectCompleteView.vue'),
        },
        {
          path: 'connect/progress',
          name: 'card-connect-progress',
          component: () => import('@/domains/card/views/CardConnectProgressView.vue'),
        },
        {
          path: 'connect/complete',
          name: 'card-connect-complete',
          component: () => import('@/domains/card/views/CardConnectCompleteView.vue'),
        },
        {
          path: 'manage',
          name: 'card-manage',
          component: () => import('@/domains/card/views/CardManageView.vue'),
          meta: { requiresActiveCard: true },
        },
        {
          path: ':id',
          name: 'card-detail',
          component: () => import('@/domains/card/views/CardDetailView.vue'),
          meta: { requiresActiveCard: true },
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/shared/components/TabLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/domains/home/views/HomeView.vue'),
          meta: { requiresActiveCard: true },
        },
        {
          path: 'home/benefits',
          name: 'home-benefits',
          component: () => import('@/domains/home/views/BenefitHistoryView.vue'),
          meta: { requiresActiveCard: true },
        },
        {
          path: 'map',
          name: 'map',
          component: MapView,
          meta: { requiresActiveCard: true },
        },
        {
          path: 'map/merchants/:placeId',
          name: 'merchant-detail',
          // 지도 화면과 완전히 같은 컴포넌트를 그대로 재사용한다.
          // (라우트가 바뀌어도 언마운트되지 않아야 상세 화면 전환 중에도 실제 지도가 계속 보인다.)
          component: MapView,
          meta: { requiresActiveCard: true },
        },
        {
          path: 'report',
          name: 'report',
          component: () => import('@/domains/benefit-report/views/ReportView.vue'),
          meta: { requiresActiveCard: true },
        },
        {
          path: 'mypage',
          name: 'mypage',
          component: () => import('@/domains/mypage/views/MypageView.vue'),
        },
        {
          path: 'mypage/profile',
          name: 'mypage-profile',
          component: () => import('@/domains/mypage/views/ProfileEditView.vue'),
        },
        {
          path: 'mypage/notifications',
          name: 'notification-settings',
          component: () => import('@/domains/notification/views/NotificationSettingsView.vue'),
        },
        {
          path: 'mypage/notices',
          name: 'mypage-notices',
          component: () => import('@/domains/mypage/views/NoticeView.vue'),
        },
        {
          path: 'mypage/inquiry',
          name: 'mypage-inquiry',
          component: () => import('@/domains/mypage/views/InquiryView.vue'),
        },
        {
          path: 'mypage/delete-account',
          name: 'mypage-delete-account',
          component: () => import('@/domains/mypage/views/DeleteAccountView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to, from) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)
  const guestOnly = to.matched.some((route) => route.meta.guestOnly)
  const requiresActiveCard = to.matched.some((route) => route.meta.requiresActiveCard)

  if (requiresAuth || guestOnly) {
    await restoreInitialMocaSession()
  }

  const { accessToken } = useAuthStore()

  if (requiresAuth && !accessToken) {
    sessionStorage.setItem('post_login_redirect', to.fullPath)

    return {
      name: 'login',
    }
  }

  if (guestOnly && accessToken) {
    return { name: 'home' }
  }

  const requiredCardFlow = Array.isArray(to.query.required)
    ? to.query.required[0]
    : to.query.required
  const previousRequiredCardFlow = Array.isArray(from.query.required)
    ? from.query.required[0]
    : from.query.required

  if (
    to.path.startsWith('/cards/connect') &&
    !requiredCardFlow &&
    (previousRequiredCardFlow === 'true' || previousRequiredCardFlow === 'activate')
  ) {
    return {
      path: to.path,
      query: { ...to.query, required: previousRequiredCardFlow },
      hash: to.hash,
      replace: true,
    }
  }

  if (requiresActiveCard && accessToken) {
    try {
      const response = await fetchMyCards()
      const cardAccessState = resolveCardAccessState(response)
      const cardManagementStore = useCardManagementStore()
      cardManagementStore.setCards(response)

      if (cardAccessState === 'none') {
        return {
          name: 'card-connect',
          query: { required: 'true' },
          replace: true,
        }
      }

      if (cardAccessState === 'inactive-only') {
        cardManagementStore.preserveCardsOnNextLoad()

        if (to.name === 'card-manage' && to.query.required === 'activate') return true

        return {
          name: 'card-manage',
          query: { required: 'activate' },
          replace: true,
        }
      }

      if (to.name === 'card-manage') {
        cardManagementStore.preserveCardsOnNextLoad()

        if (to.query.required === 'activate') {
          const { required: _, ...query } = to.query
          return { name: 'card-manage', query, replace: true }
        }
      }
    } catch {
      return true
    }
  }

  return true
})

router.afterEach((to) => {
  capturePageview(to.fullPath)
})

export default router
