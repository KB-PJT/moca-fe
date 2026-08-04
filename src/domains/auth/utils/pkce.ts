const PKCE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

const GOOGLE_CODE_VERIFIER_KEY = 'google_code_verifier'
const GOOGLE_OAUTH_STATE_KEY = 'google_oauth_state'

export function getGoogleCodeVerifier(): string | null {
  return sessionStorage.getItem(GOOGLE_CODE_VERIFIER_KEY)
}

export function clearGoogleLoginSession(): void {
  sessionStorage.removeItem(GOOGLE_CODE_VERIFIER_KEY)
  sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY)
}

function createCodeVerifier(length = 64): string {
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  return Array.from(randomValues, (value) => PKCE_CHARACTERS[value % PKCE_CHARACTERS.length]).join(
    '',
  )
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const encodedVerifier = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', encodedVerifier)

  return base64UrlEncode(digest)
}

export async function startGoogleLogin(): Promise<void> {
  const codeVerifier = createCodeVerifier()
  const codeChallenge = await createCodeChallenge(codeVerifier)
  const state = crypto.randomUUID()

  sessionStorage.setItem(GOOGLE_CODE_VERIFIER_KEY, codeVerifier)
  sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
