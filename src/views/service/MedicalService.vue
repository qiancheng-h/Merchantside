<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { message, Modal } from 'ant-design-vue';

const route = useRoute();

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceItem {
  key: string;
  name: string;
  merchant: string;
  price: number;
  gender: 'all' | 'male' | 'female';
  relatedService: string;
  checkupType: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const statusMap: Record<string, { color: string; text: string }> = {
  draft:    { color: 'default',    text: '草稿' },
  pending:  { color: 'processing', text: '待审批' },
  approved: { color: 'success',    text: '审批通过' },
  rejected: { color: 'error',      text: '已驳回' },
};

const genderMap: Record<string, string> = {
  all: '通用', male: '男', female: '女',
};

const columns: TableColumnsType = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true, fixed: 'left' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '商家', dataIndex: 'merchant', key: 'merchant', width: 140, ellipsis: true },
  { title: '关联服务项目', dataIndex: 'relatedService', key: 'relatedService', width: 130, ellipsis: true },
  { title: '适用性别', dataIndex: 'gender', key: 'gender', width: 90 },
  { title: '价格（元）', dataIndex: 'price', key: 'price', align: 'right', width: 110 },
  { title: '体检类型', dataIndex: 'checkupType', key: 'checkupType', width: 120 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' },
];

// ─── Mock Data ────────────────────────────────────────────────────────────────
const data = ref<ServiceItem[]>([
  {
    key: '1',
    name: '五星体检-通用-门诊体检',
    merchant: '某某体检中心',
    price: 1299,
    gender: 'all',
    relatedService: '五星体检',
    checkupType: '门诊体检',
    status: 'approved',
    updatedAt: '2024-01-15 10:30',
  },
  {
    key: '2',
    name: '四星体检-通用-住宿体检',
    merchant: '健康管理中心',
    price: 2580,
    gender: 'all',
    relatedService: '四星体检',
    checkupType: '住宿体检',
    status: 'pending',
    updatedAt: '2024-01-14 16:20',
  },
  {
    key: '3',
    name: '三星体检-通用-门诊体检',
    merchant: '某某体检中心',
    price: 399,
    gender: 'all',
    relatedService: '三星体检',
    checkupType: '门诊体检',
    status: 'draft',
    updatedAt: '2024-01-13 09:00',
  },
  {
    key: '4',
    name: '三星体检-通用-门诊体检',
    merchant: '健康管理中心',
    price: 680,
    gender: 'all',
    relatedService: '三星体检',
    checkupType: '门诊体检',
    status: 'rejected',
    rejectReason: '价格设置超出平台限制（最高¥500），请调整后重新提交。',
    updatedAt: '2024-01-12 14:45',
  },
  {
    key: '5',
    name: '五星体检-女-住宿体检',
    merchant: '某某体检中心',
    price: 1580,
    gender: 'female',
    relatedService: '五星体检',
    checkupType: '住宿体检',
    status: 'approved',
    updatedAt: '2024-01-11 11:00',
  },
  {
    key: '6',
    name: '四星体检-男-门诊体检',
    merchant: '健康管理中心',
    price: 880,
    gender: 'male',
    relatedService: '四星体检',
    checkupType: '门诊体检',
    status: 'draft',
    updatedAt: '2024-01-10 15:30',
  },
]);

// ─── Search ───────────────────────────────────────────────────────────────────
const searchForm = reactive({
  name: '',
  status: undefined as string | undefined,
  merchant: undefined as string | undefined,
});
const loading = ref(false);

const handleSearch = () => {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 500);
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.status = undefined;
  searchForm.merchant = undefined;
  handleSearch();
};

// ─── Drawer State ─────────────────────────────────────────────────────────────
const drawerVisible = ref(false);
const drawerMode = ref<'add' | 'view'>('view');
const isEditing = ref(false);
const currentRecord = ref<ServiceItem | undefined>(undefined);
const drawerLoading = ref(false);

const formState = reactive<Partial<ServiceItem> & { name: string }>({
  name: '',
  price: undefined,
  gender: 'all',
  relatedService: '',
  checkupType: '',
});

// ─── Auto-generate name from three fields ────────────────────────────────────
const genderLabel: Record<string, string> = { all: '通用', male: '男', female: '女' };

const generateName = () => {
  const r = formState.relatedService;
  const g = formState.gender ? genderLabel[formState.gender] : '';
  const t = formState.checkupType;
  if (!r || !g || !t) return '';
  return `${r}-${g}-${t}`;
};

// Watch the three source fields and update name reactively
watch(
  () => [formState.relatedService, formState.gender, formState.checkupType],
  () => {
    // Only auto-update name when in add mode or editing mode
    if (drawerMode.value === 'add' || isEditing.value) {
      formState.name = generateName();
    }
  }
);

// ─── Name uniqueness validator (simulates backend check) ─────────────────────
const nameValidateStatus = ref<'' | 'validating' | 'success' | 'error'>('');
const nameHelp = ref('');

const validateNameUnique = (name: string) => {
  if (!name) {
    nameValidateStatus.value = '';
    nameHelp.value = '';
    return;
  }
  nameValidateStatus.value = 'validating';
  nameHelp.value = '校验中...';
  // Simulate async backend check with 400ms delay
  setTimeout(() => {
    const existingNames = data.value
      .filter(item => item.key !== currentRecord.value?.key) // exclude self when editing
      .map(item => item.name);
    if (existingNames.includes(name)) {
      nameValidateStatus.value = 'error';
      nameHelp.value = '该名称已存在，请修改字段组合';
    } else {
      nameValidateStatus.value = 'success';
      nameHelp.value = '';
    }
  }, 400);
};

// Trigger uniqueness check whenever name changes
watch(() => formState.name, (val) => {
  if (drawerMode.value === 'add' || isEditing.value) {
    validateNameUnique(val);
  }
});

const isDisabled = computed(() => drawerMode.value === 'view' && !isEditing.value);
const canEdit = computed(() => {
  const s = currentRecord.value?.status;
  return s === 'draft' || s === 'rejected';
});

const statusConfig = computed(() => {
  const s = currentRecord.value?.status;
  return s ? statusMap[s] : null;
});

const drawerTitle = computed(() => {
  if (drawerMode.value === 'add') return '新建体检服务';
  return '体检服务详情';
});

// ─── Drawer Actions ───────────────────────────────────────────────────────────
const openAdd = () => {
  drawerMode.value = 'add';
  isEditing.value = true;
  currentRecord.value = undefined;
  nameValidateStatus.value = '';
  nameHelp.value = '';
  Object.assign(formState, {
    name: '',
    price: undefined,
    gender: 'all',
    relatedService: '',
    checkupType: '门诊体检',
  });
  drawerVisible.value = true;
};

const openView = (record: ServiceItem, startEditing = false) => {
  drawerMode.value = 'view';
  isEditing.value = startEditing;
  currentRecord.value = record;
  nameValidateStatus.value = '';
  nameHelp.value = '';
  Object.assign(formState, { ...record });
  drawerVisible.value = true;
};

const handleClose = () => {
  drawerVisible.value = false;
  isEditing.value = false;
};


const handleCancelEdit = () => {
  isEditing.value = false;
  if (currentRecord.value) Object.assign(formState, { ...currentRecord.value });
};

const handleSaveDraft = () => {
  drawerLoading.value = true;
  setTimeout(() => {
    drawerLoading.value = false;
    message.success('已保存草稿');
    handleClose();
  }, 800);
};

const handleSubmit = () => {
  Modal.confirm({
    title: '确认提交审批？',
    content: '提交后将进入审批流程，期间不可编辑。',
    okText: '确认提交',
    cancelText: '取消',
    onOk() {
      drawerLoading.value = true;
      setTimeout(() => {
        drawerLoading.value = false;
        message.success('已提交审批');
        handleClose();
      }, 800);
    },
  });
};

const handleDelete = (record?: ServiceItem) => {
  const target = record || currentRecord.value;
  if (!target) return;
  Modal.confirm({
    title: '确认删除？',
    content: '删除后不可恢复，请确认。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      data.value = data.value.filter(item => item.key !== target.key);
      message.success('已删除');
      if (drawerVisible.value) handleClose();
    },
  });
};


watch(() => route.query, (query) => {
  if (query.action === 'create') {
    openAdd();
  } else if (query.action === 'view' && query.id) {
    const targetId = query.id as string;
    const record = data.value.find(item => item.key === targetId);
    if (record) {
      openView(record);
    }
  }
}, { immediate: true });
</script>

<template>
  <div class="medical-service-list">
    <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0 0 20px 0; line-height: 1;">体检服务管理</h2>

    <!-- ── Search Form ── -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="名称">
          <a-input v-model:value="searchForm.name" placeholder="请输入名称" allow-clear style="width: 180px;" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" style="width: 130px;" allow-clear>
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="pending">待审批</a-select-option>
            <a-select-option value="approved">审批通过</a-select-option>
            <a-select-option value="rejected">已驳回</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="商家">
          <a-select v-model:value="searchForm.merchant" placeholder="请选择商家" style="width: 160px;" allow-clear>
            <a-select-option value="某某体检中心">某某体检中心</a-select-option>
            <a-select-option value="健康管理中心">健康管理中心</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch" style="background:#006738; border-color:#006738;">
            <template #icon><SearchOutlined /></template>查询
          </a-button>
          <a-button style="margin-left: 8px;" @click="handleReset">
            <template #icon><ReloadOutlined /></template>重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ── Toolbar ── -->
    <div style="margin-bottom: 12px; display: flex; justify-content: flex-end;">
      <a-button type="primary" @click="openAdd" style="background:#006738; border-color:#006738;">
        <template #icon><PlusOutlined /></template>新建服务
      </a-button>
    </div>

    <!-- ── Table ── -->
    <a-table
      :columns="columns"
      :data-source="data"
      :loading="loading"
      :pagination="{ showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` }"
      row-key="key"
      :scroll="{ x: 1000 }"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <!-- Name: sole detail entry -->
        <template v-if="column.key === 'name'">
          <a @click="openView(record)" style="color: #006738; font-weight: 600; text-decoration: underline; cursor: pointer;">
            {{ record.name }}
          </a>
        </template>

        <!-- Gender -->
        <template v-if="column.key === 'gender'">
          {{ genderMap[record.gender] }}
        </template>

        <!-- Status tag -->
        <template v-if="column.key === 'status'">
          <a-tag :color="statusMap[record.status]?.color">{{ statusMap[record.status]?.text }}</a-tag>
        </template>

        <!-- Actions -->
        <template v-if="column.key === 'action'">
          <a-space>
            <!-- draft / rejected: edit + delete -->
            <template v-if="record.status === 'draft' || record.status === 'rejected'">
              <a-button type="link" size="small" @click="openView(record, true)">编辑</a-button>
              <a-popconfirm title="确定删除吗？删除后不可恢复。" ok-text="确认" cancel-text="取消" @confirm="handleDelete(record)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </template>
            <!-- pending / approved: no actions -->
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- ── Detail / Edit Drawer ── -->
    <a-drawer
      :open="drawerVisible"
      :title="drawerTitle"
      :width="760"
      :footer-style="{ textAlign: 'right' }"
      @close="handleClose"
    >
      <!-- Status tag in header -->
      <template #extra>
        <a-tag v-if="statusConfig" :color="statusConfig.color" style="font-size: 13px; margin-right: 0;">
          {{ statusConfig.text }}
        </a-tag>
      </template>

      <!-- Rejected alert -->
      <a-alert
        v-if="currentRecord?.status === 'rejected'"
        type="error"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template #message>审核未通过</template>
        <template #description>驳回原因：{{ currentRecord?.rejectReason || '信息填写不完整，请修改后重新提交' }}</template>
      </a-alert>

      <!-- Edit mode banner -->
      <a-alert
        v-if="isEditing"
        type="info"
        message="当前为编辑模式，修改完成后请保存草稿或提交审批"
        show-icon
        style="margin-bottom: 20px;"
      />

      <!-- Form -->
      <a-form layout="vertical" :model="formState" :disabled="isDisabled">
        <a-row :gutter="16">
          <a-col :span="16">
            <!-- Name: auto-generated, read-only -->
            <a-form-item
              label="服务名称"
              name="name"
              :validate-status="(drawerMode === 'add' || isEditing) ? nameValidateStatus : ''"
              :help="(drawerMode === 'add' || isEditing) ? nameHelp : ''"
            >
              <a-input
                :value="formState.name || '（请先选择关联服务、性别和体检类型）'"
                disabled
                :style="formState.name ? '' : 'color: #bfbfbf;'"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="价格（元）" name="price" required>
              <a-input-number v-model:value="formState.price" style="width:100%;" placeholder="请输入价格" :min="0" :precision="2" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="适用性别" name="gender">
              <a-select v-model:value="formState.gender" placeholder="请选择">
                <a-select-option value="all">通用</a-select-option>
                <a-select-option value="male">男</a-select-option>
                <a-select-option value="female">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="体检类型" name="checkupType">
              <a-select v-model:value="formState.checkupType" placeholder="请选择类型">
                <a-select-option value="门诊体检">门诊体检</a-select-option>
                <a-select-option value="住宿体检">住宿体检</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联服务项目" name="relatedService">
              <a-select v-model:value="formState.relatedService" placeholder="请选择关联服务">
                <a-select-option value="三星体检">三星体检</a-select-option>
                <a-select-option value="四星体检">四星体检</a-select-option>
                <a-select-option value="五星体检">五星体检</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <!-- Footer -->
      <template #footer>
        <!-- Add mode -->
        <a-space v-if="drawerMode === 'add'">
          <a-button @click="handleClose">取消</a-button>
          <a-button @click="handleSaveDraft" :loading="drawerLoading">保存草稿</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="drawerLoading" style="background:#006738; border-color:#006738;">提交审批</a-button>
        </a-space>

        <!-- View mode (not editing) -->
        <a-space v-else-if="!isEditing">
          <a-button @click="handleClose">关闭</a-button>
          <template v-if="canEdit">
            <a-popconfirm title="确认删除？删除后不可恢复。" ok-text="确认" cancel-text="取消" @confirm="handleDelete()">
              <a-button danger>删除</a-button>
            </a-popconfirm>
            <a-button type="primary" @click="handleSubmit" style="background:#006738; border-color:#006738;">提交审批</a-button>
          </template>
          <!-- pending/approved: just close -->
        </a-space>

        <!-- Edit mode -->
        <a-space v-else>
          <a-button @click="handleCancelEdit">取消编辑</a-button>
          <a-button @click="handleSaveDraft" :loading="drawerLoading">保存草稿</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="drawerLoading" style="background:#006738; border-color:#006738;">提交审批</a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>
