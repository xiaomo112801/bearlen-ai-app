<script setup lang="ts">
definePage({
  name: 'profileAboutLingxi',
  layout: 'default',
  style: {
    navigationBarTitleText: '关于灵犀',
  },
})
</script>

<template>
  <view class="box-border min-h-screen bg-gray-50 px-4 py-6 dark:bg-[var(--wot-dark-background)]">
    <view class="rounded-3 bg-white px-4 py-5 dark:bg-[var(--wot-dark-background2)]">
      <text class="mb-2 block text-5 text-gray-900 font-semibold dark:text-[var(--wot-dark-color)]">
        灵犀助手
      </text>
      <text class="block text-3.5 text-gray-600 leading-relaxed dark:text-[var(--wot-dark-color2)]">
        灵犀是面向业务场景的智能助手，帮助你快速完成问答、协作与流程处理。
      </text>
    </view>

    <wd-gap :height="12" />
    <wd-cell-group border custom-class="rounded-3! overflow-hidden">
      <wd-cell title="当前客户端版本" value="v1.0.0" />
      <wd-cell title="技术支持" value="Bearlen AI Team" />
    </wd-cell-group>
  </view>
</template>
