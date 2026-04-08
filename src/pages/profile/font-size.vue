<script setup lang="ts">
definePage({
  name: 'profileFontSize',
  layout: 'default',
  style: {
    navigationBarTitleText: '字号大小',
  },
})

type FontSizeOption = {
  label: string
  value: 'smaller' | 'standard' | 'larger' | 'xlarge'
}

const FONT_SIZE_KEY = 'profile_font_size'
const FONT_SIZE_EVENT = 'profile-font-size-change'
const options: FontSizeOption[] = [
  { label: '更小', value: 'smaller' },
  { label: '标准', value: 'standard' },
  { label: '更大', value: 'larger' },
  { label: '超大', value: 'xlarge' },
]

const selected = ref<FontSizeOption['value']>('standard')
const previewSizeMap: Record<FontSizeOption['value'], string> = {
  smaller: '30rpx',
  standard: '36rpx',
  larger: '42rpx',
  xlarge: '48rpx',
}
const previewTitleSize = computed(() => previewSizeMap[selected.value as FontSizeOption['value']])
const previewBodySize = computed(() => `calc(${previewSizeMap[selected.value as FontSizeOption['value']]} - 8rpx)`)

onMounted(() => {
  const saved = uni.getStorageSync(FONT_SIZE_KEY) as string | undefined
  if (saved === 'smaller' || saved === 'standard' || saved === 'larger' || saved === 'xlarge') {
    selected.value = saved
    return
  }
  // 兼容旧值
  if (saved === 'small')
    selected.value = 'smaller'
  else if (saved === 'medium')
    selected.value = 'standard'
  else if (saved === 'large')
    selected.value = 'larger'
})

function selectSize(value: FontSizeOption['value']) {
  selected.value = value
  uni.setStorageSync(FONT_SIZE_KEY, value)
  uni.$emit(FONT_SIZE_EVENT)
}
</script>

<template>
  <view class="size-page box-border bg-gray-50 px-4 py-6 dark:bg-[var(--wot-dark-background)]">
    <view class="preview-wrap text-gray-900 dark:text-[var(--wot-dark-color)]">
      <view class="preview-bubble-wrap">
        <view class="preview-bubble">
          <text :style="{ fontSize: previewTitleSize }">
            李娟最经典的语录名句
          </text>
        </view>
      </view>

      <view class="preview-content" :style="{ fontSize: previewBodySize }">
        <text class="mb-3 block">
          🌼 “大地最雄浑的力量不是地震，而是万物的生长啊……”
        </text>
        <text class="mb-3 block">
          —— 李娟《遥远的向日葵地》
        </text>
        <text class="block">
          这句话最能代表她眼中那种在贫瘠中也要拼命向上的生命力。
        </text>
      </view>
    </view>

    <view class="hint text-gray-400 dark:text-[var(--wot-dark-color3)]">
      设置后，会改变对话中的字体大小
    </view>

    <view class="selector-wrap bg-white dark:bg-[var(--wot-dark-background2)]">
      <view
        v-for="item in options"
        :key="item.value"
        class="selector-item"
        :class="{ 'is-active': selected === item.value }"
        @click="selectSize(item.value)"
      >
        {{ item.label }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.size-page {
  min-height: calc(100vh - var(--window-top));
  display: flex;
  flex-direction: column;
  padding-bottom: calc(env(safe-area-inset-bottom) + 12rpx);
}

.preview-wrap {
  flex: 1;
}

.preview-bubble-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 40rpx;
}

.preview-bubble {
  background: #e9efff;
  color: #1f2937;
  padding: 16rpx 22rpx;
  border-radius: 18rpx;
  font-weight: 600;
}

.preview-content {
  line-height: 1.7;
}

.hint {
  text-align: center;
  font-size: 24rpx;
  margin: 20rpx 0 24rpx;
}

.selector-wrap {
  border-radius: 26rpx;
  padding: 10rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 8rpx;
}

.selector-item {
  height: 78rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  color: #1f2937;
}

.selector-item.is-active {
  background: #e9efff;
  color: #355ad8;
  font-weight: 700;
}
</style>
