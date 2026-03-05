<script setup lang="ts">
import { ref } from 'vue'
import { DownloadOutlined, UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { OrderType } from '@/mock/orderData'

const props = defineProps<{
  open: boolean
  orderType: OrderType
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success', count: number): void
}>()

const currentStep = ref(0)
const uploading = ref(false)
const fileName = ref('')
const importStatus = ref<'PENDING_USE' | 'COMPLETED'>('PENDING_USE')
const resultData = ref({ success: 0, fail: 0, errors: [] as string[] })

const typeLabel: Record<OrderType, string> = {
  hotel: '酒店服务',
  medical: '体检服务',
  booking: '预定服务',
}

const templateFields: Record<OrderType, string[]> = {
  hotel: ['所属商家', '房型名称', '入住日期', '离店日期', '早餐（含早/不含早）', '价格（元）', '客户姓名', '客户手机号', '客户证件号', '使用人姓名', '使用人证件后六位', '备注'],
  medical: ['所属商家', '体检服务名称', '体检类型（门诊/住宿）', '档期日期', '价格（元）', '客户姓名', '客户手机号', '客户证件号', '使用人姓名', '使用人证件后六位', '备注'],
  booking: ['所属商家', '服务名称', '预约日期', '预约时段', '服务地点', '价格（元）', '客户姓名', '客户手机号', '客户证件号', '使用人姓名', '使用人证件后六位', '备注'],
}

const handleDownloadTemplate = () => {
  message.success(`${typeLabel[props.orderType]}导入模板已下载（模拟）`)
}

const handleBeforeUpload = (file: File) => {
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    message.error('仅支持 .xlsx / .xls 格式')
    return false
  }
  fileName.value = file.name
  uploading.value = true
  // Simulate parsing
  setTimeout(() => {
    uploading.value = false
    resultData.value = {
      success: 4,
      fail: 1,
      errors: ['第3行：客户手机号格式错误（应为11位数字）'],
    }
    currentStep.value = 3
  }, 1500)
  return false
}

const handleClose = () => {
  currentStep.value = 0
  fileName.value = ''
  resultData.value = { success: 0, fail: 0, errors: [] }
  emit('update:open', false)
}

const handleConfirmResult = () => {
  emit('success', resultData.value.success)
  message.success(`批量导入完成：成功 ${resultData.value.success} 条`)
  handleClose()
}
</script>

<template>
  <a-modal
    :open="open"
    :title="`批量导入 · ${typeLabel[orderType]}订单`"
    :width="640"
    :footer="null"
    @cancel="handleClose"
  >
    <a-steps :current="currentStep" size="small" style="margin-bottom: 28px;">
      <a-step title="下载模板" />
      <a-step title="填写数据" />
      <a-step title="上传文件" />
      <a-step title="查看结果" />
    </a-steps>

    <!-- Step 0: Download template -->
    <div v-if="currentStep === 0">
      <a-alert type="info" show-icon style="margin-bottom: 16px;">
        <template #message>请先下载对应类型的导入模板，按模板格式填写数据后上传。</template>
      </a-alert>
      <div style="background: #fafafa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #262626; margin-bottom: 10px;">
          {{ typeLabel[orderType] }}模板字段说明
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <a-tag v-for="field in templateFields[orderType]" :key="field" color="blue">{{ field }}</a-tag>
        </div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <a-button @click="handleClose">取消</a-button>
        <a-button type="primary" @click="handleDownloadTemplate; currentStep = 1" style="background: #006738; border-color: #006738;">
          <template #icon><DownloadOutlined /></template>
          下载模板
        </a-button>
      </div>
    </div>

    <!-- Step 1: Fill data instructions -->
    <div v-if="currentStep === 1">
      <a-alert type="warning" show-icon style="margin-bottom: 16px;">
        <template #message>填写注意事项</template>
        <template #description>
          <ul style="margin: 8px 0 0; padding-left: 16px; font-size: 12px; line-height: 2;">
            <li>请勿修改模板表头，否则将导致导入失败</li>
            <li>日期格式：YYYY-MM-DD（如 2026-02-25）</li>
            <li>价格填写数字，不含货币符号</li>
            <li>手机号须为11位数字</li>
            <li>证件后六位须为6位数字</li>
            <li>单次最多导入 500 条记录</li>
          </ul>
        </template>
      </a-alert>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <a-button @click="currentStep = 0">上一步</a-button>
        <a-button type="primary" @click="currentStep = 2" style="background: #006738; border-color: #006738;">
          已填写完毕，去上传
        </a-button>
      </div>
    </div>

    <!-- Step 2: Upload -->
    <div v-if="currentStep === 2">
      <div style="margin-bottom: 16px;">
        <span style="margin-right: 12px; color: #666;">导入后订单状态：</span>
        <a-radio-group v-model:value="importStatus">
          <a-radio value="PENDING_USE">待使用</a-radio>
          <a-radio value="COMPLETED">已核销</a-radio>
        </a-radio-group>
      </div>

      <a-upload-dragger
        :show-upload-list="false"
        :before-upload="handleBeforeUpload"
        accept=".xlsx,.xls"
        style="margin-bottom: 16px;"
      >
        <p class="ant-upload-drag-icon">
          <UploadOutlined style="font-size: 40px; color: #006738;" />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">仅支持 .xlsx / .xls 格式，单次最多 500 条</p>
      </a-upload-dragger>

      <a-spin v-if="uploading" tip="正在解析文件..." style="display: block; text-align: center; padding: 20px 0;" />

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <a-button @click="currentStep = 1">上一步</a-button>
      </div>
    </div>

    <!-- Step 3: Result -->
    <div v-if="currentStep === 3">
      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        <a-statistic
          title="导入成功"
          :value="resultData.success"
          :value-style="{ color: '#006738', fontSize: '28px' }"
          suffix="条"
          style="flex: 1; background: #f6ffed; border-radius: 8px; padding: 16px;"
        >
          <template #prefix><CheckCircleOutlined /></template>
        </a-statistic>
        <a-statistic
          title="导入失败"
          :value="resultData.fail"
          :value-style="{ color: resultData.fail > 0 ? '#ff4d4f' : '#8c8c8c', fontSize: '28px' }"
          suffix="条"
          style="flex: 1; background: #fff2f0; border-radius: 8px; padding: 16px;"
        >
          <template #prefix><CloseCircleOutlined /></template>
        </a-statistic>
      </div>

      <div v-if="resultData.errors.length" style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; color: #ff4d4f; margin-bottom: 8px;">失败原因</div>
        <div
          v-for="(err, i) in resultData.errors"
          :key="i"
          style="font-size: 12px; color: #ff4d4f; padding: 6px 10px; background: #fff2f0; border-radius: 4px; margin-bottom: 4px;"
        >
          {{ err }}
        </div>
        <a-button type="link" size="small" style="padding: 0; color: #006738;">
          下载失败明细
        </a-button>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <a-button @click="handleClose">关闭</a-button>
        <a-button
          v-if="resultData.success > 0"
          type="primary"
          @click="handleConfirmResult"
          style="background: #006738; border-color: #006738;"
        >
          确认，刷新列表
        </a-button>
      </div>
    </div>
  </a-modal>
</template>
