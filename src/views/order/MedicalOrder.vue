<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, ImportOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons-vue'
import type { TableColumnsType } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { medicalOrders, statusMap } from '@/mock/orderData'
import type { OrderItem, OrderStatus } from '@/mock/orderData'
import OrderDetailDrawer from '@/components/order/OrderDetailDrawer.vue'
import SupplementModal from '@/components/order/SupplementModal.vue'
import ImportModal from '@/components/order/ImportModal.vue'

const data = ref<OrderItem[]>([...medicalOrders])

const searchForm = reactive({
  orderNo: '',
  serviceName: '',
  status: undefined as OrderStatus | undefined,
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
}

const columns: TableColumnsType = [
  { title: '订单编号', dataIndex: 'orderNo', key: 'orderNo', width: 200, fixed: 'left' },
  { title: '体检服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 220, ellipsis: true },
  { title: '订单状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '缺席状态', dataIndex: 'absenceStatus', key: 'absenceStatus', width: 100 },
  { title: '体检类型', dataIndex: 'medicalType', key: 'medicalType', width: 100 },
  { title: '档期日期', dataIndex: 'scheduleDate', key: 'scheduleDate', width: 110 },
  { title: '价格（元）', dataIndex: 'price', key: 'price', width: 100, align: 'right' },
  { title: '客户姓名', dataIndex: 'userName', key: 'userName', width: 90 },
  { title: '使用人', dataIndex: 'appointPersonNameMasked', key: 'appointPersonNameMasked', width: 90 },
  { title: '手机号', dataIndex: 'userPhone', key: 'userPhone', width: 130 },
  { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

const drawerOpen = ref(false)
const currentOrder = ref<OrderItem | null>(null)
const openDetail = (record: OrderItem) => { currentOrder.value = record; drawerOpen.value = true }

const handleVerify = (order: OrderItem) => {
  const idx = data.value.findIndex(o => o.key === order.key)
  if (idx !== -1) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    data.value[idx] = { ...data.value[idx]!, status: 'COMPLETED', verifyTime: now, verifyOperator: '当前操作员',
      flowRecords: [...data.value[idx]!.flowRecords, { id: `f${Date.now()}`, time: now, desc: '商家核销完成', operator: '当前操作员' }] } as OrderItem
  }
}
const handleConfirmModify = (order: OrderItem) => {
  const idx = data.value.findIndex(o => o.key === order.key)
  if (idx !== -1) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    data.value[idx] = { ...data.value[idx]!, hasModifyRequest: false,
      flowRecords: [...data.value[idx]!.flowRecords, { id: `f${Date.now()}`, time: now, desc: '商家确认修改请求', operator: '商家账号' }] } as OrderItem
  }
}

const supplementOpen = ref(false)
const importOpen = ref(false)
const handleSupplementSuccess = (newOrder: any) => { data.value.unshift({ ...newOrder, orderType: 'medical' }) }
const handleImportSuccess = (count: number) => { message.success(`已导入 ${count} 条体检服务订单`) }

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
      <MedicineBoxOutlined style="font-size: 20px; color: #006738;" />
      <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0;">体检服务订单</h2>
    </div>

    <a-card :bordered="false" style="margin-bottom: 16px;">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="订单编号">
          <a-input v-model:value="searchForm.orderNo" placeholder="请输入订单编号" allow-clear style="width: 180px;" />
        </a-form-item>
        <a-form-item label="服务名称">
          <a-input v-model:value="searchForm.serviceName" placeholder="请输入体检服务名称" allow-clear style="width: 160px;" />
        </a-form-item>
        <a-form-item label="客户姓名">
          <a-input v-model:value="searchForm.userName" placeholder="请输入客户姓名" allow-clear style="width: 140px;" />
        </a-form-item>
        <a-form-item label="订单状态">
          <a-select v-model:value="searchForm.status" placeholder="全部状态" style="width: 130px;" allow-clear>
            <a-select-option value="PENDING_USE">待核销</a-select-option>
            <a-select-option value="PENDING_MODIFY">待修改</a-select-option>
            <a-select-option value="COMPLETED">已完成</a-select-option>
            <a-select-option value="CANCELLED">已取消</a-select-option>
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

    <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 13px; color: #8c8c8c;">最后更新时间: 2026-02-25 21:09</div>
      </div>
      <a-space>
        <a-button @click="supplementOpen = true"><template #icon><PlusOutlined /></template>新增订单</a-button>
        <a-button @click="importOpen = true"><template #icon><ImportOutlined /></template>批量导入</a-button>
      </a-space>
    </div>

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
        <template v-if="column.key === 'orderNo'">
          <a @click="openDetail(record)" style="color: #006738; font-weight: 600; text-decoration: underline; cursor: pointer;">
            {{ record.orderNo }}
          </a>
          <a-tag v-if="record.isSupplementary" color="purple" style="margin-left: 6px; font-size: 11px;">补录</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="statusMap[record.status as OrderStatus].color">{{ statusMap[record.status as OrderStatus].text }}</a-tag>
        </template>
        <template v-if="column.key === 'absenceStatus'">
          <template v-if="record.status === 'COMPLETED'">
            <a-tag v-if="record.absenceStatus === 'ABSENT'" color="volcano">缺席</a-tag>
            <a-tag v-else-if="record.absenceStatus === 'PRESENT'" color="success">未缺席</a-tag>
            <span v-else style="color: #bfbfbf;">-</span>
          </template>
          <span v-else style="color: #bfbfbf;">-</span>
        </template>
        <template v-if="column.key === 'price'">¥{{ record.price }}</template>
        <template v-if="column.key === 'action'">
          <a-space>
            <template v-if="record.status === 'PENDING_USE'">
              <a-button type="link" size="small" style="color: #006738;" @click="openDetail(record)">核销</a-button>
            </template>
          </a-space>
        </template>
      </template>
    </a-table>

    <OrderDetailDrawer
      v-model:open="drawerOpen"
      :order="currentOrder"
      @verify="handleVerify"
      @confirm-modify="handleConfirmModify"
    />
    <SupplementModal v-model:open="supplementOpen" default-type="medical" @success="handleSupplementSuccess" />
    <ImportModal v-model:open="importOpen" order-type="medical" @success="handleImportSuccess" />
  </div>
</template>
