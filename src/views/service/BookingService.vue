<script setup lang="ts">
import { ref, reactive, computed, onMounted, shallowRef, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  StarFilled,
  CloseOutlined,
} from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { message, Modal } from 'ant-design-vue';
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const route = useRoute();

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceImage {
  uid: string;
  url: string;
  isMain: boolean;
}

interface BookingItem {
  key: string;
  name: string;
  merchantName: string;
  images: ServiceImage[];
  price: number;
  summary: string;
  description: string;
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

const columns: TableColumnsType = [
  { title: '主图', key: 'thumb', width: 80, fixed: 'left' },
  { title: '服务名称', dataIndex: 'name', key: 'name', width: 200, fixed: 'left' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '价格（元）', dataIndex: 'price', key: 'price', align: 'right', width: 110 },
  { title: '服务简介', dataIndex: 'summary', key: 'summary', ellipsis: true },
  { title: '商家名称', dataIndex: 'merchantName', key: 'merchantName', width: 160 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' },
];

// ─── Mock helpers ─────────────────────────────────────────────────────────────
const mkImgs = (seed: number): ServiceImage[] => [
  { uid: `${seed}-1`, url: `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop&sig=${seed}`, isMain: true },
  { uid: `${seed}-2`, url: `https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&h=200&fit=crop&sig=${seed}`, isMain: false },
  { uid: `${seed}-3`, url: `https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=300&h=200&fit=crop&sig=${seed}`, isMain: false },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const MERCHANT = '杭州萧山国际机场';
const SUMMARY = '支持贵宾电话预约服务';
const DESC = '<p>支持贵宾电话预约，在雅静舒适的贵宾厅候机，提供免费的精致茶点和餐饮，登机服务提醒。</p>';

const data = ref<BookingItem[]>([
  {
    key: '1',
    name: '北贵宾区',
    merchantName: MERCHANT,
    images: mkImgs(10),
    price: 500,
    summary: SUMMARY,
    description: DESC,
    status: 'approved',
    updatedAt: '2024-01-15 14:00',
  },
  {
    key: '2',
    name: '贵宾接送机服务',
    merchantName: MERCHANT,
    images: mkImgs(11),
    price: 500,
    summary: SUMMARY,
    description: DESC,
    status: 'approved',
    updatedAt: '2024-01-14 11:30',
  },
  {
    key: '3',
    name: 'T3航站楼内贵宾接送机服务',
    merchantName: MERCHANT,
    images: mkImgs(12),
    price: 500,
    summary: SUMMARY,
    description: DESC,
    status: 'pending',
    updatedAt: '2024-01-13 16:00',
  },
  {
    key: '4',
    name: 'T4航站楼内贵宾送机服务',
    merchantName: MERCHANT,
    images: mkImgs(13),
    price: 500,
    summary: SUMMARY,
    description: DESC,
    status: 'draft',
    updatedAt: '2024-01-12 09:30',
  },
  {
    key: '5',
    name: '国际贵宾厅贵宾送机服务',
    merchantName: MERCHANT,
    images: mkImgs(14),
    price: 500,
    summary: SUMMARY,
    description: DESC,
    status: 'rejected',
    rejectReason: '服务描述不够详细，请补充具体服务内容和服务流程。',
    updatedAt: '2024-01-11 10:00',
  },
]);

// ─── Search ───────────────────────────────────────────────────────────────────
const searchForm = reactive({ name: '', status: undefined as string | undefined });
const loading = ref(false);

const handleSearch = () => {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 500);
};
const handleReset = () => {
  searchForm.name = '';
  searchForm.status = undefined;
  handleSearch();
};

// ─── Drawer state ─────────────────────────────────────────────────────────────
const drawerVisible = ref(false);
const drawerMode = ref<'add' | 'view'>('view');
const isEditing = ref(false);
const currentRecord = ref<BookingItem | undefined>(undefined);
const drawerLoading = ref(false);

// Fixed merchant name (auto-filled, read-only)
const MERCHANT_NAME = '悦享健康中心';

const formState = reactive<{
  name: string;
  merchantName: string;
  price: number | undefined;
  summary: string;
  description: string;
  images: ServiceImage[];
}>({
  name: '',
  merchantName: MERCHANT_NAME,
  price: undefined,
  summary: '',
  description: '',
  images: [],
});

const isDisabled = computed(() => drawerMode.value === 'view' && !isEditing.value);
const statusConfig = computed(() => currentRecord.value ? statusMap[currentRecord.value.status] : null);
const canEdit = computed(() => {
  const s = currentRecord.value?.status;
  return s === 'draft' || s === 'rejected';
});
const isActionable = computed(() => {
  const s = currentRecord.value?.status;
  return s === 'pending' || s === 'approved';
});
const drawerTitle = computed(() => drawerMode.value === 'add' ? '新建预定服务' : '预定服务详情');

// Editor
const editorRef = shallowRef()
const mode = 'default'
const toolbarConfig: any = {
  toolbarKeys: [
    'bold',
    'italic',
    'color',
    'bulletedList',
    'numberedList',
    'uploadImage',
    'insertImage',
    'uploadVideo',
    'insertVideo'
  ]
}
const editorConfig: any = {
  placeholder: '请输入服务描述...',
  MENU_CONF: {
    uploadImage: {
      base64LimitSize: 5 * 1024 * 1024 // 5MB limit for base64 image
    }
  }
}

const handleCreated = (editor: any) => {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

watch([() => editorRef.value, () => isDisabled.value], ([editor, disabled]) => {
  if (editor) {
    if (disabled) editor.disable()
    else editor.enable()
  }
})

// ─── Drawer open/close ────────────────────────────────────────────────────────
const openAdd = () => {
  drawerMode.value = 'add';
  isEditing.value = false;
  currentRecord.value = undefined;
  Object.assign(formState, { name: '', merchantName: MERCHANT_NAME, price: undefined, summary: '', description: '', images: [] });
  drawerVisible.value = true;
};

const openView = (record: BookingItem) => {
  drawerMode.value = 'view';
  isEditing.value = false;
  currentRecord.value = record;
  Object.assign(formState, {
    name: record.name,
    merchantName: record.merchantName,
    price: record.price,
    summary: record.summary,
    description: record.description,
    images: record.images.map(i => ({ ...i })),
  });
  drawerVisible.value = true;
};

const handleClose = () => {
  drawerVisible.value = false;
  isEditing.value = false;
};

const handleEnterEdit = () => { isEditing.value = true; };

const handleCancelEdit = () => {
  isEditing.value = false;
  if (currentRecord.value) {
    Object.assign(formState, {
      name: currentRecord.value.name,
      merchantName: currentRecord.value.merchantName,
      price: currentRecord.value.price,
      summary: currentRecord.value.summary,
      description: currentRecord.value.description,
      images: currentRecord.value.images.map(i => ({ ...i })),
    });
  }
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

const handleDelete = (record?: BookingItem) => {
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


// ─── Image management ─────────────────────────────────────────────────────────
const dragSrcIdx = ref<number | null>(null);

const setMainImage = (uid: string) => {
  formState.images = formState.images.map(img => ({ ...img, isMain: img.uid === uid }));
};

const removeImage = (uid: string) => {
  formState.images = formState.images.filter(img => img.uid !== uid);
  if (formState.images.length > 0 && !formState.images.some(img => img.isMain)) {
    if (formState.images[0]) formState.images[0].isMain = true;
  }
};

const onDragStart = (idx: number) => { dragSrcIdx.value = idx; };

const onDrop = (targetIdx: number) => {
  if (dragSrcIdx.value === null || dragSrcIdx.value === targetIdx) return;
  const imgs = [...formState.images];
  const moved = imgs.splice(dragSrcIdx.value, 1)[0]!;
  imgs.splice(targetIdx, 0, moved);
  imgs.forEach((img, i) => { img.isMain = i === 0; });
  formState.images = imgs;
  dragSrcIdx.value = null;
};

const handleUpload = () => {
  const uid = Date.now().toString();
  const isFirst = formState.images.length === 0;
  formState.images.push({
    uid,
    url: `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop&sig=${uid}`,
    isMain: isFirst,
  });
  message.success('图片上传成功');
  return false;
};

onMounted(() => {
  if (route.query.action === 'create') openAdd();
});
</script>

<template>
  <div class="booking-service-list">
    <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0 0 20px 0;">预定服务管理</h2>

    <!-- ── Search ── -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="服务名称">
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
      :scroll="{ x: 1100 }"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <!-- Thumbnail -->
        <template v-if="column.key === 'thumb'">
          <a-image
            v-if="record.images?.length"
            :src="(record.images.find((i: ServiceImage) => i.isMain) ?? record.images[0]).url"
            :width="56" :height="42"
            style="object-fit: cover; border-radius: 4px;"
            :preview="false"
          />
          <div v-else style="width:56px;height:42px;background:#f5f5f5;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#bfbfbf;font-size:11px;">无图</div>
        </template>

        <!-- Clickable name -->
        <template v-if="column.key === 'name'">
          <a @click="openView(record)" style="color:#006738; font-weight:600; text-decoration:underline; cursor:pointer;">
            {{ record.name }}
          </a>
        </template>

        <!-- Status -->
        <template v-if="column.key === 'status'">
          <a-tag :color="statusMap[record.status]?.color">{{ statusMap[record.status]?.text }}</a-tag>
        </template>

        <!-- Actions -->
        <template v-if="column.key === 'action'">
          <a-space>
            <!-- draft / rejected: edit + delete -->
            <template v-if="record.status === 'draft' || record.status === 'rejected'">
              <a-button type="link" size="small" @click="openView(record)">编辑</a-button>
              <a-popconfirm title="确定删除吗？" ok-text="确认" cancel-text="取消" @confirm="handleDelete(record)">
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
      :width="800"
      :footer-style="{ textAlign: 'right' }"
      @close="handleClose"
    >
      <!-- Status tag -->
      <template #extra>
        <a-tag v-if="statusConfig" :color="statusConfig.color" style="font-size:13px; margin-right:0;">
          {{ statusConfig.text }}
        </a-tag>
      </template>

      <!-- Rejected alert -->
      <a-alert
        v-if="currentRecord?.status === 'rejected'"
        type="error" show-icon style="margin-bottom: 20px;"
      >
        <template #message>审核未通过</template>
        <template #description>驳回原因：{{ currentRecord?.rejectReason }}</template>
      </a-alert>

      <!-- Edit mode banner -->
      <a-alert
        v-if="isEditing"
        type="info"
        message="当前为编辑模式，修改完成后请保存草稿或提交审批"
        show-icon style="margin-bottom: 20px;"
      />

      <!-- Form -->
      <a-form layout="vertical" :model="formState" :disabled="isDisabled">
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item label="服务名称" name="name" required>
              <a-input v-model:value="formState.name" placeholder="请输入服务名称" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="价格（元）" name="price" required>
              <a-input-number v-model:value="formState.price" style="width:100%;" placeholder="请输入价格" :min="0" :precision="2" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="商家名称" name="merchantName">
          <a-input :value="formState.merchantName" disabled />
        </a-form-item>

        <a-form-item label="服务简介" name="summary">
          <a-textarea v-model:value="formState.summary" :rows="2" placeholder="请输入服务简介" />
        </a-form-item>

        <a-form-item label="服务描述" name="description">
          <div style="border: 1px solid #ccc; z-index: 100;">
            <Toolbar
              v-if="!isDisabled"
              style="border-bottom: 1px solid #ccc"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              :mode="mode"
            />
            <Editor
              style="height: 300px; overflow-y: hidden;"
              v-model="formState.description"
              :defaultConfig="editorConfig"
              :mode="mode"
              @onCreated="handleCreated"
            />
          </div>
        </a-form-item>

        <!-- Images -->
        <a-form-item label="服务图片">
          <div style="font-size:12px; color:#8c8c8c; margin-bottom:8px;">
            第一张为主图；可拖拽调整顺序；点击"设为主图"将该图置首
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
            <div
              v-for="(img, idx) in formState.images"
              :key="img.uid"
              :draggable="!isDisabled"
              @dragstart="onDragStart(idx)"
              @dragover.prevent
              @drop="onDrop(idx)"
              style="position:relative; width:130px; border-radius:6px; overflow:hidden; cursor:grab;"
              :style="img.isMain ? 'border: 2px solid #006738;' : 'border: 2px solid #d9d9d9;'"
            >
              <img :src="img.url" style="width:130px; height:98px; object-fit:cover; display:block;" />

              <!-- Main badge -->
              <div
                v-if="img.isMain"
                style="position:absolute; top:4px; left:4px; background:#006738; color:#fff; font-size:11px; padding:1px 6px; border-radius:3px; display:flex; align-items:center; gap:3px;"
              >
                <StarFilled style="font-size:10px;" /> 主图
              </div>

              <!-- Action overlay (edit mode) -->
              <div
                v-if="!isDisabled"
                style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.55); display:flex; justify-content:space-around; padding:5px 0;"
              >
                <a-tooltip title="设为主图">
                  <span
                    v-if="!img.isMain"
                    @click="setMainImage(img.uid)"
                    style="color:#fff; cursor:pointer; font-size:12px;"
                  >主图</span>
                  <span v-else style="color:#fadb14; font-size:12px;">已是主图</span>
                </a-tooltip>
                <a-tooltip title="删除">
                  <CloseOutlined @click="removeImage(img.uid)" style="color:#fff; cursor:pointer; font-size:14px;" />
                </a-tooltip>
              </div>
            </div>

            <!-- Upload button -->
            <a-upload
              v-if="!isDisabled"
              :show-upload-list="false"
              :before-upload="handleUpload"
              accept="image/*"
            >
              <div style="width:130px; height:98px; border:1px dashed #d9d9d9; border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; color:#8c8c8c;">
                <PlusOutlined style="font-size:20px; margin-bottom:4px;" />
                <span style="font-size:12px;">上传图片</span>
              </div>
            </a-upload>
          </div>

          <a-empty v-if="isDisabled && formState.images.length === 0" description="暂无图片" :image-style="{ height: '40px' }" />
        </a-form-item>
      </a-form>

      <!-- Footer -->
      <template #footer>
        <!-- Add mode -->
        <a-space v-if="drawerMode === 'add'">
          <a-button @click="handleClose">取消</a-button>
          <a-button @click="handleSaveDraft" :loading="drawerLoading">保存草稿</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="drawerLoading" style="background:#006738; border-color:#006738;">提交审批</a-button>
        </a-space>

        <!-- View mode -->
        <a-space v-else-if="!isEditing">
          <a-button @click="handleClose">关闭</a-button>
          <template v-if="canEdit">
            <a-popconfirm title="确认删除？" ok-text="确认" cancel-text="取消" @confirm="handleDelete()">
              <a-button danger>删除</a-button>
            </a-popconfirm>
            <a-button @click="handleEnterEdit">进入编辑态</a-button>
            <a-button type="primary" @click="handleSubmit" style="background:#006738; border-color:#006738;">提交审批</a-button>
          </template>
          <!-- pending/approved: just close (no extra buttons) -->
          <template v-if="isActionable">
            <!-- intentionally empty: only close button shown -->
          </template>
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
