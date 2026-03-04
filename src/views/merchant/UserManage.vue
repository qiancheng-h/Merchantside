<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import {
  SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined,
  KeyOutlined, DeleteOutlined, UserOutlined
} from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { message, Modal } from 'ant-design-vue';
import { userList, type UserAccount } from '@/mock/userData';

const data = ref<UserAccount[]>([...userList.value]);

// ─── Search ───────────────────────────────────────────────────────────────────
const searchForm = reactive({ username: '', phone: '' });
const loading = ref(false);

const filteredData = computed(() => {
  return data.value.filter(item => {
    if (searchForm.username && !item.username.includes(searchForm.username)) return false;
    if (searchForm.phone && !item.phone.includes(searchForm.phone)) return false;
    return true;
  });
});

const handleSearch = () => {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 400);
};

const handleReset = () => {
  searchForm.username = '';
  searchForm.phone = '';
};

// ─── Table Columns ────────────────────────────────────────────────────────────
const columns: TableColumnsType = [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 180, ellipsis: true },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 220, ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 240, fixed: 'right' },
];

// ─── Status Toggle ────────────────────────────────────────────────────────────
const handleStatusChange = (record: UserAccount, checked: boolean) => {
  const newStatus = checked ? 'enabled' : 'disabled';
  if (record.username === 'admin' && !checked) {
    message.warning('无法禁用超级管理员账号');
    return;
  }

  if (!checked) {
    Modal.confirm({
      title: '确认禁用该账号？',
      content: '禁用后，该用户将无法登录系统且会话立即失效。',
      okText: '确认',
      cancelText: '取消',
      onOk() {
        record.status = newStatus;
        message.success('账号已禁用');
      }
    });
  } else {
    record.status = newStatus;
    message.success('账号已启用');
  }
};

// ─── Delete User ──────────────────────────────────────────────────────────────
const handleDelete = (record: UserAccount) => {
  Modal.confirm({
    title: '确认删除该用户？',
    content: '删除后账号数据不可恢复，若该账号存在未完成操作可能受影响，请确认。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      const idx = data.value.findIndex(u => u.id === record.id);
      if (idx !== -1) {
        data.value.splice(idx, 1);
        message.success('用户删除成功');
      }
    }
  });
};

// ─── Add/Edit User Modal ──────────────────────────────────────────────────────
const formRef = ref();
const modalVisible = ref(false);
const modalTitle = ref('新增用户');
const formState = reactive<Partial<UserAccount>>({
  username: '', phone: '', email: '', status: 'enabled', remark: ''
});
const currentEditId = ref<string | null>(null);

const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' }
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱格式' }]
};

const openAddModal = () => {
  modalTitle.value = '新增用户';
  currentEditId.value = null;
  Object.assign(formState, { username: '', phone: '', email: '', status: 'enabled', remark: '' });
  modalVisible.value = true;
};

const openEditModal = (record: UserAccount) => {
  modalTitle.value = '编辑用户';
  currentEditId.value = record.id;
  Object.assign(formState, { ...record });
  modalVisible.value = true;
};

const handleModalSubmit = () => {
  formRef.value.validate().then(() => {
    if (currentEditId.value) {
      // Edit
      const idx = data.value.findIndex(u => u.id === currentEditId.value);
      if (idx !== -1) {
        data.value[idx] = { ...data.value[idx], ...formState } as UserAccount;
        message.success('用户信息更新成功');
      }
    } else {
      // Check phone existence
      if (data.value.some(u => u.phone === formState.phone)) {
        message.error('该手机号已被注册，请更换');
        return;
      }

      data.value.unshift({
        id: `u${Date.now()}`,
        ...formState,
      } as UserAccount);
      Modal.success({
        title: '新增用户成功',
        content: `默认初始密码已生成：AKHZ@123456\n（拼音首字母 + 地区缩写 + @ + 123456）`
      });
    }
    modalVisible.value = false;
  }).catch(() => {});
};

// ─── Reset Password Modal ──────────────────────────────────────────────────────
const pwdVisible = ref(false);
const pwdFormState = reactive({ password: '' });
const pwdRef = ref();

const openResetPwd = (record: UserAccount) => {
  currentEditId.value = record.id;
  pwdFormState.password = '';
  pwdVisible.value = true;
};

const handlePwdSubmit = () => {
  pwdRef.value.validate().then(() => {
    message.success('密码重置成功');
    pwdVisible.value = false;
  }).catch(() => {});
};
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
      <UserOutlined style="font-size: 20px; color: #006738;" />
      <h2 style="font-size: 20px; font-weight: 700; color: #262626; margin: 0;">用户账号管理</h2>
    </div>

    <!-- ── Search ── -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="用户名">
          <a-input v-model:value="searchForm.username" placeholder="请输入用户名" allow-clear style="width: 180px;" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="searchForm.phone" placeholder="请输入手机号" allow-clear style="width: 180px;" />
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
    <div style="margin-bottom: 12px; display: flex; justify-content: flex-end;">
      <a-button type="primary" @click="openAddModal" style="background: #006738; border-color: #006738;">
        <template #icon><PlusOutlined /></template>新增用户
      </a-button>
    </div>

    <!-- ── Table ── -->
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :loading="loading"
      :pagination="{ showSizeChanger: true, pageSize: 20, showTotal: (total: number) => `共 ${total} 条` }"
      row-key="id"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'email'">
          {{ record.email || '—' }}
        </template>

        <template v-if="column.key === 'remark'">
          <span style="color: #8c8c8c;">{{ record.remark || '无' }}</span>
        </template>

        <template v-if="column.key === 'status'">
          <a-switch
            :checked="record.status === 'enabled'"
            checked-children="启用"
            un-checked-children="禁用"
            @change="(val: boolean) => handleStatusChange(record as UserAccount, val)"
          />
        </template>

        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openEditModal(record)">
              <template #icon><EditOutlined /></template>编辑
            </a-button>
            <a-button type="link" size="small" @click="openResetPwd(record)">
              <template #icon><KeyOutlined /></template>重置密码
            </a-button>
            <a-button type="link" danger size="small" @click="handleDelete(record)" :disabled="record.username === 'admin'">
              <template #icon><DeleteOutlined /></template>删除
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- ── Add/Edit Modal ── -->
    <a-modal v-model:open="modalVisible" :title="modalTitle" @ok="handleModalSubmit" ok-text="提交" cancel-text="取消" :width="500">
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical" style="margin-top: 16px;">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formState.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="formState.phone" placeholder="请输入11位手机号" />
          <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;" v-if="!currentEditId">
            新增成功后系统将自动生成默认初始密码
          </div>
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formState.email" placeholder="选填，请输入邮箱" />
        </a-form-item>
        <a-form-item label="账号状态" name="status">
          <a-radio-group v-model:value="formState.status">
            <a-radio value="enabled">启用</a-radio>
            <a-radio value="disabled">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="formState.remark" placeholder="选填，对账号的补充说明" :rows="2" :maxlength="100" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- ── Reset Password Modal ── -->
    <a-modal v-model:open="pwdVisible" title="重置密码" @ok="handlePwdSubmit" ok-text="确认重置" cancel-text="取消" :width="400">
      <a-form ref="pwdRef" :model="pwdFormState" layout="vertical" style="margin-top: 16px;">
        <a-form-item
          label="新密码"
          name="password"
          :rules="[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少6位' }]"
        >
          <a-input-password v-model:value="pwdFormState.password" placeholder="请输入新密码" />
          <div style="font-size: 12px; color: #8c8c8c; margin-top: 6px;">
            密码将加密存储，请牢记重置后的新密码
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
