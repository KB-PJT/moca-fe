<script setup lang="ts">
import bcLogoFill from '@/assets/issuer-logos/bc-fill.svg'
import bcLogo from '@/assets/issuer-logos/bc.svg'
import hanaLogoFill from '@/assets/issuer-logos/hana-fill.svg'
import hanaLogo from '@/assets/issuer-logos/hana.svg'
import hyundaiLogoFill from '@/assets/issuer-logos/hyundai-fill.svg'
import hyundaiLogo from '@/assets/issuer-logos/hyundai.svg'
import kbLogoFill from '@/assets/issuer-logos/kb-fill.svg'
import kbLogo from '@/assets/issuer-logos/kb.svg'
import lotteLogoFill from '@/assets/issuer-logos/lotte-fill.svg'
import lotteLogo from '@/assets/issuer-logos/lotte.svg'
import nhNonghyupLogoFill from '@/assets/issuer-logos/nh-nonghyup-fill.svg'
import nhNonghyupLogo from '@/assets/issuer-logos/nh-nonghyup.svg'
import samsungLogoFill from '@/assets/issuer-logos/samsung-fill.svg'
import samsungLogo from '@/assets/issuer-logos/samsung.svg'
import shinhanLogoFill from '@/assets/issuer-logos/shinhan-fill.svg'
import shinhanLogo from '@/assets/issuer-logos/shinhan.svg'
import wooriLogoFill from '@/assets/issuer-logos/woori-fill.svg'
import wooriLogo from '@/assets/issuer-logos/woori.svg'

const issuerLogos = {
  'bc-baro': { default: bcLogo, fill: bcLogoFill },
  'kb-kookmin': { default: kbLogo, fill: kbLogoFill },
  'nh-nonghyup': { default: nhNonghyupLogo, fill: nhNonghyupLogoFill },
  lotte: { default: lotteLogo, fill: lotteLogoFill },
  samsung: { default: samsungLogo, fill: samsungLogoFill },
  shinhan: { default: shinhanLogo, fill: shinhanLogoFill },
  woori: { default: wooriLogo, fill: wooriLogoFill },
  hana: { default: hanaLogo, fill: hanaLogoFill },
  hyundai: { default: hyundaiLogo, fill: hyundaiLogoFill },
} as const

withDefaults(
  defineProps<{
    issuer: keyof typeof issuerLogos
    variant?: 'default' | 'fill'
  }>(),
  {
    variant: 'default',
  },
)
</script>

<template>
  <span class="flex size-10 items-center justify-center" aria-hidden="true">
    <img :src="issuerLogos[issuer][variant]" alt="" class="size-10 object-contain" />
  </span>
</template>
