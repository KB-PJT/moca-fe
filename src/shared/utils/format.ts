/**
 * MOCA 공통 포맷터
 *
 * 화면에 값을 표시할 때는 반드시 이 함수들을 거친다.
 * 컴포넌트 안에서 toLocaleString() 등을 직접 쓰지 않는다.
 */

/* ------------------------------------------------------------------
 * 금액
 * ------------------------------------------------------------------ */

/**
 * 숫자에 천 단위 쉼표를 넣는다. 단위는 붙이지 않는다.
 *
 * formatAmount(38200)  // "38,200"
 * formatAmount(0)      // "0"
 */
export function formatAmount(value: number): string {
  // toLocaleString은 브라우저 로케일에 따라 결과가 달라질 수 있어
  // 'ko-KR'을 명시해 어디서든 같은 결과가 나오게 한다.
  return value.toLocaleString('ko-KR')
}

/**
 * 금액에 "원"을 붙인다.
 *
 * formatAmountWithUnit(38200)  // "38,200원"
 */
export function formatAmountWithUnit(value: number): string {
  return `${formatAmount(value)}원`
}

/**
 * 부호를 포함한 금액. 거래 내역·혜택 표시에 쓴다.
 *
 * formatSignedAmount(-6200)  // "-6,200원"
 * formatSignedAmount(3000)   // "+3,000원"
 * formatSignedAmount(0)      // "0원"
 */
export function formatSignedAmount(value: number): string {
  // 0은 부호를 붙이지 않는다.
  if (value === 0) {
    return '0원'
  }

  // 음수는 formatAmount가 이미 "-"를 포함하므로 그대로 두고,
  // 양수일 때만 "+"를 앞에 붙인다.
  const sign = value > 0 ? '+' : ''

  return `${sign}${formatAmount(value)}원`
}

/**
 * 포인트 표시.
 *
 * formatPoint(1240)   // "1,240P"
 * formatPoint(-380)   // "-380P"
 */
export function formatPoint(value: number): string {
  return `${formatAmount(value)}P`
}

/**
 * 실적 게이지처럼 좁은 공간에 금액을 표시할 때 쓰는 축약형.
 * 만원 미만은 원 단위 그대로, 이상은 "만원" 단위로 반올림한다.
 *
 * formatCompactAmount(8000)     // "8,000원"
 * formatCompactAmount(250000)   // "25만원"
 */
export function formatCompactAmount(amount: number): string {
  if (amount < 10_000) return formatAmountWithUnit(amount)
  return `${Math.round(amount / 10_000)}만원`
}

/* ------------------------------------------------------------------
 * 비율
 * ------------------------------------------------------------------ */

/**
 * 퍼센트 표시. 소수점은 기본으로 버린다.
 *
 * formatPercent(10)        // "10%"
 * formatPercent(12.5, 1)   // "12.5%"
 */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`
}

/**
 * 실적 달성률을 계산해 퍼센트 문자열로 반환한다.
 * 100%를 넘어도 그대로 표시한다(초과 달성 표현용).
 *
 * formatAchievementRate(210000, 300000)  // "70%"
 * formatAchievementRate(50000, 0)        // "0%"  (0 나누기 방지)
 */
export function formatAchievementRate(current: number, required: number): string {
  // 실적 조건이 없는 카드(required = 0)는 나눗셈이 불가능하므로 0으로 처리한다.
  if (required <= 0) {
    return '0%'
  }

  return formatPercent(Math.floor((current / required) * 100))
}

/* ------------------------------------------------------------------
 * 카드번호
 * ------------------------------------------------------------------ */

/**
 * 뒤 4자리만 노출하는 짧은 형식.
 *
 * formatCardNumber('4321')  // "•••• 4321"
 */
export function formatCardNumber(last4: string): string {
  return `•••• ${last4}`
}

/**
 * 앞 4자리 + 뒤 4자리를 노출하는 카드관리 화면용 형식.
 * formatMaskedCardNumber('1234', '5678')  // "1234-****-****-5678"
 */
export function formatMaskedCardNumber(first4: string, last4: string): string {
  return `${first4}-****-****-${last4}`
}

/* ------------------------------------------------------------------
 * 거리
 * ------------------------------------------------------------------ */

/**
 * 미터 단위 거리를 사람이 읽기 좋은 형태로 바꾼다.
 *
 * formatDistance(320)   // "320m"
 * formatDistance(1200)  // "1.2km"
 */
export function formatDistance(meters: number): string {
  // 1km 미만은 미터 단위로, 소수점 없이 표시한다.
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }

  // 1km 이상은 소수점 첫째 자리까지만 표시한다.
  const km = meters / 1000

  return `${km.toFixed(1)}km`
}

/* ------------------------------------------------------------------
 * 날짜·시간
 * ------------------------------------------------------------------ */

export type DatePattern =
  | 'YYYY.MM.DD' // 2025.06.28
  | 'YYYY.MM.DD HH:mm' // 2025.06.28 14:30
  | 'M월 D일' // 6월 28일
  | 'YYYY년 M월' // 2025년 6월

/**
 * ISO 문자열을 지정한 패턴으로 변환한다.
 *
 * formatDate('2025-06-28T14:30:00Z', 'YYYY.MM.DD')  // "2025.06.28"
 */
export function formatDate(iso: string, pattern: DatePattern = 'YYYY.MM.DD'): string {
  const date = new Date(iso)

  // 잘못된 값이 들어오면 화면이 "Invalid Date"로 깨지므로 빈 문자열을 반환한다.
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth()는 0부터 시작
  const day = date.getDate()

  // 2자리로 맞추는 헬퍼. 6 → "06"
  const pad = (n: number) => String(n).padStart(2, '0')

  switch (pattern) {
    case 'YYYY.MM.DD':
      return `${year}.${pad(month)}.${pad(day)}`

    case 'YYYY.MM.DD HH:mm':
      return `${year}.${pad(month)}.${pad(day)} ${pad(date.getHours())}:${pad(date.getMinutes())}`

    case 'M월 D일':
      return `${month}월 ${day}일`

    case 'YYYY년 M월':
      return `${year}년 ${month}월`

    default:
      return `${year}.${pad(month)}.${pad(day)}`
  }
}

/**
 * "2025-06" 형식의 조회 기준월을 화면용으로 바꾼다.
 * API의 period_ym 값을 그대로 넣으면 된다.
 *
 * formatPeriodMonth('2025-06')  // "2025년 6월"
 */
export function formatPeriodMonth(periodYm: string): string {
  const [year, month] = periodYm.split('-')

  // 형식이 예상과 다르면 원본을 그대로 돌려준다.
  if (!year || !month) {
    return periodYm
  }

  return `${year}년 ${Number(month)}월`
}

/**
 * 마지막 동기화 시각 등을 상대 시간으로 표시한다.
 *
 * formatRelativeTime(30초 전)   // "방금 전"
 * formatRelativeTime(5분 전)    // "5분 전"
 * formatRelativeTime(3일 전)    // "2025.06.25"
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  // 현재 시각과의 차이를 초 단위로 구한다.
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffSeconds < 60) {
    return '방금 전'
  }

  if (diffSeconds < 60 * 60) {
    return `${Math.floor(diffSeconds / 60)}분 전`
  }

  if (diffSeconds < 60 * 60 * 24) {
    return `${Math.floor(diffSeconds / 3600)}시간 전`
  }

  // 하루가 넘으면 상대 시간 대신 날짜를 그대로 보여주는 편이 명확하다.
  return formatDate(iso, 'YYYY.MM.DD')
}
