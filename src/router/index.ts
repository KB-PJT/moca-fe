import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { restoreInitialMocaSession } from '@/shared/api/client'

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
        },
        {
          path: ':id',
          name: 'card-detail',
          component: () => import('@/domains/card/views/CardDetailView.vue'),
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
        },
        {
          path: 'home/benefits',
          name: 'home-benefits',
          component: () => import('@/domains/home/views/BenefitHistoryView.vue'),
        },
        {
          path: 'map',
          name: 'map',
          component: MapView,
        },
        {
          path: 'map/merchants/:placeId',
          name: 'merchant-detail',
          // 지도 화면과 완전히 같은 컴포넌트를 그대로 재사용한다.
          // (라우트가 바뀌어도 언마운트되지 않아야 상세 화면 전환 중에도 실제 지도가 계속 보인다.)
          component: MapView,
        },
        {
          path: 'report',
          name: 'report',
          component: () => import('@/domains/benefit-report/views/ReportView.vue'),
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
          path: 'mypage/faq',
          name: 'faq',
          component: () => import('@/domains/mypage/views/FaqView.vue'),
        },
        {
          path: 'mypage/inquiry',
          name: 'mypage-inquiry',
          component: () => import('@/domains/mypage/views/InquiryView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth)
  const guestOnly = to.matched.some((route) => route.meta.guestOnly)

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

  return true
})

export default router
