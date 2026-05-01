import { useAuthStore } from '../../features/auth/auth.store'

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export interface ApiResponse<TData> {
  result: number
  message: string
  data: TData
}

interface RequestOptions extends RequestInit {
  auth?: boolean
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

export const apiRequest = async <TData>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<TData>> => {
  const { auth = false, headers, ...init } = options
  const token = useAuthStore.getState().token
  const requestHeaders = new Headers(headers)

  if (!requestHeaders.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (auth && token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
  })

  const payload = (await parseResponse(response)) as Partial<ApiResponse<TData>>

  if (!response.ok || payload.result !== 1) {
    const message =
      typeof payload.message === 'string' && payload.message.trim().length > 0
        ? payload.message
        : `Request failed with status ${response.status}`

    throw new Error(message)
  }

  return payload as ApiResponse<TData>
}
