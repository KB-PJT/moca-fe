import type { CardIssuerId } from '@/domains/card/constants/cardIssuers'

export type CardConnectionFieldKey =
  | 'homepageId'
  | 'homepagePassword'
  | 'cardNumber'
  | 'cardPassword'
  | 'birthDate'

export interface CardConnectionField {
  key: CardConnectionFieldKey
  label: string
  placeholder: string
  inputType: 'text' | 'password'
  autocomplete: string
  numeric?: boolean
  maxLength?: number
  exactLength?: number
  format?: 'card-number'
  helperText?: string
}

export interface CardConnectionConfig {
  loginFields: readonly CardConnectionField[]
  additionalFields: readonly CardConnectionField[]
  additionalInputMode: 'none' | 'always'
}

const HOMEPAGE_LOGIN_FIELDS = [
  {
    key: 'homepageId',
    label: '홈페이지 ID',
    placeholder: '홈페이지 아이디를 입력해 주세요',
    inputType: 'text',
    autocomplete: 'username',
    maxLength: 50,
  },
  {
    key: 'homepagePassword',
    label: '홈페이지 비밀번호',
    placeholder: '홈페이지 비밀번호를 입력해 주세요',
    inputType: 'password',
    autocomplete: 'current-password',
    maxLength: 50,
  },
] as const satisfies readonly CardConnectionField[]

const CARD_NUMBER_FIELD = {
  key: 'cardNumber',
  label: '카드번호',
  placeholder: '카드번호 전체를 입력해 주세요',
  inputType: 'text',
  autocomplete: 'off',
  numeric: true,
  maxLength: 16,
  exactLength: 16,
  format: 'card-number',
  helperText: '16자리 카드번호를 입력해 주세요',
} as const satisfies CardConnectionField

const KB_CARD_PASSWORD_FIELD = {
  key: 'cardPassword',
  label: '카드 비밀번호 앞 2자리',
  placeholder: '2자리 입력',
  inputType: 'password',
  autocomplete: 'off',
  numeric: true,
  maxLength: 2,
  exactLength: 2,
  helperText: '카드 조회 확인에만 사용해요',
} as const satisfies CardConnectionField

const HYUNDAI_CARD_PASSWORD_FIELD = {
  key: 'cardPassword',
  label: '카드 비밀번호 4자리',
  placeholder: '4자리 입력',
  inputType: 'password',
  autocomplete: 'off',
  numeric: true,
  maxLength: 4,
  exactLength: 4,
} as const satisfies CardConnectionField

const BIRTH_DATE_FIELD = {
  key: 'birthDate',
  label: '생년월일',
  placeholder: 'YYYYMMDD',
  inputType: 'text',
  autocomplete: 'off',
  numeric: true,
  maxLength: 8,
  exactLength: 8,
  helperText: '생년월일 8자리를 입력해 주세요. 예: 19950101',
} as const satisfies CardConnectionField

export const CARD_CONNECTION_CONFIGS: Record<CardIssuerId, CardConnectionConfig> = {
  'kb-kookmin': {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [CARD_NUMBER_FIELD, KB_CARD_PASSWORD_FIELD],
    additionalInputMode: 'always',
  },
  hyundai: {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [CARD_NUMBER_FIELD, HYUNDAI_CARD_PASSWORD_FIELD],
    additionalInputMode: 'always',
  },
  woori: {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [BIRTH_DATE_FIELD],
    additionalInputMode: 'always',
  },
  samsung: {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [],
    additionalInputMode: 'none',
  },
  'nh-nonghyup': {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [],
    additionalInputMode: 'none',
  },
  'bc-baro': {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [],
    additionalInputMode: 'none',
  },
  shinhan: {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [],
    additionalInputMode: 'none',
  },
  lotte: {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [],
    additionalInputMode: 'none',
  },
  hana: {
    loginFields: HOMEPAGE_LOGIN_FIELDS,
    additionalFields: [],
    additionalInputMode: 'none',
  },
}
