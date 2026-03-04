<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
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
import RoomStatusDrawer from '@/components/RoomStatusDrawer.vue';

const route = useRoute();

// ─── Types ────────────────────────────────────────────────────────────────────
interface RoomImage {
  uid: string;
  url: string;
  isMain: boolean;
}

interface HotelItem {
  key: string;
  name: string;
  intro: string;
  images: RoomImage[];
  price: number;
  breakfast: 'none' | 'single' | 'double';
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

const breakfastMap: Record<string, string> = {
  none: '无早', single: '单早', double: '双早',
};

const columns: TableColumnsType = [
  { title: '主图', key: 'thumb', width: 80, fixed: 'left' },
  { title: '房型名称', dataIndex: 'name', key: 'name', width: 180, fixed: 'left' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 110 },
  { title: '价格（元）', dataIndex: 'price', key: 'price', align: 'right', width: 110 },
  { title: '简介', dataIndex: 'intro', key: 'intro', ellipsis: true },
  { title: '有无早餐', dataIndex: 'breakfast', key: 'breakfast', width: 100 },
  { title: '操作', key: 'action', width: 240, fixed: 'right' },
];

// ─── Mock helpers ─────────────────────────────────────────────────────────────
const mkImgs = (seed: number): RoomImage[] => [
  { uid: `${seed}-1`, url: `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=200&fit=crop&sig=${seed}`, isMain: true },
  { uid: `${seed}-2`, url: `https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=300&h=200&fit=crop&sig=${seed}`, isMain: false },
  { uid: `${seed}-3`, url: `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&h=200&fit=crop&sig=${seed}`, isMain: false },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const data = ref<HotelItem[]>([
  {
    key: '1',
    name: '豪华大床房',
    intro: '宽敞舒适的豪华大床房，配备高端寝具，俯瞰城市全景，面积约45㎡。',
    images: mkImgs(1),
    price: 899,
    breakfast: 'double',
    status: 'approved',
    updatedAt: '2024-01-15 11:00',
  },
  {
    key: '2',
    name: '商务双床房',
    intro: '适合商务出行的双床房，配备独立工作区域，高速WiFi，面积约38㎡。',
    images: mkImgs(2),
    price: 688,
    breakfast: 'none',
    status: 'draft',
    updatedAt: '2024-01-14 09:30',
  },
  {
    key: '3',
    name: '亲子套房',
    intro: '专为家庭出行设计，配备儿童床和游乐设施，亲子互动空间，面积约65㎡。',
    images: mkImgs(3),
    price: 1280,
    breakfast: 'double',
    status: 'pending',
    updatedAt: '2024-01-13 15:00',
  },
  {
    key: '4',
    name: '行政套房',
    intro: '顶层行政套房，含专属管家服务，独立客厅与卧室，面积约90㎡。',
    images: mkImgs(4),
    price: 2580,
    breakfast: 'double',
    status: 'rejected',
    rejectReason: '房型图片不符合平台要求（分辨率过低），请重新上传至少3张清晰图片后重新提交。',
    updatedAt: '2024-01-12 10:00',
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
const currentRecord = ref<HotelItem | undefined>(undefined);
const drawerLoading = ref(false);

const formState = reactive<{
  name: string;
  intro: string;
  price: number | undefined;
  breakfast: string;
  images: RoomImage[];
}>({
  name: '',
  intro: '',
  price: undefined,
  breakfast: 'none',
  images: [],
});

const isDisabled = computed(() => drawerMode.value === 'view' && !isEditing.value);
const statusConfig = computed(() => currentRecord.value ? statusMap[currentRecord.value.status] : null);
const canEdit = computed(() => {
  const s = currentRecord.value?.status;
  return s === 'draft' || s === 'rejected';
});
const isApproved = computed(() => currentRecord.value?.status === 'approved');

const drawerTitle = computed(() => drawerMode.value === 'add' ? '新建房型' : '房型详情');

// ─── Drawer open/close ────────────────────────────────────────────────────────
const openAdd = () => {
  drawerMode.value = 'add';
  isEditing.value = false;
  currentRecord.value = undefined;
  Object.assign(formState, { name: '', intro: '', price: undefined, breakfast: 'none', images: [] });
  drawerVisible.value = true;
};

const openView = (record: HotelItem) => {
  drawerMode.value = 'view';
  isEditing.value = false;
  currentRecord.value = record;
  Object.assign(formState, {
    name: record.name,
    intro: record.intro,
    price: record.price,
    breakfast: record.breakfast,
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
      intro: currentRecord.value.intro,
      price: currentRecord.value.price,
      breakfast: currentRecord.value.breakfast,
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

const handleDelete = (record?: HotelItem) => {
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
    url: `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=200&fit=crop&sig=${uid}`,
    isMain: isFirst,
  });
  message.success('图片上传成功');
  return false;
};

// ─── Room status drawer ───────────────────────────────────────────────────────
const roomStatusVisible = ref(false);
const roomStatusRecord = ref<HotelItem | undefined>(undefined);

const openRoomStatus = (record: HotelItem) => {
  roomStatusRecord.value = record;
  roomStatusVisible.value = true;
};

onMounted(() => {
  if (route.query.action === 'create') openAdd();
});
</script>

<template>
  <div class="hotel-service-list">
    <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0 0 20px 0;">房型管理</h2>

    <!-- ── Search ── -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="房型名称">
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
        <template #icon><PlusOutlined /></template>新建房型
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
            :src="(record.images.find((i: RoomImage) => i.isMain) ?? record.images[0]).url"
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

        <!-- Breakfast -->
        <template v-if="column.key === 'breakfast'">
          {{ breakfastMap[record.breakfast] }}
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

            <!-- approved: room status management only -->
            <template v-if="record.status === 'approved'">
              <a-button type="link" size="small" style="color:#006738;" @click="openRoomStatus(record)">房态管控</a-button>
            </template>

            <!-- pending: no actions -->
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
            <a-form-item label="房型名称" name="name" required>
              <a-input v-model:value="formState.name" placeholder="请输入房型名称" />
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
            <a-form-item label="有无早餐" name="breakfast">
              <a-select v-model:value="formState.breakfast" placeholder="请选择">
                <a-select-option value="none">无早</a-select-option>
                <a-select-option value="single">单早</a-select-option>
                <a-select-option value="double">双早</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="简介" name="intro">
          <a-textarea v-model:value="formState.intro" :rows="3" placeholder="请输入房型简介" />
        </a-form-item>

        <!-- Images -->
        <a-form-item label="房型图片">
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

            <!-- Upload button (edit/add mode) -->
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

          <!-- draft / rejected -->
          <template v-if="canEdit">
            <a-popconfirm title="确认删除？" ok-text="确认" cancel-text="取消" @confirm="handleDelete()">
              <a-button danger>删除</a-button>
            </a-popconfirm>
            <a-button @click="handleEnterEdit">进入编辑态</a-button>
            <a-button type="primary" @click="handleSubmit" style="background:#006738; border-color:#006738;">提交审批</a-button>
          </template>

          <!-- approved -->
          <template v-if="isApproved && currentRecord">
            <a-button type="primary" @click="openRoomStatus(currentRecord)" style="background:#006738; border-color:#006738;">房态管控</a-button>
          </template>

          <!-- pending: just close -->
          <!-- (no extra buttons for pending) -->
        </a-space>

        <!-- Edit mode -->
        <a-space v-else>
          <a-button @click="handleCancelEdit">取消编辑</a-button>
          <a-button @click="handleSaveDraft" :loading="drawerLoading">保存草稿</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="drawerLoading" style="background:#006738; border-color:#006738;">提交审批</a-button>
        </a-space>
      </template>
    </a-drawer>

    <!-- Room Status Drawer -->
    <RoomStatusDrawer
      v-model:visible="roomStatusVisible"
      :record="roomStatusRecord"
    />
  </div>
</template>
