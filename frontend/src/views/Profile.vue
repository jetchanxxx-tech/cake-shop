<template>
  <div class="page-container profile-page">
    <!-- 用户信息卡片 -->
    <div class="profile-card">
      <div class="profile-bg"></div>
      <div class="profile-content">
        <div class="profile-avatar">
          <img v-if="userStore.userInfo?.avatar" :src="userStore.userInfo.avatar" alt="avatar">
          <span v-else>{{ userStore.userInfo?.nickname?.[0] || 'U' }}</span>
        </div>
        <div class="profile-info">
          <h3>{{ userStore.userInfo?.nickname || '未登录' }}</h3>
          <p>{{ userStore.userInfo?.phone || '点击登录享受更多服务' }}</p>
        </div>
        <button v-if="!userStore.isLoggedIn" class="btn btn-primary btn-sm" @click="$router.push('/login')">登录</button>
      </div>
    </div>

    <!-- 订单状态 -->
    <div class="menu-card">
      <div class="menu-header" @click="$router.push('/orders')">
        <span class="menu-title">我的订单</span>
        <span class="menu-arrow">全部 ></span>
      </div>
      <div class="order-status">
        <div v-for="s in orderStatuses" :key="s.value" class="status-item" @click="$router.push(`/orders?status=${s.value}`)">
          <span class="status-icon">{{ s.icon }}</span>
          <span class="status-label">{{ s.label }}</span>
          <span v-if="s.count > 0" class="status-badge">{{ s.count }}</span>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-card">
      <div
        v-for="item in menuItems"
        :key="item.path"
        class="menu-item"
        @click="$router.push(item.path)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span class="menu-label">{{ item.label }}</span>
        <span class="menu-arrow">></span>
      </div>
    </div>

    <!-- 退出登录 -->
    <button v-if="userStore.isLoggedIn" class="logout-btn" @click="handleLogout">
      退出登录
    </button>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const orderStatuses = [
  { label: '待付款', value: 'pending', icon: '💳', count: 0 },
  { label: '制作中', value: 'paid', icon: '🍰', count: 0 },
  { label: '待配送', value: 'shipping', icon: '🚚', count: 0 },
  { label: '已完成', value: 'completed', icon: '✅', count: 0 }
]

const menuItems = [
  { icon: '❤️', label: '我的收藏', path: '/favorites' },
  { icon: '🎫', label: '优惠券', path: '/coupons' },
  { icon: '📍', label: '收货地址', path: '/addresses' },
  { icon: '💬', label: '联系客服', path: '#' },
  { icon: '⚙️', label: '设置', path: '#' }
]

function handleLogout() {
  userStore.logout()
  router.push('/home')
}
</script>

<style lang="scss" scoped>
.profile-page {
  background: var(--bg);
}

.profile-card {
  position: relative;
  overflow: hidden;
  background: var(--bg-card);

  .profile-bg {
    height: 100px;
    background: linear-gradient(135deg, var(--primary-light), var(--primary));
  }

  .profile-content {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 20px 20px;
    margin-top: -30px;
  }

  .profile-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--bg-warm);
    border: 3px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-dark);
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .profile-info {
    flex: 1;

    h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    p {
      font-size: 12px;
      color: var(--text-muted);
    }
  }

  .btn-sm {
    padding: 6px 16px;
    font-size: 13px;
  }
}

.menu-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin: 12px 16px;
  overflow: hidden;

  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;

    .menu-title {
      font-size: 15px;
      font-weight: 600;
    }

    .menu-arrow {
      font-size: 13px;
      color: var(--text-muted);
    }
  }
}

.order-status {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;

  .status-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    position: relative;
    cursor: pointer;

    .status-icon {
      font-size: 24px;
    }

    .status-label {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .status-badge {
      position: absolute;
      top: -4px;
      right: -8px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: var(--accent);
      color: white;
      border-radius: 8px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }

  &:active {
    background: var(--bg);
  }

  .menu-icon {
    font-size: 20px;
    margin-right: 12px;
    width: 24px;
    text-align: center;
  }

  .menu-label {
    flex: 1;
    font-size: 14px;
  }

  .menu-arrow {
    font-size: 13px;
    color: var(--text-muted);
  }
}

.logout-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 20px 16px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--accent);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
</style>
