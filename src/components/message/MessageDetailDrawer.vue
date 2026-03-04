<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { MessageItem } from '@/stores/message';

const props = defineProps<{
  open: boolean;
  messageData?: MessageItem;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();

const router = useRouter();

const handleClose = () => {
  emit('update:open', false);
};

import { hotelOrders, medicalOrders, bookingOrders } from '@/mock/orderData';

const handleProcess = () => {
  if (!props.messageData) return;

  const { type, referenceId } = props.messageData;

  if (type === 'order' && referenceId) {
    if (hotelOrders.find(o => o.orderNo === referenceId)) {
      router.push({ path: '/order/hotel', query: { action: 'view', id: referenceId } });
      handleClose();
      return;
    }
    if (medicalOrders.find(o => o.orderNo === referenceId)) {
      router.push({ path: '/order/medical', query: { action: 'view', id: referenceId } });
      handleClose();
      return;
    }
    if (bookingOrders.find(o => o.orderNo === referenceId)) {
      router.push({ path: '/order/booking', query: { action: 'view', id: referenceId } });
      handleClose();
      return;
    }
    message.error('关联内容已不存在');
    return;
  }

  if (type === 'approval' && referenceId) {
    router.push({ path: '/service/medical', query: { action: 'view', id: referenceId } });
    handleClose();
    return;
  }

  message.error('未知的消息类型或缺少关联数据');
  handleClose();
};

const typeLabel = computed(() => {
  if (props.messageData?.type === 'order') return '订单';
  if (props.messageData?.type === 'approval') return '审批';
  return '系统';
});

const typeColor = computed(() => {
  if (props.messageData?.type === 'order') return '#1890ff';
  if (props.messageData?.type === 'approval') return '#faad14';
  return '#1890ff';
});

</script>

<template>
  <a-drawer
    :open="open"
    title="消息详情"
    placement="right"
    :width="600"
    :footer-style="{ textAlign: 'right' }"
    @close="handleClose"
  >
    <div v-if="messageData" class="message-detail-content">
      <!-- Meta info -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 13px;">
        <a-tag :color="typeColor" style="margin-right: 0;">{{ typeLabel }}</a-tag>
        <span style="color: #8c8c8c;">|</span>
        <span style="color: #8c8c8c;">{{ messageData.time }}</span>
      </div>

      <!-- Title -->
      <h3 style="font-size: 18px; font-weight: 600; color: #262626; margin-bottom: 24px;">
        {{ messageData.title }}
      </h3>

      <!-- Content -->
      <div style="font-size: 14px; color: #595959; line-height: 1.6; white-space: pre-wrap;">
        {{ messageData.content }}
      </div>
    </div>

    <div v-else style="padding: 40px; text-align: center; color: #8c8c8c;">
      未选择消息内容
    </div>

    <!-- Footer buttons -->
    <template #footer>
      <a-button @click="handleClose" style="margin-right: 8px;">关闭</a-button>
      <a-button type="primary" @click="handleProcess" style="background: #006738; border-color: #006738;">
        前往处理
      </a-button>
    </template>
  </a-drawer>
</template>

<style scoped>
.message-detail-content {
  padding: 8px 0;
}
</style>
