<template>
  <div class="page-container order-detail-page">
    <header class="detail-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1>订单详情</h1>
    </header>

    <div v-if="order" class="detail-content">
      <div class="status-banner" :class="order.status">
        <span class="status-icon">{{ statusIcon }}</span>
        <span class="status-text">{{ statusMap[order.status] }}</span>
      </div>

      <div class="detail-card">
        <h3>收货信息</h3>
        <div class="address-info">
          <p><strong>{{ order.address?.name }}</strong> {{ order.address?.phone }}</p>
          <p>{{ order.address?.province }}{{ order.address?.city }}{{ order.address?.district }}{{ order.address?.detail }}</p>
        </div>
      </div>

      <div class="detail-card">
        <h3>商品信息</h3>
        <div v-for="item in order.items" :key="item.id" class="detail-item">
          <img :src="item.product_image" :alt="item.product_name">
          <div class="item-info">
            <h4 class="ellipsis">{{ item.product_name }}</h4>
            <p>{{ item.spec_name }} x{{ item.quantity }}</p>
          </div>
          <span class="price">{{ item.price }}</span>
        </div>
      </div>

      <div class="detail-card">
        <div class="amount-row"><span>商品总额</span><span>¥{{ order.total_amount?.toFixed(2) }}</span></div>
        <div class="amount-row"><span>优惠金额</span><span class="discount">-¥{{ order.discount_amount?.toFixed(2) }}</span></div>
        <div class="amount-row"><span>运费</span><span>¥0.00</span></div>
        <div class="amount-row total"><span>实付金额</span><span class="price">{{ order.pay_amount?.toFixed(2) }}</span></div>
      </div>

      <div class="detail-card info-card">
        <p>订单编号：{{ order.order_no }}</p>
        <p>创建时间：{{ order.created_at }}</p>
        <p v-if="order.remark">订单备注：{{ order.remark }}</p>
      </div>
    </div>

    <div v-if="order?.status === 'pending'" class="detail-footer">
      <button class="btn btn-outline" @click="cancelOrder">取消订单</button>
      <button class="btn btn-primary" @click="pay" :disabled="paying">
        {{ paying ? '拉起支付中...' : '去支付' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail, cancelOrder as apiCancelOrder, createPayOrder, queryPayOrder } from '@/api'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const paying = ref(false)

const statusMap = {
  pending: '待付款',
  paid: '待收货',
  shipping: '配送中',
  completed: '已完成',
  cancelled: '已取消'
}

const statusIcon = computed(() => {
  const icons = { pending: '💳', paid: '🍰', shipping: '🚚', completed: '✅', cancelled: '❌' }
  return icons[order.value?.status] || '📋'
})

async function loadData() {
  const res = await getOrderDetail(route.params.id)
  order.value = res.data
}

async function pollPaid(orderId) {
  for (let i = 0; i < 10; i++) {
    try {
      const r = await queryPayOrder(orderId)
      if (r.data?.status === 'paid') return true
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  return false
}

function buildReturnUrl() {
  const href = router.resolve({
    name: 'OrderDetail',
    params: { id: order.value.id },
    query: { pay_return: '1' }
  }).href
  return `${window.location.origin}${href}`
}

function appendRedirectUrl(h5Url, redirectUrl) {
  if (!h5Url) return ''
  if (h5Url.includes('redirect_url=')) return h5Url
  const sep = h5Url.includes('?') ? '&' : '?'
  return `${h5Url}${sep}redirect_url=${encodeURIComponent(redirectUrl)}`
}

async function pay() {
  if (!order.value) return
  paying.value = true
  try {
    const payRes = await createPayOrder({
      orderId: order.value.id,
      payType: 'wechat_h5'
    })

    const h5Url = payRes.data?.h5Url || payRes.data?.h5_url
    const finalUrl = appendRedirectUrl(h5Url, buildReturnUrl())
    if (!finalUrl) throw new Error('未获取到微信 H5 支付链接')
    window.location.href = finalUrl
  } catch (e) {
    const msg = e?.err_msg || e?.message || '支付失败或已取消'
    alert(msg)
  } finally {
    paying.value = false
  }
}

async function cancelOrder() {
  if (!confirm('确定取消该订单？')) return
  await apiCancelOrder(order.value.id)
  loadData()
}

onMounted(async () => {
  await loadData()
  if (route.query.pay_return) {
    const paid = await pollPaid(route.params.id)
    if (paid) await loadData()
  }
})
</script>

<style lang="scss" scoped>
.order-detail-page {
  background: var(--bg);
  padding-bottom: 80px;
}

.detail-header {
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

.status-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: var(--bg-card);
  margin-bottom: 8px;

  .status-icon {
    font-size: 24px;
  }

  .status-text {
    font-size: 18px;
    font-weight: 600;
  }
}

.detail-card {
  background: var(--bg-card);
  padding: 14px 16px;
  margin-bottom: 8px;

  h3 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .address-info {
    p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;

      strong {
        color: var(--text);
        font-weight: 500;
      }
    }
  }

  .detail-item {
    display: flex;
    gap: 10px;
    padding: 8px 0;

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

  .amount-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13px;
    color: var(--text-secondary);

    .discount {
      color: var(--accent);
    }

    &.total {
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
      font-size: 15px;
      font-weight: 600;
      color: var(--text);

      .price {
        font-size: 18px;
      }
    }
  }

  &.info-card {
    p {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.8;
    }
  }
}

.detail-footer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  z-index: 100;

  .btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
