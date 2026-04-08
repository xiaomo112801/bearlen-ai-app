<script setup lang="ts">
const showMenu = ref(false)
type SideMenuShellExpose = { resetWithoutAnimation: () => void }
const sideMenuShellRef = ref<SideMenuShellExpose | null>(null)

onShow(() => {
  sideMenuShellRef.value?.resetWithoutAnimation()
})

definePage({
  name: 'service',
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '客服',
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

const router = useRouter()

onNavigationBarButtonTap(() => {
  showMenu.value = !showMenu.value
})

function goReturnSort() {
  router.push({ name: 'returnSort' })
}
</script>

<template>
  <app-side-menu-shell ref="sideMenuShellRef" v-model="showMenu">
    <view class="box-border min-h-screen">
      <view class="px-4 py-6">
        <view class="mb-4 rounded-3 bg-white px-4 py-5 dark:bg-[var(--wot-dark-background2)]">
          <text class="mb-2 block text-5 text-gray-800 font-semibold dark:text-[var(--wot-dark-color)]">
            客服中心
          </text>
          <text class="block text-3.5 text-gray-500 leading-relaxed dark:text-[var(--wot-dark-color2)]">
            退件整理等业务入口。
          </text>
        </view>

        <wd-cell-group border custom-class="rounded-2! overflow-hidden">
          <wd-cell title="退件整理" label="扫描运单、确认货品与关单" is-link @click="goReturnSort" />
        </wd-cell-group>
      </view>
    </view>
  </app-side-menu-shell>
</template>
