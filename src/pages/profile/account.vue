<script setup lang="ts">
definePage({
  name: 'profileAccount',
  layout: 'default',
  style: {
    navigationBarTitleText: '账号管理',
  },
})

const authStore = useAuthStore()

const expireText = computed(() => {
  if (!authStore.failureTime)
    return '-'
  const t = Number(authStore.failureTime)
  if (!Number.isFinite(t))
    return '-'
  return new Date(t).toLocaleString()
})
</script>

<template>
  <view class="box-border min-h-screen bg-gray-50 px-4 py-6 dark:bg-[var(--wot-dark-background)]">
    <wd-cell-group border custom-class="rounded-3! overflow-hidden">
      <wd-cell title="账号" :value="authStore.account || '-'" />
      <wd-cell title="用户 ID" :value="String(authStore.uid ?? '-')" />
      <wd-cell title="Token 到期" :value="expireText" />
    </wd-cell-group>
  </view>
</template>
