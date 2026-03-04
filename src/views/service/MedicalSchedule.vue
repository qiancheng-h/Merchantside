<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SearchOutlined, ReloadOutlined, PlusOutlined, OrderedListOutlined } from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { medicalBranches } from '@/mock/medicalBranchData';

// ─── Main List State ────────────────────────────────────────────────────────
const searchForm = reactive({
  type: undefined as string | undefined, // 'outpatient' | 'accommodation'
  date: undefined as string | undefined,
  keyword: ''
});

const loading = ref(false);

const handleSearch = () => {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 400);
};

const handleReset = () => {
  searchForm.type = undefined;
  searchForm.date = undefined;
  searchForm.keyword = '';
  handleSearch();
};

interface ScheduleItem {
  id: string;
  name: string;
  date: string;
  type: 'outpatient' | 'accommodation';
  branchName: string;
  totalQuota: number;
  remainingQuota: number;
}

const mockData: ScheduleItem[] = [
  { id: '1', name: '五星体检', date: '2026-03-01', type: 'accommodation', totalQuota: 100, remainingQuota: 45, branchName: '美年大健康黄龙分院' },
  { id: '2', name: '四星体检', date: '2026-03-05', type: 'outpatient', totalQuota: 300, remainingQuota: 120, branchName: '美年大健康西溪分院' },
  { id: '3', name: '三星体检', date: '2026-02-28', type: 'outpatient', totalQuota: 500, remainingQuota: 480, branchName: '美年大健康滨江分院' },
  { id: '4', name: '五星体检', date: '2026-03-08', type: 'accommodation', totalQuota: 120, remainingQuota: 60, branchName: '美年大健康武林广场分院' },
  { id: '5', name: '四星体检', date: '2026-03-10', type: 'outpatient', totalQuota: 350, remainingQuota: 150, branchName: '美年大健康钱江新城分院' },
  { id: '6', name: '三星体检', date: '2026-03-12', type: 'outpatient', totalQuota: 600, remainingQuota: 500, branchName: '美年大健康黄龙分院' },
  { id: '7', name: '五星体检', date: '2026-03-15', type: 'accommodation', totalQuota: 80, remainingQuota: 20, branchName: '美年大健康西溪分院' },
  { id: '8', name: '四星体检', date: '2026-03-18', type: 'outpatient', totalQuota: 280, remainingQuota: 100, branchName: '美年大健康滨江分院' },
  { id: '9', name: '三星体检', date: '2026-03-20', type: 'outpatient', totalQuota: 450, remainingQuota: 380, branchName: '美年大健康武林广场分院' },
  { id: '10', name: '五星体检', date: '2026-03-25', type: 'accommodation', totalQuota: 150, remainingQuota: 80, branchName: '美年大健康钱江新城分院' },
];

const data = ref<ScheduleItem[]>([...mockData]);
const selectedRowKeys = ref<string[]>([]);
const onSelectChange = (keys: string[]) => { selectedRowKeys.value = keys; };

const columns: TableColumnsType = [
  { title: '档期时间', dataIndex: 'date', key: 'date', width: 140 },
  { title: '体检分院', dataIndex: 'branchName', key: 'branchName', width: 220, ellipsis: true },
  { title: '体检项目', dataIndex: 'name', key: 'name', width: 300, ellipsis: true },
  { title: '体检类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '总名额', dataIndex: 'totalQuota', key: 'totalQuota', width: 100 },
  { title: '剩余名额', dataIndex: 'remainingQuota', key: 'remainingQuota', width: 100 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' }
];

const filteredData = computed(() => {
  return data.value.filter(item => {
    if (searchForm.type && item.type !== searchForm.type) return false;
    if (searchForm.keyword && !item.name.includes(searchForm.keyword)) return false;
    if (searchForm.date && item.date !== searchForm.date) return false;
    return true;
  });
});

const handleDelete = (record: ScheduleItem) => {
  Modal.confirm({
    title: '确认删除该体检档期？',
    content: '删除后无法恢复，且会影响正在预定的极个别订单，请谨慎操作！',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      const idx = data.value.findIndex(d => d.id === record.id);
      if (idx > -1) {
        data.value.splice(idx, 1);
        message.success('删除成功');
      }
    }
  });
};

// ─── Publish Modal ───────────────────────────────────────────────────────────
const publishVisible = ref(false);
const publishFormRef = ref();
const publishForm = reactive({
  type: 'outpatient',
  outpatientQuota: undefined as number | undefined,
  roomKing: undefined as number | undefined,
  roomTwin: undefined as number | undefined,
  serviceItem: undefined as string | undefined,
  branchId: undefined as string | undefined,
  date: undefined as string | undefined
});

const publishRules = {
  outpatientQuota: [{ required: true, type: 'number', message: '请输入正整数名额数量', min: 1 }],
  serviceItem: [{ required: true, message: '请选择关联的体检服务项目' }],
  branchId: [{ required: true, message: '请选择体检分院' }],
  date: [{ required: true, message: '请选择档期时间' }]
};

const isPublishDisabled = computed(() => {
  if (publishForm.type === 'outpatient' && (!publishForm.outpatientQuota || publishForm.outpatientQuota <= 0)) return true;
  if (publishForm.type === 'accommodation' && !publishForm.roomKing && !publishForm.roomTwin) return true;
  if (!publishForm.serviceItem) return true;
  if (!publishForm.branchId) return true;
  if (!publishForm.date) return true;
  return false;
});

const handlePublishOpen = () => {
  publishForm.type = 'outpatient';
  publishForm.outpatientQuota = undefined;
  publishForm.roomKing = undefined;
  publishForm.roomTwin = undefined;
  publishForm.serviceItem = undefined;
  publishForm.branchId = undefined;
  publishForm.date = undefined;
  publishVisible.value = true;
};

const handlePublishSubmit = () => {
  publishFormRef.value.validate().then(() => {
    message.success('档期发布成功');
    publishVisible.value = false;
  }).catch(() => {});
};

// ─── Edit Quota Modal ────────────────────────────────────────────────────────
const editVisible = ref(false);
const editFormRef = ref();
const editForm = reactive({ remainingQuota: undefined as number | undefined });
const editingRecord = ref<ScheduleItem | null>(null);

const handleEditOpen = (record: ScheduleItem) => {
  editingRecord.value = record;
  editForm.remainingQuota = record.remainingQuota;
  editVisible.value = true;
};

const handleEditSubmit = () => {
  editFormRef.value.validate().then(() => {
    if (editingRecord.value && editForm.remainingQuota !== undefined) {
      editingRecord.value.remainingQuota = editForm.remainingQuota;
      message.success('剩余名额更新成功');
      editVisible.value = false;
    }
  }).catch(() => {});
};

// ─── Detail Modal (Outpatient & Accommodation) ──────────────────────────────
const detailVisible = ref(false);
const detailRecord = ref<ScheduleItem | null>(null);

const detailColumnsOutpatient = [
  { title: '圈存分公司', dataIndex: 'company', key: 'company' },
  { title: '圈存人员', dataIndex: 'person', key: 'person' },
  { title: '圈存数量', dataIndex: 'queued', key: 'queued' },
  { title: '已预约数', dataIndex: 'appointed', key: 'appointed' },
  { title: '剩余数量', dataIndex: 'remaining', key: 'remaining' }
];

const detailColumnsAccomm = [
  { title: '圈存分公司', dataIndex: 'company', key: 'company' },
  { title: '圈存人员', dataIndex: 'person', key: 'person' },
  { title: '圈存数量', key: 'queued' },
  { title: '已预约数', key: 'appointed' },
  { title: '剩余数量', key: 'remaining' }
];

const mockDetailData = [
  { id: '1', company: '浙江分公司', person: '张经理', queued: 50, appointed: 20, remaining: 30, roomQueued: [20, 20, 10], roomAppointed: [10, 5, 5], roomRemaining: [10, 15, 5] },
  { id: '2', company: '上海分公司', person: '李主管', queued: 100, appointed: 80, remaining: 20, roomQueued: [40, 50, 10], roomAppointed: [30, 40, 10], roomRemaining: [10, 10, 0] }
];

const openDetail = (record: ScheduleItem) => {
  detailRecord.value = record;
  detailVisible.value = true;
};
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
      <OrderedListOutlined style="font-size: 20px; color: #006738;" />
      <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0;">体检档期管理</h2>
    </div>

    <!-- 【区域一：筛选区】 -->
    <a-card :bordered="false" style="margin-bottom: 24px; border-radius: 8px;">
      <a-form layout="inline" :model="searchForm" class="search-form-row">
        <a-form-item label="体检类型">
          <a-select v-model:value="searchForm.type" placeholder="请选择类型" allow-clear style="width: 140px;">
            <a-select-option value="outpatient">门诊</a-select-option>
            <a-select-option value="accommodation">住宿</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="档期时间">
          <a-date-picker v-model:value="searchForm.date" value-format="YYYY-MM-DD" style="width: 200px;" placeholder="选择日期" allow-clear />
        </a-form-item>

        <a-form-item label="体检项目名称">
          <a-input v-model:value="searchForm.keyword" placeholder="请输入关键词" allow-clear style="width: 220px;" />
        </a-form-item>

        <a-form-item class="actions-right">
          <a-button type="primary" @click="handleSearch" style="background: #006738; border-color: #006738;">
            <template #icon><SearchOutlined /></template>查询
          </a-button>
          <a-button style="margin-left: 8px;" @click="handleReset">
            <template #icon><ReloadOutlined /></template>重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false" style="border-radius: 8px;">
      <!-- 【区域二：全局操作区】 -->
      <div style="margin-bottom: 16px; display: flex; gap: 8px; justify-content: flex-end;">
        <a-button type="primary" style="background: #006738; border-color: #006738;" @click="handlePublishOpen">
          <template #icon><PlusOutlined /></template>发布档期
        </a-button>
      </div>

      <!-- 【区域三：列表区】 -->
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        row-key="id"
        size="middle"
        :pagination="{ showSizeChanger: true, pageSize: 10, showTotal: (total: number) => `共 ${total} 条` }"
        :locale="{ emptyText: '暂无符合条件的体检档期' }"
      >
        <template #headerCell="{ column }">
          <template v-if="column.key === 'selection'">
            <!-- selection handling via row-selection prop above -->
          </template>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'date'">
            <span style="color: #006738; text-decoration: underline; cursor: pointer; font-weight: 600;" @click="openDetail(record)">
              {{ record.date }}
            </span>
          </template>

          <template v-if="column.key === 'name'">
            {{ record.name }}
          </template>

          <template v-if="column.key === 'type'">
            <a-tag :color="record.type === 'outpatient' ? 'blue' : 'purple'">
              {{ record.type === 'outpatient' ? '门诊' : '住宿' }}
            </a-tag>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEditOpen(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- ── Publish Modal ── -->
    <a-modal v-model:open="publishVisible" title="发布档期" :width="560" :footer="null">
      <a-form ref="publishFormRef" :model="publishForm" :rules="publishRules" layout="vertical" style="margin-top: 16px;">
        <a-form-item label="体检类型" name="type">
          <a-radio-group v-model:value="publishForm.type">
            <a-radio value="outpatient">门诊</a-radio>
            <a-radio value="accommodation">住宿</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item v-if="publishForm.type === 'outpatient'" label="名额数量" name="outpatientQuota">
          <a-input-number v-model:value="publishForm.outpatientQuota" placeholder="请输入名额数量" style="width: 100%;" :min="1" />
        </a-form-item>

        <div v-if="publishForm.type === 'accommodation'" style="margin-bottom: 24px;">
          <table class="room-input-table">
            <thead>
              <tr><th>房型</th><th>房间数量</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>大床房</td>
                <td><a-input-number v-model:value="publishForm.roomKing" placeholder="请输入房间数量" style="width: 100%;" :min="0" /></td>
              </tr>
              <tr>
                <td>双床房</td>
                <td><a-input-number v-model:value="publishForm.roomTwin" placeholder="请输入房间数量" style="width: 100%;" :min="0" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <a-form-item label="选择分院" name="branchId">
          <a-select v-model:value="publishForm.branchId" placeholder="请选择体检分院">
            <a-select-option v-for="branch in medicalBranches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="关联体检项目" name="serviceItem">
          <a-select v-model:value="publishForm.serviceItem" placeholder="请选择体检服务项目">
            <a-select-option value="s1">五星体检</a-select-option>
            <a-select-option value="s2">四星体检</a-select-option>
            <a-select-option value="s3">三星体检</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="档期时间" name="date">
          <a-date-picker v-model:value="publishForm.date" value-format="YYYY-MM-DD" style="width: 100%;" placeholder="选择日期" />
        </a-form-item>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px;">
          <a-button @click="publishVisible = false">取消</a-button>
          <a-button type="primary" :disabled="isPublishDisabled" @click="handlePublishSubmit" style="background: #006738; border-color: #006738;">发布</a-button>
        </div>
      </a-form>
    </a-modal>

    <!-- ── Edit Quota Modal ── -->
    <a-modal v-model:open="editVisible" title="编辑剩余名额" :width="400" :footer="null">
      <a-form ref="editFormRef" :model="editForm" layout="vertical" style="margin-top: 16px;">
        <a-form-item
          label="剩余名额"
          name="remainingQuota"
          :rules="[
            { required: true, message: '请输入名额数量' },
            { type: 'number', min: 0, max: editingRecord?.totalQuota || 9999, message: '请输入不大于总名额的正整数' }
          ]"
        >
          <a-input-number v-model:value="editForm.remainingQuota" placeholder="请填写当前剩余名额" style="width: 100%;" />
        </a-form-item>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <a-button @click="editVisible = false">取消</a-button>
          <a-button type="primary" :disabled="editForm.remainingQuota === undefined || editForm.remainingQuota === null" @click="handleEditSubmit" style="background: #006738; border-color: #006738;">确认</a-button>
        </div>
      </a-form>
    </a-modal>

    <!-- ── Detail Modal ── -->
    <a-modal v-model:open="detailVisible" title="档期详情" :width="800" :footer="null" :destroyOnClose="true">
      <div v-if="detailRecord" style="margin-top: 16px;">

        <!-- Outpatient Metrics Area -->
        <div v-if="detailRecord.type === 'outpatient'" class="detail-metrics-outpatient">
          <div class="metric-block">
            <div class="m-label">总名额</div>
            <div class="m-value">{{ detailRecord.totalQuota }}</div>
          </div>
          <div class="metric-block">
            <div class="m-label">已圈存名额</div>
            <div class="m-value">80</div>
          </div>
          <div class="metric-block">
            <div class="m-label">剩余可圈存名额</div>
            <div class="m-value">{{ detailRecord.totalQuota - 80 }}</div>
          </div>
          <div class="metric-block">
            <div class="m-label">已预约名额</div>
            <div class="m-value">45</div>
          </div>
        </div>

        <!-- Accommodation Metrics Area  -->
        <div v-if="detailRecord.type === 'accommodation'" class="detail-metrics-accommodation">
          <table class="acc-metrics-table">
            <thead>
              <tr><th></th><th>大床</th><th>双床</th><th>套房</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="row-header">总名额</td>
                <td class="m-value-td">40</td><td class="m-value-td">50</td><td class="m-value-td">10</td>
              </tr>
              <tr>
                <td class="row-header">已圈存</td>
                <td class="m-value-td">20</td><td class="m-value-td">30</td><td class="m-value-td">5</td>
              </tr>
              <tr>
                <td class="row-header">剩余可圈存</td>
                <td class="m-value-td">20</td><td class="m-value-td">20</td><td class="m-value-td">5</td>
              </tr>
              <tr>
                <td class="row-header">已预约</td>
                <td class="m-value-td">15</td><td class="m-value-td">25</td><td class="m-value-td">2</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Basic Info Area -->
        <div class="detail-basic-info">
          <div class="info-item">体检分院：<span class="iv">{{ detailRecord.branchName }}</span></div>
          <div class="info-item">体检项目：<span class="iv">{{ detailRecord.name }}</span></div>
          <div class="info-item">档期时间：<span class="iv">{{ detailRecord.date }}</span></div>
          <div class="info-item">圈存类型：<a-tag :color="detailRecord.type === 'outpatient' ? 'blue' : 'purple'">{{ detailRecord.type === 'outpatient' ? '门诊' : '住宿' }}</a-tag></div>
          <div v-if="detailRecord.type === 'accommodation'" class="info-item">房间数量：<span class="iv">{{ detailRecord.totalQuota }}</span></div>
        </div>

        <!-- Table Area -->
        <div class="detail-table-title">圈存明细</div>

        <a-table
          v-if="detailRecord.type === 'outpatient'"
          :columns="detailColumnsOutpatient"
          :data-source="mockDetailData"
          row-key="id"
          size="small"
          :pagination="false"
          :locale="{ emptyText: '暂无圈存明细' }"
        />

        <a-table
          v-if="detailRecord.type === 'accommodation'"
          :columns="detailColumnsAccomm"
          :data-source="mockDetailData"
          row-key="id"
          size="small"
          :pagination="false"
          :locale="{ emptyText: '暂无圈存明细' }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'queued'">
              <div class="multi-line">大床: {{ record.roomQueued[0] }}</div>
              <div class="multi-line">双床: {{ record.roomQueued[1] }}</div>
              <div class="multi-line">套房: {{ record.roomQueued[2] }}</div>
            </template>
            <template v-if="column.key === 'appointed'">
              <div class="multi-line">大床: {{ record.roomAppointed[0] }}</div>
              <div class="multi-line">双床: {{ record.roomAppointed[1] }}</div>
              <div class="multi-line">套房: {{ record.roomAppointed[2] }}</div>
            </template>
            <template v-if="column.key === 'remaining'">
              <div class="multi-line">大床: {{ record.roomRemaining[0] }}</div>
              <div class="multi-line">双床: {{ record.roomRemaining[1] }}</div>
              <div class="multi-line">套房: {{ record.roomRemaining[2] }}</div>
            </template>
          </template>
        </a-table>

      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.search-form-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.actions-right {
  margin-left: auto;
  margin-right: 0;
}
:deep(.ant-table-empty .ant-empty-description) {
  color: #8c8c8c;
  font-size: 14px;
}

/* Modals styling */
.room-input-table {
  width: 100%;
  border-collapse: collapse;
}
.room-input-table th {
  text-align: left;
  padding: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  font-weight: 500;
  color: #262626;
}
.room-input-table td {
  padding: 8px;
  border: 1px solid #f0f0f0;
}

.detail-metrics-outpatient {
  display: flex;
  justify-content: space-between;
  text-align: center;
  margin-bottom: 24px;
}
.metric-block {
  flex: 1;
}
.m-label {
  font-size: 14px;
  color: #595959;
  margin-bottom: 4px;
}
.m-value {
  font-size: 24px;
  font-weight: 700;
  color: #006738;
}

.detail-metrics-accommodation {
  margin-bottom: 24px;
}
.acc-metrics-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}
.acc-metrics-table th {
  padding: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  font-weight: 500;
  color: #595959;
}
.acc-metrics-table td {
  padding: 8px;
  border: 1px solid #f0f0f0;
}
.acc-metrics-table .row-header {
  background: #fafafa;
  font-weight: 500;
  color: #595959;
  text-align: left;
  padding-left: 12px;
}
.m-value-td {
  font-size: 18px;
  font-weight: 700;
  color: #006738;
}

.detail-basic-info {
  display: flex;
  gap: 32px;
  background: #fafafa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
}
.info-item {
  color: #595959;
  font-size: 14px;
}
.iv {
  color: #262626;
  font-weight: 500;
}

.detail-table-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.multi-line {
  line-height: 1.6;
}
</style>
