import bcLogoFill from '@/domains/card/assets/issuer-logos/bc-fill.svg'
import bcLogo from '@/domains/card/assets/issuer-logos/bc.svg'
import hanaLogoFill from '@/domains/card/assets/issuer-logos/hana-fill.svg'
import hanaLogo from '@/domains/card/assets/issuer-logos/hana.svg'
import hyundaiLogoFill from '@/domains/card/assets/issuer-logos/hyundai-fill.svg'
import hyundaiLogo from '@/domains/card/assets/issuer-logos/hyundai.svg'
import kbLogoFill from '@/domains/card/assets/issuer-logos/kb-fill.svg'
import kbLogo from '@/domains/card/assets/issuer-logos/kb.svg'
import lotteLogoFill from '@/domains/card/assets/issuer-logos/lotte-fill.svg'
import lotteLogo from '@/domains/card/assets/issuer-logos/lotte.svg'
import nhNonghyupLogoFill from '@/domains/card/assets/issuer-logos/nh-nonghyup-fill.svg'
import nhNonghyupLogo from '@/domains/card/assets/issuer-logos/nh-nonghyup.svg'
import samsungLogoFill from '@/domains/card/assets/issuer-logos/samsung-fill.svg'
import samsungLogo from '@/domains/card/assets/issuer-logos/samsung.svg'
import shinhanLogoFill from '@/domains/card/assets/issuer-logos/shinhan-fill.svg'
import shinhanLogo from '@/domains/card/assets/issuer-logos/shinhan.svg'
import wooriLogoFill from '@/domains/card/assets/issuer-logos/woori-fill.svg'
import wooriLogo from '@/domains/card/assets/issuer-logos/woori.svg'

export const CARD_ISSUERS = {
  'bc-baro': {
    id: 'bc-baro',
    name: 'BC 바로카드',
    institutionCode: '0305',
    logos: { default: bcLogo, fill: bcLogoFill },
  },
  'kb-kookmin': {
    id: 'kb-kookmin',
    name: 'KB국민카드',
    institutionCode: '0301',
    logos: { default: kbLogo, fill: kbLogoFill },
  },
  'nh-nonghyup': {
    id: 'nh-nonghyup',
    name: 'NH농협카드',
    institutionCode: '0304',
    logos: { default: nhNonghyupLogo, fill: nhNonghyupLogoFill },
  },
  lotte: {
    id: 'lotte',
    name: '롯데카드',
    institutionCode: '0311',
    logos: { default: lotteLogo, fill: lotteLogoFill },
  },
  samsung: {
    id: 'samsung',
    name: '삼성카드',
    institutionCode: '0303',
    logos: { default: samsungLogo, fill: samsungLogoFill },
  },
  shinhan: {
    id: 'shinhan',
    name: '신한카드',
    institutionCode: '0306',
    logos: { default: shinhanLogo, fill: shinhanLogoFill },
  },
  woori: {
    id: 'woori',
    name: '우리카드',
    institutionCode: '0309',
    logos: { default: wooriLogo, fill: wooriLogoFill },
  },
  hana: {
    id: 'hana',
    name: '하나카드',
    institutionCode: '0313',
    logos: { default: hanaLogo, fill: hanaLogoFill },
  },
  hyundai: {
    id: 'hyundai',
    name: '현대카드',
    institutionCode: '0302',
    logos: { default: hyundaiLogo, fill: hyundaiLogoFill },
  },
} as const

export type CardIssuerId = keyof typeof CARD_ISSUERS

export function isCardIssuerId(value: string): value is CardIssuerId {
  return Object.prototype.hasOwnProperty.call(CARD_ISSUERS, value)
}

export const CARD_ISSUER_LIST = Object.values(CARD_ISSUERS)

export const CARD_ISSUER_SELECTION_LIST = [
  CARD_ISSUERS['kb-kookmin'],
  CARD_ISSUERS.hyundai,
  CARD_ISSUERS.shinhan,
  CARD_ISSUERS['nh-nonghyup'],
  CARD_ISSUERS.samsung,
  CARD_ISSUERS.woori,
  CARD_ISSUERS.hana,
  CARD_ISSUERS.lotte,
  CARD_ISSUERS['bc-baro'],
] as const
