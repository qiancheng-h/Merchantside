<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from 'ant-design-vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';

const props = defineProps<{
  visible: boolean;
  record?: any;
}>();

const emit = defineEmits(['update:visible']);

const loading = ref(false);

// Current month being viewed
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth()); // 0-indexed

// Set of "YYYY-MM-DD" strings that are marked as 满房 (full)
const fullDays = ref<Set<string>>(new Set());

// Reset when drawer opens
watch(
  () => props.visible,
  (val) => {
    if (val) {
      currentYear.value = today.getFullYear();
      currentMonth.value = today.getMonth();
      fullDays.value = new Set();
    }
  }
);

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value, 1);
  return `${currentYear.value}年${currentMonth.value + 1}月`;
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// Build calendar grid: array of weeks, each week is 7 days (null = padding)
const calendarWeeks = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
});

const pad = (n: number) => String(n).padStart(2, '0');

const dateKey = (day: number) =>
  `${currentYear.value}-${pad(currentMonth.value + 1)}-${pad(day)}`;

const isFull = (day: number) => fullDays.value.has(dateKey(day));

const isPast = (day: number) => {
  const d = new Date(currentYear.value, currentMonth.value, day);
  d.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d < t;
};

const isToday = (day: number) => {
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  );
};

const toggleDay = (day: number | null) => {
  if (!day || isPast(day)) return;
  const key = dateKey(day);
  if (fullDays.value.has(key)) {
    fullDays.value.delete(key);
  } else {
    fullDays.value.add(key);
  }
  // trigger reactivity
  fullDays.value = new Set(fullDays.value);
};

const handleClose = () => emit('update:visible', false);

const handleSave = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    const count = fullDays.value.size;
    message.success(count > 0 ? `已将 ${count} 天设为满房` : '房态已保存（全部有房）');
    handleClose();
  }, 500);
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
</script>

<template>
  <a-drawer
    :open="visible"
    :title="record ? `房态管控 · ${record.name}` : '房态管控'"
    :width="560"
    :footer-style="{ textAlign: 'right' }"
    @close="handleClose"
  >
    <!-- Legend -->
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; font-size: 13px; color: #595959;">
      <span>
        <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#f6ffed;border:1px solid #b7eb8f;vertical-align:middle;margin-right:4px;"></span>有房（可订）
      </span>
      <span>
        <span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#fff1f0;border:1px solid #ffa39e;vertical-align:middle;margin-right:4px;"></span>满房（不可订）
      </span>
      <span style="color:#bfbfbf; font-size:12px;">· 点击日期切换状态，过去日期不可编辑</span>
    </div>

    <!-- Month navigator -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <a-button type="text" size="small" @click="prevMonth">
        <template #icon><LeftOutlined /></template>
      </a-button>
      <span style="font-size: 15px; font-weight: 600; color: #262626;">{{ monthLabel }}</span>
      <a-button type="text" size="small" @click="nextMonth">
        <template #icon><RightOutlined /></template>
      </a-button>
    </div>

    <!-- Calendar grid -->
    <div class="cal-grid">
      <!-- Week header -->
      <div class="cal-row cal-header">
        <div v-for="wd in weekDays" :key="wd" class="cal-cell cal-head-cell">{{ wd }}</div>
      </div>
      <!-- Day rows -->
      <div v-for="(week, wi) in calendarWeeks" :key="wi" class="cal-row">
        <div
          v-for="(day, di) in week"
          :key="di"
          class="cal-cell cal-day-cell"
          :class="{
            'cal-empty': !day,
            'cal-full': day && isFull(day),
            'cal-available': day && !isFull(day),
            'cal-past': day && isPast(day),
            'cal-today': day && isToday(day),
          }"
          @click="toggleDay(day)"
        >
          <template v-if="day">
            <span class="cal-day-num">{{ day }}</span>
            <span class="cal-day-label">{{ isFull(day) ? '满房' : '有房' }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div style="margin-top: 16px; font-size: 13px; color: #8c8c8c;">
      已标记 <strong style="color: #ff4d4f;">{{ fullDays.size }}</strong> 天为满房
    </div>

    <template #footer>
      <a-space>
        <a-button @click="handleClose">取消</a-button>
        <a-button type="primary" :loading="loading" style="background:#006738; border-color:#006738;" @click="handleSave">保存设置</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<style scoped>
.cal-grid {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.cal-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.cal-header {
  background: #fafafa;
}

.cal-cell {
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.cal-cell:last-child {
  border-right: none;
}

.cal-row:last-child .cal-cell {
  border-bottom: none;
}

.cal-head-cell {
  min-height: 36px;
  font-size: 12px;
  font-weight: 600;
  color: #8c8c8c;
}

.cal-day-cell {
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.cal-empty {
  background: #fafafa;
  cursor: default;
}

.cal-available {
  background: #f6ffed;
}

.cal-available:hover {
  background: #d9f7be;
}

.cal-full {
  background: #fff1f0;
}

.cal-full:hover {
  background: #ffd8d8;
}

.cal-past {
  opacity: 0.45;
  cursor: not-allowed;
}

.cal-past:hover {
  background: inherit;
}

.cal-today .cal-day-num {
  background: #006738;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.cal-day-num {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  line-height: 1;
}

.cal-day-label {
  font-size: 11px;
  color: #8c8c8c;
}

.cal-full .cal-day-label {
  color: #ff4d4f;
  font-weight: 600;
}

.cal-available .cal-day-label {
  color: #52c41a;
}
</style>
