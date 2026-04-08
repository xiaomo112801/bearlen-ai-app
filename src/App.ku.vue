<script setup lang="ts">
const { themeVars, theme } = useManualTheme()

type FontSizeLevel = 'smaller' | 'standard' | 'larger' | 'xlarge'
const FONT_SIZE_KEY = 'profile_font_size'
const FONT_SIZE_EVENT = 'profile-font-size-change'

const fontSizeLevel = ref<FontSizeLevel>('standard')

const fontSizeThemeVarsMap: Record<FontSizeLevel, Record<string, string>> = {
  smaller: {
    fsSecondary: '10px',
    fsContent: '12px',
    fsTitle: '14px',
    cellTitleFs: '12px',
    cellLabelFs: '11px',
    cellValueFs: '12px',
    cellGroupTitleFs: '14px',
    cellGroupValueFs: '12px',
    buttonSmallFs: '10px',
    buttonMediumFs: '12px',
    buttonLargeFs: '14px',
    inputFs: '12px',
    inputCountFs: '12px',
    tabbarItemTitleFontSize: '9px',
  },
  standard: {
    fsSecondary: '11px',
    fsContent: '13px',
    fsTitle: '15px',
    cellTitleFs: '13px',
    cellLabelFs: '12px',
    cellValueFs: '13px',
    cellGroupTitleFs: '15px',
    cellGroupValueFs: '13px',
    buttonSmallFs: '11px',
    buttonMediumFs: '13px',
    buttonLargeFs: '15px',
    inputFs: '13px',
    inputCountFs: '13px',
    tabbarItemTitleFontSize: '10px',
  },
  larger: {
    fsSecondary: '12px',
    fsContent: '14px',
    fsTitle: '16px',
    cellTitleFs: '14px',
    cellLabelFs: '13px',
    cellValueFs: '14px',
    cellGroupTitleFs: '16px',
    cellGroupValueFs: '14px',
    buttonSmallFs: '12px',
    buttonMediumFs: '14px',
    buttonLargeFs: '16px',
    inputFs: '14px',
    inputCountFs: '14px',
    tabbarItemTitleFontSize: '11px',
  },
  xlarge: {
    fsSecondary: '13px',
    fsContent: '15px',
    fsTitle: '17px',
    cellTitleFs: '15px',
    cellLabelFs: '14px',
    cellValueFs: '15px',
    cellGroupTitleFs: '17px',
    cellGroupValueFs: '15px',
    buttonSmallFs: '13px',
    buttonMediumFs: '15px',
    buttonLargeFs: '17px',
    inputFs: '15px',
    inputCountFs: '15px',
    tabbarItemTitleFontSize: '12px',
  },
}

const appThemeVars = computed(() => ({
  ...themeVars.value,
  ...fontSizeThemeVarsMap[fontSizeLevel.value as FontSizeLevel],
}))

function syncFontSizeFromStorage() {
  const saved = uni.getStorageSync(FONT_SIZE_KEY) as string | undefined
  if (saved === 'smaller' || saved === 'standard' || saved === 'larger' || saved === 'xlarge') {
    fontSizeLevel.value = saved
    return
  }
  // 兼容旧版本三档值
  if (saved === 'small') {
    fontSizeLevel.value = 'smaller'
    return
  }
  if (saved === 'medium') {
    fontSizeLevel.value = 'standard'
    return
  }
  if (saved === 'large') {
    fontSizeLevel.value = 'larger'
    return
  }
  fontSizeLevel.value = 'standard'
}

onMounted(() => {
  syncFontSizeFromStorage()
  uni.$on(FONT_SIZE_EVENT, syncFontSizeFromStorage)
})

onUnmounted(() => {
  uni.$off(FONT_SIZE_EVENT, syncFontSizeFromStorage)
})
</script>

<template>
  <wd-config-provider :theme-vars="appThemeVars" :theme="theme" :custom-class="`page-wraper ${theme}`">
    <ku-root-view />
    <wd-notify />
    <wd-message-box />
    <wd-toast />
    <global-loading />
    <global-toast />
    <global-message />
    <!-- #ifdef MP-WEIXIN -->
    <privacy-popup />
    <!-- #endif -->
  </wd-config-provider>
</template>
