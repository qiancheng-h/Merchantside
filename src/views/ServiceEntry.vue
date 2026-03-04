<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// import { PageHeader } from 'ant-design-vue';

const router = useRouter();
const route = useRoute();
const activeKey = ref<string>('medical-service');

// Sync tab with route
watch(
  () => route.name,
  (newName) => {
    if (newName) {
      activeKey.value = newName as string;
    }
  },
  { immediate: true }
);

const handleTabChange = (key: string) => {
  activeKey.value = key;
  router.push({ name: key });
};
</script>

<template>
  <div class="service-entry">
    <a-page-header
      style="background: #fff; padding: 16px 24px; margin-bottom: 0;"
      title="服务管理"
      sub-title="管理各类服务信息（体检、房型、预定服务）"
    >
        <template #extra>
             <!-- No main action here, actions are generally inside the lists -->
        </template>
        <template #footer>
            <a-tabs v-model:activeKey="activeKey" @change="handleTabChange">
                <a-tab-pane key="medical-service" tab="体检服务管理" />
                <a-tab-pane key="hotel-service" tab="房型管理" />
                <a-tab-pane key="booking-service" tab="预定服务类管理" />
            </a-tabs>
        </template>
    </a-page-header>
    
    <div class="service-content" style="background: #fff; padding: 24px; min-height: 400px; margin-top: 16px;">
        <router-view />
    </div>
  </div>
</template>

<style scoped>
/* PageHeader styles usually fine by default */
</style>
