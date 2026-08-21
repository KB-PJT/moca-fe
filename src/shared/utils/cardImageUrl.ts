const CARD_IMAGE_HOST = 'd1c5n4ri2guedi.cloudfront.net'
const CARD_IMAGE_PATH_PREFIX = '/card/'
const CARD_IMAGE_QUALITY = 75

export type CardImageWidth = 128 | 384

export function optimizeCardImageUrl(
  source: string | null | undefined,
  width: CardImageWidth,
  enabled = import.meta.env.PROD,
) {
  const trimmedSource = source?.trim()
  if (!trimmedSource || !enabled) return trimmedSource

  try {
    const url = new URL(trimmedSource)
    const isAllowedCardImage =
      url.protocol === 'https:' &&
      url.hostname === CARD_IMAGE_HOST &&
      url.port === '' &&
      url.pathname.startsWith(CARD_IMAGE_PATH_PREFIX) &&
      url.search === ''

    if (!isAllowedCardImage) return trimmedSource

    const params = new URLSearchParams({
      url: url.href,
      w: String(width),
      q: String(CARD_IMAGE_QUALITY),
    })
    return `/_vercel/image?${params.toString()}`
  } catch {
    return trimmedSource
  }
}
