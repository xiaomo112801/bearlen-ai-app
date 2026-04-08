<script lang="ts" setup>
</script>

<script lang="ts">
export default {
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
}
</script>

<template>
  <slot />
  <GlobalToast />
  <GlobalMessage />
  <GlobalLoading />
</template>
