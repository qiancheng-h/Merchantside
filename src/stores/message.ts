import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface MessageItem {
  id: string;
  type: 'order' | 'approval';
  title: string;
  summary: string;
  content: string;
  time: string;
  isRead: boolean;
  referenceId?: string;
}

// Generate some mock messages
const mockMessages: MessageItem[] = [
  {
    id: 'm1',
    type: 'approval',
    title: '您的服务审批已通过',
    summary: '您提交的体检服务「五星体检-通用-门诊体检」已审批通过，服务已上线生效。',
    content: '您提交的体检服务「五星体检-通用-门诊体检」已审批通过，服务已上线生效。',
    time: '2026-02-26 18:15',
    isRead: false,
    referenceId: '1',
  },
  {
    id: 'm2',
    type: 'approval',
    title: '您的服务审批被驳回，请查看原因',
    summary: '您提交的体检服务「三星体检-通用-门诊体检」审批被驳回，驳回原因：价格设置超出平台限制（最高¥500），请调整后重新提交。',
    content: '您提交的体检服务「三星体检-通用-门诊体检」审批被驳回，驳回原因：价格设置超出平台限制（最高¥500），请调整后重新提交。',
    time: '2026-02-26 17:40',
    isRead: false,
    referenceId: '4',
  },
  {
    id: 'm3',
    type: 'order',
    title: '您有新订单待确认',
    summary: 'ORD202402250001 - 五星体检-男-门诊体检。（预约日期：2026-03-10），请及时确认。',
    content: 'ORD202402250001 - 五星体检-男-门诊体检。（预约日期：2026-03-10），请及时确认。',
    time: '2026-02-25 10:30',
    isRead: false,
    referenceId: 'ORD202402250001'
  },
  {
    id: 'm4',
    type: 'order',
    title: '客户已取消订单',
    summary: 'ORD202402240088 - 豪华大床房（预约日期：2026-03-05）。',
    content: 'ORD202402240088 - 豪华大床房（预约日期：2026-03-05）。',
    time: '2026-02-24 18:45',
    isRead: true,
  },
  {
    id: 'm5',
    type: 'order',
    title: '客户申请修改订单，请及时处理',
    summary: 'ORD202402230055 - 五星体检-男-门诊体检，请查看修改详情并确认。',
    content: 'ORD202402230055 - 五星体检-男-门诊体检，请查看修改详情并确认。',
    time: '2026-02-23 14:12',
    isRead: false,
    referenceId: 'ORD202402230055'
  },
];

export const useMessageStore = defineStore('message', () => {
  const messages = ref<MessageItem[]>(mockMessages);

  // Tab synchronization for unread count
  const SYNC_KEY = 'v-antigravity-unread-count';

  const unreadCount = computed(() => messages.value.filter(m => !m.isRead).length);

  // Sync to local storage whenever unread count changes
  // In a real app, this might just sync the trigger and re-fetch from the server.
  // Here we'll just broadcast the read status simply or sync the count.
  const syncUnreadCount = () => {
    localStorage.setItem(SYNC_KEY, unreadCount.value.toString());
  };

  const markAsRead = (id: string) => {
    const msg = messages.value.find(m => m.id === id);
    if (msg && !msg.isRead) {
      msg.isRead = true;
      syncUnreadCount();
      // Notify other tabs to reload or sync
      localStorage.setItem('v-antigravity-msg-sync', Date.now().toString());
    }
  };

  const markAllAsRead = () => {
    let changed = false;
    messages.value.forEach(m => {
      if (!m.isRead) {
        m.isRead = true;
        changed = true;
      }
    });
    if (changed) {
      syncUnreadCount();
      localStorage.setItem('v-antigravity-msg-sync', Date.now().toString());
    }
  };

  // Add event listener to sync state across tabs when changes occur
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'v-antigravity-msg-sync') {
        // In a real application, you'd re-fetch data from API here.
        // For mock data, we just assume that someone marked everything as read or we reload state.
        // As a simplification for mock, if we see a sync event we just mark all as read locally
        // if unread count is 0 in localstorage.
        const storedUnreadStr = localStorage.getItem(SYNC_KEY);
        if (storedUnreadStr) {
          const count = parseInt(storedUnreadStr, 10);
          if (count === 0 && unreadCount.value > 0) {
            messages.value.forEach(m => m.isRead = true);
          }
        }
      }
    });
    // Init local storage value on startup
    syncUnreadCount();
  }

  return {
    messages,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
});
