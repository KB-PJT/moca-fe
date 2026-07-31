import type { Merchant } from '@/domains/map/api/merchants.mock'

// 카카오맵 자체 POI 아이콘이 대부분 주황/브라운 톤이라, 마커는 빨간색으로 구분 (기존 --color-error 토큰과 동일)
const DOT_COLOR = '#ef4444'

// @lucide/vue의 utensils / coffee / shopping-bag / shopping-cart 아이콘 path 그대로 사용 (24x24 기준)
const categoryIcon: Record<Merchant['category'], string> = {
  음식점:
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  카페: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  편의점:
    '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
  마트: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
}

// 선택 안 된 마커: 작은 점
export function dotMarkerImage() {
  const size = 12
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${DOT_COLOR}" stroke="white" stroke-width="1.5" />
  </svg>`
  const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  return new window.kakao.maps.MarkerImage(src, new window.kakao.maps.Size(size, size), {
    offset: new window.kakao.maps.Point(size / 2, size / 2),
  })
}

// 선택된 마커: 말풍선(핀) 모양 + 카테고리 아이콘
export function pinMarkerImage(category: Merchant['category']) {
  const icon = categoryIcon[category]
  const width = 32
  const height = 40
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#pin-shadow)">
      <circle cx="16" cy="14" r="12" fill="${DOT_COLOR}" />
      <path d="M6 20 L16 36 L26 20 Z" fill="${DOT_COLOR}" />
    </g>
    <g transform="translate(10,8) scale(0.5)" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      ${icon}
    </g>
  </svg>`
  const src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  return new window.kakao.maps.MarkerImage(src, new window.kakao.maps.Size(width, height), {
    offset: new window.kakao.maps.Point(width / 2, height - 3),
  })
}
