<template>
  <div class="page-container login-page">
    <div class="login-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
    </div>

    <div class="login-content">
      <h1 class="font-serif login-title">{{ isLogin ? '欢迎回来' : '创建账号' }}</h1>
      <p class="login-subtitle">{{ isLogin ? '登录以继续享受美味' : '注册开始您的甜蜜之旅' }}</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div class="form-group">
          <label>手机号</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="请输入手机号"
            maxlength="11"
            required
          >
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          >
        </div>

        <div v-if="!isLogin" class="form-group">
          <label>昵称</label>
          <input
            v-model="form.nickname"
            type="text"
            placeholder="给自己起个好听的名字"
          >
        </div>

        <button type="submit" class="btn btn-primary submit-btn" :disabled="submitting">
          {{ submitting ? '请稍候...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="login-switch">
        <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <a @click="isLogin = !isLogin">{{ isLogin ? '立即注册' : '去登录' }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { login, register } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const submitting = ref(false)
const form = reactive({ phone: '', password: '', nickname: '' })

async function handleSubmit() {
  submitting.value = true
  try {
    const res = isLogin.value
      ? await login({ phone: form.phone, password: form.password })
      : await register({ phone: form.phone, password: form.password, nickname: form.nickname })

    userStore.setToken(res.data.token)
    userStore.userInfo = res.data.user
    const redirect = route.query.redirect || '/home'
    router.replace(redirect)
  } catch (e) {
    alert(e)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
}

.login-header {
  padding: 12px 16px;

  .back-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text);
  }
}

.login-content {
  flex: 1;
  padding: 20px 28px;

  .login-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .login-subtitle {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 32px;
  }
}

.login-form {
  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 15px;
      background: var(--bg);
      color: var(--text);
      outline: none;
      transition: border-color 0.2s ease;

      &:focus {
        border-color: var(--primary);
      }

      &::placeholder {
        color: var(--text-muted);
      }
    }
  }

  .submit-btn {
    width: 100%;
    padding: 14px;
    font-size: 16px;
    margin-top: 10px;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.login-switch {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-secondary);

  a {
    color: var(--primary-dark);
    font-weight: 500;
    cursor: pointer;
    margin-left: 4px;
  }
}
</style>
