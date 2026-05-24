import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProfile } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const isLoggedIn = computed(() => !!token.value)

  const setToken = newToken => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const res = await getProfile()
      userInfo.value = res.data
    } catch {
      logout()
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, isLoggedIn, setToken, fetchUserInfo, logout }
})
