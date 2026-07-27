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
      path: '/cards/connect',
      name: 'card-connect',
      component: () => import('@/domains/card/views/CardConnectView.vue'),
    },
    {
      path: '/cards/manage',
      name: 'card-manage',
      component: () => import('@/domains/card/views/CardManageView.vue'),
    },
    {
      path: '/cards/:id',
      name: 'card-detail',
      component: () => import('@/domains/card/views/CardDetailView.vue'),
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
