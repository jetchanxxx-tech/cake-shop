<template>
  <div class="admin-settings">
    <h2 class="page-title">系统设置</h2>

    <div class="panel">
      <h3>修改管理员密码</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>旧密码</label>
          <input v-model="form.oldPassword" type="password" placeholder="请输入旧密码" required />
        </div>
        <div class="form-group">
          <label>新密码</label>
          <input v-model="form.newPassword" type="password" placeholder="请输入新密码" required />
        </div>
        <div class="form-group">
          <label>确认新密码</label>
          <input v-model="form.confirmPassword" type="password" placeholder="请再次输入新密码" required />
        </div>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : '修改密码' }}
        </button>
      </form>
      <p v-if="msg" :class="['msg', msgType]">{{ msg }}</p>
    </div>

    <div class="panel info-panel">
      <h3>系统信息</h3>
      <div class="info-row">
        <label>系统名称</label>
        <span>Mio Bakery 管理系统</span>
      </div>
      <div class="info-row">
        <label>版本</label>
        <span>v1.0.0</span>
      </div>
      <div class="info-row">
        <label>默认管理员账号</label>
        <span>admin / admin123</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const saving = ref(false)
const msg = ref('')
const msgType = ref('')

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const handleSubmit = async () => {
  msg.value = ''
  if (form.newPassword !== form.confirmPassword) {
    msg.value = '两次输入的新密码不一致'
    msgType.value = 'error'
    return
  }
  if (form.newPassword.length < 6) {
    msg.value = '新密码至少6位'
    msgType.value = 'error'
    return
  }
  saving.value = true
  try {
    await adminStore.updatePassword(form.oldPassword, form.newPassword)
    msg.value = '密码修改成功，请重新登录'
    msgType.value = 'success'
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    setTimeout(() => adminStore.logout(), 1500)
  } catch (err) {
    msg.value = err.message
    msgType.value = 'error'
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.admin-settings {
  max-width: 600px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}
.panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #444;
    margin-bottom: 20px;
  }
}
.form-group {
  margin-bottom: 16px;
  label {
    display: block;
    font-size: 13px;
    color: #666;
    margin-bottom: 6px;
  }
  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e8e0d8;
    border-radius: 8px;
    font-size: 14px;
    background: #fdfbf9;
    &:focus { outline: none; border-color: #d4a574; }
  }
}
.btn-primary {
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  background: #d4a574;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  &:hover { background: #c49768; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.msg {
  margin-top: 12px;
  font-size: 13px;
  &.success { color: #2e7d32; }
  &.error { color: #e74c3c; }
}
.info-panel {
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f5f1ec;
    font-size: 13px;
    label { color: #999; }
    span { color: #555; }
    &:last-child { border-bottom: none; }
  }
}
</style>
