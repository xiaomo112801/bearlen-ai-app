/*
 * @Author: weisheng
 * @Date: 2025-04-17 15:58:11
 * @LastEditTime: 2025-06-15 21:47:22
 * @LastEditors: weisheng
 * @Description: Alova response and error handlers
 * @FilePath: /wot-starter/src/api/core/handlers.ts
 */
import type { Method } from 'alova'

function replaceAllToLogin() {
  Promise.all([
    import('@/router'),
    import('@/store/authStore'),
  ]).then(([r, { useAuthStore }]) => {
    useAuthStore().clearSession()
    r.default.replaceAll({ path: '/pages/login/index' })
  }).catch(() => {})
}

// Custom error class for API errors
export class ApiError extends Error {
  code: number
  data?: any

  constructor(message: string, code: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

/** 与 Bearlen /api 约定：code===1 成功；亦兼容无 code 的旧响应 */
interface ApiResponse {
  code?: number
  message?: string
  msg?: string
  data?: any
  success?: boolean
  total?: number
  more?: boolean
}

function parseResponseBody(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    }
    catch {
      return data
    }
  }
  return data
}

function businessMessage(json: ApiResponse): string {
  return json.message ?? json.msg ?? '请求失败'
}

// Handle successful responses
export async function handleAlovaResponse(
  response: UniApp.RequestSuccessCallbackResult | UniApp.UploadFileSuccessCallbackResult | UniApp.DownloadSuccessData,
) {
  const globalToast = useGlobalToast()
  const { statusCode, data } = response as UniNamespace.RequestSuccessCallbackResult
  const parsed = parseResponseBody(data) as ApiResponse

  // HTTP 401/403：未授权
  if (statusCode === 401 || statusCode === 403) {
    globalToast.error({ msg: '登录已过期，请重新登录！', duration: 500 })
    const timer = setTimeout(() => {
      clearTimeout(timer)
      replaceAllToLogin()
    }, 500)
    throw new ApiError('登录已过期，请重新登录！', statusCode, parsed)
  }

  // Bearlen 业务：HTTP 非 2xx 时仍可能返回 JSON body（code=-1）
  if (statusCode >= 400) {
    if (parsed && typeof parsed === 'object' && typeof parsed.code === 'number' && parsed.code !== 1) {
      const msg = businessMessage(parsed)
      globalToast.error(msg)
      throw new ApiError(msg, parsed.code, parsed.data)
    }
    globalToast.error(`请求失败 (${statusCode})`)
    throw new ApiError(`Request failed with status: ${statusCode}`, statusCode, parsed)
  }

  if (import.meta.env.MODE === 'development') {
    console.log('[Alova Response]', parsed)
  }

  // 显式业务码
  if (parsed && typeof parsed === 'object' && typeof parsed.code === 'number') {
    if (parsed.code !== 1) {
      const msg = businessMessage(parsed)
      globalToast.error(msg)
      throw new ApiError(msg, parsed.code, parsed.data)
    }
    return parsed.data
  }

  return parsed
}

// Handle request errors
export function handleAlovaError(error: any, method: Method) {
  const globalToast = useGlobalToast()
  if (import.meta.env.MODE === 'development') {
    console.error('[Alova Error]', error, method)
  }

  if (error instanceof ApiError && (error.code === 401 || error.code === 403)) {
    globalToast.error({ msg: '登录已过期，请重新登录！', duration: 500 })
    const timer = setTimeout(() => {
      clearTimeout(timer)
      replaceAllToLogin()
    }, 500)
    throw new ApiError('登录已过期，请重新登录！', error.code, error.data)
  }

  if (error.name === 'NetworkError') {
    globalToast.error('网络错误，请检查您的网络连接')
  }
  else if (error.name === 'TimeoutError') {
    globalToast.error('请求超时，请重试')
  }
  else if (error instanceof ApiError) {
    globalToast.error(error.message || '请求失败')
  }
  else {
    globalToast.error('发生意外错误')
  }

  throw error
}
