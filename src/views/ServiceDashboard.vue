<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { PlusOutlined } from '@ant-design/icons-vue';

const router = useRouter();

// Modal state
const createModalVisible = ref(false);
const selectedServiceType = ref<string | undefined>(undefined);

// Mock statistics data
const serviceStats = [
  {
    key: 'medical',
    name: '体检服务管理',
    route: '/service/medical',
    stats: {
      draft: 12,
      pending: 5,
      approved: 38,
      rejected: 3
    }
  },
  {
    key: 'hotel',
    name: '酒店房型管理',
    route: '/service/hotel',
    stats: {
      draft: 8,
      pending: 2,
      approved: 25,
      rejected: 1
    }
  },
  {
    key: 'booking',
    name: '预定服务类管理',
    route: '/service/booking',
    stats: {
      draft: 6,
      pending: 3,
      approved: 18,
      rejected: 2
    }
  }
];

const handleCreateService = () => {
  createModalVisible.value = true;
  selectedServiceType.value = undefined;
};

const handleModalOk = () => {
  if (!selectedServiceType.value) {
    return;
  }
  
  createModalVisible.value = false;
  
  // Navigate to the selected service page
  const serviceMap: Record<string, string> = {
    medical: '/service/medical',
    hotel: '/service/hotel',
    booking: '/service/booking'
  };
  
  const route = serviceMap[selectedServiceType.value];
  if (route) {
    // Navigate and trigger drawer open via query parameter
    router.push({ path: route, query: { action: 'create' } });
  }
};

const handleModalCancel = () => {
  createModalVisible.value = false;
  selectedServiceType.value = undefined;
};

const handleEnterManagement = (route: string) => {
  router.push(route);
};

const handleTabChange = (key: string) => {
  const serviceMap: Record<string, string> = {
    'medical': '/service/medical',
    'hotel': '/service/hotel',
    'booking': '/service/booking'
  };
  
  const route = serviceMap[key];
  if (route) {
    router.push(route);
  }
};
</script>

<template>
  <div class="service-dashboard">
    <!-- Page Header -->
    <a-page-header
      title="服务管理"
      sub-title="管理体检服务、酒店房型与预定服务的信息维护与审批"
      style="background: #fff; margin-bottom: 24px; padding: 24px;"
    >
      <template #extra>
        <a-button type="primary" @click="handleCreateService">
          <PlusOutlined /> 新建服务
        </a-button>
      </template>
    </a-page-header>

    <!-- Tabs Navigation -->
    <div style="background: #fff; padding: 0 24px; margin-bottom: 24px;">
      <a-tabs @tabClick="handleTabChange">
        <a-tab-pane key="medical" tab="体检服务管理" />
        <a-tab-pane key="hotel" tab="酒店房型管理" />
        <a-tab-pane key="booking" tab="预定服务类管理" />
      </a-tabs>
    </div>

    <!-- Overview Cards -->
    <a-row :gutter="24">
      <a-col :span="8" v-for="service in serviceStats" :key="service.key">
        <a-card 
          :title="service.name" 
          :bordered="false"
          style="margin-bottom: 24px;"
        >
          <div class="stats-container">
            <div class="stat-item">
              <a-tag color="default">草稿</a-tag>
              <span class="stat-number">{{ service.stats.draft }}</span>
            </div>
            <div class="stat-item">
              <a-tag color="processing">待审批</a-tag>
              <span class="stat-number">{{ service.stats.pending }}</span>
            </div>
            <div class="stat-item">
              <a-tag color="success">审批通过</a-tag>
              <span class="stat-number">{{ service.stats.approved }}</span>
            </div>
            <div class="stat-item">
              <a-tag color="error">已驳回</a-tag>
              <span class="stat-number">{{ service.stats.rejected }}</span>
            </div>
          </div>
          
          <template #actions>
            <a-button 
              type="primary" 
              block 
              @click="handleEnterManagement(service.route)"
            >
              进入管理
            </a-button>
          </template>
        </a-card>
      </a-col>
    </a-row>

    <!-- Create Service Modal -->
    <a-modal
      v-model:open="createModalVisible"
      title="选择服务类型"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :ok-button-props="{ disabled: !selectedServiceType }"
    >
      <a-radio-group v-model:value="selectedServiceType" style="width: 100%;">
        <a-space direction="vertical" style="width: 100%;" :size="16">
          <a-radio value="medical" style="width: 100%; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 500; font-size: 16px;">体检服务</span>
              <span style="color: #8c8c8c; font-size: 14px; margin-top: 4px;">创建体检套餐服务</span>
            </div>
          </a-radio>
          <a-radio value="hotel" style="width: 100%; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 500; font-size: 16px;">酒店房型</span>
              <span style="color: #8c8c8c; font-size: 14px; margin-top: 4px;">创建酒店房型信息</span>
            </div>
          </a-radio>
          <a-radio value="booking" style="width: 100%; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px;">
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 500; font-size: 16px;">预定服务</span>
              <span style="color: #8c8c8c; font-size: 14px; margin-top: 4px;">创建预定类服务项目</span>
            </div>
          </a-radio>
        </a-space>
      </a-radio-group>
    </a-modal>
  </div>
</template>

<style scoped>
.service-dashboard {
  padding: 0;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-card-head) {
  background: #fafafa;
  border-bottom: 2px solid #006738;
}

:deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

:deep(.ant-card-actions) {
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

:deep(.ant-radio-wrapper) {
  margin: 0 !important;
}

:deep(.ant-radio-wrapper:hover) {
  border-color: #006738 !important;
}

:deep(.ant-radio-wrapper-checked) {
  border-color: #006738 !important;
  background: #f6ffed;
}
</style>
