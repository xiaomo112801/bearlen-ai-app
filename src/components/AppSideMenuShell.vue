<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const disableMotion = ref(false)

const showMenu = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

function goProfile() {
  router.push({ name: 'profile' })
}

function resetWithoutAnimation() {
  disableMotion.value = true
  showMenu.value = false
  setTimeout(() => {
    disableMotion.value = false
  }, 0)
}

defineExpose({
  resetWithoutAnimation,
})
</script>

<template>
  <view class="page-shell min-h-screen bg-gray-50 dark:bg-[var(--wot-dark-background)]">
    <view class="menu-backdrop" :class="{ 'is-open': showMenu, 'no-motion': disableMotion }" @click="showMenu = false" />

    <view class="side-menu" :class="{ 'is-open': showMenu, 'no-motion': disableMotion }">
      <view class="flex h-full flex-col bg-white dark:bg-[var(--wot-dark-background2)]">
        <view class="border-b border-gray-100 px-4 py-4 dark:border-gray-700" @click="goProfile">
          <view class="flex items-center gap-3">
            <image
              v-if="authStore.avatar"
              :src="authStore.avatar"
              class="h-10 w-10 rounded-full"
            />
            <view
              v-else
              class="h-10 w-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-[var(--wot-dark-background3)] dark:text-[var(--wot-dark-color2)]"
            >
              <wd-icon name="user" size="18px" />
            </view>
            <view class="min-w-0 flex-1">
              <text class="block truncate text-3.8 text-gray-900 font-medium dark:text-[var(--wot-dark-color)]">
                {{ authStore.account || '未命名用户' }}
              </text>
              <text class="block text-3 text-gray-500 dark:text-[var(--wot-dark-color2)]">
                个人中心
              </text>
            </view>
            <wd-icon name="arrow-right" />
          </view>
        </view>
      </view>
    </view>

    <view class="main-layer" :class="{ 'is-open': showMenu, 'no-motion': disableMotion }">
      <slot />
    </view>
  </view>
</template>

<style scoped>
.page-shell {
  position: relative;
  overflow: hidden;
  background: #f3f4f6;
}

.menu-backdrop {
  position: fixed;
  top: var(--window-top);
  left: 0;
  z-index: 4;
  width: 100%;
  height: calc(100vh - var(--window-top));
  background: transparent;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.26s ease;
}

.menu-backdrop.is-open {
  background: rgb(0 0 0 / 50%);
  opacity: 1;
  pointer-events: auto;
}

.side-menu {
  position: fixed;
  top: var(--window-top);
  left: 0;
  z-index: 5;
  width: 74%;
  height: calc(100vh - var(--window-top));
  transform: translateX(-102%);
  opacity: 0;
  transition: transform 0.26s ease, opacity 0.2s ease;
}

.side-menu.is-open {
  transform: translateX(0);
  opacity: 1;
}

.main-layer {
  position: relative;
  z-index: 3;
  min-height: 100vh;
  transform-origin: left top;
  background: #f3f4f6;
  overflow: hidden;
  will-change: transform;
  transition: transform 0.26s ease;
}

.main-layer.is-open {
  transform: translateX(71%);
}

.no-motion {
  transition: none !important;
}
</style>
