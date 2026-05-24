<template>
  <div class="admin-login">
    <div class="login-card">
      <div class="logo">
        <h1>Mio Bakery</h1>
        <p>管理后台</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required />
        </div>
        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <p class="hint">默认账号: admin / 密码: admin123</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await adminStore.login(form.username, form.password)
    router.push('/admin/dashboard')
  } catch (err) {
    errorMsg.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #faf6f1;
}
.login-card {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.logo {
  text-align: center;
  margin-bottom: 32px;
  h1 {
    font-family: 'Playfair Display', serif;
    color: #8b5e3c;
    font-size: 28px;
    margin-bottom: 4px;
  }
  p {
    color: #999;
    font-size: 14px;
  }
}
.form-group {
  margin-bottom: 20px;
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    color: #555;
  }
  input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #e8e0d8;
    border-radius: 10px;
    font-size: 14px;
    background: #fdfbf9;
    &:focus {
      outline: none;
      border-color: #d4a574;
    }
  }
}
.btn-submit {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #d4a574;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #c49768; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
.error {
  margin-top: 12px;
  color: #e74c3c;
  font-size: 13px;
  text-align: center;
}
.hint {
  margin-top: 16px;
  font-size: 12px;
  color: #bbb;
  text-align: center;
}
</style>
