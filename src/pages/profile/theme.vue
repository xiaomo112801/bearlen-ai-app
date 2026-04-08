<script setup lang="ts">
definePage({
  name: 'profileTheme',
  layout: 'default',
  style: {
    navigationBarTitleText: '主题色彩',
  },
})

type ThemeChoice = 'system' | 'light' | 'dark'

const store = useManualThemeStore()
const choices: Array<{ label: string, value: ThemeChoice }> = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色模式', value: 'light' },
  { label: '暗色模式', value: 'dark' },
]

const currentChoice = computed<ThemeChoice>(() => {
  if (store.followSystem)
    return 'system'
  return store.theme
})

function selectTheme(value: ThemeChoice) {
  if (value === 'system') {
    store.setFollowSystem(true)
    return
  }
  store.setFollowSystem(false)
  store.toggleTheme(value)
}
</script>

<template>
  <view class="box-border min-h-screen bg-gray-50 px-4 py-6 dark:bg-[var(--wot-dark-background)]">
    <wd-cell-group border custom-class="rounded-3! overflow-hidden">
      <wd-cell
        v-for="item in choices"
        :key="item.value"
        :title="item.label"
        clickable
        @click="selectTheme(item.value)"
      >
        <template #right-icon>
          <wd-icon v-if="currentChoice === item.value" name="check" custom-class="text-[var(--wot-color-theme)]" />
        </template>
      </wd-cell>
    </wd-cell-group>
  </view>
</template>
