/**
 * 从 Pinia 持久化存储读取 token（避免在 Alova beforeRequest 中引用 Pinia 造成环依赖）
 * 与 `useAuthStore` 的 store id `auth` 一致
 */
const AUTH_STORE_ID = 'auth'

export function getPersistedBearerToken(): string {
  try {
    const raw = uni.getStorageSync(AUTH_STORE_ID) as { token?: string } | string | undefined
    if (!raw)
      return ''
    const state = typeof raw === 'string' ? JSON.parse(raw) as { token?: string } : raw
    const t = state?.token
    if (!t)
      return ''
    return t.startsWith('Bearer ') ? t : `Bearer ${t}`
  }
  catch {
    return ''
  }
}

/**
 * `uni.uploadFile` 不走 Alova，需手动带 JWT。
 * 与 `POST .../uploadImage`、`POST .../uploadAbnormalMedia`（相对 `VITE_API_BASE_URL`，一般为 `/api` 根下）一致：`Authorization: Bearer <token>`
 */
export function getMultipartUploadAuthHeaders(): Record<string, string> {
  const bearer = getPersistedBearerToken()
  if (!bearer)
    return {}
  return { Authorization: bearer }
}
