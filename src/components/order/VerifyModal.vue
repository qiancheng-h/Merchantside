<script setup lang="ts">
import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import type { OrderItem } from '@/mock/orderData'

const props = defineProps<{
  open: boolean
  order: OrderItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success'): void
}>()

const form = reactive({ name: '', idLast6: '' })
const loading = ref(false)
const errorMsg = ref('')

const handleClose = () => {
  form.name = ''
  form.idLast6 = ''
  errorMsg.value = ''
  emit('update:open', false)
}

const handleVerify = () => {
  if (!form.name.trim()) {
    errorMsg.value = '请输入使用人姓名'
    return
  }
  if (!/^\d{6}$/.test(form.idLast6)) {
    errorMsg.value = '证件后六位须为6位数字'
    return
  }
  loading.value = true
  errorMsg.value = ''
  // Simulate backend verification (mock: name "张三" + "123456" is correct)
  setTimeout(() => {
    loading.value = false
    // Mock: any input with 6 digits passes (demo)
    if (form.idLast6.length === 6) {
      emit('success')
      handleClose()
    } else {
      errorMsg.value = '信息不匹配，请核实后重试'
    }
  }, 800)
}
</script>

<template>
  <a-modal
    :open="open"
    title="核销验证"
    :width="420"
    :confirm-loading="loading"
    ok-text="确认核销"
    cancel-text="取消"
    :ok-button-props="{ style: 'background: #006738; border-color: #006738;' }"
    @ok="handleVerify"
    @cancel="handleClose"
  >
    <div style="padding: 8px 0;">
      <a-alert
        type="info"
        show-icon
        message="请让客户出示使用人信息，核对后完成核销"
        style="margin-bottom: 20px;"
      />

      <a-form layout="vertical">
        <a-form-item label="使用人姓名" required>
          <a-input
            v-model:value="form.name"
            placeholder="请输入使用人姓名"
            allow-clear
            @pressEnter="handleVerify"
          />
        </a-form-item>
        <a-form-item label="使用人证件后 6 位" required>
          <a-input
            v-model:value="form.idLast6"
            placeholder="请输入使用人证件后 6 位"
            :maxlength="6"
            allow-clear
            @pressEnter="handleVerify"
          />
        </a-form-item>
      </a-form>

      <a-alert
        v-if="errorMsg"
        type="error"
        :message="errorMsg"
        show-icon
        style="margin-top: 8px;"
      />
    </div>
  </a-modal>
</template>
