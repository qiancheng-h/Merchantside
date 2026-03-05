<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import { medicalBranches } from '@/mock/medicalBranchData'
import type { MedicalBranch } from '@/mock/medicalBranchData'

// === List State ===
const data = ref<MedicalBranch[]>([...medicalBranches])
const loading = ref(false)

const searchForm = reactive({
  name: ''
})

const filteredData = computed(() => {
  if (!searchForm.name) return data.value
  return data.value.filter(item => item.name.includes(searchForm.name))
})

const handleSearch = () => {
  loading.value = true
  setTimeout(() => { loading.value = false }, 400)
}

const handleReset = () => {
  searchForm.name = ''
}

const columns: TableColumnsType = [
  { title: '分院名称', dataIndex: 'name', key: 'name' },
  { title: '详细地址', dataIndex: 'address', key: 'address' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 200 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' },
]

// === Add / Edit Modal State ===
const modalVisible = ref(false)
const modalLoading = ref(false)
const isEdit = ref(false)

const formState = reactive({
  id: '',
  name: '',
  address: ''
})

const formRef = ref()
const rules = {
  name: [{ required: true, message: '请输入分院名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
}

const openAdd = () => {
  isEdit.value = false
  formState.id = ''
  formState.name = ''
  formState.address = ''
  modalVisible.value = true
}

const openEdit = (record: MedicalBranch) => {
  isEdit.value = true
  formState.id = record.id
  formState.name = record.name
  formState.address = record.address
  modalVisible.value = true
}

const handleModalOk = () => {
  formRef.value.validate().then(() => {
    modalLoading.value = true
    setTimeout(() => {
      if (isEdit.value) {
        const idx = data.value.findIndex(item => item.id === formState.id)
        if (idx !== -1) {
          // 用局部变量持有元素引用，避免数组下标访问时 TS 报 possibly undefined
          const item = data.value[idx]!
          item.name = formState.name
          item.address = formState.address
          // Reflect back to mock
          const mockIdx = medicalBranches.findIndex(m => m.id === formState.id)
          if(mockIdx !== -1 && medicalBranches[mockIdx]) {
            // Using non-null assertion since we verified mockIdx exists
            medicalBranches[mockIdx]!.name = formState.name
            medicalBranches[mockIdx]!.address = formState.address
          }
        }
        message.success('分院信息已更新')
      } else {
        const newItem: MedicalBranch = {
          id: Date.now().toString(),
          name: formState.name,
          address: formState.address,
          createTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        }
        data.value.unshift(newItem)
        medicalBranches.unshift(newItem)
        message.success('分院已添加')
      }
      modalVisible.value = false
      modalLoading.value = false
    }, 600)
  })
}

const handleModalCancel = () => {
  modalVisible.value = false
}

const handleDelete = (record: MedicalBranch) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除分院 "${record.name}" 吗？此操作不可逆。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      return new Promise((resolve) => {
        setTimeout(() => {
          data.value = data.value.filter(item => item.id !== record.id)
          const mockIdx = medicalBranches.findIndex(m => m.id === record.id)
          if(mockIdx !== -1) medicalBranches.splice(mockIdx, 1)
          message.success('删除成功')
          resolve(true)
        }, 500)
      })
    },
  })
}
</script>

<template>
  <div class="medical-branch-container">
    <div class="page-header" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 20px; font-weight: 500; color: #1f1f1f; display: flex; align-items: center; gap: 8px;">
        体检分院管理
      </div>
      <div>
        <a-button type="primary" @click="openAdd">
          <template #icon><PlusOutlined /></template>
          新增分院
        </a-button>
      </div>
    </div>

    <a-card :bordered="false" style="border-radius: 8px; margin-bottom: 24px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
      <a-form layout="inline" :model="searchForm" class="filter-form">
        <a-form-item label="分院名称">
          <a-input v-model:value="searchForm.name" placeholder="请输入分院名称" allow-clear />
        </a-form-item>
        <a-form-item class="filter-actions">
          <a-space>
            <a-button type="primary" @click="handleSearch" :loading="loading">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button @click="handleReset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false" style="border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: ((total: number) => `共 ${total} 条`) }"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button type="link" danger size="small" @click="handleDelete(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑分院' : '新增分院'"
      :confirm-loading="modalLoading"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      destroyOnClose
    >
      <a-form :model="formState" :rules="rules" ref="formRef" layout="vertical" style="margin-top: 24px;">
        <a-form-item label="分院名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入分院名称，如的美年大健康黄龙分院" />
        </a-form-item>
        <a-form-item label="详细地址" name="address">
          <a-textarea v-model:value="formState.address" placeholder="请输入分院详细地址" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.filter-actions {
  margin-left: auto;
}
</style>
