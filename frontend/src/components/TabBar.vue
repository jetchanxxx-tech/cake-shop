<template>
  <nav class="tab-bar">
    <router-link
      v-for="item in tabs"
      :key="item.path"
      :to="item.path"
      class="tab-item"
      :class="{ active: isActive(item.path) }"
    >
      <div class="tab-icon">
        <svg v-if="item.name === 'home'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <svg v-else-if="item.name === 'category'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
        <svg v-else-if="item.name === 'cart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <span class="tab-label">{{ item.label }}</span>
      <span v-if="item.name === 'cart' && cartStore.totalCount > 0" class="tab-badge">
        {{ cartStore.totalCount > 99 ? '99+' : cartStore.totalCount }}
      </span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const cartStore = useCartStore()

const tabs = [
  { name: 'home', path: '/home', label: '首页' },
  { name: 'category', path: '/category', label: '分类' },
  { name: 'cart', path: '/cart', label: '购物车' },
  { name: 'profile', path: '/profile', label: '我的' }
]

function isActive(path) {
  return route.path === path
}
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(60px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 60px;
  text-decoration: none;
  color: #999;
  position: relative;
  transition: color 0.3s ease;

  &.active {
    color: var(--primary);
  }
}

.tab-icon {
  width: 22px;
  height: 22px;
  margin-bottom: 3px;

  svg {
    width: 100%;
    height: 100%;
  }
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
}

.tab-badge {
  position: absolute;
  top: 4px;
  right: calc(50% - 20px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--accent);
  color: white;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
