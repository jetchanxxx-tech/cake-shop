import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/global.scss'

// 支持从 URL 参数注入 token（用于截图等场景）
const urlParams = new URLSearchParams(window.location.search)
const urlToken = urlParams.get('auth_token')
if (urlToken) {
  localStorage.setItem('token', urlToken)
  // 清理 URL 中的 token
  const cleanUrl = window.location.pathname + window.location.hash
  window.history.replaceState({}, '', cleanUrl)
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
