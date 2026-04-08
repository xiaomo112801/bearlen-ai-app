import type { SignInData } from '@/types/bearlen'
import { apiLoginOut, apiSign } from '@/api/modules/bearlen'
import { defineStore } from 'pinia'

/**
 * 登录态：token 与用户信息（与 POST /api/sign 返回字段对齐）
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    uid: null as number | null,
    account: '',
    avatar: '',
    failureTime: null as number | null,
  }),

  getters: {
    isLoggedIn: state => !!state.token,
  },

  actions: {
    setSession(payload: SignInData) {
      this.token = payload.token || ''
      this.uid = payload.uid ?? null
      this.account = payload.account ?? ''
      this.avatar = payload.avatar ?? ''
      this.failureTime = payload.failureTime ?? null
    },

    clearSession() {
      this.token = ''
      this.uid = null
      this.account = ''
      this.avatar = ''
      this.failureTime = null
    },

    async login(account: string, password: string) {
      const data = await apiSign({ account, password }).send()
      this.setSession(data)
    },

    async logout() {
      try {
        if (this.token)
          await apiLoginOut().send()
      }
      catch {
        // 服务端失败仍清理本地会话
      }
      finally {
        this.clearSession()
      }
    },
  },
})
