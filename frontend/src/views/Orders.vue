<template>
  <div class="page-container orders-page">
    <header class="orders-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1>我的订单</h1>
    </header>

    <div class="status-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: currentStatus === tab.value }]"
        @click="currentStatus = tab.value"
      >{{ tab.label }}</div>
    </div>

    <div class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card" @click="$router.push(`/order-detail/${order.id}`)">
        <div class="order-header">
          <span class="order-no">订单号：{{ order.order_no }}</span>
          <span class="order-status" :class="order.status">{{ statusMap[order.status] }}</span>
        </div>
        <div class="order-items">
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <img :src="item.product_image" :alt="item.product_name">
            <div class="item-info">
              <h4 class="ellipsis">{{ item.product_name }}</h4>
              <p>{{ item.spec_name }} x{{ item.quantity }}</p>
            </div>
            <span class="price">{{ item.price }}</span>
          </div>
        </div>
        <div class="order-footer">
          <span>共{{ order.items?.length || 0 }}件</span>
          <span>实付：<span class="price">{{ order.pay_amount }}</span></span>
        </div>
        <div v-if="order.status === 'pending'" class="order-actions">
          <button class="btn btn-outline btn-sm" @click.stop="cancelOrder(order.id)">取消订单</button>
          <button class="btn btn-primary btn-sm">去支付</button>
        </div>
      </div>

      <div v-if="orders.length === 0" class="empty-state">
        <span class="empty-icon">📋</span>
        <span class="empty-text">暂无订单</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getOrders, cancelOrder as apiCancelOrder } from '@/api'

const route = useRoute()
const orders = ref([])
const currentStatus = ref(route.query.status || '')

const tabs = [
  { label: '全部', value: '' },
  { label: '待付款', value: 'pending' },
  { label: '待收货', value: 'paid' },
  { label: '已完成', value: 'completed' }
]

const statusMap = {
  pending: '待付款',
  paid: '待收货',
  shipping: '配送中',
  completed: '已完成',
  cancelled: '已取消'
}

async function loadOrders() {
  const params = {}
  if (currentStatus.value) params.status = currentStatus.value
  const res = await getOrders(params)
  orders.value = res.data || []
}

async function cancelOrder(id) {
  if (!confirm('确定取消该订单？')) return
  await apiCancelOrder(id)
  loadOrders()
}

watch(currentStatus, loadOrders, { immediate: true })
</script>

<style lang="scss" scoped>
.orders-page {
  background: var(--bg);
}

.orders-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-card);
  gap: 12px;

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

  h1 {
    font-size: 17px;
    font-weight: 600;
  }
}

.status-tabs {
  display: flex;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);

  .tab-item {
    flex: 1;
    text-align: center;
    padding: 12px;
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
    position: relative;
    transition: color 0.2s ease;

    &.active {
      color: var(--primary-dark);
      font-weight: 600;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: var(--primary);
        border-radius: 1px;
      }
    }
  }
}

.orders-list {
  padding: 12px;
}

.order-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .order-no {
      font-size: 12px;
      color: var(--text-muted);
    }

    .order-status {
      font-size: 12px;
      font-weight: 500;

      &.pending { color: var(--accent); }
      &.paid { color: var(--primary-dark); }
      &.completed { color: #52c41a; }
      &.cancelled { color: var(--text-muted); }
    }
  }

  .order-item {
    display: flex;
    gap: 10px;
    padding: 8px 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--border);
    }

    img {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      flex-shrink: 0;
    }

    .item-info {
      flex: 1;
      min-width: 0;

      h4 {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 2px;
      }

      p {
        font-size: 11px;
        color: var(--text-muted);
      }
    }
  }

  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    font-size: 13px;

    .price {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .order-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;

    .btn-sm {
      padding: 6px 14px;
      font-size: 12px;
    }
  }
}
</style>
