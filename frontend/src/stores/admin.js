import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = '/api/admin'

async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('admin_token')
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await res.json()
  if (data.code !== 200) {
    const err = new Error(data.message || '请求失败')
    err.code = data.code
    throw err
  }
  return data
}

export const useAdminStore = defineStore('admin', () => {
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminInfo = ref(JSON.parse(localStorage.getItem('admin_info') || 'null'))
  const isLoggedIn = computed(() => !!token.value)

  const setToken = newToken => {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  const setAdminInfo = info => {
    adminInfo.value = info
    localStorage.setItem('admin_info', JSON.stringify(info))
  }

  const login = async (username, password) => {
    const data = await adminFetch(`${API_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    setToken(data.data.token)
    setAdminInfo(data.data.admin)
    return data
  }

  const logout = () => {
    token.value = ''
    adminInfo.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_info')
  }

  // Stats
  const getStats = () => adminFetch(`${API_BASE}/stats`)

  // Orders
  const getOrders = params => {
    const qs = new URLSearchParams(params).toString()
    return adminFetch(`${API_BASE}/orders?${qs}`)
  }
  const getOrderDetail = id => adminFetch(`${API_BASE}/orders/${id}`)
  const updateOrderStatus = (id, status) => adminFetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })

  // Products
  const getProducts = params => {
    const qs = new URLSearchParams(params).toString()
    return adminFetch(`${API_BASE}/products?${qs}`)
  }
  const getProductDetail = id => adminFetch(`${API_BASE}/products/${id}`)
  const createProduct = product => adminFetch(`${API_BASE}/products`, {
    method: 'POST',
    body: JSON.stringify(product)
  })
  const updateProduct = (id, product) => adminFetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product)
  })
  const deleteProduct = id => adminFetch(`${API_BASE}/products/${id}`, { method: 'DELETE' })

  // Categories
  const getCategories = () => adminFetch(`${API_BASE}/categories`)

  // Password
  const updatePassword = (oldPassword, newPassword) => adminFetch(`${API_BASE}/password`, {
    method: 'PUT',
    body: JSON.stringify({ oldPassword, newPassword })
  })

  return {
    token, adminInfo, isLoggedIn,
    setToken, setAdminInfo, login, logout,
    getStats, getOrders, getOrderDetail, updateOrderStatus,
    getProducts, getProductDetail, createProduct, updateProduct, deleteProduct,
    getCategories, updatePassword
  }
})
