<template>
  <div class="admin-orders">
    <h2 class="page-title">订单管理</h2>

    <div class="filter-bar">
      <select v-model="filter.status" @change="page = 1; fetchOrders()">
        <option value="">全部状态</option>
        <option value="pending">待付款</option>
        <option value="paid">待发货</option>
        <option value="shipped">已发货</option>
        <option value="completed">已完成</option>
        <option value="cancelled">已取消</option>
      </select>
      <input v-model="filter.keyword" placeholder="搜索订单号" @keyup.enter="page = 1; fetchOrders()" />
      <button class="btn-search" @click="page = 1; fetchOrders()">搜索</button>
    </div>

    <div class="panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>商品</th>
            <th>金额</th>
            <th>状态</th>
            <th>下单时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.order_no }}</td>
            <td>
              <div>{{ order.user_nickname || '匿名' }}</div>
              <div class="phone">{{ order.user_phone }}</div>
            </td>
            <td>
              <div class="items-preview">
                <div v-for="item in order.items" :key="item.id" class="item-line">
                  {{ item.product_name }} x{{ item.quantity }}
                </div>
              </div>
            </td>
            <td>
              <div class="amount">¥{{ Number(order.pay_amount || 0).toFixed(2) }}</div>
              <div v-if="order.discount_amount > 0" class="discount">-¥{{ Number(order.discount_amount || 0).toFixed(2) }}</div>
            </td>
            <td>
              <span :class="['status-tag', order.status]">{{ statusText(order.status) }}</span>
            </td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>
              <button v-if="order.status === 'paid'" class="btn-text" @click="handleShip(order.id)">发货</button>
              <button class="btn-text" @click="openDetail(order.id)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button :disabled="page <= 1" @click="page--; fetchOrders()">上一页</button>
        <span>第 {{ page }} 页 / 共 {{ totalPages }} 页</span>
        <button :disabled="page >= totalPages" @click="page++; fetchOrders()">下一页</button>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="detail" class="modal-overlay" @click.self="detail = null">
      <div class="modal">
        <h3>订单详情</h3>
        <div class="detail-section">
          <div class="detail-row"><label>订单号:</label><span>{{ detail.order_no }}</span></div>
          <div class="detail-row"><label>用户:</label><span>{{ detail.user_nickname || '匿名' }} ({{ detail.user_phone }})</span></div>
          <div class="detail-row"><label>状态:</label><span :class="['status-tag', detail.status]">{{ statusText(detail.status) }}</span></div>
          <div class="detail-row"><label>下单时间:</label><span>{{ formatDate(detail.created_at) }}</span></div>
          <div class="detail-row"><label>收货地址:</label>
            <span>{{ detail.address?.province }} {{ detail.address?.city }} {{ detail.address?.district }} {{ detail.address?.detail }}<br/>{{ detail.address?.name }} {{ detail.address?.phone }}</span>
          </div>
          <div class="detail-row"><label>备注:</label><span>{{ detail.remark || '无' }}</span></div>
        </div>
        <div class="detail-section">
          <h4>商品清单</h4>
          <div v-for="item in detail.items" :key="item.id" class="order-item">
            <img :src="item.product_image" class="item-img" />
            <div class="item-info">
              <div class="name">{{ item.product_name }}</div>
              <div class="spec">{{ item.spec_name }}</div>
            </div>
            <div class="item-price">¥{{ item.price }} x{{ item.quantity }}</div>
          </div>
        </div>
        <div class="detail-section amount-summary">
          <div>商品总额: ¥{{ Number(detail.total_amount || 0).toFixed(2) }}</div>
          <div>优惠: -¥{{ Number(detail.discount_amount || 0).toFixed(2) }}</div>
          <div class="pay">实付: ¥{{ Number(detail.pay_amount || 0).toFixed(2) }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="detail = null">关闭</button>
          <button v-if="detail.status === 'paid'" class="btn-primary" @click="handleShip(detail.id); detail = null">确认发货</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const orders = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 15
const filter = reactive({ status: '', keyword: '' })
const detail = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const statusText = s => ({
  pending: '待付款', paid: '待发货', shipped: '已发货',
  completed: '已完成', cancelled: '已取消'
}[s] || s)

const formatDate = d => d ? new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'

const fetchOrders = async () => {
  const res = await adminStore.getOrders({
    status: filter.status,
    keyword: filter.keyword,
    page: page.value,
    pageSize
  })
  orders.value = res.data.list
  total.value = res.data.total
}

const openDetail = async id => {
  const res = await adminStore.getOrderDetail(id)
  detail.value = res.data
}

const handleShip = async id => {
  if (!confirm('确认发货？')) return
  try {
    await adminStore.updateOrderStatus(id, 'shipped')
    fetchOrders()
  } catch (err) {
    alert(err.message)
  }
}

onMounted(fetchOrders)
</script>

<style lang="scss" scoped>
.admin-orders {
  max-width: 1200px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}
.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  input, select {
    padding: 8px 12px;
    border: 1px solid #e8e0d8;
    border-radius: 8px;
    font-size: 13px;
    background: #fff;
  }
  input { width: 200px; }
}
.btn-search {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #8b5e3c;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.phone {
  font-size: 11px;
  color: #999;
}
.items-preview {
  .item-line {
    font-size: 12px;
    color: #555;
    white-space: nowrap;
  }
}
.amount {
  font-weight: 600;
  color: #333;
}
.discount {
  font-size: 11px;
  color: #e74c3c;
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
.btn-text {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: #d4a574;
  font-size: 12px;
  cursor: pointer;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  button {
    padding: 6px 14px;
    border: 1px solid #e8e0d8;
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    cursor: pointer;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
  span { font-size: 13px; color: #666; }
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal {
  background: #fff;
  border-radius: 16px;
  width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #333;
  }
  h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #555;
  }
}
.detail-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0ebe5;
}
.detail-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
  label {
    width: 80px;
    color: #999;
    flex-shrink: 0;
  }
  span { color: #333; }
}
.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  .item-img {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }
  .item-info {
    flex: 1;
    .name { font-size: 13px; color: #333; }
    .spec { font-size: 11px; color: #999; }
  }
  .item-price {
    font-size: 13px;
    color: #d4a574;
    font-weight: 500;
  }
}
.amount-summary {
  text-align: right;
  font-size: 13px;
  color: #666;
  div { margin-bottom: 4px; }
  .pay {
    font-size: 16px;
    font-weight: 700;
    color: #d4a574;
    margin-top: 8px;
  }
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.btn-secondary {
  padding: 10px 20px;
  border: 1px solid #e8e0d8;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #d4a574;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
</style>
