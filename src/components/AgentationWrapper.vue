<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { Agentation } from 'agentation';

const rootElement = ref<HTMLElement | null>(null);
let reactRoot: any = null;

onMounted(() => {
  if (rootElement.value) {
    reactRoot = createRoot(rootElement.value);
    reactRoot.render(React.createElement(Agentation));
  }
});

onBeforeUnmount(() => {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
});
</script>

<template>
  <div ref="rootElement" class="agentation-wrapper"></div>
</template>

<style scoped>
.agentation-wrapper {
  position: fixed;
  z-index: 9999;
}
</style>
