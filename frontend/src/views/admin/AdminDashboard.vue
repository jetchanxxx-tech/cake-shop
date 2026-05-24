<template>
  <div class="admin-dashboard">
    <h2 class="page-title">营业概况</h2>

    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalOrders || 0 }}</div>
          <div class="stat-label">总订单数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎂</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalProducts || 0 }}</div>
          <div class="stat-label">商品总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value">¥{{ formatPrice(stats.totalSales) }}</div>
          <div class="stat-label">总销售额</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.todayOrders || 0 }}</div>
          <div class="stat-label">今日订单</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💵</div>
        <div class="stat-info">
          <div class="stat-value">¥{{ formatPrice(stats.todaySales) }}</div>
          <div class="stat-label">今日销售额</div>
        </div>
      </div>
    </div>

    <div class="dashboard-row">
      <div class="panel">
        <h3>待处理订单</h3>
        <div class="sub-stats">
          <div class="sub-stat">
            <span class="num">{{ stats.pendingOrders || 0 }}</span>
            <span class="text">待付款</span>
          </div>
          <div class="sub-stat">
            <span class="num">{{ stats.paidOrders || 0 }}</span>
            <span class="text">待发货</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>销售趋势（近7天）</h3>
      <div class="trend-chart">
        <div
          v-for="(item, idx) in trendData"
          :key="idx"
          class="trend-bar"
          :style="{ height: item.percent + '%' }"
        >
          <span class="trend-value">¥{{ formatPrice(item.total) }}</span>
          <span class="trend-date">{{ item.date.slice(5) }}</span>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>最近订单</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>金额</th>
            <th>状态</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in stats.recentOrders" :key="order.id">
            <td>{{ order.order_no }}</td>
            <td>{{ order.user_nickname || '匿名用户' }}</td>
            <td>¥{{ formatPrice(order.pay_amount) }}</td>
            <td>
              <span :class="['status-tag', order.status]">{{ statusText(order.status) }}</span>
            </td>
            <td>{{ formatDate(order.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const stats = ref({})

const trendData = computed(() => {
  const list = stats.value.salesTrend || []
  if (!list.length) return []
  const max = Math.max(...list.map(i => i.total), 1)
  return list.map(item => ({
    ...item,
    percent: Math.max((item.total / max) * 80, 5)
  }))
})

const statusText = s => ({
  pending: '待付款', paid: '待发货', shipped: '已发货',
  completed: '已完成', cancelled: '已取消'
}[s] || s)

const formatPrice = p => (p || 0).toFixed(2)
const formatDate = d => d ? new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

onMounted(async () => {
  try {
    const res = await adminStore.getStats()
    stats.value = res.data
  } catch (err) {
    console.error(err)
  }
})
</script>

<style lang="scss" scoped>
.admin-dashboard {
  max-width: 1200px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}
.stat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.stat-icon {
  font-size: 32px;
  margin-right: 14px;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}
.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}
.dashboard-row {
  margin-bottom: 20px;
}
.panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #444;
    margin-bottom: 16px;
  }
}
.sub-stats {
  display: flex;
  gap: 40px;
}
.sub-stat {
  .num {
    font-size: 28px;
    font-weight: 700;
    color: #d4a574;
    display: block;
  }
  .text {
    font-size: 13px;
    color: #999;
  }
}
.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 160px;
  padding-bottom: 24px;
}
.trend-bar {
  flex: 1;
  background: #d4a574;
  border-radius: 6px 6px 0 0;
  min-height: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  opacity: 0.85;
}
.trend-value {
  position: absolute;
  top: -20px;
  font-size: 11px;
  color: #888;
  white-space: nowrap;
}
.trend-date {
  position: absolute;
  bottom: -22px;
  font-size: 11px;
  color: #aaa;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th, td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid #f0ebe5;
  }
  th {
    color: #999;
    font-weight: 500;
  }
}
.status-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  &.pending { background: #fff3e0; color: #e65100; }
  &.paid { background: #e3f2fd; color: #1565c0; }
  &.shipped { background: #f3e5f5; color: #6a1b9a; }
  &.completed { background: #e8f5e9; color: #2e7d32; }
  &.cancelled { background: #fafafa; color: #999; }
}
</style>
