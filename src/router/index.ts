import { createRouter, createWebHistory } from 'vue-router'

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
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/domains/auth/views/OnboardingView.vue'),
    },
    {
      path: '/cards',
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
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/domains/home/views/HomeView.vue'),
        },
        {
          path: 'map',
          name: 'map',
          component: () => import('@/domains/map/views/MapView.vue'),
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
      ],
    },
  ],
})

export default router
