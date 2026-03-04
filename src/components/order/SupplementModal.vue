<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { CheckCircleFilled } from '@ant-design/icons-vue'
import type { Dayjs } from 'dayjs'
import type { OrderType } from '@/mock/orderData'

const props = defineProps<{
  open: boolean
  defaultType?: OrderType
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success', order: any): void
}>()

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(false)
const queryLoading = ref(false)
const succeeded = ref(false)
const successOrderNo = ref('')
const errorMsg = ref('')

// ─── Customer info ────────────────────────────────────────────────────────────
const idCard = ref('')
const customerName = ref('')
const customerPhone = ref('')
const address = ref('') // Added for Medical
const idCardStatus = ref<'' | 'error'>('')

// ─── Service user (was Appoint Person) ─────────────────────────────────────────
const isSelfUse = ref(true)
const userFields = reactive({
  name: '',
  idCard: '',
  phone: '',
})
const userFieldsStatus = reactive({ name: '', idCard: '', phone: '' } as Record<string, '' | 'error'>)

// ─── Order info (Shared & Hotel) ──────────────────────────────────────────────
const redeemType = ref<'优惠价' | '入住' | ''>('')
const roomTypeName = ref('')
const roomCount = ref<number | undefined>(1)
const checkInDate = ref<Dayjs | null>(null)
const checkOutDate = ref<Dayjs | null>(null)
const remark = ref('')

// ─── Order info (Medical Specific) ────────────────────────────────────────────
const medicalProject = ref('')
const medicalType = ref<'门诊' | '住宿' | ''>('')
const medicalGender = ref<'男' | '女' | ''>('')
const scheduleDate = ref<Dayjs | null>(null)
const medicalLunch = ref<boolean | null>(null)
const medicalDinner = ref<boolean | null>(null)
const medicalStatus = ref<'PENDING_USE' | 'COMPLETED' | ''>('PENDING_USE')

// ─── Companion Info (Medical Specific) ───────────────────────────────────────
const hasCompanion = ref(false)
const comp = reactive({
  name: '', idCard: '', phone: '', age: undefined as number | undefined,
  gender: '' as '男' | '女' | '', relation: '', maritalStatus: '' as '已婚' | '未婚' | '',
  address: '', lunch: null as boolean | null, dinner: null as boolean | null
})

// field-level status
const orderFieldStatus = reactive({
  redeemType: '', roomTypeName: '', roomCount: '', checkInDate: '', checkOutDate: '',
  medicalProject: '', medicalType: '', medicalGender: '', scheduleDate: '',
  medicalLunch: '', medicalDinner: '', address: '', medicalStatus: ''
} as Record<string, '' | 'error'>)

const compStatus = reactive({
  name: '', idCard: '', phone: '', age: '', gender: '', relation: '', maritalStatus: '',
  address: '', lunch: '', dinner: ''
} as Record<string, '' | 'error'>)

// ─── Computed ─────────────────────────────────────────────────────────────────
const disabledCheckOutDate = computed(() => (current: Dayjs) => {
  if (!checkInDate.value) return false
  return current.isBefore(checkInDate.value, 'day')
})

const isMedical = computed(() => props.defaultType === 'medical')
const isHotel = computed(() => props.defaultType === 'hotel')

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(() => props.open, (v) => {
  if (!v) return
  resetAll()
})

// ─── Methods ──────────────────────────────────────────────────────────────────
function resetAll() {
  loading.value = false
  queryLoading.value = false
  succeeded.value = false
  successOrderNo.value = ''
  errorMsg.value = ''

  idCard.value = ''
  customerName.value = ''
  customerPhone.value = ''
  address.value = ''
  idCardStatus.value = ''

  isSelfUse.value = true
  Object.assign(userFields, { name: '', idCard: '', phone: '' })
  Object.assign(userFieldsStatus, { name: '', idCard: '', phone: '' })

  redeemType.value = ''
  roomTypeName.value = ''
  roomCount.value = 1
  checkInDate.value = null
  checkOutDate.value = null
  remark.value = ''

  medicalProject.value = ''
  medicalType.value = ''
  medicalGender.value = ''
  scheduleDate.value = null
  medicalStatus.value = 'PENDING_USE'
  medicalLunch.value = null
  medicalDinner.value = null

  hasCompanion.value = false
  Object.assign(comp, {
    name: '', idCard: '', phone: '', age: undefined, gender: '', relation: '', maritalStatus: '',
    address: '', lunch: null, dinner: null
  })

  Object.keys(orderFieldStatus).forEach(k => (orderFieldStatus[k] = ''))
  Object.keys(compStatus).forEach(k => (compStatus[k] = ''))
}

function handleClose() {
  emit('update:open', false)
}

function handleQueryCustomer() {
  if (!idCard.value.trim()) {
    idCardStatus.value = 'error'
    errorMsg.value = '请填写证件号后再查询'
    return
  }
  idCardStatus.value = ''
  errorMsg.value = ''
  queryLoading.value = true
  // Simulate API call
  setTimeout(() => {
    queryLoading.value = false
    customerName.value = '张三'
    customerPhone.value = '138****5678'
  }, 600)
}

function validate(): boolean {
  errorMsg.value = ''
  idCardStatus.value = ''
  Object.assign(userFieldsStatus, { name: '', idCard: '', phone: '' })
  Object.keys(orderFieldStatus).forEach(k => (orderFieldStatus[k] = ''))
  Object.keys(compStatus).forEach(k => (compStatus[k] = ''))

  const missing: string[] = []

  // Global Customer Info
  if (!idCard.value.trim()) { idCardStatus.value = 'error'; missing.push('客户证件号') }
  if (!customerName.value) missing.push('客户姓名（请先查询）')
  if (isMedical.value && !address.value.trim()) { orderFieldStatus.address = 'error'; missing.push('寄件地址') }

  // Global Service User
  if (!isSelfUse.value) {
    if (!userFields.name) { userFieldsStatus.name = 'error'; missing.push('使用人姓名') }
    if (!userFields.idCard) { userFieldsStatus.idCard = 'error'; missing.push('使用人证件号') }
    if (!userFields.phone) { userFieldsStatus.phone = 'error'; missing.push('使用人手机号') }
  }

  // Medical Order Info
  if (isMedical.value) {
    if (!medicalStatus.value) { orderFieldStatus.medicalStatus = 'error'; missing.push('订单状态') }
    if (!medicalProject.value) { orderFieldStatus.medicalProject = 'error'; missing.push('体检服务项目') }
    if (!medicalType.value) { orderFieldStatus.medicalType = 'error'; missing.push('体检类型') }
    if (!medicalGender.value) { orderFieldStatus.medicalGender = 'error'; missing.push('体检人性别') }
    if (!scheduleDate.value) { orderFieldStatus.scheduleDate = 'error'; missing.push('档期日期') }

    if (medicalType.value === '住宿') {
      if (medicalLunch.value === null) { orderFieldStatus.medicalLunch = 'error'; missing.push('体检日是否用午餐') }
      if (medicalDinner.value === null) { orderFieldStatus.medicalDinner = 'error'; missing.push('入住日是否用晚餐') }
    }

    // Companion
    if (hasCompanion.value) {
      if (!comp.name) { compStatus.name = 'error'; missing.push('陪同人姓名') }
      if (!comp.idCard) { compStatus.idCard = 'error'; missing.push('陪同人证件号') }
      if (!comp.phone) { compStatus.phone = 'error'; missing.push('陪同人手机号') }
      if (!comp.age) { compStatus.age = 'error'; missing.push('陪同人年龄') }
      if (!comp.gender) { compStatus.gender = 'error'; missing.push('陪同人性别') }
      if (!comp.relation) { compStatus.relation = 'error'; missing.push('陪同人关系') }
      if (!comp.maritalStatus) { compStatus.maritalStatus = 'error'; missing.push('陪同人婚否') }
      if (!comp.address) { compStatus.address = 'error'; missing.push('陪同人寄件地址') }
      if (medicalType.value === '住宿') {
        if (comp.lunch === null) { compStatus.lunch = 'error'; missing.push('陪同人午餐选择') }
        if (comp.dinner === null) { compStatus.dinner = 'error'; missing.push('陪同人晚餐选择') }
      }
    }
  }

  // Hotel Order Info
  if (isHotel.value) {
    if (!redeemType.value) { orderFieldStatus.redeemType = 'error'; missing.push('订单兑换类型') }
    if (!roomTypeName.value) { orderFieldStatus.roomTypeName = 'error'; missing.push('房型名称') }
    if (!roomCount.value || roomCount.value < 1) { orderFieldStatus.roomCount = 'error'; missing.push('房间数') }
    if (!checkInDate.value) { orderFieldStatus.checkInDate = 'error'; missing.push('入住日期') }
    if (!checkOutDate.value) { orderFieldStatus.checkOutDate = 'error'; missing.push('离店日期') }
  }

  if (missing.length) {
    errorMsg.value = `请填写完整信息：${missing.join('、')}`
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return
  loading.value = true
  setTimeout(() => {
    loading.value = false
    const orderNo = `VX${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Date.now()).slice(-4)}`
    successOrderNo.value = orderNo

    // Construct order payload based on type
    const baseOrder = {
      orderNo,
      userName: customerName.value,
      userPhone: customerPhone.value,
      userIdCard: idCard.value,
      remark: remark.value,
      isSupplementary: true,
    }

    let specificOrder = {}
    if (isHotel.value) {
      specificOrder = {
        status: 'PENDING_USE',
        redeemType: redeemType.value,
        roomTypeName: roomTypeName.value,
        roomCount: roomCount.value,
        checkInDate: checkInDate.value?.format('YYYY-MM-DD'),
        checkOutDate: checkOutDate.value?.format('YYYY-MM-DD'),
      }
    } else if (isMedical.value) {
      specificOrder = {
        status: medicalStatus.value,
        serviceName: medicalProject.value, // maps to list view
        scheduleDate: scheduleDate.value?.format('YYYY-MM-DD'),
        medicalType: medicalType.value,
        medicalGender: medicalGender.value,
        address: address.value,
        medicalLunch: medicalLunch.value,
        medicalDinner: medicalDinner.value,
        hasCompanion: hasCompanion.value,
        companionInfo: hasCompanion.value ? { ...comp } : null,
      }
    }

    emit('success', { ...baseOrder, ...specificOrder })
    succeeded.value = true
  }, 900)
}
</script>

<template>
  <a-drawer
    :open="open"
    title="新增订单"
    :width="640"
    :footer="null"
    :mask-closable="false"
    @close="handleClose"
    class="supplement-drawer"
  >
    <!-- ── Success State ──────────────────────────────────────────── -->
    <div v-if="succeeded" class="supp-success">
      <check-circle-filled class="supp-success__icon" />
      <div class="supp-success__title">补录成功</div>
      <div class="supp-success__sub">订单号：{{ successOrderNo }}</div>
      <div class="supp-footer supp-footer--center">
        <a-button type="primary" @click="handleClose">关闭</a-button>
      </div>
    </div>

    <!-- ── Main Form ──────────────────────────────────────────────── -->
    <template v-else>
      <div class="supp-body">
        <a-alert
          v-if="errorMsg"
          type="error"
          :message="errorMsg"
          show-icon
          closable
          style="margin-bottom: 16px;"
          @close="errorMsg = ''"
        />

        <!-- ① Customer Info ──────────────────────────────────────── -->
        <div class="supp-section supp-section--gray">
          <div class="supp-section__header">
            <span class="supp-section__title">客户信息</span>
            <div class="supp-section__divider" />
          </div>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="客户证件号" required style="margin-bottom: 12px;">
                <a-input v-model:value="idCard" placeholder="请输入证件号" :status="idCardStatus" allow-clear>
                  <template #suffix>
                    <a-button type="link" size="small" :loading="queryLoading" style="padding: 0; height: auto; line-height: 1;" @click="handleQueryCustomer">查询</a-button>
                  </template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="客户姓名" style="margin-bottom: 12px;">
                <a-input :value="customerName" disabled placeholder="查询后自动填充" />
              </a-form-item>
            </a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="客户手机号" style="margin-bottom: 12px;">
                <a-input :value="customerPhone" disabled placeholder="查询后自动填充" />
              </a-form-item>
            </a-col>
            <a-col :span="12" v-if="isMedical && isSelfUse">
              <a-form-item label="寄件地址" required style="margin-bottom: 12px;">
                <a-input v-model:value="address" :status="orderFieldStatus.address" placeholder="请输入寄件地址" />
              </a-form-item>
            </a-col>
          </a-row>
        </div>

        <!-- ② Service User ───────────────────────────────────────── -->
        <div class="supp-section">
          <div class="supp-section__header">
            <span class="supp-section__title">服务使用人</span>
            <div class="supp-section__divider" />
          </div>

          <div class="supp-toggle-row">
            <span class="supp-toggle-label">是否本人使用</span>
            <a-switch v-model:checked="isSelfUse" />
          </div>

          <div v-if="isSelfUse" class="supp-hint">
            服务使用人信息与填单人一致，无需填写
          </div>

          <template v-else>
            <a-row :gutter="16" style="margin-top: 12px;">
              <a-col :span="12">
                <a-form-item label="使用人姓名" required style="margin-bottom: 12px;">
                  <a-input v-model:value="userFields.name" :status="userFieldsStatus.name" placeholder="请输入姓名" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="使用人证件号" required style="margin-bottom: 12px;">
                  <a-input v-model:value="userFields.idCard" :status="userFieldsStatus.idCard" placeholder="请输入证件号" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="使用人手机号" required style="margin-bottom: 0;">
                  <a-input v-model:value="userFields.phone" :status="userFieldsStatus.phone" placeholder="请输入手机号" />
                </a-form-item>
              </a-col>
              <a-col :span="12" v-if="isMedical">
                <a-form-item label="体检报告寄件地址" required style="margin-bottom: 0;">
                  <a-input v-model:value="address" :status="orderFieldStatus.address" placeholder="请输入寄件地址" />
                </a-form-item>
              </a-col>
            </a-row>
          </template>
        </div>

        <!-- ③ Order Info (Conditional) ───────────────────────────── -->
        <div class="supp-section">
          <div class="supp-section__header">
            <span class="supp-section__title">订单信息</span>
            <div class="supp-section__divider" />
          </div>

          <!-- HOTEL ORDER FIELDS -->
          <template v-if="isHotel">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="订单兑换类型" required style="margin-bottom: 12px;">
                  <a-select v-model:value="redeemType" :status="orderFieldStatus.redeemType" placeholder="请选择兑换类型">
                    <a-select-option value="优惠价">兑换优惠价</a-select-option>
                    <a-select-option value="入住">兑换入住</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="房型名称" required style="margin-bottom: 12px;">
                  <a-select v-model:value="roomTypeName" :status="orderFieldStatus.roomTypeName" placeholder="请选择房型">
                    <a-select-option value="大床房">大床房</a-select-option>
                    <a-select-option value="双床房">双床房</a-select-option>
                    <a-select-option value="豪华大床房">豪华大床房</a-select-option>
                    <a-select-option value="豪华双床房">豪华双床房</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="房间数" required style="margin-bottom: 12px;">
                  <a-input-number v-model:value="roomCount" :status="orderFieldStatus.roomCount" :min="1" :max="99" style="width: 100%;" placeholder="间数"/>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="入住日期" required style="margin-bottom: 12px;">
                  <a-date-picker v-model:value="checkInDate" :status="orderFieldStatus.checkInDate" style="width: 100%;" placeholder="选择入住日期" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="离店日期" required style="margin-bottom: 12px;">
                  <a-date-picker v-model:value="checkOutDate" :status="orderFieldStatus.checkOutDate" :disabled-date="disabledCheckOutDate" style="width: 100%;" placeholder="选择离店日期" />
                </a-form-item>
              </a-col>
            </a-row>
          </template>

          <!-- MEDICAL ORDER FIELDS -->
          <template v-if="isMedical">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="订单状态" required style="margin-bottom: 12px;">
                  <a-select v-model:value="medicalStatus" :status="orderFieldStatus.medicalStatus" placeholder="请选择状态">
                    <a-select-option value="PENDING_USE">待核销</a-select-option>
                    <a-select-option value="COMPLETED">已核销</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="体检服务项目" required style="margin-bottom: 12px;">
                  <a-select v-model:value="medicalProject" :status="orderFieldStatus.medicalProject" placeholder="请选择体检项目">
                    <a-select-option value="三星体检">三星体检</a-select-option>
                    <a-select-option value="四星体检">四星体检</a-select-option>
                    <a-select-option value="五星体检">五星体检</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="体检类型" required style="margin-bottom: 12px;">
                  <a-select v-model:value="medicalType" :status="orderFieldStatus.medicalType" placeholder="请选择类型">
                    <a-select-option value="门诊">门诊</a-select-option>
                    <a-select-option value="住宿">住宿</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
              </a-col>
            </a-row>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="体检人性别" required style="margin-bottom: 12px;">
                  <a-radio-group v-model:value="medicalGender" :class="{ 'radio-error': orderFieldStatus.medicalGender === 'error' }">
                    <a-radio value="男">男</a-radio>
                    <a-radio value="女">女</a-radio>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="档期日期" required style="margin-bottom: 12px;">
                  <a-date-picker v-model:value="scheduleDate" :status="orderFieldStatus.scheduleDate" style="width: 100%;" placeholder="请选择体检日期" />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- Meal Info block (Only for 住宿) -->
            <template v-if="medicalType === '住宿'">
              <div style="background: #fdfdfd; padding: 12px; border: 1px dashed #d9d9d9; border-radius: 6px; margin-bottom: 12px;">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">用餐饮食信息（使用人）</div>
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="体检日是否用午餐" required style="margin-bottom: 0;">
                      <a-radio-group v-model:value="medicalLunch" :class="{ 'radio-error': orderFieldStatus.medicalLunch === 'error' }">
                        <a-radio :value="true">是</a-radio>
                        <a-radio :value="false">否</a-radio>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="入住日是否用晚餐" required style="margin-bottom: 0;">
                      <a-radio-group v-model:value="medicalDinner" :class="{ 'radio-error': orderFieldStatus.medicalDinner === 'error' }">
                        <a-radio :value="true">是</a-radio>
                        <a-radio :value="false">否</a-radio>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                </a-row>
              </div>
            </template>
          </template>

          <!-- Shared Remark -->
          <a-form-item label="备注" style="margin-bottom: 0;">
            <a-textarea v-model:value="remark" :rows="2" :maxlength="200" placeholder="选填，最多200字" />
          </a-form-item>
        </div>

        <!-- ④ Companion Info (Medical Only) ──────────────────────── -->
        <div v-if="isMedical" class="supp-section">
          <div class="supp-section__header">
            <span class="supp-section__title">陪同人信息</span>
            <div class="supp-section__divider" />
          </div>

          <div class="supp-toggle-row">
            <span class="supp-toggle-label">是否添加陪同人</span>
            <a-switch v-model:checked="hasCompanion" />
          </div>

          <template v-if="hasCompanion">
            <div style="padding: 12px; background: #fafafa; border-radius: 6px; margin-top: 12px;">
              <!-- row 1 -->
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="姓名" required style="margin-bottom: 12px;">
                    <a-input v-model:value="comp.name" :status="compStatus.name" placeholder="请输入姓名" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="证件号" required style="margin-bottom: 12px;">
                    <a-input v-model:value="comp.idCard" :status="compStatus.idCard" placeholder="请输入证件号" />
                  </a-form-item>
                </a-col>
              </a-row>
              <!-- row 2 -->
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="手机号" required style="margin-bottom: 12px;">
                    <a-input v-model:value="comp.phone" :status="compStatus.phone" placeholder="请输入手机号" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="年龄" required style="margin-bottom: 12px;">
                    <a-input-number v-model:value="comp.age" :status="compStatus.age" style="width: 100%;" placeholder="岁" />
                  </a-form-item>
                </a-col>
              </a-row>
              <!-- row 3 -->
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="性别" required style="margin-bottom: 12px;">
                    <a-select v-model:value="comp.gender" :status="compStatus.gender">
                      <a-select-option value="男">男</a-select-option>
                      <a-select-option value="女">女</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="关系" required style="margin-bottom: 12px;">
                    <a-select v-model:value="comp.relation" :status="compStatus.relation" placeholder="请选择关系">
                      <a-select-option value="父母">父母</a-select-option>
                      <a-select-option value="配偶">配偶</a-select-option>
                      <a-select-option value="子女">子女</a-select-option>
                      <a-select-option value="其他">其他</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
              <!-- row 4 -->
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="婚否" required style="margin-bottom: 12px;">
                    <a-select v-model:value="comp.maritalStatus" :status="compStatus.maritalStatus">
                      <a-select-option value="已婚">已婚</a-select-option>
                      <a-select-option value="未婚">未婚</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-divider style="margin: 12px 0;" dashed />

              <div style="font-weight: 500; font-size: 13px; margin-bottom: 12px;">陪同人收件信息</div>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="寄件地址" required style="margin-bottom: 12px;">
                    <a-input v-model:value="comp.address" :status="compStatus.address" placeholder="请输入寄件地址" />
                  </a-form-item>
                </a-col>
              </a-row>

              <!-- Companion Meal Info block (Only for 住宿) -->
              <template v-if="medicalType === '住宿'">
                <a-divider style="margin: 12px 0;" dashed />
                <div style="font-weight: 500; font-size: 13px; margin-bottom: 12px;">陪同人饮食选项</div>
                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="体检日是否用午餐" required style="margin-bottom: 0;">
                      <a-radio-group v-model:value="comp.lunch" :class="{ 'radio-error': compStatus.lunch === 'error' }">
                        <a-radio :value="true">是</a-radio>
                        <a-radio :value="false">否</a-radio>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="入住日是否用晚餐" required style="margin-bottom: 0;">
                      <a-radio-group v-model:value="comp.dinner" :class="{ 'radio-error': compStatus.dinner === 'error' }">
                        <a-radio :value="true">是</a-radio>
                        <a-radio :value="false">否</a-radio>
                      </a-radio-group>
                    </a-form-item>
                  </a-col>
                </a-row>
              </template>

            </div>
          </template>
        </div>

      </div>

      <!-- ── Fixed Footer ───────────────────────────────────────── -->
      <div class="supp-footer">
        <a-button @click="handleClose">取消</a-button>
        <a-button type="primary" :loading="loading" @click="handleSubmit">确认补录</a-button>
      </div>
    </template>
  </a-drawer>
</template>

<style scoped>
/* ── Drawer body padding reset ────────────────────────────────────────────────── */
:deep(.ant-drawer-body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Scrollable content ─────────────────────────────────────────────────────── */
.supp-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 8px;
}

/* ── Section ────────────────────────────────────────────────────────────────── */
.supp-section {
  margin-bottom: 20px;
}

.supp-section--gray {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.supp-section__header {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  gap: 10px;
}

.supp-section__title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  white-space: nowrap;
}

.supp-section__divider {
  flex: 1;
  height: 1px;
  background: #e5e6eb;
}

/* ── Toggle row ─────────────────────────────────────────────────────────────── */
.supp-toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.supp-toggle-label {
  font-size: 13px;
  color: #262626;
}

.supp-hint {
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 8px 12px;
}

/* ── Radio error highlight ───────────────────────────────────────────────────── */
.radio-error :deep(.ant-radio-wrapper) {
  color: #ff4d4f;
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */
.supp-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  flex-shrink: 0;
}

.supp-footer--center {
  justify-content: center;
  border-top: none;
  padding-top: 0;
}

/* ── Success state ───────────────────────────────────────────────────────────── */
.supp-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 0;
}

.supp-success__icon {
  font-size: 56px;
  color: #52c41a;
  margin-bottom: 16px;
}

.supp-success__title {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.supp-success__sub {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 32px;
}
</style>
