<script setup lang="ts">
import { useAuthStore } from '@/store/authStore'

definePage({
  name: 'login',
  layout: 'default',
  style: {
    navigationBarTitleText: '登录',
    navigationBarBackgroundColor: '@navBgColor',
    navigationBarTextStyle: '@navTxtStyle',
  },
})

const router = useRouter()
const route = useRoute()
const toast = useGlobalToast()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const submitting = ref(false)

function resolveRedirectPath(): string | undefined {
  const r = route.query.redirect
  const raw = Array.isArray(r) ? r[0] : r
  if (!raw || typeof raw !== 'string')
    return undefined
  try {
    return decodeURIComponent(raw)
  }
  catch {
    return raw
  }
}

async function handleSubmit() {
  const u = username.value.trim()
  if (!u) {
    toast.warning('请输入账号')
    return
  }
  if (!password.value) {
    toast.warning('请输入密码')
    return
  }

  submitting.value = true
  try {
    await authStore.login(u, password.value)
    toast.success('登录成功')
    const redirect = resolveRedirectPath()
    if (redirect)
      router.replaceAll({ path: redirect })
    else
      router.replaceAll({ name: 'service' })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- page-wraper：App.vue 全局样式，保证各端 min-height 与背景；避免 min-h-screen 在部分端未生效导致「空白」 -->
  <view class="page-wraper box-border px-5 pt-10 pb-8">
    <view class="mb-10 text-center">
      <text class="mb-2 block text-6 font-semibold text-gray-900 dark:text-[var(--wot-dark-color)]">
        Bearlen AI
      </text>
      <text class="block text-3.5 leading-relaxed text-gray-500 dark:text-[var(--wot-dark-color2)]">
        登录账号以继续使用
      </text>
    </view>

    <view class="rounded-3 bg-white p-5 shadow-sm dark:bg-[var(--wot-dark-background2)]">
      <view class="mb-5">
        <wd-input
          v-model="username"
          type="text"
          label="账号"
          label-width="15%"
          placeholder="用户名或手机号"
          clearable
          :maxlength="64"
        />
      </view>
      <view class="mb-8 login-password-field">
        <wd-input
          v-model="password"
          label="密码"
          label-width="15%"
          placeholder="请输入密码"
          clearable
          show-password
          :maxlength="64"
        />
      </view>
      <wd-button
        type="primary"
        block
        size="large"
        :loading="submitting"
        @click="handleSubmit"
      >
        登录
      </wd-button>
    </view>
  </view>
</template>

<style scoped>
/* #ifdef H5 */
/* 仅保留 Wot 的 show-password 图标，隐藏浏览器/内核自带密码装饰 */
.login-password-field :deep(input[type='password']::-ms-reveal),
.login-password-field :deep(input[type='password']::-ms-clear),
.login-password-field :deep(input::-ms-reveal),
.login-password-field :deep(input::-ms-clear) {
  display: none !important;
}

.login-password-field :deep(input[type='password']::-webkit-textfield-decoration-container),
.login-password-field :deep(input::-webkit-textfield-decoration-container),
.login-password-field :deep(input::-webkit-credentials-auto-fill-button),
.login-password-field :deep(input::-webkit-contacts-auto-fill-button),
.login-password-field :deep(input::-webkit-caps-lock-indicator),
.login-password-field :deep(input::-webkit-strong-password-auto-fill-button) {
  visibility: hidden !important;
  pointer-events: none !important;
  position: absolute !important;
  right: 0 !important;
}
/* #endif */
</style>
