<script setup lang="ts">
definePage({
  name: 'profile',
  layout: 'default',
  style: {
    navigationBarTitleText: '个人中心',
  },
})

const router = useRouter()
const authStore = useAuthStore()
const toast = useGlobalToast()
const message = useGlobalMessage()

function go(path: string) {
  router.push({ path })
}

function logout() {
  message.confirm({
    title: '退出登录',
    msg: '确定退出当前账号？',
    success: async () => {
      await authStore.logout()
      toast.success('已退出')
      router.replaceAll({ path: '/pages/login/index' })
    },
  })
}
</script>

<template>
  <view class="box-border min-h-screen bg-gray-50 px-4 py-6 dark:bg-[var(--wot-dark-background)]">
    <view class="mb-4 rounded-3 bg-white px-4 py-4 dark:bg-[var(--wot-dark-background2)]">
      <view class="flex items-center gap-3">
        <image
          v-if="authStore.avatar"
          :src="authStore.avatar"
          class="h-12 w-12 rounded-full"
        />
        <view
          v-else
          class="h-12 w-12 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-[var(--wot-dark-background3)] dark:text-[var(--wot-dark-color2)]"
        >
          <wd-icon name="user" size="22px" />
        </view>
        <view class="min-w-0 flex-1">
          <text class="block truncate text-4.5 text-gray-900 font-semibold dark:text-[var(--wot-dark-color)]">
            {{ authStore.account || '未命名用户' }}
          </text>
          <text class="block text-3 text-gray-500 dark:text-[var(--wot-dark-color2)]">
            UID: {{ authStore.uid ?? '-' }}
          </text>
        </view>
      </view>
    </view>

    <wd-cell-group border custom-class="profile-cell-group mb-4 rounded-3! overflow-hidden">
      <wd-cell title="字号大小" is-link @click="go('/pages/profile/font-size')">
        <template #icon>
          <text class="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-1.5 bg-gray-100 text-3 text-gray-600 dark:bg-[var(--wot-dark-background3)] dark:text-[var(--wot-dark-color2)]">
            A
          </text>
        </template>
      </wd-cell>
      <wd-cell title="主题色彩" is-link @click="go('/pages/profile/theme')">
        <template #icon>
          <wd-icon name="a-precisemonitor" size="18px" custom-class="mr-2 text-gray-500 dark:text-[var(--wot-dark-color2)]" />
        </template>
      </wd-cell>
    </wd-cell-group>

    <wd-cell-group border custom-class="profile-cell-group mb-4 rounded-3! overflow-hidden">
      <wd-cell title="账号管理" is-link @click="go('/pages/profile/account')">
        <template #icon>
          <wd-icon name="user" custom-class="mr-2 text-4.5 text-gray-500 dark:text-[var(--wot-dark-color2)]" />
        </template>
      </wd-cell>
    </wd-cell-group>

    <wd-cell-group border custom-class="profile-cell-group mb-4 rounded-3! overflow-hidden">
      <wd-cell title="关于灵犀" is-link @click="go('/pages/profile/about-lingxi')">
        <template #icon>
          <wd-icon name="info-circle" custom-class="mr-2 text-4.5 text-gray-500 dark:text-[var(--wot-dark-color2)]" />
        </template>
      </wd-cell>
      <wd-cell title="退出登录" is-link @click="logout">
        <template #icon>
          <wd-icon name="logout" custom-class="mr-2 text-4.5 text-gray-500 dark:text-[var(--wot-dark-color2)]" />
        </template>
      </wd-cell>
    </wd-cell-group>
  </view>
</template>

<style scoped>
.profile-cell-group :deep(.wd-cell.is-border .wd-cell__wrapper::after) {
  left: 56rpx !important;
  right: 32rpx !important;
  width: auto !important;
}
</style>
