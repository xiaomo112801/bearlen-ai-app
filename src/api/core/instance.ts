import AdapterUniapp from '@alova/adapter-uniapp'
import { createAlova } from 'alova'
import vueHook from 'alova/vue'
import { getPersistedBearerToken } from '@/utils/authStorage'
import mockAdapter from '../mock/mockAdapter'
import { handleAlovaError, handleAlovaResponse } from './handlers'

function pathWithoutQuery(url: string): string {
  const s = url.replace(/^https?:\/\/[^/]+/i, '')
  return s.split('?')[0] || s
}

/** 无需携带 JWT 的路径（相对 baseURL） */
function isAuthOptionalPath(url: string): boolean {
  const p = pathWithoutQuery(url)
  return ['/sign', '/verify'].some(seg => p === seg || p.endsWith(seg))
}

export const alovaInstance = createAlova({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  ...AdapterUniapp({
    mockRequest: mockAdapter,
  }),
  statesHook: vueHook,
  beforeRequest: (method) => {
    if (['POST', 'PUT', 'PATCH'].includes(method.type)) {
      method.config.headers['Content-Type'] = 'application/json'
    }

    if (!isAuthOptionalPath(String(method.url))) {
      const bearer = getPersistedBearerToken()
      if (bearer) {
        method.config.headers.Authorization = bearer
      }
    }

    if (method.type === 'GET' && CommonUtil.isObj(method.config.params)) {
      method.config.params._t = Date.now()
    }

    if (import.meta.env.MODE === 'development') {
      console.log(`[Alova Request] ${method.type} ${method.url}`, method.data || method.config.params)
      console.log(`[API Base URL] ${import.meta.env.VITE_API_BASE_URL}`)
      console.log(`[Environment] ${import.meta.env.VITE_ENV_NAME}`)
    }
  },

  // Response handlers
  responded: {
    // Success handler
    onSuccess: handleAlovaResponse,

    // Error handler
    onError: handleAlovaError,

    // Complete handler - runs after success or error
    onComplete: async () => {
      // Any cleanup or logging can be done here
    },
  },

  // We'll use the middleware in the hooks
  // middleware is not directly supported in createAlova options

  // Default request timeout (10 seconds)
  timeout: 60000,
  // 设置为null即可全局关闭全部请求缓存
  cacheFor: null,
})

export default alovaInstance
