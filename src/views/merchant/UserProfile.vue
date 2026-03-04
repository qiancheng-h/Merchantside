<script setup lang="ts">
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { UserOutlined, SettingOutlined } from '@ant-design/icons-vue';

const activeTab = ref('baseInfo');
const saving = ref(false);

// ─── Base Info Form ───────────────────────────────────────────────────────────
const baseFormRef = ref();
const baseFormState = reactive({
  username: '张运营',
  phone: '13911112222',
  email: 'zhangyy@vshare.com',
  remark: '日常订单处理'
});

const handleSaveBaseInfo = () => {
  baseFormRef.value.validate().then(() => {
    saving.value = true;
    setTimeout(() => {
      saving.value = false;
      message.success('个人资料保存成功');
    }, 500);
  }).catch(() => {});
};

// ─── Change Password Form ──────────────────────────────────────────────────────
const pwdFormRef = ref();
const pwdFormState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value === '') {
    return Promise.reject('请再次输入新密码');
  } else if (value !== pwdFormState.newPassword) {
    return Promise.reject('两次输入的密码不一致');
  } else {
    return Promise.resolve();
  }
};

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码长度至少为 6 个字符' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword }
  ]
};

const handleChangePassword = () => {
  pwdFormRef.value.validate().then(() => {
    saving.value = true;
    setTimeout(() => {
      saving.value = false;
      message.success('密码修改成功，请妥善保管新密码');
      pwdFormRef.value.resetFields();
    }, 500);
  }).catch(() => {});
};
</script>

<template>
  <div style="max-width: 800px; margin: 0 auto; padding-top: 10px;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
      <UserOutlined style="font-size: 22px; color: #006738;" />
      <h2 style="font-size: 22px; font-weight: 700; color: #262626; margin: 0;">个人中心</h2>
    </div>

    <a-card :bordered="false" style="border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
      <a-tabs v-model:activeKey="activeTab">

        <!-- 基础信息 Tab -->
        <a-tab-pane key="baseInfo" tab="基础信息">
          <div style="padding: 24px 0 10px 0; max-width: 500px;">
            <a-form ref="baseFormRef" :model="baseFormState" layout="vertical">
              <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
                <a-input v-model:value="baseFormState.username" placeholder="请输入用户名" />
              </a-form-item>

              <a-form-item label="手机号" name="phone">
                <!-- Phone might be disabled or verified in real scenario, showing as disabled for demo -->
                <a-input v-model:value="baseFormState.phone" disabled style="background-color: #f5f5f5;" />
                <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">手机号用于登录，如需修改请联系管理员</div>
              </a-form-item>

              <a-form-item label="联系邮箱" name="email" :rules="[{ type: 'email', message: '请输入正确的邮箱格式' }]">
                <a-input v-model:value="baseFormState.email" placeholder="请输入联系邮箱" />
              </a-form-item>

              <a-form-item label="个人备注" name="remark">
                <a-textarea v-model:value="baseFormState.remark" placeholder="请输入个人备注信息" :rows="3" />
              </a-form-item>

              <a-form-item style="margin-top: 32px;">
                <a-button type="primary" @click="handleSaveBaseInfo" :loading="saving" style="background: #006738; border-color: #006738; width: 120px;">
                  保存修改
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>

        <!-- 修改密码 Tab -->
        <a-tab-pane key="security" tab="安全设置">
          <div style="padding: 24px 0 10px 0; max-width: 400px;">
            <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 8px; color: #262626; font-weight: 600;">
              <SettingOutlined /> 修改登录密码
            </div>
            <a-form ref="pwdFormRef" :model="pwdFormState" :rules="pwdRules" layout="vertical">
              <a-form-item label="原密码" name="oldPassword">
                <a-input-password v-model:value="pwdFormState.oldPassword" placeholder="请输入当前密码" />
              </a-form-item>

              <a-form-item label="新密码" name="newPassword">
                <a-input-password v-model:value="pwdFormState.newPassword" placeholder="请输入新密码（至少 6 个字符）" />
              </a-form-item>

              <a-form-item label="确认新密码" name="confirmPassword">
                <a-input-password v-model:value="pwdFormState.confirmPassword" placeholder="请再次输入新密码" />
              </a-form-item>

              <a-form-item style="margin-top: 32px;">
                <a-button type="primary" @click="handleChangePassword" :loading="saving" style="background: #006738; border-color: #006738; width: 140px;">
                  更新密码
                </a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>

      </a-tabs>
    </a-card>
  </div>
</template>
