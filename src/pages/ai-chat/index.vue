<script setup lang="ts">
const showMenu = ref(false)
type SideMenuShellExpose = { resetWithoutAnimation: () => void }
const sideMenuShellRef = ref<SideMenuShellExpose | null>(null)

onShow(() => {
  sideMenuShellRef.value?.resetWithoutAnimation()
})

definePage({
  name: 'aiChat',
  type: 'home',
  layout: 'tabbar',
  style: {
    navigationBarTitleText: 'AI 对话',
    // #ifdef APP-PLUS
    titleNView: {
      buttons: [{
        type: 'none',
        float: 'left',
        text: '☰',
        fontSize: '20px',
        color: '#333333',
      }],
    },
    // #endif
  },
})

onNavigationBarButtonTap(() => {
  showMenu.value = !showMenu.value
})
</script>

<template>
  <app-side-menu-shell ref="sideMenuShellRef" v-model="showMenu">
    <view class="box-border min-h-screen">
      <view class="px-4 py-6">
        <view class="rounded-3 bg-white px-4 py-5 dark:bg-[var(--wot-dark-background2)]">
          <text class="mb-2 block text-5 text-gray-800 font-semibold dark:text-[var(--wot-dark-color)]">
            AI 对话
          </text>
          <text class="block text-3.5 text-gray-500 dark:text-[var(--wot-dark-color2)]">
            智能问答与助手模块首页。
          </text>
        </view>
      </view>
    </view>
  </app-side-menu-shell>
</template>
