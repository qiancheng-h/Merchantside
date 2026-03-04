<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import AgentationWrapper from './components/AgentationWrapper.vue';

dayjs.locale('zh-cn');

const theme = {
  token: {
    colorPrimary: '#006738',
  },
};

const isDev = import.meta.env.DEV;
</script>

<template>
  <ConfigProvider :locale="zhCN" :theme="theme">
    <router-view />
    <AgentationWrapper v-if="isDev" />
  </ConfigProvider>
</template>

<style>
/* Global styles if needed */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
