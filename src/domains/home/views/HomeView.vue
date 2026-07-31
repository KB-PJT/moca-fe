<script setup lang="ts">
import PageLayout from '@/shared/components/PageLayout.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
</script>

<template>
  <PageLayout title="홈" :show-back="false" has-bottom-bar>
    <SectionCard title="이번 달 혜택">
      <template #action>
        <RouterLink to="/report" class="text-caption text-primary">전체보기</RouterLink>
      </template>

      <p class="text-display text-charcoal">38,200원</p>
      <p class="text-body text-gray">2025.06.28 · 카드 결제</p>
    </SectionCard>

    <SectionCard title="내 카드" flush>
      <EmptyState
        title="아직 등록된 카드가 없어요"
        description="카드를 연결하면 혜택과 실적을 볼 수 있어요"
        action-label="카드 연결하기"
      />
    </SectionCard>

    <SectionCard title="버튼 예시">
      <div class="flex flex-col gap-2">
        <MocaButton block>연결 시작하기</MocaButton>
        <MocaButton variant="secondary" block>나중에 하기</MocaButton>
        <MocaButton variant="ghost" block>더보기</MocaButton>
        <MocaButton block disabled>비활성 버튼</MocaButton>
        <MocaButton block loading>불러오는 중</MocaButton>
      </div>
    </SectionCard>
  </PageLayout>
</template>
