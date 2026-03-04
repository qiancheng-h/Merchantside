<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  UserOutlined,
  ShopOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();

const selectedKeys = computed(() => {
    if (route.path.includes('/service/medical-schedule')) return ['medical-schedule'];
    if (route.path.includes('/service/medical-branch')) return ['medical-branch'];
    if (route.path.includes('/service/medical')) return ['medical-service'];
    if (route.path.includes('/service/hotel')) return ['hotel-service'];
    if (route.path.includes('/service/booking')) return ['booking-service'];
    if (route.path.startsWith('/service')) return ['service'];
    if (route.path.startsWith('/order/hotel')) return ['order-hotel'];
    if (route.path.startsWith('/order/medical')) return ['order-medical'];
    if (route.path.startsWith('/order/booking')) return ['order-booking'];
    if (route.path.startsWith('/product')) return ['product'];
    if (route.path.startsWith('/merchant-info')) return ['merchant-info'];
    if (route.path.startsWith('/user')) return ['user'];
    if (route.path.startsWith('/profile')) return []; // Profile doesn't highlight sidebar
    return [];
});

const openKeys = ref<string[]>(['service', 'service-operations']);
const collapsed = ref(false);
const toggleCollapse = () => { collapsed.value = !collapsed.value; };

import { useMessageStore } from '@/stores/message';
import { merchantInfo } from '@/mock/merchantData';

// Notification
const messageStore = useMessageStore();

const handleNotifClick = () => {
  router.push('/message');
};

const handleMenuClick = (e: any) => {
    if (e.key === 'medical-service') router.push('/service/medical');
    else if (e.key === 'medical-schedule') router.push('/service/medical-schedule');
    else if (e.key === 'medical-branch') router.push('/service/medical-branch');
    else if (e.key === 'hotel-service') router.push('/service/hotel');
    else if (e.key === 'booking-service') router.push('/service/booking');
    else if (e.key === 'service') router.push('/service');
    else if (e.key === 'order-hotel') router.push('/order/hotel');
    else if (e.key === 'order-medical') router.push('/order/medical');
    else if (e.key === 'order-booking') router.push('/order/booking');
    else if (e.key === 'user') router.push('/user');
    else if (e.key === 'merchant-info') router.push('/merchant-info');
};

const goToProfile = () => {
    router.push('/profile');
};
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-header style="background: #fff; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,21,41,.08); z-index: 1;">
      <div class="logo" style="font-size: 20px; font-weight: bold; color: #006738;">
        V 享+商家平台
      </div>
      <div class="header-right" style="display: flex; align-items: center; gap: 20px;">
        <div @click="handleNotifClick" style="display: flex; align-items: center; cursor: pointer;">
          <a-badge :count="messageStore.unreadCount" :offset="[4, -4]">
            <BellOutlined style="font-size: 20px; color: #595959;" />
          </a-badge>
        </div>
        <a-dropdown placement="bottomRight">
          <a-avatar style="background-color: #006738; cursor: pointer;">商</a-avatar>
          <template #overlay>
            <a-menu>
              <a-menu-item key="profile" @click="goToProfile">
                <UserOutlined style="margin-right: 8px;" />
                个人中心
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout" style="color: #f5222d;">
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </a-layout-header>
    <a-layout>
      <a-layout-sider
        :width="240"
        :collapsed="collapsed"
        :collapsed-width="56"
        :trigger="null"
        style="background: #fff; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column;"
      >
        <a-menu
          v-model:selectedKeys="selectedKeys"
          v-model:openKeys="openKeys"
          mode="inline"
          :inline-collapsed="collapsed"
          style="border-right: 0; flex: 1; overflow-y: auto;"
          @click="handleMenuClick"
        >
          <a-sub-menu key="service">
            <template #icon><AppstoreOutlined /></template>
            <template #title>服务管理</template>
            <a-menu-item key="medical-service">体检服务管理</a-menu-item>
            <a-menu-item key="hotel-service">酒店房型管理</a-menu-item>
            <a-menu-item key="booking-service">预定服务管理</a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="service-operations">
            <template #icon><OrderedListOutlined /></template>
            <template #title>服务项目运营</template>
            <a-menu-item key="medical-schedule">体检档期管理</a-menu-item>
            <a-menu-item key="medical-branch">体检分院管理</a-menu-item>
          </a-sub-menu>
          <a-menu-item key="product" disabled>
            <template #icon><ShoppingOutlined /></template>
            <span>商品管理</span>
          </a-menu-item>
          <a-sub-menu key="order">
            <template #icon><OrderedListOutlined /></template>
            <template #title>订单管理</template>
            <a-menu-item key="order-medical">体检服务订单</a-menu-item>
            <a-menu-item key="order-hotel">酒店服务订单</a-menu-item>
            <a-menu-item key="order-booking">预定服务订单</a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="system">
            <template #icon><SettingOutlined /></template>
            <template #title>系统管理</template>
            <a-menu-item key="user">
              <template #icon><UserOutlined /></template>
              <span>用户管理</span>
            </a-menu-item>
            <a-menu-item key="merchant-info">
              <template #icon><ShopOutlined /></template>
              <span>商家信息管理</span>
            </a-menu-item>
          </a-sub-menu>
        </a-menu>

        <!-- Collapse toggle -->
        <div
          @click="toggleCollapse"
          :title="collapsed ? '展开菜单' : '收起菜单'"
          style="
            display: flex; align-items: center; justify-content: center;
            height: 48px; cursor: pointer;
            border-top: 1px solid #f0f0f0;
            color: #8c8c8c; font-size: 16px;
            transition: color 0.2s;
            flex-shrink: 0;
          "
          class="collapse-btn"
        >
          <MenuUnfoldOutlined v-if="collapsed" />
          <MenuFoldOutlined v-else />
        </div>
      </a-layout-sider>
      <a-layout-content style="margin: 0; padding: 24px; background: #f5f7fa; overflow-y: auto;">

        <a-alert
          v-if="!merchantInfo.desc || !merchantInfo.businessLicense || !merchantInfo.serviceAgreement"
          type="warning"
          show-icon
          style="margin-bottom: 24px;"
        >
          <template #message>
            您的商家资质信息暂未完善，为了不影响服务的正常上架与订单接收，请尽快
            <a @click="router.push('/merchant-info')" style="font-weight: 600; text-decoration: underline;">前往完善</a>
          </template>
        </a-alert>

        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
:deep(.ant-menu-item-selected) {
    background-color: #e6f7ef !important;
    color: #006738 !important;
}
:deep(.ant-menu-title-content) {
    font-weight: 500;
}
:deep(.ant-layout-sider-children) {
    display: flex;
    flex-direction: column;
    height: 100%;
}
.collapse-btn:hover {
    color: #006738;
    background-color: #f6ffed;
}
</style>
