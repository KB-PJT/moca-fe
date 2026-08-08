import { describe, expect, it } from 'vitest'
import { resolveApiBaseUrl } from '@/shared/api/baseUrl'

describe('resolveApiBaseUrl', () => {
  it('개발 서버에서는 설정한 API 주소를 사용한다', () => {
    expect(resolveApiBaseUrl(true, ' https://api.mocabe.store/ ')).toBe('https://api.mocabe.store')
  })

  it('배포 환경에서는 same-origin API 경로를 사용한다', () => {
    expect(resolveApiBaseUrl(false, 'https://api.mocabe.store')).toBe('')
  })
})
