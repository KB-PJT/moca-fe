import {
  cuLogoDataUrl,
  emartLogoDataUrl,
  gs25LogoDataUrl,
  sevenLogoDataUrl,
} from '@/domains/map/assets/logos/convenience-store/logoDataUrls'
import {
  croissantLogoDataUrl,
  parisLogoDataUrl,
  touslesLogoDataUrl,
} from '@/domains/map/assets/logos/bakery/logoDataUrls'
import { oliveLogoDataUrl } from '@/domains/map/assets/logos/beauty/logoDataUrls'
import { kyoboLogoDataUrl } from '@/domains/map/assets/logos/bookstore/logoDataUrls'
import {
  beanLogoDataUrl,
  ediyaLogoDataUrl,
  mgcLogoDataUrl,
  paulLogoDataUrl,
  starbucksLogoDataUrl,
  twosomeLogoDataUrl,
} from '@/domains/map/assets/logos/cafe/logoDataUrls'
import {
  hyundaiLogoDataUrl,
  lotteDLogoDataUrl,
  shinLogoDataUrl,
} from '@/domains/map/assets/logos/department-store/logoDataUrls'
import {
  burgerkingLogoDataUrl,
  kfcLogoDataUrl,
  lotteriaLogoDataUrl,
  mcdonaldLogoDataUrl,
} from '@/domains/map/assets/logos/fast-food/logoDataUrls'
import { outbackLogoDataUrl, vipsLogoDataUrl } from '@/domains/map/assets/logos/food/logoDataUrls'
import { gsLogoDataUrl, skLogoDataUrl } from '@/domains/map/assets/logos/gas-station/logoDataUrls'
import {
  // mart 폴더에도 이마트(대형마트) 로고가 emart.png로 있어, 편의점의 이마트24 로고(emartLogoDataUrl)와
  // export 이름이 겹친다. 서로 다른 브랜드라 별칭을 줘서 구분한다.
  emartLogoDataUrl as emartMartLogoDataUrl,
  hanaroLogoDataUrl,
  homeplusLogoDataUrl,
  lotteLogoDataUrl,
} from '@/domains/map/assets/logos/mart/logoDataUrls'
import {
  cgvLogoDataUrl,
  lotteCLogoDataUrl,
  megaLogoDataUrl,
} from '@/domains/map/assets/logos/movie/logoDataUrls'
import {
  everLogoDataUrl,
  lotteWLogoDataUrl,
  seoulLogoDataUrl,
} from '@/domains/map/assets/logos/theme-park/logoDataUrls'

const DOT_COLOR = '#ef4444'
const CURRENT_LOCATION_COLOR = '#3b82f6'

// 카테고리는 API에서 동적으로 내려오므로, 매핑에 없는 값은 DEFAULT_ICON으로 대체한다.
const DEFAULT_ICON = '<circle cx="12" cy="12" r="8"/>'

const categoryIcon: Record<string, string> = {
  음식점:
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  카페: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  편의점:
    '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
  대형마트:
    '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  도서: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
  주유: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  패스트푸드:
    '<path d="M12 16H4a2 2 0 1 1 0-4h16a2 2 0 1 1 0 4h-4.25"/><path d="M5 12a2 2 0 0 1-2-2 9 7 0 0 1 18 0 2 2 0 0 1-2 2"/><path d="M5 16a2 2 0 0 0-2 2 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 2 2 0 0 0-2-2q0 0 0 0"/><path d="m6.67 12 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"/>',
  뷰티: '<path d="m11 10 3 3"/><path d="M6.5 21A3.5 3.5 0 1 0 3 17.5a2.62 2.62 0 0 1-.708 1.792A1 1 0 0 0 3 21z"/><path d="M9.969 17.031 21.378 5.624a1 1 0 0 0-3.002-3.002L6.967 14.031"/>',
  드럭스토어:
    '<path d="M3 3h.01"/><path d="M7 5h.01"/><path d="M11 7h.01"/><path d="M3 7h.01"/><path d="M7 9h.01"/><path d="M3 11h.01"/><rect width="4" height="4" x="15" y="5"/><path d="m19 9 2 2v10c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1V11l2-2"/><path d="m13 14 8-2"/><path d="m13 19 8-2"/>',
  주유소:
    '<path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5"/><path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16"/><path d="M2 21h13"/><path d="M3 9h11"/>',
  테마파크:
    '<circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 7-3.5 2"/><path d="M6.8 9 3.3 7"/><path d="m20.7 17-3.5-2"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/><path d="M18 18.7a9 9 0 1 0-12 0"/>',
  백화점:
    '<path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
  영화: '<path d="m12.296 3.464 3.02 3.956"/><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="m6.18 5.276 3.1 3.899"/>',
  베이커리:
    '<path d="M10.2 18H4.774a1.5 1.5 0 0 1-1.352-.97 11 11 0 0 1 .132-6.487"/><path d="M18 10.2V4.774a1.5 1.5 0 0 0-.97-1.352 11 11 0 0 0-6.486.132"/><path d="M18 5a4 3 0 0 1 4 3 2 2 0 0 1-2 2 10 10 0 0 0-5.139 1.42"/><path d="M5 18a3 4 0 0 0 3 4 2 2 0 0 0 2-2 10 10 0 0 1 1.42-5.14"/><path d="M8.709 2.554a10 10 0 0 0-6.155 6.155 1.5 1.5 0 0 0 .676 1.626l9.807 5.42a2 2 0 0 0 2.718-2.718l-5.42-9.807a1.5 1.5 0 0 0-1.626-.676"/>',
}

// 편의점 브랜드 시그니처 마커. 흰 배지 안에 실제 로고 이미지를 넣고, 핀(또는 점 테두리)은
// 그 브랜드를 대표하는 색으로 채운다.
interface BrandMark {
  fill: string
  logoUrl: string
  // 트리밍된 로고 원본의 가로/세로 비율(width/height). GS25·이마트24처럼 아주 넓적한
  // 워드마크를 정사각형 박스에 억지로 넣으면 다들 같은 높이로 짜부라져 잘 안 보이므로,
  // 브랜드마다 원에 내접하는 최대 크기의 박스를 이 비율 기준으로 따로 계산한다.
  aspectRatio: number
}

const brandMark: Record<string, BrandMark> = {
  // 편의점
  CU: { fill: '#4B2FE0', logoUrl: cuLogoDataUrl, aspectRatio: 249 / 153 },
  GS25: { fill: '#22D1DE', logoUrl: gs25LogoDataUrl, aspectRatio: 1890 / 597 },
  세븐일레븐: { fill: '#1E7145', logoUrl: sevenLogoDataUrl, aspectRatio: 700 / 934 },
  이마트24: { fill: '#FFB81C', logoUrl: emartLogoDataUrl, aspectRatio: 2000 / 399 },

  // 베이커리
  파리크라상: { fill: '#1A1A1A', logoUrl: croissantLogoDataUrl, aspectRatio: 447 / 445 },
  파리바게뜨: { fill: '#1B2A5E', logoUrl: parisLogoDataUrl, aspectRatio: 348 / 352 },
  뚜레쥬르: { fill: '#1F4B33', logoUrl: touslesLogoDataUrl, aspectRatio: 199 / 168 },

  // 뷰티
  올리브영: { fill: '#7AC142', logoUrl: oliveLogoDataUrl, aspectRatio: 161 / 161 },

  // 도서
  교보문고: { fill: '#003876', logoUrl: kyoboLogoDataUrl, aspectRatio: 233 / 165 },

  // 카페
  커피빈: { fill: '#6B2C91', logoUrl: beanLogoDataUrl, aspectRatio: 332 / 246 },
  이디야: { fill: '#123974', logoUrl: ediyaLogoDataUrl, aspectRatio: 323 / 138 },
  메가MGC커피: { fill: '#FFC72C', logoUrl: mgcLogoDataUrl, aspectRatio: 223 / 345 },
  폴바셋: { fill: '#E6007E', logoUrl: paulLogoDataUrl, aspectRatio: 655 / 457 },
  스타벅스: { fill: '#00704A', logoUrl: starbucksLogoDataUrl, aspectRatio: 1 },
  투썸플레이스: { fill: '#C8102E', logoUrl: twosomeLogoDataUrl, aspectRatio: 1 },

  // 백화점
  현대백화점: { fill: '#1E5945', logoUrl: hyundaiLogoDataUrl, aspectRatio: 389 / 140 },
  롯데백화점: { fill: '#8A7A6D', logoUrl: lotteDLogoDataUrl, aspectRatio: 568 / 540 },
  신세계백화점: { fill: '#E4002B', logoUrl: shinLogoDataUrl, aspectRatio: 335 / 240 },

  // 패스트푸드
  버거킹: { fill: '#D62300', logoUrl: burgerkingLogoDataUrl, aspectRatio: 550 / 557 },
  KFC: { fill: '#E4002B', logoUrl: kfcLogoDataUrl, aspectRatio: 385 / 108 },
  롯데리아: { fill: '#E4032E', logoUrl: lotteriaLogoDataUrl, aspectRatio: 675 / 451 },
  맥도날드: { fill: '#FBB918', logoUrl: mcdonaldLogoDataUrl, aspectRatio: 377 / 287 },

  // 음식점
  아웃백: { fill: '#8B1D1D', logoUrl: outbackLogoDataUrl, aspectRatio: 608 / 225 },
  VIPS: { fill: '#A6192E', logoUrl: vipsLogoDataUrl, aspectRatio: 524 / 222 },

  // 주유
  GS칼텍스: { fill: '#F7941D', logoUrl: gsLogoDataUrl, aspectRatio: 428 / 445 },
  SK에너지: { fill: '#EE3524', logoUrl: skLogoDataUrl, aspectRatio: 236 / 188 },

  // 대형마트 (편의점 이마트24와는 다른 브랜드)
  이마트: { fill: '#FFC600', logoUrl: emartMartLogoDataUrl, aspectRatio: 367 / 105 },
  하나로마트: { fill: '#F4A81D', logoUrl: hanaroLogoDataUrl, aspectRatio: 498 / 615 },
  홈플러스: { fill: '#ED1C24', logoUrl: homeplusLogoDataUrl, aspectRatio: 298 / 254 },
  롯데마트: { fill: '#E4032E', logoUrl: lotteLogoDataUrl, aspectRatio: 387 / 386 },

  // 영화
  CGV: { fill: '#E30613', logoUrl: cgvLogoDataUrl, aspectRatio: 3096 / 1356 },
  롯데시네마: { fill: '#E4032E', logoUrl: lotteCLogoDataUrl, aspectRatio: 308 / 301 },
  메가박스: { fill: '#1B2A6B', logoUrl: megaLogoDataUrl, aspectRatio: 134 / 100 },

  // 테마파크
  에버랜드: { fill: '#F0791E', logoUrl: everLogoDataUrl, aspectRatio: 271 / 247 },
  롯데월드: { fill: '#E4032E', logoUrl: lotteWLogoDataUrl, aspectRatio: 347 / 189 },
  서울랜드: { fill: '#E4032E', logoUrl: seoulLogoDataUrl, aspectRatio: 738 / 213 },
}

// 반지름 r인 원에 내접하는, 주어진 가로세로 비율의 최대 직사각형 크기.
// margin은 안티에일리어싱 경계에서 살짝 여유를 두기 위한 축소 비율(1보다 작게).
function inscribedBox(radius: number, aspectRatio: number, margin = 0.92) {
  const diameter = radius * 2 * margin
  const height = diameter / Math.sqrt(aspectRatio * aspectRatio + 1)
  const width = aspectRatio * height
  return { width, height }
}

// 카테고리·브랜드 조합별로 결과가 항상 동일해서, 마커마다 매번 SVG를 새로 만들고
// encodeURIComponent를 다시 돌리는 대신 한 번 만든 MarkerImage를 재사용한다.
// 특히 브랜드 마커는 base64 로고까지 포함돼 있어 매번 다시 만들면 낭비가 크다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dotMarkerImageCache = new Map<string, any>()

export function dotMarkerImage(category: string, brandName?: string) {
  const cacheKey = brandName ?? category
  const cached = dotMarkerImageCache.get(cacheKey)
  if (cached) return cached

  // 겹쳐서 뜰 때도 브랜드 로고가 눈에 들어오도록 키운다.
  // (선택된 마커는 pinMarkerImage의 더 큰 핀 모양으로 따로 표시)
  const size = 28
  const brand = brandName ? brandMark[brandName] : undefined

  const content = brand
    ? (() => {
        const cx = size / 2
        const cy = size / 2
        const r = size / 2 - 2
        const box = inscribedBox(r, brand.aspectRatio)
        return `<defs>
      <clipPath id="dot-badge-clip"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="${brand.fill}" stroke-width="3" />
    <image href="${brand.logoUrl}" xlink:href="${brand.logoUrl}" x="${cx - box.width / 2}" y="${cy - box.height / 2}" width="${box.width}" height="${box.height}" preserveAspectRatio="xMidYMid meet" clip-path="url(#dot-badge-clip)" />`
      })()
    : `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${DOT_COLOR}" stroke="white" stroke-width="2.5" />
    <g transform="translate(7,7) scale(0.583)" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${categoryIcon[category] ?? DEFAULT_ICON}
    </g>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}">
    ${content}
  </svg>`
  const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  const markerImage = new window.kakao.maps.MarkerImage(
    src,
    new window.kakao.maps.Size(size, size),
    {
      offset: new window.kakao.maps.Point(size / 2, size / 2),
    },
  )
  dotMarkerImageCache.set(cacheKey, markerImage)
  return markerImage
}

export function currentLocationMarkerImage() {
  const size = 20
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${CURRENT_LOCATION_COLOR}" fill-opacity="0.2" />
    <circle cx="${size / 2}" cy="${size / 2}" r="5" fill="${CURRENT_LOCATION_COLOR}" stroke="white" stroke-width="2" />
  </svg>`
  const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  return new window.kakao.maps.MarkerImage(src, new window.kakao.maps.Size(size, size), {
    offset: new window.kakao.maps.Point(size / 2, size / 2),
  })
}

function brandPinBadge(brand: BrandMark): string {
  const cx = 22
  const cy = 19
  const r = 12

  const box = inscribedBox(r, brand.aspectRatio)

  return `<defs>
      <clipPath id="pin-badge-clip"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" />
    <image href="${brand.logoUrl}" xlink:href="${brand.logoUrl}" x="${cx - box.width / 2}" y="${cy - box.height / 2}" width="${box.width}" height="${box.height}" preserveAspectRatio="xMidYMid meet" clip-path="url(#pin-badge-clip)" />`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinMarkerImageCache = new Map<string, any>()

export function pinMarkerImage(category: string, brandName?: string) {
  const cacheKey = brandName ?? category
  const cached = pinMarkerImageCache.get(cacheKey)
  if (cached) return cached

  // 점 마커(32px)보다 선택 상태가 뚜렷이 더 커 보이도록 비례해서 키운 크기.
  const width = 44
  const height = 54
  const brand = brandName ? brandMark[brandName] : undefined
  const fillColor = brand ? brand.fill : DOT_COLOR

  const badge = brand
    ? brandPinBadge(brand)
    : `<g transform="translate(14,11) scale(0.7)" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${categoryIcon[category] ?? DEFAULT_ICON}
    </g>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
    <defs>
      <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#pin-shadow)">
      <circle cx="22" cy="19" r="14" fill="${fillColor}" />
      <path d="M8 27 L22 49 L36 27 Z" fill="${fillColor}" />
    </g>
    ${badge}
  </svg>`
  const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  const markerImage = new window.kakao.maps.MarkerImage(
    src,
    new window.kakao.maps.Size(width, height),
    {
      offset: new window.kakao.maps.Point(width / 2, height - 4),
    },
  )
  pinMarkerImageCache.set(cacheKey, markerImage)
  return markerImage
}
