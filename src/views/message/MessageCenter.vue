<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMessageStore, type MessageItem } from '@/stores/message';
import { Modal, message } from 'ant-design-vue';
import { hotelOrders, medicalOrders, bookingOrders } from '@/mock/orderData';

const messageStore = useMessageStore();

// ─── Filter State ─────────────────────────────────────────────────────────────
const activeTab = ref('all'); // all, order, approval
const readStatusFilter = ref('all'); // all, unread

// ─── Pagination State ─────────────────────────────────────────────────────────
const currentPage = ref(1);
const pageSize = ref(20);

// ─── Computed List ────────────────────────────────────────────────────────────
const filteredMessages = computed(() => {
  let list = [...messageStore.messages];

  // 1. Sort by time descending (newest first)
  list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // 2. Filter by tab layout
  if (activeTab.value === 'order') {
    list = list.filter(m => m.type === 'order');
  } else if (activeTab.value === 'approval') {
    list = list.filter(m => m.type === 'approval');
  }

  // 3. Filter by read status
  if (readStatusFilter.value === 'unread') {
    list = list.filter(m => !m.isRead);
  }

  return list;
});

const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredMessages.value.slice(start, start + pageSize.value);
});

// ─── Actions ──────────────────────────────────────────────────────────────────
const handleMarkAllRead = () => {
  Modal.confirm({
    title: '确认将所有消息标为已读？',
    content: '此操作将把当前视图下所有未读消息标记为已读，且不可撤销。',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      messageStore.markAllAsRead();
      message.success('已全部标记为已读');
    },
  });
};

const handlePageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
};

import { useRouter } from 'vue-router';

// ─── Modal State ─────────────────────────────────────────────────────────────
const modalVisible = ref(false);
const selectedMessage = ref<MessageItem | undefined>(undefined);

const router = useRouter();

const handleItemClick = (msg: MessageItem) => {
  // Mark as read immediately
  messageStore.markAsRead(msg.id);

  if (msg.type === 'order' && msg.referenceId) {
    if (hotelOrders.find(o => o.orderNo === msg.referenceId)) {
      router.push({ path: '/order/hotel', query: { action: 'view', id: msg.referenceId } });
      return;
    }
    if (medicalOrders.find(o => o.orderNo === msg.referenceId)) {
      router.push({ path: '/order/medical', query: { action: 'view', id: msg.referenceId } });
      return;
    }
    if (bookingOrders.find(o => o.orderNo === msg.referenceId)) {
      router.push({ path: '/order/booking', query: { action: 'view', id: msg.referenceId } });
      return;
    }
  }

  if (msg.type === 'approval' && msg.referenceId) {
    router.push({ path: '/service/medical', query: { action: 'view', id: msg.referenceId } });
    return;
  }

  // Fallback to text modal
  selectedMessage.value = msg;
  modalVisible.value = true;
};

// Formatting helpers
const getTypeLabel = (type: string) => (type === 'order' ? '订单类' : '审批类');

</script>

<template>
  <div class="message-center-page" style="background: #fff; padding: 24px; border-radius: 8px; min-height: calc(100vh - 110px);">
    <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0 0 24px 0;">消息中心</h2>

    <!-- Toolbar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #f0f0f0;">
      <!-- Tabs -->
      <a-tabs v-model:activeKey="activeTab" :tabBarStyle="{ marginBottom: 0, borderBottom: 'none' }">
        <a-tab-pane key="all" tab="全部" />
        <a-tab-pane key="order" tab="订单消息" />
        <a-tab-pane key="approval" tab="审批消息" />
      </a-tabs>

      <!-- Right Actions -->
      <div style="display: flex; align-items: center; gap: 16px; padding-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px; color: #595959;">状态:</span>
          <a-select v-model:value="readStatusFilter" style="width: 120px;" size="middle">
            <a-select-option value="all">全部</a-select-option>
            <a-select-option value="unread">未读</a-select-option>
          </a-select>
        </div>
        <a-button @click="handleMarkAllRead" :disabled="messageStore.unreadCount === 0">全部已读</a-button>
      </div>
    </div>

    <!-- Message List -->
    <div v-if="paginatedMessages.length > 0" class="message-list">
      <div
        v-for="msg in paginatedMessages"
        :key="msg.id"
        class="message-card"
        @click="handleItemClick(msg)"
      >
        <!-- Unread Indicator -->
        <div class="unread-indicator">
          <div v-if="!msg.isRead" class="orange-dot"></div>
        </div>

        <div class="message-content">
          <!-- Row 1: Type + Title -->
          <div class="message-title-row">
            <div class="title-left">
              <div class="type-tag" :class="msg.type === 'order' ? 'tag-blue' : 'tag-orange'">
                {{ getTypeLabel(msg.type) }}
              </div>
              <span class="title-text" :class="{ 'is-read': msg.isRead, 'is-unread': !msg.isRead }">{{ msg.title }}</span>
            </div>
            <!-- Time on the right -->
            <div class="message-time">
              {{ msg.time }}
            </div>
          </div>

          <!-- Row 2: Summary -->
          <div class="message-summary">
            {{ msg.summary }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else style="padding: 100px 0;">
      <a-empty
        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
        :image-style="{ height: '120px' }"
      >
        <template #description>
          <span style="color: #bfbfbf;">暂无消息</span>
        </template>
      </a-empty>
    </div>

    <!-- Pagination -->
    <div v-if="filteredMessages.length > 0" style="margin-top: 24px; display: flex; justify-content: flex-end;">
      <a-pagination
        v-model:current="currentPage"
        v-model:pageSize="pageSize"
        :total="filteredMessages.length"
        :show-size-changer="true"
        :page-size-options="['10', '20', '50']"
        @change="handlePageChange"
        show-quick-jumper
        :show-total="(total: number) => `共 ${total} 条`"
      />
    </div>

    <!-- Detail Modal -->
    <a-modal
      v-model:open="modalVisible"
      title="消息详情"
      :footer="null"
      :width="600"
    >
      <div v-if="selectedMessage" style="padding: 10px 0;">
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #262626;">{{ selectedMessage.title }}</h3>
        <p style="font-size: 14px; color: #8c8c8c; margin-bottom: 16px;">{{ selectedMessage.time }}</p>
        <div style="font-size: 15px; color: #595959; line-height: 1.6;">
          {{ selectedMessage.content }}
        </div>
      </div>
    </a-modal>

    <!-- Removed Order Detail Drawer since we navigate -->
  </div>
</template>

<style scoped>
.message-card {
  display: flex;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  align-items: flex-start;
}
.message-card:hover {
  background-color: #fafafa;
}

.unread-indicator {
  width: 24px;
  display: flex;
  justify-content: flex-start;
  padding-top: 8px;
  flex-shrink: 0;
}
.orange-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #fa8c16;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.title-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding-right: 16px;
}

.type-tag {
  display: inline-block;
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  border-radius: 10px;
  margin-right: 8px;
  white-space: nowrap;
}
.tag-blue {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
.tag-orange {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.title-text {
  font-size: 16px;
  color: #262626;
  white-space: nowrap;
  /* Ensure it doesn't truncate early, but we still want ellipsis if the viewport is extremely narrow */
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-text.is-unread {
  font-weight: 600;
  color: #52c41a; /* Green font for unread */
}

.title-text.is-read {
  font-weight: 400;
  color: #595959; /* Normal deep color for read */
}

.message-summary {
  font-size: 14px;
  color: #595959;

  /* Multiline truncation for up to 2 lines */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}

.message-time {
  font-size: 13px;
  color: #bfbfbf;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
