export function resolveApiBaseUrl(isDevelopment: boolean, configuredBaseUrl?: string): string {
  if (!isDevelopment) return ''

  return configuredBaseUrl?.trim().replace(/\/+$/, '') ?? ''
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.DEV,
  import.meta.env.VITE_API_BASE_URL,
)
