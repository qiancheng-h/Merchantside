<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, ImportOutlined,
  HomeOutlined,
} from '@ant-design/icons-vue'
import type { TableColumnsType } from 'ant-design-vue'
import { message, Modal } from 'ant-design-vue'
import { hotelOrders, statusMap } from '@/mock/orderData'
import type { OrderItem, OrderStatus } from '@/mock/orderData'
import OrderDetailDrawer from '@/components/order/OrderDetailDrawer.vue'
import SupplementModal from '@/components/order/SupplementModal.vue'
import ImportModal from '@/components/order/ImportModal.vue'

// ─── Data ─────────────────────────────────────────────────────────────────────
const data = ref<OrderItem[]>([...hotelOrders])

// ─── Search ───────────────────────────────────────────────────────────────────
const searchForm = reactive({
  orderNo: '',
  serviceName: '',
  status: undefined as OrderStatus | undefined,
  createTimeRange: [] as string[],
  checkInDateRange: [] as string[],
  userName: '',
})
const loading = ref(false)

const filteredData = computed(() => {
  return data.value.filter(item => {
    if (searchForm.orderNo && !item.orderNo.includes(searchForm.orderNo)) return false
    if (searchForm.serviceName && !item.serviceName.includes(searchForm.serviceName)) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    if (searchForm.userName && !item.userName.includes(searchForm.userName)) return false
    return true
  })
})

const handleSearch = () => {
  loading.value = true
  setTimeout(() => { loading.value = false }, 400)
}
const handleReset = () => {
  searchForm.orderNo = ''
  searchForm.serviceName = ''
  searchForm.status = undefined
  searchForm.createTimeRange = []
  searchForm.checkInDateRange = []
}

// ─── Table columns ────────────────────────────────────────────────────────────
const columns: TableColumnsType = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 200, fixed: 'left' },
  { title: '房型名称', dataIndex: 'serviceName', key: 'serviceName', width: 160, ellipsis: true },
  { title: '间数', dataIndex: 'roomCount', key: 'roomCount', width: 70 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '入住日期', dataIndex: 'checkInDate', key: 'checkInDate', width: 110 },
  { title: '离店日期', dataIndex: 'checkOutDate', key: 'checkOutDate', width: 110 },
  { title: '价格（元）', dataIndex: 'price', key: 'price', width: 100, align: 'right' },
  { title: '客户姓名', dataIndex: 'userName', key: 'userName', width: 90 },
  { title: '使用人', dataIndex: 'appointPersonNameMasked', key: 'appointPersonNameMasked', width: 90 },
  { title: '手机号', dataIndex: 'userPhone', key: 'userPhone', width: 130 },
  { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

// ─── Detail Drawer ────────────────────────────────────────────────────────────
const drawerOpen = ref(false)
const currentOrder = ref<OrderItem | null>(null)

const openDetail = (record: OrderItem) => {
  currentOrder.value = record
  drawerOpen.value = true
}

// ─── Order actions ────────────────────────────────────────────────────────────
const handleConfirm = (order: OrderItem) => {
  Modal.confirm({
    title: '确认订单？',
    content: '确认后将向客户发送确认短信，订单状态变更为「待使用」。',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      const idx = data.value.findIndex(o => o.key === order.key)
      if (idx !== -1) {
        data.value[idx] = {
          ...data.value[idx]!,
          status: 'PENDING_USE',
          confirmTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          flowRecords: [
            ...data.value[idx]!.flowRecords,
            { id: `f${Date.now()}`, time: new Date().toISOString().replace('T', ' ').substring(0, 19), desc: '商家确认订单', operator: '商家账号' },
          ],
        } as OrderItem
        message.success('订单已确认')
      }
    },
  })
}

const handleReject = (order: OrderItem) => {
  const idx = data.value.findIndex(o => o.key === order.key)
  if (idx !== -1) {
    data.value[idx] = {
      ...data.value[idx]!,
      status: 'CANCELLED',
      cancelTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      flowRecords: [
        ...data.value[idx]!.flowRecords,
        { id: `f${Date.now()}`, time: new Date().toISOString().replace('T', ' ').substring(0, 19), desc: '商家不可接待，订单取消', operator: '商家账号' },
      ],
    } as OrderItem
  }
}

const handleVerify = (order: OrderItem) => {
  const idx = data.value.findIndex(o => o.key === order.key)
  if (idx !== -1) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    data.value[idx] = {
      ...data.value[idx]!,
      status: 'COMPLETED',
      verifyTime: now,
      verifyOperator: '当前操作员',
      flowRecords: [
        ...data.value[idx]!.flowRecords,
        { id: `f${Date.now()}`, time: now, desc: '商家核销完成', operator: '当前操作员' },
      ],
    } as OrderItem
  }
}

const handleConfirmModify = (order: OrderItem) => {
  const idx = data.value.findIndex(o => o.key === order.key)
  if (idx !== -1) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    data.value[idx] = {
      ...data.value[idx]!,
      hasModifyRequest: false,
      flowRecords: [
        ...data.value[idx]!.flowRecords,
        { id: `f${Date.now()}`, time: now, desc: '商家确认修改请求', operator: '商家账号' },
      ],
    } as OrderItem
  }
}

// ─── Supplement & Import ──────────────────────────────────────────────────────
const supplementOpen = ref(false)
const importOpen = ref(false)

const handleSupplementSuccess = (newOrder: any) => {
  data.value.unshift({ ...newOrder, orderType: 'hotel' })
}

const handleImportSuccess = (count: number) => {
  message.success(`已导入 ${count} 条酒店服务订单`)
}

import { watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()

watch(() => route.query, (query) => {
  if (query.action === 'view' && query.id) {
    const targetId = query.id as string
    const record = data.value.find(item => item.orderNo === targetId)
    if (record) {
      openDetail(record)
    }
  }
}, { immediate: true })
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
      <HomeOutlined style="font-size: 20px; color: #006738;" />
      <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0;">酒店服务订单</h2>
    </div>

    <!-- ── Search ── -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="订单编号">
          <a-input v-model:value="searchForm.orderNo" placeholder="请输入订单编号" allow-clear style="width: 180px;" />
        </a-form-item>
        <a-form-item label="房型名称">
          <a-input v-model:value="searchForm.serviceName" placeholder="请输入房型名称" allow-clear style="width: 160px;" />
        </a-form-item>
        <a-form-item label="客户姓名">
          <a-input v-model:value="searchForm.userName" placeholder="请输入客户姓名" allow-clear style="width: 140px;" />
        </a-form-item>
        <a-form-item label="订单状态">
          <a-select v-model:value="searchForm.status" placeholder="全部状态" style="width: 130px;" allow-clear>
            <a-select-option value="PENDING_CONFIRM">待确认</a-select-option>
            <a-select-option value="PENDING_USE">待核销</a-select-option>
            <a-select-option value="COMPLETED">已核销</a-select-option>
            <a-select-option value="CANCELLED">已取消</a-select-option>
            <a-select-option value="CLOSED">已关闭</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch" style="background: #006738; border-color: #006738;">
            <template #icon><SearchOutlined /></template>查询
          </a-button>
          <a-button style="margin-left: 8px;" @click="handleReset">
            <template #icon><ReloadOutlined /></template>重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- ── Toolbar ── -->
    <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <a-tag color="processing" style="cursor: pointer;" @click="searchForm.status = 'PENDING_CONFIRM'; handleSearch()">
          待确认 {{ data.filter(o => o.status === 'PENDING_CONFIRM').length }}
        </a-tag>
      </div>
      <a-space>
        <a-button @click="supplementOpen = true">
          <template #icon><PlusOutlined /></template>新增订单
        </a-button>
        <a-button @click="importOpen = true">
          <template #icon><ImportOutlined /></template>批量导入
        </a-button>
      </a-space>
    </div>

    <!-- ── Table ── -->
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :loading="loading"
      :pagination="{ showSizeChanger: true, pageSize: 20, pageSizeOptions: ['10','20','50','100'], showTotal: (total: number) => `共 ${total} 条` }"
      row-key="key"
      :scroll="{ x: 1400 }"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <!-- Order No: clickable -->
        <template v-if="column.key === 'orderNo'">
          <a @click="openDetail(record)" style="color: #006738; font-weight: 600; text-decoration: underline; cursor: pointer;">
            {{ record.orderNo }}
          </a>
          <a-tag v-if="record.isSupplementary" color="purple" style="margin-left: 6px; font-size: 11px;">补录</a-tag>
        </template>

        <!-- Status -->
        <template v-if="column.key === 'status'">
          <a-tag :color="statusMap[record.status as OrderStatus].color">
            {{ statusMap[record.status as OrderStatus].text }}
          </a-tag>
          <a-badge v-if="record.hasModifyRequest" color="orange" title="有修改请求" style="margin-left: 4px;" />
        </template>

        <!-- Price -->
        <template v-if="column.key === 'price'">
          ¥{{ record.price }}
        </template>

        <!-- Actions -->
        <template v-if="column.key === 'action'">
          <a-space>
            <template v-if="record.status === 'PENDING_CONFIRM'">
              <a-button type="link" size="small" style="color: #006738;" @click="currentOrder = record; handleConfirm(record)">确认订单</a-button>
              <a-button type="link" size="small" danger @click="currentOrder = record; handleReject(record)">不可接待</a-button>
            </template>
            <template v-if="record.status === 'PENDING_USE'">
              <a-button type="link" size="small" style="color: #006738;" @click="openDetail(record)">核销</a-button>
            </template>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- Detail Drawer -->
    <OrderDetailDrawer
      v-model:open="drawerOpen"
      :order="currentOrder"
      @confirm="handleConfirm"
      @reject="handleReject"
      @verify="handleVerify"
      @confirm-modify="handleConfirmModify"
    />

    <!-- Supplement Modal -->
    <SupplementModal
      v-model:open="supplementOpen"
      default-type="hotel"
      @success="handleSupplementSuccess"
    />

    <!-- Import Modal -->
    <ImportModal
      v-model:open="importOpen"
      order-type="hotel"
      @success="handleImportSuccess"
    />
  </div>
</template>
