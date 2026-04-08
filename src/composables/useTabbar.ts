export interface TabbarItem {
  name: string
  value: number | null
  active: boolean
  title: string
  icon: string
}

const tabbarItems = ref<TabbarItem[]>([
  { name: 'aiChat', value: null, active: false, title: 'AI对话', icon: 'chat' },
  { name: 'finance', value: null, active: false, title: '财务', icon: 'money-circle' },
  { name: 'customerMgmt', value: null, active: false, title: '客户', icon: 'usergroup' },
  { name: 'service', value: null, active: true, title: '客服', icon: 'service' },
])

export function useTabbar() {
  const tabbarList = computed(() => tabbarItems.value)

  const activeTabbar = computed(() => {
    const item = tabbarItems.value.find(item => item.active)
    return item || tabbarItems.value[0]
  })

  const getTabbarItemValue = (name: string) => {
    const item = tabbarItems.value.find(item => item.name === name)
    return item && item.value ? item.value : null
  }

  const setTabbarItem = (name: string, value: number) => {
    const tabbarItem = tabbarItems.value.find(item => item.name === name)
    if (tabbarItem) {
      tabbarItem.value = value
    }
  }

  const setTabbarItemActive = (name: string) => {
    tabbarItems.value.forEach((item) => {
      if (item.name === name) {
        item.active = true
      }
      else {
        item.active = false
      }
    })
  }

  return {
    tabbarList,
    activeTabbar,
    getTabbarItemValue,
    setTabbarItem,
    setTabbarItemActive,
  }
}
