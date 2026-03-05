<script setup lang="ts">
import { ref, reactive, shallowRef, onBeforeUnmount } from 'vue';
import { message } from 'ant-design-vue';
import { EditOutlined, UploadOutlined, InfoCircleOutlined, ShopOutlined } from '@ant-design/icons-vue';
import { merchantList, type MerchantInfo } from '@/mock/merchantData';
import '@wangeditor/editor/dist/css/style.css';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';

// 定义严格的酒店设施类型，所有子字段均为必填，确保 formState 中不会出现 possibly undefined
interface FormHotelFacilities {
  traffic: { parking: boolean; parkingType: 'free' | 'paid'; chargingStation: boolean; chargingStationType: 'free' | 'paid' };
  frontDesk: { twentyFourHour: boolean; luggageStorage: boolean; concierge: boolean };
  dining: { breakfast: boolean; restaurant: boolean };
  entertainment: { publicWifi: boolean; roomWifi: boolean; pool: boolean; poolType: 'free' | 'paid'; gym: boolean; gymType: 'free' | 'paid' };
}

// 本地表单类型：hotelFacilities 整体可选，但存在时子字段均为必填
type MerchantFormState = Omit<MerchantInfo, 'id' | 'hotelFacilities'> & {
  hotelFacilities?: FormHotelFacilities;
};

// ─── Table Config ───────────────────────────────────────────────────────────
const columns = [
  { title: '商家名称', dataIndex: 'name', key: 'name' },
  { title: '类别', dataIndex: 'category', key: 'category' },
  { title: '所属区域', dataIndex: 'region', key: 'region' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'action', width: 150 }
];

// ─── Drawer Config ────────────────────────────────────────────────────────────
const visible = ref(false);
const submitting = ref(false);
const isEditingId = ref<string | null>(null);

const categories = ['礼品类', '酒店类', '预定类', '体检类'];
const regions = [
  '浙江省', '杭州市', '宁波市', '温州市', '嘉兴市', '湖州市',
  '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'
];

const defaultFormState: MerchantFormState = {
  name: '',
  category: '酒店类',
  region: '杭州市',
  desc: '',
  status: 'operating',
  address: '',
  phone: '',
  images: [],
  businessLicense: '',
  serviceAgreement: '',
  specialLicense: '',
  hotelFacilities: {
    traffic: {
      parking: false,
      parkingType: 'free',
      chargingStation: false,
      chargingStationType: 'free',
    },
    frontDesk: {
      twentyFourHour: false,
      luggageStorage: false,
      concierge: false,
    },
    dining: {
      breakfast: false,
      restaurant: false,
    },
    entertainment: {
      publicWifi: false,
      roomWifi: false,
      pool: false,
      poolType: 'free',
      gym: false,
      gymType: 'free',
    }
  }
};

const formState = reactive<MerchantFormState>({ ...defaultFormState });

// ─── Wang Editor instances ───────────────────────────────────────────────────────────
const editorRef = shallowRef();
const valueHtml = ref('');
const mode = 'default';

const toolbarConfig = {
  toolbarKeys: [
    'bold', 'color', 'italic', '|', 'uploadImage', 'uploadVideo', '|', 'bulletedList', 'numberedList'
  ]
};
const editorConfig = {
  placeholder: '请输入详细的商家介绍，支持图文排版...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: any) {
        const url = URL.createObjectURL(file);
        insertFn(url, file.name, url);
      }
    },
    uploadVideo: {
      async customUpload(file: File, insertFn: any) {
        const url = URL.createObjectURL(file);
        insertFn(url);
      }
    }
  }
};

const handleCreated = (editor: any) => {
  editorRef.value = editor;
};

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

// ─── Upload Docs ──────────────────────────────────────────────────────────────────
const licenseFileList = ref<any[]>([]);
const agreementFileList = ref<any[]>([]);
const specialFileList = ref<any[]>([]);
const imagesFileList = ref<any[]>([]);

const parseFileList = (url?: string, name: string = 'file.png') => {
  if (!url) return [];
  return [{ uid: '-1', name, status: 'done', url }];
};

const beforeUploadGen = (fileListRef: any) => (file: File) => {
  const isJpgOrPngOrPdf = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'application/pdf';
  if (!isJpgOrPngOrPdf) {
    message.error('只支持上传 JPG/PNG/PDF 格式文件!');
    return false;
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error('文件大小不能超过 5MB!');
    return false;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    fileListRef.value = [{
      uid: file.name,
      name: file.name,
      status: 'done',
      url: reader.result as string
    }];
  };
  return false;
};

// ─── Actions ──────────────────────────────────────────────────────────────────────
const openEdit = (record: MerchantInfo) => {
  isEditingId.value = record.id;
  Object.assign(formState, JSON.parse(JSON.stringify(record))); // Deep copy for nested objects
  if (!formState.hotelFacilities) {
    formState.hotelFacilities = JSON.parse(JSON.stringify(defaultFormState.hotelFacilities));
  }
  valueHtml.value = record.desc || '';
  licenseFileList.value = parseFileList(record.businessLicense, '营业执照.png');
  agreementFileList.value = parseFileList(record.serviceAgreement, '服务协议.png');
  specialFileList.value = parseFileList(record.specialLicense, '特殊许可证.png');

  imagesFileList.value = (record.images || []).map((url, idx) => ({
    uid: String(-idx),
    name: `image-${idx}.png`,
    status: 'done',
    url
  }));

  visible.value = true;
};

const closeDrawer = () => {
  visible.value = false;
};

const submitUpdate = () => {
  submitting.value = true;

  if (!formState.phone) {
    message.warning('请输入联系电话');
    submitting.value = false;
    return;
  }

  if (!formState.address) {
    message.warning('请输入商家地址');
    submitting.value = false;
    return;
  }

  if (licenseFileList.value.length === 0) {
    message.warning('请上传营业执照');
    submitting.value = false;
    return;
  }

  if (agreementFileList.value.length === 0) {
    message.warning('请上传服务供应保障协议');
    submitting.value = false;
    return;
  }

  setTimeout(() => {
    const newData: MerchantInfo = {
      ...formState,
      id: isEditingId.value || `M${Date.now()}`,
      desc: valueHtml.value,
      businessLicense: licenseFileList.value[0]?.url || '',
      serviceAgreement: agreementFileList.value[0]?.url || '',
      specialLicense: specialFileList.value[0]?.url || ''
    };

    if (isEditingId.value) {
      const index = merchantList.value.findIndex(m => m.id === isEditingId.value);
      if (index !== -1) {
        merchantList.value.splice(index, 1, newData);
      }
    } else {
      merchantList.value.unshift(newData);
    }

    visible.value = false;
    submitting.value = false;
    message.success(isEditingId.value ? '商家信息更新成功' : '新增商家成功');
  }, 600);
};
</script>

<template>
  <div class="merchant-info-page">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <ShopOutlined style="font-size: 20px; color: #006738;" />
        <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0;">商家信息管理</h2>
      </div>
    </div>

    <a-card :bordered="false" style="border-radius: 8px;">
      <a-table :dataSource="merchantList" :columns="columns" rowKey="id" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a-button type="link" style="color: #006738; padding: 0" @click="openEdit(record)">
              {{ record.name }}
            </a-button>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'operating' ? 'success' : 'error'">
              {{ record.status === 'operating' ? '正常营业' : '暂停服务' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" style="color: #006738; padding: 0" @click="openEdit(record)">
              <EditOutlined /> 编辑
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="visible"
      :title="isEditingId ? '编辑商家资料' : '新增商家'"
      width="720"
      placement="right"
      :closable="true"
    >
      <a-alert v-if="isEditingId" message="编辑商家信息涉及主体变更或资质更改，保存后即生效。" type="warning" show-icon style="margin-bottom: 24px;" />

      <a-form layout="vertical">
        <h3 class="section-title">基础信息</h3>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="商家名称" required>
              <a-input v-model:value="formState.name" disabled placeholder="请输入商家名称" />
              <div class="assist-text">商家名称不可更改，若需更名请联系运营专员。</div>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="商家所属区域" required>
              <a-select v-model:value="formState.region" :options="regions.map(r => ({ value: r, label: r }))" disabled placeholder="请选择区域" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="类别" required>
              <a-select v-model:value="formState.category" :options="categories.map(c => ({ value: c, label: c }))" disabled placeholder="请选择类别" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态" required>
              <a-radio-group v-model:value="formState.status" disabled>
                <a-radio value="operating">正常营业</a-radio>
                <a-radio value="suspended">暂停服务</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="联系电话" required>
              <a-input v-model:value="formState.phone" placeholder="请输入商家联系电话" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="商家地址" required>
              <a-input v-model:value="formState.address" placeholder="请输入详细地址" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="商家图片">
              <a-upload
                v-model:file-list="imagesFileList"
                list-type="picture-card"
                :before-upload="beforeUploadGen(imagesFileList)"
                :max-count="5"
                multiple
              >
                <div>
                  <UploadOutlined />
                  <div style="margin-top: 8px">上传(最多5张)</div>
                </div>
              </a-upload>
            </a-form-item>
          </a-col>
        </a-row>

        <template v-if="formState.category === '酒店类' && formState.hotelFacilities">
          <h3 class="section-title" style="margin-top: 24px;">酒店设施</h3>
          <div class="facility-section">
            <div class="facility-category">
              <div class="category-name"><span class="vertical-line"></span>交通服务</div>
              <div class="category-items">
                <a-form-item label="停车场" class="inline-form-item">
                  <div class="flex-align">
                    <a-switch v-model:checked="formState.hotelFacilities!.traffic.parking" />
                    <a-radio-group v-if="formState.hotelFacilities!.traffic.parking" v-model:value="formState.hotelFacilities!.traffic.parkingType" style="margin-left: 16px;">
                      <a-radio value="free">免费停车</a-radio>
                      <a-radio value="paid">收费停车</a-radio>
                    </a-radio-group>
                  </div>
                </a-form-item>
                <a-form-item label="充电桩" class="inline-form-item">
                  <div class="flex-align">
                    <a-switch v-model:checked="formState.hotelFacilities!.traffic.chargingStation" />
                    <a-radio-group v-if="formState.hotelFacilities!.traffic.chargingStation" v-model:value="formState.hotelFacilities!.traffic.chargingStationType" style="margin-left: 16px;">
                      <a-radio value="free">免费充电</a-radio>
                      <a-radio value="paid">收费充电</a-radio>
                    </a-radio-group>
                  </div>
                </a-form-item>
              </div>
            </div>

            <div class="facility-category">
              <div class="category-name"><span class="vertical-line"></span>前台服务</div>
              <div class="category-items flex-row-items">
                <a-checkbox v-model:checked="formState.hotelFacilities!.frontDesk.twentyFourHour">24小时前台</a-checkbox>
                <a-checkbox v-model:checked="formState.hotelFacilities!.frontDesk.luggageStorage">行李寄存(免费)</a-checkbox>
                <a-checkbox v-model:checked="formState.hotelFacilities!.frontDesk.concierge">礼宾服务</a-checkbox>
              </div>
            </div>

            <div class="facility-category">
              <div class="category-name"><span class="vertical-line"></span>餐饮设施</div>
              <div class="category-items">
                <a-form-item label="早餐供应" class="inline-form-item">
                  <a-switch v-model:checked="formState.hotelFacilities!.dining.breakfast" />
                </a-form-item>
                <a-form-item label="餐厅" class="inline-form-item">
                  <a-switch v-model:checked="formState.hotelFacilities!.dining.restaurant" />
                </a-form-item>
              </div>
            </div>

            <div class="facility-category">
              <div class="category-name"><span class="vertical-line"></span>休闲娱乐</div>
              <div class="category-items">
                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; width: 80px; text-align: right; margin-right: 16px;">网络设施</span>
                  <a-checkbox v-model:checked="formState.hotelFacilities!.entertainment.publicWifi">公共区WIFI</a-checkbox>
                  <a-checkbox v-model:checked="formState.hotelFacilities!.entertainment.roomWifi">客房WIFI</a-checkbox>
                </div>
                <a-form-item label="游泳池" class="inline-form-item">
                  <div class="flex-align">
                    <a-switch v-model:checked="formState.hotelFacilities!.entertainment.pool" />
                    <a-radio-group v-if="formState.hotelFacilities!.entertainment.pool" v-model:value="formState.hotelFacilities!.entertainment.poolType" style="margin-left: 16px;">
                      <a-radio value="free">免费畅游</a-radio>
                      <a-radio value="paid">收费使用</a-radio>
                    </a-radio-group>
                  </div>
                </a-form-item>
                <a-form-item label="健身房" class="inline-form-item">
                  <div class="flex-align">
                    <a-switch v-model:checked="formState.hotelFacilities!.entertainment.gym" />
                    <a-radio-group v-if="formState.hotelFacilities!.entertainment.gym" v-model:value="formState.hotelFacilities!.entertainment.gymType" style="margin-left: 16px;">
                      <a-radio value="free">免费使用</a-radio>
                      <a-radio value="paid">收费使用</a-radio>
                    </a-radio-group>
                  </div>
                </a-form-item>
              </div>
            </div>
          </div>
        </template>

        <h3 class="section-title" style="margin-top: 24px;">商家图文介绍</h3>
        <div style="border: 1px solid #d9d9d9; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
          <Toolbar
            style="border-bottom: 1px solid #d9d9d9"
            :editor="editorRef"
            :defaultConfig="toolbarConfig"
            :mode="mode"
          />
          <Editor
            style="height: 300px; overflow-y: hidden;"
            v-model="valueHtml"
            :defaultConfig="editorConfig"
            :mode="mode"
            @onCreated="handleCreated"
          />
        </div>
        <div class="assist-text" style="margin-bottom: 24px;">
          支持上传图片（最大 5MB）和本地视频以丰富详情页展示。
        </div>

        <h3 class="section-title" style="margin-top: 24px;">服务资质与协议文件</h3>
        <div style="margin-bottom: 16px; color: #595959; font-size: 13px;">
          <InfoCircleOutlined style="color: #1890ff; margin-right: 4px;" />
          请按分类上传最新且加盖公章的对应资质文件。
        </div>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="营业执照" required>
              <a-upload
                v-model:file-list="licenseFileList"
                list-type="picture-card"
                :before-upload="beforeUploadGen(licenseFileList)"
                :max-count="1"
              >
                <div v-if="licenseFileList.length === 0">
                  <UploadOutlined />
                  <div style="margin-top: 8px">上传</div>
                </div>
              </a-upload>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="服务供应保障协议" required>
              <a-upload
                v-model:file-list="agreementFileList"
                list-type="picture-card"
                :before-upload="beforeUploadGen(agreementFileList)"
                :max-count="1"
              >
                <div v-if="agreementFileList.length === 0">
                  <UploadOutlined />
                  <div style="margin-top: 8px">上传</div>
                </div>
              </a-upload>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="特殊行业许可证">
              <a-upload
                v-model:file-list="specialFileList"
                list-type="picture-card"
                :before-upload="beforeUploadGen(specialFileList)"
                :max-count="1"
              >
                <div v-if="specialFileList.length === 0">
                  <UploadOutlined />
                  <div style="margin-top: 8px">上传(可选)</div>
                </div>
              </a-upload>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <template #footer>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <a-button @click="closeDrawer">取消</a-button>
          <a-button type="primary" style="background: #006738; border-color: #006738;" :loading="submitting" @click="submitUpdate">
            保存提交
          </a-button>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<style scoped>
.merchant-info-page {
  padding: 0;
}
.assist-text {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
  line-height: 1.5;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #262626;
  border-left: 4px solid #006738;
  padding-left: 8px;
}
.facility-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px 24px;
}
.facility-category {
  margin-bottom: 24px;
}
.facility-category:last-child {
  margin-bottom: 0;
}
.category-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
.vertical-line {
  display: inline-block;
  width: 3px;
  height: 14px;
  background: #006738;
  margin-right: 8px;
  border-radius: 2px;
}
.category-items {
  padding-left: 12px;
}
.inline-form-item {
  margin-bottom: 12px;
}
.inline-form-item :deep(.ant-form-item-label) {
  padding: 0;
  width: 80px;
  text-align: right;
  margin-right: 16px;
  font-weight: normal;
}
.inline-form-item :deep(.ant-form-item-control-input) {
  min-height: auto;
}
.inline-form-item :deep(.ant-form-item-row) {
  flex-direction: row;
  align-items: center;
}
.flex-align {
  display: flex;
  align-items: center;
}
.flex-row-items {
  display: flex;
  gap: 24px;
  margin-left: 96px;
}
</style>
