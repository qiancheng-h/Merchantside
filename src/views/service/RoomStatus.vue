<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs, { Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();

// ─── Room info from route query ───────────────────────────────────────────────
// Passed as query params: ?roomId=1&roomName=豪华大床房&status=approved
const roomName = computed(() => route.query.roomName as string || '未知房型');
const roomStatus = computed(() => route.query.status as string || '');

const isApproved = computed(() => roomStatus.value === 'approved');

// ─── Calendar state ───────────────────────────────────────────────────────────
const currentMonth = ref(dayjs());

// Map of date string → 'soldout' | 'available'
const dateStatusMap = reactive<Record<string, 'soldout' | 'available'>>({
  [dayjs().format('YYYY-MM-DD')]: 'available',
  [dayjs().add(2, 'day').format('YYYY-MM-DD')]: 'soldout',
  [dayjs().add(5, 'day').format('YYYY-MM-DD')]: 'soldout',
  [dayjs().add(8, 'day').format('YYYY-MM-DD')]: 'soldout',
});

// Selected dates (multi-select)
const selectedDates = ref<string[]>([]);

const toggleDate = (dateStr: string) => {
  if (!isApproved.value) return;
  const idx = selectedDates.value.indexOf(dateStr);
  if (idx >= 0) {
    selectedDates.value.splice(idx, 1);
  } else {
    selectedDates.value.push(dateStr);
  }
};

const isSelected = (dateStr: string) => selectedDates.value.includes(dateStr);
const isSoldOut = (dateStr: string) => dateStatusMap[dateStr] === 'soldout';
const isToday = (date: Dayjs) => date.isSame(dayjs(), 'day');
const isPast = (date: Dayjs) => date.isBefore(dayjs(), 'day');

// ─── Batch actions ────────────────────────────────────────────────────────────
const setSoldOut = () => {
  selectedDates.value.forEach(d => { dateStatusMap[d] = 'soldout'; });
  message.success(`已将 ${selectedDates.value.length} 个日期设为售罄`);
  selectedDates.value = [];
};

const cancelSoldOut = () => {
  selectedDates.value.forEach(d => { dateStatusMap[d] = 'available'; });
  message.success(`已将 ${selectedDates.value.length} 个日期取消售罄`);
  selectedDates.value = [];
};

const clearSelection = () => { selectedDates.value = []; };

// ─── Save ─────────────────────────────────────────────────────────────────────
const saving = ref(false);
const handleSave = () => {
  saving.value = true;
  setTimeout(() => {
    saving.value = false;
    message.success('房态设置已保存');
    router.back();
  }, 800);
};

const handleCancel = () => { router.back(); };

// ─── Calendar helpers ─────────────────────────────────────────────────────────
const daysInMonth = computed(() => {
  const start = currentMonth.value.startOf('month');
  const end = currentMonth.value.endOf('month');
  const days: Dayjs[] = [];
  let cur = start;
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    days.push(cur);
    cur = cur.add(1, 'day');
  }
  return days;
});

// Leading empty cells for first-day-of-week alignment (Mon=0)
const leadingBlanks = computed(() => {
  const dow = currentMonth.value.startOf('month').day(); // 0=Sun
  return dow === 0 ? 6 : dow - 1; // convert to Mon-first
});

const prevMonth = () => { currentMonth.value = currentMonth.value.subtract(1, 'month'); };
const nextMonth = () => { currentMonth.value = currentMonth.value.add(1, 'month'); };

onMounted(() => {
  // If accessed directly without proper context, we still show the page
});
</script>

<template>
  <div class="room-status-page" style="padding: 24px; max-width: 900px; margin: 0 auto;">
    <!-- Page header -->
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
      <a-button type="text" @click="handleCancel" style="padding: 0;">
        <template #icon><ArrowLeftOutlined /></template>
      </a-button>
      <div>
        <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0;">房态管控</h2>
        <div style="font-size: 13px; color: #8c8c8c; margin-top: 2px;">{{ roomName }}</div>
      </div>
    </div>

    <!-- Non-approved alert -->
    <a-alert
      v-if="!isApproved"
      type="warning"
      show-icon
      message="当前房型未审批通过，无法进行房态管控"
      description="仅审批通过的房型可以设置房态。请先完成审批流程。"
      style="margin-bottom: 24px;"
    />

    <a-row :gutter="24">
      <!-- Calendar -->
      <a-col :span="16">
        <a-card :bordered="false" style="box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
          <!-- Month nav -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <a-button type="text" @click="prevMonth">‹</a-button>
            <span style="font-size: 16px; font-weight: 600;">{{ currentMonth.format('YYYY年 MM月') }}</span>
            <a-button type="text" @click="nextMonth">›</a-button>
          </div>

          <!-- Weekday headers -->
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 8px;">
            <div
              v-for="d in ['一','二','三','四','五','六','日']"
              :key="d"
              style="text-align: center; font-size: 12px; color: #8c8c8c; padding: 4px 0;"
            >{{ d }}</div>
          </div>

          <!-- Date grid -->
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
            <!-- Leading blanks -->
            <div v-for="i in leadingBlanks" :key="`blank-${i}`" />

            <!-- Days -->
            <div
              v-for="day in daysInMonth"
              :key="day.format('YYYY-MM-DD')"
              @click="!isPast(day) && toggleDate(day.format('YYYY-MM-DD'))"
              :style="{
                position: 'relative',
                borderRadius: '6px',
                padding: '6px 4px',
                textAlign: 'center',
                cursor: isPast(day) || !isApproved ? 'not-allowed' : 'pointer',
                background: isSelected(day.format('YYYY-MM-DD'))
                  ? '#006738'
                  : isSoldOut(day.format('YYYY-MM-DD'))
                  ? '#fff1f0'
                  : isToday(day)
                  ? '#f6ffed'
                  : '#fafafa',
                border: isToday(day) ? '1px solid #52c41a' : '1px solid #f0f0f0',
                opacity: isPast(day) ? 0.4 : 1,
                transition: 'all 0.15s',
              }"
            >
              <div :style="{ fontSize: '14px', fontWeight: isToday(day) ? '700' : '400', color: isSelected(day.format('YYYY-MM-DD')) ? '#fff' : '#262626' }">
                {{ day.date() }}
              </div>
              <div style="font-size: 10px; margin-top: 2px; height: 14px;">
                <span v-if="isSoldOut(day.format('YYYY-MM-DD')) && !isSelected(day.format('YYYY-MM-DD'))" style="color: #ff4d4f;">售罄</span>
                <span v-else-if="isSelected(day.format('YYYY-MM-DD'))" style="color: rgba(255,255,255,0.85);">已选</span>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div style="display: flex; gap: 16px; margin-top: 16px; font-size: 12px; color: #8c8c8c;">
            <span><span style="display:inline-block;width:12px;height:12px;background:#006738;border-radius:2px;margin-right:4px;vertical-align:middle;"></span>已选中</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#fff1f0;border:1px solid #ffccc7;border-radius:2px;margin-right:4px;vertical-align:middle;"></span>售罄</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#f6ffed;border:1px solid #52c41a;border-radius:2px;margin-right:4px;vertical-align:middle;"></span>今日</span>
            <span><span style="display:inline-block;width:12px;height:12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:2px;margin-right:4px;vertical-align:middle;"></span>可售</span>
          </div>
        </a-card>
      </a-col>

      <!-- Control panel -->
      <a-col :span="8">
        <a-card :bordered="false" style="box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
          <template #title>
            <span style="font-weight: 600;">批量操作</span>
          </template>

          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; color: #595959; margin-bottom: 8px;">
              已选日期：<strong style="color: #006738;">{{ selectedDates.length }}</strong> 天
            </div>
            <div v-if="selectedDates.length > 0" style="font-size: 12px; color: #8c8c8c; max-height: 80px; overflow-y: auto;">
              <a-tag v-for="d in selectedDates.slice(0, 6)" :key="d" style="margin-bottom: 4px; font-size: 11px;">{{ d }}</a-tag>
              <span v-if="selectedDates.length > 6">...等{{ selectedDates.length }}天</span>
            </div>
            <a-empty v-else description="请在日历中点击选择日期" :image-style="{ height: '40px' }" style="margin: 8px 0;" />
          </div>

          <a-divider style="margin: 12px 0;" />

          <a-space direction="vertical" style="width: 100%;">
            <a-button
              block
              danger
              :disabled="!isApproved || selectedDates.length === 0"
              @click="setSoldOut"
            >
              设为售罄
            </a-button>
            <a-button
              block
              :disabled="!isApproved || selectedDates.length === 0"
              @click="cancelSoldOut"
            >
              取消售罄
            </a-button>
            <a-button
              block
              :disabled="selectedDates.length === 0"
              @click="clearSelection"
            >
              清空选择
            </a-button>
          </a-space>

          <a-divider style="margin: 16px 0;" />

          <!-- Summary stats -->
          <div style="font-size: 12px; color: #8c8c8c;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span>本月售罄天数</span>
              <strong style="color: #ff4d4f;">
                {{ Object.entries(dateStatusMap).filter(([d, s]) => s === 'soldout' && d.startsWith(currentMonth.format('YYYY-MM'))).length }} 天
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>本月可售天数</span>
              <strong style="color: #52c41a;">
                {{ daysInMonth.filter(d => !isPast(d) && dateStatusMap[d.format('YYYY-MM-DD')] !== 'soldout').length }} 天
              </strong>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- Footer actions -->
    <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
      <a-button @click="handleCancel">取消不保存</a-button>
      <a-button
        type="primary"
        :loading="saving"
        :disabled="!isApproved"
        @click="handleSave"
        style="background: #006738; border-color: #006738;"
      >
        确认保存
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.room-status-page :deep(.ant-card-body) {
  padding: 20px;
}
</style>
