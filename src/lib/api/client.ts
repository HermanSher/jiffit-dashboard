import { useAuthStore } from '../../features/auth/auth.store'
import type { AuthTokenPair } from '../../features/auth/auth.types'
import { toast } from 'sonner'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export interface ApiResponse<TData> {
  result: number
  message: string
  data: TData
}

interface RequestOptions extends RequestInit {
  auth?: boolean
  skipRefresh?: boolean
  toastErrors?: boolean
}

const parseResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return { message: text }
  }
}

let refreshPromise: Promise<AuthTokenPair | null> | null = null

const requestFreshTokens = async (): Promise<AuthTokenPair | null> => {
  const refreshToken = useAuthStore.getState().refreshToken

  if (!refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const payload = (await parseResponse(response)) as Partial<ApiResponse<AuthTokenPair>>

        if (!response.ok || payload.result !== 1 || !payload.data) {
          throw new Error(payload.message || 'Session expired. Please login again.')
        }

        useAuthStore.getState().setTokens(payload.data.accessToken, payload.data.refreshToken)
        return payload.data
      })
      .catch(() => {
        useAuthStore.getState().logout()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

const buildHeaders = (headers: HeadersInit | undefined, body: BodyInit | null | undefined) => {
  const accessToken = useAuthStore.getState().accessToken
  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has('Content-Type') && body && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  return requestHeaders
}

export const apiRequest = async <TData>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<TData>> => {
  const {
    auth = true,
    headers,
    skipRefresh = false,
    toastErrors = true,
    ...init
  } = options

  const send = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: init.cache ?? 'no-store',
      headers: (() => {
        const requestHeaders = buildHeaders(headers, init.body)

        if (!auth) {
          requestHeaders.delete('Authorization')
        }

        return requestHeaders
      })(),
    })

  let response = await send()

  if (auth && response.status === 401 && !skipRefresh) {
    const tokens = await requestFreshTokens()

    if (tokens) {
      response = await send()
    }
  }

  const payload = (await parseResponse(response)) as Partial<ApiResponse<TData>>

  if (!response.ok || payload.result !== 1) {
    const message =
      typeof payload.message === 'string' && payload.message.trim().length > 0
        ? payload.message
      : `Request failed with status ${response.status}`

    if (toastErrors) {
      toast.error(message)
    }

    throw new Error(message)
  }

  return {
    result: payload.result ?? 1,
    message: payload.message ?? '',
    data: payload.data as TData,
  }
}
