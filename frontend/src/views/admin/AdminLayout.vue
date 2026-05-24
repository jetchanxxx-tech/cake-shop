<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <h2>Mio Bakery</h2>
        <span>管理后台</span>
      </div>
      <nav class="menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="['menu-item', { active: $route.path === item.path }]"
        >
          <span class="icon">{{ item.icon }}</span>
          <span class="label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="admin-info">
          <span class="name">{{ adminStore.adminInfo?.nickname || '管理员' }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()

const menuItems = [
  { path: '/admin/dashboard', label: '营业概况', icon: '📊' },
  { path: '/admin/products', label: '商品管理', icon: '🎂' },
  { path: '/admin/orders', label: '订单管理', icon: '📦' },
  { path: '/admin/settings', label: '系统设置', icon: '⚙️' },
]

const handleLogout = () => {
  adminStore.logout()
  router.push('/admin/login')
}
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f1ec;
}
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #ece5dd;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
}
.brand {
  padding: 24px 20px;
  border-bottom: 1px solid #f0ebe5;
  h2 {
    font-family: 'Playfair Display', serif;
    color: #8b5e3c;
    font-size: 20px;
    margin-bottom: 2px;
  }
  span {
    font-size: 12px;
    color: #bbb;
  }
}
.menu {
  flex: 1;
  padding: 12px 0;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
  .icon {
    margin-right: 10px;
    font-size: 16px;
  }
  &:hover {
    background: #fdf8f3;
    color: #8b5e3c;
  }
  &.active {
    background: #fdf8f3;
    color: #8b5e3c;
    font-weight: 500;
    border-right: 3px solid #d4a574;
  }
}
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0ebe5;
}
.admin-info {
  margin-bottom: 10px;
  .name {
    font-size: 13px;
    color: #555;
  }
}
.logout-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #e8e0d8;
  border-radius: 8px;
  background: #fff;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  &:hover {
    border-color: #d4a574;
    color: #d4a574;
  }
}
.main {
  flex: 1;
  margin-left: 220px;
  padding: 24px;
  min-height: 100vh;
}
</style>
