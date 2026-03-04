<script setup lang="ts">
import { ref, watch, computed, reactive } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue';

const props = defineProps<{
  visible: boolean;
  type: 'medical' | 'hotel' | 'booking';
  mode: 'add' | 'edit' | 'view';
  record?: any;
}>();

const emit = defineEmits(['update:visible', 'success', 'delete']);

// ─── State ───────────────────────────────────────────────────────────────────
const isEditing = ref(false);  // true = edit mode inside drawer
const loading = ref(false);

const formState = reactive<any>({
  name: '',
  price: undefined,
  description: '',
  checkupItems: '',
  bedType: '',
  breakfast: '',
  duration: '',
  category: '',
  images: [] as { uid: string; url: string; isMain: boolean }[],
});

// ─── Computed ─────────────────────────────────────────────────────────────────
const isAddMode = computed(() => props.mode === 'add');

const drawerTitle = computed(() => {
  if (isAddMode.value) return props.type === 'hotel' ? '新建房型' : '新建服务';
  return props.type === 'hotel' ? '房型详情' : '服务详情';
});

const isDisabled = computed(() => {
  if (isAddMode.value) return false;
  return !isEditing.value;
});

const statusConfig = computed(() => {
  const s = props.record?.status;
  const map: Record<string, { color: string; text: string }> = {
    draft:    { color: 'default',    text: '草稿' },
    pending:  { color: 'processing', text: '待审批' },
    approved: { color: 'success',    text: '审批通过' },
    rejected: { color: 'error',      text: '已驳回' },
  };
  return s ? map[s] : null;
});

const canEdit = computed(() => {
  const s = props.record?.status;
  return s === 'draft' || s === 'rejected';
});

const isActionable = computed(() => {
  const s = props.record?.status;
  return s === 'pending' || s === 'approved';
});

const showImages = computed(() => props.type === 'hotel' || props.type === 'booking');

// ─── Watch ────────────────────────────────────────────────────────────────────
watch(
  () => props.visible,
  (val) => {
    if (val) {
      isEditing.value = false;
      if (!isAddMode.value && props.record) {
        Object.assign(formState, {
          name: props.record.name || '',
          price: props.record.price,
          description: props.record.description || '',
          checkupItems: props.record.checkupItems || '',
          bedType: props.record.bedType || '',
          breakfast: props.record.breakfast || '',
          duration: props.record.duration || '',
          category: props.record.category || '',
          images: props.record.images || mockImages(),
        });
      } else {
        Object.keys(formState).forEach(k => {
          formState[k] = k === 'images' ? [] : undefined;
        });
        formState.name = '';
        formState.description = '';
        formState.checkupItems = '';
        formState.bedType = '';
        formState.breakfast = '';
        formState.duration = '';
        formState.images = [];
      }
    }
  }
);

// ─── Mock images for demo ─────────────────────────────────────────────────────
function mockImages() {
  if (!showImages.value) return [];
  return [
    { uid: '1', url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&h=150&fit=crop', isMain: true },
    { uid: '2', url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=200&h=150&fit=crop', isMain: false },
    { uid: '3', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&h=150&fit=crop', isMain: false },
  ];
}

// ─── Actions ──────────────────────────────────────────────────────────────────
const handleClose = () => {
  isEditing.value = false;
  emit('update:visible', false);
};

const handleEnterEdit = () => {
  isEditing.value = true;
};

const handleCancelEdit = () => {
  isEditing.value = false;
  // restore original values
  if (props.record) {
    Object.assign(formState, {
      name: props.record.name || '',
      price: props.record.price,
      description: props.record.description || '',
      checkupItems: props.record.checkupItems || '',
      bedType: props.record.bedType || '',
      breakfast: props.record.breakfast || '',
      duration: props.record.duration || '',
      images: props.record.images || mockImages(),
    });
  }
};

const handleSaveDraft = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    message.success('已保存草稿');
    emit('success');
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
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
        message.success('已提交审批');
        emit('success');
        handleClose();
      }, 800);
    },
  });
};

const handleDelete = () => {
  Modal.confirm({
    title: '确认删除？',
    content: '删除后不可恢复，请确认。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      message.success('已删除');
      emit('delete', props.record);
      handleClose();
    },
  });
};

// ─── Image helpers ────────────────────────────────────────────────────────────
const setMainImage = (uid: string) => {
  formState.images = formState.images.map((img: any) => ({
    ...img,
    isMain: img.uid === uid,
  }));
};

const removeImage = (uid: string) => {
  formState.images = formState.images.filter((img: any) => img.uid !== uid);
  // if we removed the main, make first the main
  if (formState.images.length > 0 && !formState.images.some((img: any) => img.isMain)) {
    if (formState.images[0]) formState.images[0].isMain = true;
  }
};

// Mock upload handler
const handleUpload = () => {
  // In real app, upload to server. Here we mock with a placeholder URL.
  const uid = Date.now().toString();
  const isFirst = formState.images.length === 0;
  formState.images.push({
    uid,
    url: `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&h=150&fit=crop&sig=${uid}`,
    isMain: isFirst,
  });
  message.success('图片上传成功');
  return false; // prevent default upload
};

// Drag reorder
const dragSrcIdx = ref<number | null>(null);

const onDragStart = (idx: number) => {
  dragSrcIdx.value = idx;
};

const onDrop = (targetIdx: number) => {
  if (dragSrcIdx.value === null || dragSrcIdx.value === targetIdx) return;
  const imgs = [...formState.images];
  const [moved] = imgs.splice(dragSrcIdx.value, 1);
  imgs.splice(targetIdx, 0, moved);
  // first image is always main
  imgs.forEach((img, i) => { img.isMain = i === 0; });
  formState.images = imgs;
  dragSrcIdx.value = null;
};
</script>

<template>
  <a-drawer
    :open="visible"
    :title="drawerTitle"
    :width="760"
    :footer-style="{ textAlign: 'right' }"
    @close="handleClose"
  >
    <!-- ── Drawer Header Extra: Status Tag ── -->
    <template #extra>
      <a-tag
        v-if="statusConfig && !isAddMode"
        :color="statusConfig.color"
        style="margin-right: 0; font-size: 13px;"
      >
        {{ statusConfig.text }}
      </a-tag>
    </template>

    <!-- ── Rejected Alert ── -->
    <a-alert
      v-if="record?.status === 'rejected'"
      type="error"
      show-icon
      style="margin-bottom: 20px;"
    >
      <template #message>审核未通过</template>
      <template #description>驳回原因：{{ record?.rejectReason || '信息填写不完整，请修改后重新提交' }}</template>
    </a-alert>

    <!-- ── Edit mode banner ── -->
    <a-alert
      v-if="isEditing"
      type="info"
      message="当前为编辑模式，修改完成后请保存草稿或提交审批"
      show-icon
      style="margin-bottom: 20px;"
    />

    <!-- ── Main Form ── -->
    <a-form layout="vertical" :model="formState" :disabled="isDisabled">

      <!-- Basic Info -->
      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="服务名称" name="name" required>
            <a-input v-model:value="formState.name" placeholder="请输入服务名称" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="价格 (¥)" name="price" required>
            <a-input-number
              v-model:value="formState.price"
              style="width: 100%"
              placeholder="请输入价格"
              :min="0"
              :precision="2"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <!-- Medical Specific -->
      <template v-if="type === 'medical'">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="服务分类" name="category">
              <a-select v-model:value="formState.category" placeholder="请选择分类">
                <a-select-option value="体检">体检套餐</a-select-option>
                <a-select-option value="专项">专项检查</a-select-option>
                <a-select-option value="儿童">儿童体检</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="体检项目" name="checkupItems">
          <a-textarea
            v-model:value="formState.checkupItems"
            placeholder="请输入包含的体检项目，以逗号分隔，例如：血常规、尿常规、心电图"
            :rows="4"
          />
        </a-form-item>
      </template>

      <!-- Hotel Specific -->
      <template v-if="type === 'hotel'">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="床型" name="bedType" required>
              <a-select v-model:value="formState.bedType" placeholder="请选择床型">
                <a-select-option value="大床 2m">大床 2m</a-select-option>
                <a-select-option value="双床 1.2m">双床 1.2m</a-select-option>
                <a-select-option value="亲子房">亲子房</a-select-option>
                <a-select-option value="套房">套房</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="早餐" name="breakfast" required>
              <a-select v-model:value="formState.breakfast" placeholder="请选择早餐">
                <a-select-option value="无早">无早</a-select-option>
                <a-select-option value="单早">单早</a-select-option>
                <a-select-option value="双早">双早</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </template>

      <!-- Booking Specific -->
      <template v-if="type === 'booking'">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="服务时长" name="duration" required>
              <a-input v-model:value="formState.duration" placeholder="例如：2小时" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="服务分类" name="category">
              <a-select v-model:value="formState.category" placeholder="请选择分类">
                <a-select-option value="SPA">SPA 护理</a-select-option>
                <a-select-option value="餐饮">餐饮预定</a-select-option>
                <a-select-option value="活动">活动体验</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </template>

      <!-- Description -->
      <a-form-item label="图文详情" name="description">
        <a-textarea
          v-model:value="formState.description"
          :rows="4"
          placeholder="请输入详细描述"
        />
      </a-form-item>

      <!-- Image Upload (hotel / booking) -->
      <template v-if="showImages">
        <a-form-item label="服务图片">
          <div style="font-size: 12px; color: #8c8c8c; margin-bottom: 8px;">
            第一张图片为主图；可拖拽调整顺序；点击"设为主图"将该图设为第一张
          </div>

          <!-- Image list -->
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
            <div
              v-for="(img, _idx) in formState.images"
              :key="img.uid"
              :draggable="!isDisabled"
              @dragstart="onDragStart(formState.images.indexOf(img))"
              @dragover.prevent
              @drop="onDrop(formState.images.indexOf(img))"
              style="position: relative; width: 120px; border: 2px solid transparent; border-radius: 6px; overflow: hidden; cursor: grab;"
              :style="img.isMain ? 'border-color: #006738;' : 'border-color: #d9d9d9;'"
            >
              <img :src="img.url" style="width: 120px; height: 90px; object-fit: cover; display: block;" />
              <!-- Main badge -->
              <div
                v-if="img.isMain"
                style="position: absolute; top: 4px; left: 4px; background: #006738; color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 3px;"
              >
                <StarFilled style="font-size: 10px;" /> 主图
              </div>
              <!-- Actions overlay (edit mode only) -->
              <div
                v-if="!isDisabled"
                style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.55); display: flex; justify-content: space-around; padding: 4px 0;"
              >
                <a-tooltip title="设为主图">
                  <StarOutlined
                    v-if="!img.isMain"
                    @click="setMainImage(img.uid)"
                    style="color: #fff; cursor: pointer; font-size: 14px;"
                  />
                </a-tooltip>
                <a-tooltip title="删除图片">
                  <CloseOutlined
                    @click="removeImage(img.uid)"
                    style="color: #fff; cursor: pointer; font-size: 14px;"
                  />
                </a-tooltip>
              </div>
            </div>

            <!-- Upload button (edit mode only) -->
            <a-upload
              v-if="!isDisabled"
              :show-upload-list="false"
              :before-upload="handleUpload"
              accept="image/*"
            >
              <div
                style="width: 120px; height: 90px; border: 1px dashed #d9d9d9; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #8c8c8c;"
              >
                <PlusOutlined style="font-size: 20px; margin-bottom: 4px;" />
                <span style="font-size: 12px;">上传图片</span>
              </div>
            </a-upload>
          </div>

          <!-- Empty state in view mode -->
          <a-empty
            v-if="isDisabled && formState.images.length === 0"
            description="暂无图片"
            :image-style="{ height: '40px' }"
          />
        </a-form-item>
      </template>

    </a-form>

    <!-- ── Footer ── -->
    <template #footer>
      <!-- ADD mode -->
      <a-space v-if="isAddMode">
        <a-button @click="handleClose">取消</a-button>
        <a-button @click="handleSaveDraft" :loading="loading">保存草稿</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="loading" style="background:#006738; border-color:#006738;">
          提交审批
        </a-button>
      </a-space>

      <!-- VIEW mode (not add), currently viewing (not editing) -->
      <a-space v-else-if="!isEditing">
        <a-button @click="handleClose">关闭</a-button>

        <!-- draft / rejected: full actions -->
        <template v-if="canEdit">
          <a-popconfirm title="确认删除？删除后不可恢复。" ok-text="确认" cancel-text="取消" @confirm="handleDelete">
            <a-button danger>
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </a-popconfirm>
          <a-button @click="handleEnterEdit">
            <template #icon><EditOutlined /></template>
            进入编辑态
          </a-button>
          <a-button type="primary" @click="handleSubmit" style="background:#006738; border-color:#006738;">
            提交审批
          </a-button>
        </template>

        <!-- pending / approved: disabled with tooltip -->
        <template v-if="isActionable">
          <a-tooltip title="当前状态不可操作">
            <a-button disabled>
              <template #icon><DeleteOutlined /></template>
              删除
            </a-button>
          </a-tooltip>
          <a-tooltip title="当前状态不可操作">
            <a-button disabled>
              <template #icon><EditOutlined /></template>
              进入编辑态
            </a-button>
          </a-tooltip>
          <a-tooltip title="当前状态不可操作">
            <a-button type="primary" disabled>提交审批</a-button>
          </a-tooltip>
        </template>
      </a-space>

      <!-- EDIT mode (switched from view) -->
      <a-space v-else>
        <a-button @click="handleCancelEdit">取消编辑</a-button>
        <a-button @click="handleSaveDraft" :loading="loading">保存草稿</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="loading" style="background:#006738; border-color:#006738;">
          提交审批
        </a-button>
      </a-space>
    </template>
  </a-drawer>
</template>
