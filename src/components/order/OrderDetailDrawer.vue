<script setup lang="ts">
import { ref } from 'vue'
import {
  CheckOutlined,
  StopOutlined,
  ScanOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import type { OrderItem } from '@/mock/orderData'
import { statusMap } from '@/mock/orderData'
import VerifyModal from './VerifyModal.vue'

// ─── Props / Emits ────────────────────────────────────────────────────────────
const props = defineProps<{
  open: boolean
  order: OrderItem | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm', order: OrderItem): void
  (e: 'reject', order: OrderItem): void
  (e: 'verify', order: OrderItem): void
  (e: 'confirmModify', order: OrderItem): void
}>()

// ─── Verify modal ─────────────────────────────────────────────────────────────
const verifyVisible = ref(false)

// ─── Remark (Removed) ─────────────────────────────────────────────────────────// ─── Actions ──────────────────────────────────────────────────────────────────
const confirmLoading = ref(false)

const handleConfirm = () => {
  if (!props.order) return
  Modal.confirm({
    title: '确认接受此订单？',
    content: '确认后将向客户发送确认短信，订单状态变更为「待使用」。',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      confirmLoading.value = true
      setTimeout(() => {
        confirmLoading.value = false
        emit('confirm', props.order!)
        message.success('订单已确认，短信已发送')
        emit('update:open', false)
      }, 800)
    },
  })
}

const handleReject = () => {
  if (!props.order) return
  Modal.confirm({
    title: '确认不可接待？',
    content: '操作后将向客户发送取消短信，订单状态变更为「已取消」。',
    okText: '确认不可接待',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      confirmLoading.value = true
      setTimeout(() => {
        confirmLoading.value = false
        emit('reject', props.order!)
        message.success('已标记不可接待，短信已发送')
        emit('update:open', false)
      }, 800)
    },
  })
}

const handleConfirmModify = () => {
  if (!props.order) return
  Modal.confirm({
    title: '确认修改请求？',
    content: '确认后将向客户发送修改确认短信。',
    okText: '确认修改',
    cancelText: '取消',
    onOk() {
      confirmLoading.value = true
      setTimeout(() => {
        confirmLoading.value = false
        emit('confirmModify', props.order!)
        message.success('修改已确认，短信已发送')
        emit('update:open', false)
      }, 800)
    },
  })
}

const handleVerifySuccess = () => {
  if (!props.order) return
  emit('verify', props.order)
  message.success('核销成功，订单已完成')
  verifyVisible.value = false
  emit('update:open', false)
}

</script>

<template>
  <a-drawer
    :open="open"
    :width="680"
    :footer-style="{ textAlign: 'right' }"
    @close="emit('update:open', false)"
  >
    <!-- Title -->
    <template #title>
      <span style="font-weight: 700; font-size: 15px;">{{ order?.orderNo }}</span>
      <a-tag v-if="order" :color="statusMap[order.status].color" style="margin-left: 10px;">
        {{ statusMap[order.status].text }}
      </a-tag>
      <a-tag v-if="order?.isSupplementary" color="purple" style="margin-left: 4px;">补录</a-tag>
    </template>

    <template v-if="order">
      <!-- ── Top Alert: Cancel Request ── -->
      <a-alert
        v-if="order.hasCancelRequest"
        type="warning"
        show-icon
        message="客户已申请取消，订单已自动取消"
        style="margin-bottom: 16px;"
      />

      <!-- ── Top Alert: Modify Request (PENDING_USE with pending changes) ── -->
      <a-alert
        v-if="order.hasModifyRequest && order.status === 'PENDING_USE'"
        type="warning"
        show-icon
        style="margin-bottom: 16px;"
      >
        <template #message>
          客户已申请修改，请尽快处理
          <a-button type="link" size="small" style="padding: 0 4px; color: #006738;" @click="handleConfirmModify">
            确认修改
          </a-button>
        </template>
      </a-alert>

      <!-- ── Top Alert: PENDING_MODIFY ── -->
      <a-alert
        v-if="order.status === 'PENDING_MODIFY'"
        type="warning"
        show-icon
        message="订单已被撤回修改"
        description="该订单已从商家侧撤回，正在等待客户和销售完成信息修改。修改完成后订单将重新推送至商家。"
        style="margin-bottom: 16px;"
      />

      <!-- ── Section 1: Basic Info ── -->
      <a-card :bordered="false" style="margin-bottom: 16px; background: #fafafa; border-radius: 8px;">
        <div class="section-title">基础信息</div>
        <a-descriptions v-if="order.orderType !== 'medical'" :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '90px' }">
          <a-descriptions-item label="订单编号">{{ order.orderNo }}</a-descriptions-item>
          <a-descriptions-item label="所属商家">{{ order.merchant }}</a-descriptions-item>
          <a-descriptions-item label="服务名称" :span="2">{{ order.serviceName }}</a-descriptions-item>
          <a-descriptions-item label="下单时间">{{ order.createTime || '—' }}</a-descriptions-item>
          <a-descriptions-item v-if="order.verifyTime" label="核销时间">{{ order.verifyTime }}</a-descriptions-item>
        </a-descriptions>

        <a-descriptions v-if="order.orderType === 'medical'" :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '90px' }">
          <a-descriptions-item label="国寿订单号">{{ order.orderNo }}</a-descriptions-item>
          <a-descriptions-item label="平台订单号">{{ order.platformOrderNo || '—' }}</a-descriptions-item>
          <a-descriptions-item label="服务项目名称" :span="2">{{ order.serviceName }}</a-descriptions-item>
          <a-descriptions-item label="订单类型">体检类</a-descriptions-item>
          <a-descriptions-item label="同步状态">
            <template v-if="order.syncStatus === 'SUCCESS'"><a-tag color="success">成功</a-tag></template>
            <template v-else-if="order.syncStatus === 'FAILED'">
              <a-tag color="error">失败</a-tag>
              <a-tooltip :title="order.syncFailReason"><info-circle-outlined style="color: #ff4d4f" /></a-tooltip>
            </template>
            <template v-else-if="order.syncStatus === 'PENDING'"><a-tag color="processing">同步中</a-tag></template>
            <template v-else>—</template>
          </a-descriptions-item>
          <a-descriptions-item label="补录标识">
            <a-tag v-if="order.isSupplementary" color="blue">补录</a-tag>
            <span v-else>—</span>
          </a-descriptions-item>
          <a-descriptions-item label="最近同步时间">{{ order.lastSyncTime || '—' }}</a-descriptions-item>
          <a-descriptions-item label="下单时间">{{ order.createTime || '—' }}</a-descriptions-item>
          <a-descriptions-item label="订单状态">
            {{ statusMap[order.status].text || '—' }}
            <a-tag v-if="order.status === 'COMPLETED' && order.absenceStatus === 'ABSENT'" color="volcano" style="margin-left: 6px;">缺席</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="核销时间">{{ order.verifyTime || '—' }}</a-descriptions-item>
          <a-descriptions-item v-if="order.status === 'COMPLETED'" label="缺席状态">
            <a-tag v-if="order.absenceStatus === 'ABSENT'" color="volcano">缺席</a-tag>
            <a-tag v-else-if="order.absenceStatus === 'PRESENT'" color="success">未缺席</a-tag>
            <span v-else>—</span>
          </a-descriptions-item>
          <a-descriptions-item label="订单结算价">¥{{ order.settlementPrice ? order.settlementPrice.toFixed(2) : '—' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- ── Section 2: Customer Info ── -->
      <a-card :bordered="false" style="margin-bottom: 16px; background: #fafafa; border-radius: 8px;">
        <div class="section-title">客户信息</div>
        <a-descriptions :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '90px' }">
          <a-descriptions-item label="客户姓名">{{ order.userName }}</a-descriptions-item>
          <a-descriptions-item label="手机号">{{ order.userPhone }}</a-descriptions-item>
          <a-descriptions-item label="证件号">{{ order.userIdCard ? order.userIdCard.slice(0, -6) + '******' : '—' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- ── Section 3: Order Info (type-specific) ── -->
      <a-card :bordered="false" style="margin-bottom: 16px; background: #fafafa; border-radius: 8px;">
        <div class="section-title">订单信息</div>

        <!-- Hotel & Booking specific -->
        <template v-if="order.orderType !== 'medical'">
          <a-descriptions :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '90px' }">
            <a-descriptions-item label="价格">¥{{ order.price }}</a-descriptions-item>

            <template v-if="order.orderType === 'hotel'">
              <a-descriptions-item label="房间数">{{ order.roomCount || 1 }}间</a-descriptions-item>
              <a-descriptions-item label="早餐">{{ order.breakfast }}</a-descriptions-item>
              <a-descriptions-item label="入住日期">{{ order.checkInDate }}</a-descriptions-item>
              <a-descriptions-item label="离店日期">{{ order.checkOutDate }}</a-descriptions-item>
              <a-descriptions-item v-if="order.confirmTime" label="确认时间">{{ order.confirmTime }}</a-descriptions-item>
              <a-descriptions-item v-if="order.cancelTime" label="取消时间">{{ order.cancelTime }}</a-descriptions-item>
              <a-descriptions-item v-if="order.closeTime" label="关闭时间">{{ order.closeTime }}</a-descriptions-item>
            </template>

            <template v-if="order.orderType === 'booking'">
              <a-descriptions-item label="预约日期">{{ order.appointDate }}</a-descriptions-item>
              <a-descriptions-item label="预约时段">{{ order.appointTime }}</a-descriptions-item>
              <a-descriptions-item label="服务地点">{{ order.serviceLocation }}</a-descriptions-item>
              <a-descriptions-item v-if="order.confirmTime" label="确认时间">{{ order.confirmTime }}</a-descriptions-item>
              <a-descriptions-item v-if="order.cancelTime" label="取消时间">{{ order.cancelTime }}</a-descriptions-item>
              <a-descriptions-item v-if="order.closeTime" label="关闭时间">{{ order.closeTime }}</a-descriptions-item>
            </template>
          </a-descriptions>
          <a-divider style="margin-top: 12px; margin-bottom: 12px;" />
          <div style="font-size: 13px; color: #262626; font-weight: 600; margin-bottom: 8px;">使用人信息</div>
          <a-descriptions :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '90px' }">
            <a-descriptions-item label="使用人">{{ order.appointPersonNameMasked || '—' }}</a-descriptions-item>
            <a-descriptions-item label="证件号">{{ order.appointPersonIdCard ? order.appointPersonIdCard.slice(0, -6) + '******' : '—' }}</a-descriptions-item>
            <a-descriptions-item v-if="order.orderType === 'hotel'" label="手机号">{{ order.userPhone || '—' }}</a-descriptions-item>
          </a-descriptions>
        </template>

        <!-- Medical specific -->
        <template v-if="order.orderType === 'medical'">
          <!-- 1. 档期信息 -->
          <div style="font-size: 13px; color: #262626; font-weight: 600; margin-bottom: 8px;">1. 档期信息</div>
          <a-descriptions :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '90px', paddingBottom: '0' }">
            <a-descriptions-item label="体检分院">{{ order.medicalBranch || '—' }}</a-descriptions-item>
            <a-descriptions-item label="体检项目">{{ order.medicalProject || '—' }}</a-descriptions-item>
            <a-descriptions-item label="档期时间">{{ order.scheduleDate || '—' }}</a-descriptions-item>
            <a-descriptions-item label="体检方式">{{ order.medicalType || '—' }}</a-descriptions-item>
            <a-descriptions-item v-if="order.medicalType === '住宿'" label="住宿房型">{{ order.medicalRoomType || '—' }}</a-descriptions-item>
          </a-descriptions>

          <!-- 2. 体检人信息 -->
          <a-divider style="margin-top: 12px; margin-bottom: 12px;" dashed />
          <div style="font-size: 13px; color: #262626; font-weight: 600; margin-bottom: 8px;">2. 体检人信息</div>
          <a-descriptions :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '135px', paddingBottom: '0' }">
            <a-descriptions-item label="姓名">{{ order.appointPersonNameMasked || '—' }}</a-descriptions-item>
            <a-descriptions-item label="性别">{{ order.appointPersonGender || '—' }}</a-descriptions-item>
            <a-descriptions-item label="年龄">{{ order.appointPersonAge || '—' }}</a-descriptions-item>
            <a-descriptions-item label="手机号">{{ order.appointPersonPhone || '—' }}</a-descriptions-item>
            <a-descriptions-item label="证件号">{{ order.appointPersonIdCard || '—' }}</a-descriptions-item>
            <a-descriptions-item label="邮寄地址">{{ order.appointPersonAddress || '—' }}</a-descriptions-item>
            <a-descriptions-item label="关系">{{ order.appointPersonRelation || '—' }}</a-descriptions-item>
            <template v-if="order.medicalType === '住宿'">
              <a-descriptions-item label="入住日是否使用晚餐">{{ order.appointPersonDinnerCheckIn ? '是' : (order.appointPersonDinnerCheckIn === false ? '否' : '—') }}</a-descriptions-item>
              <a-descriptions-item label="体检日是否使用晚餐">{{ order.appointPersonDinnerMedical ? '是' : (order.appointPersonDinnerMedical === false ? '否' : '—') }}</a-descriptions-item>
            </template>
          </a-descriptions>

          <!-- 3. 陪同人信息 -->
          <template v-if="order.hasCompanion && order.companionInfo">
            <a-divider style="margin-top: 12px; margin-bottom: 12px;" dashed />
            <div style="font-size: 13px; color: #262626; font-weight: 600; margin-bottom: 8px;">3. 陪同人信息</div>
            <a-descriptions :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '135px', paddingBottom: '0' }">
              <a-descriptions-item label="陪同人是否参与体检">{{ order.companionInfo.participate ? '是' : '否' }}</a-descriptions-item>
              <a-descriptions-item label="姓名">{{ order.companionInfo.name || '—' }}</a-descriptions-item>
              <a-descriptions-item label="性别">{{ order.companionInfo.gender || '—' }}</a-descriptions-item>
              <a-descriptions-item label="年龄">{{ order.companionInfo.age || '—' }}</a-descriptions-item>
              <a-descriptions-item label="手机号">{{ order.companionInfo.phone || '—' }}</a-descriptions-item>
              <a-descriptions-item label="证件号">{{ order.companionInfo.idCard || '—' }}</a-descriptions-item>
              <a-descriptions-item label="与主检人关系">{{ order.companionInfo.relation || '—' }}</a-descriptions-item>
              <a-descriptions-item label="邮寄地址">{{ order.companionInfo.address || '—' }}</a-descriptions-item>
              <template v-if="order.companionInfo.participate">
                <a-descriptions-item label="体检项目">{{ order.companionInfo.project || '—' }}</a-descriptions-item>
                <a-descriptions-item label="费用承担方">{{ order.companionInfo.feePayer || '—' }}</a-descriptions-item>
              </template>
              <template v-if="order.medicalType === '住宿'">
                <a-descriptions-item label="入住日是否使用晚餐">{{ order.companionInfo.dinnerCheckIn ? '是' : (order.companionInfo.dinnerCheckIn === false ? '否' : '—') }}</a-descriptions-item>
                <a-descriptions-item label="体检日是否使用晚餐">{{ order.companionInfo.dinnerMedical ? '是' : (order.companionInfo.dinnerMedical === false ? '否' : '—') }}</a-descriptions-item>
              </template>
            </a-descriptions>
          </template>
        </template>
      </a-card>

      <!-- ── Section 3: Modify Request Comparison ── -->
      <a-card
        v-if="order.hasModifyRequest && order.modifyRequests?.length"
        :bordered="false"
        style="margin-bottom: 16px; background: #fffbe6; border-radius: 8px; border: 1px solid #ffe58f;"
      >
        <div class="section-title" style="color: #d48806;">修改请求对比</div>
        <a-table
          :data-source="order.modifyRequests"
          :columns="[
            { title: '字段', dataIndex: 'field', key: 'field', width: 120 },
            { title: '修改前', dataIndex: 'before', key: 'before' },
            { title: '修改后', dataIndex: 'after', key: 'after' },
          ]"
          :pagination="false"
          size="small"
          row-key="field"
        />
      </a-card>

      <!-- ── Original Order Snapshot (PENDING_MODIFY only) ── -->
      <a-card
        v-if="order.status === 'PENDING_MODIFY' && order.originalSnapshot"
        :bordered="false"
        style="margin-bottom: 16px; background: #fff7e6; border-radius: 8px; border: 1px solid #ffd591;"
      >
        <div class="section-title" style="color: #d46b08;">原始订单快照（撤回前信息）</div>
        <a-descriptions :column="2" size="small" :label-style="{ color: '#8c8c8c', width: '100px' }">
          <a-descriptions-item v-if="order.originalSnapshot.scheduleDate" label="档期日期">
            <span style="text-decoration: line-through; color: #999;">{{ order.originalSnapshot.scheduleDate }}</span>
            <span style="margin-left: 8px; color: #52c41a;">→ {{ order.scheduleDate }}</span>
          </a-descriptions-item>
          <a-descriptions-item v-if="order.originalSnapshot.medicalType" label="体检方式">
            <span style="text-decoration: line-through; color: #999;">{{ order.originalSnapshot.medicalType }}</span>
            <span style="margin-left: 8px; color: #52c41a;">→ {{ order.medicalType }}</span>
          </a-descriptions-item>
          <a-descriptions-item v-if="order.originalSnapshot.medicalBranch" label="体检分院">
            <span style="text-decoration: line-through; color: #999;">{{ order.originalSnapshot.medicalBranch }}</span>
            <span style="margin-left: 8px; color: #52c41a;">→ {{ order.medicalBranch }}</span>
          </a-descriptions-item>
          <a-descriptions-item v-if="order.recallTime" label="撤回时间">{{ order.recallTime }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- ── Remark ── -->
      <a-card :bordered="false" style="margin-bottom: 16px; background: #fafafa; border-radius: 8px;">
        <div class="section-title">备注</div>
        <div style="font-size: 13px; color: #595959; margin-top: 8px; min-height: 32px;">
          {{ order.remark || '—' }}
        </div>
      </a-card>
    </template>

    <!-- ── Footer Actions ── -->
    <template #footer>
      <a-space v-if="order">
        <a-button @click="emit('update:open', false)">关闭</a-button>

        <!-- PENDING_CONFIRM actions -->
        <!-- PENDING_CONFIRM actions (Not applicable to Medical) -->
        <template v-if="order.status === 'PENDING_CONFIRM' && order.orderType !== 'medical'">
          <a-button danger @click="handleReject">
            <template #icon><StopOutlined /></template>
            不可接待
          </a-button>
          <a-button
            type="primary"
            @click="handleConfirm"
            :loading="confirmLoading"
            style="background: #006738; border-color: #006738;"
          >
            <template #icon><CheckOutlined /></template>
            确认订单
          </a-button>
        </template>

        <!-- PENDING_USE actions -->
        <template v-if="order.status === 'PENDING_USE'">
          <a-button
            v-if="order.hasModifyRequest"
            type="default"
            @click="handleConfirmModify"
          >
            <template #icon><EditOutlined /></template>
            确认修改
          </a-button>
          <a-button
            type="primary"
            @click="verifyVisible = true"
            style="background: #006738; border-color: #006738;"
          >
            <template #icon><ScanOutlined /></template>
            核销
          </a-button>
        </template>

        <!-- PENDING_MODIFY: no merchant action needed -->
        <!-- (footer only shows the default close button) -->
      </a-space>
    </template>
  </a-drawer>

  <!-- Verify Modal -->
  <VerifyModal
    v-model:open="verifyVisible"
    :order="order"
    @success="handleVerifySuccess"
  />
</template>

<style scoped>
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
</style>
