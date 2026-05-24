<template>
  <div class="page-container checkout-page">
    <header class="checkout-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1>确认订单</h1>
    </header>

    <!-- 地址选择 -->
    <div class="checkout-section address-section" @click="showAddressModal = true">
      <div v-if="selectedAddress" class="address-info">
        <div class="address-top">
          <span class="address-name">{{ selectedAddress.name }}</span>
          <span class="address-phone">{{ selectedAddress.phone }}</span>
          <span v-if="selectedAddress.is_default" class="address-default">默认</span>
        </div>
        <p class="address-detail">{{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}</p>
      </div>
      <div v-else class="address-empty">+ 选择收货地址</div>
      <span class="address-arrow">></span>
    </div>

    <!-- 商品列表 -->
    <div class="checkout-section">
      <div v-for="item in items" :key="item.productId + item.specName" class="checkout-item">
        <img :src="item.productImage" :alt="item.productName" class="item-img">
        <div class="item-detail">
          <h4 class="ellipsis">{{ item.productName }}</h4>
          <p class="item-spec">{{ item.specName }}</p>
          <div class="item-price-row">
            <span class="price">{{ item.price }}</span>
            <span class="item-qty">x{{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 优惠券 -->
    <div class="checkout-section" @click="showCouponModal = true">
      <div class="checkout-row">
        <span>优惠券</span>
        <span v-if="selectedCoupon" class="coupon-value">-{{ couponDiscount }}元</span>
        <span v-else class="row-value">{{ userCoupons.length > 0 ? `${userCoupons.length}张可用` : '无可用' }}</span>
      </div>
    </div>

    <!-- 备注 -->
    <div class="checkout-section">
      <div class="checkout-row remark-row">
        <span>订单备注</span>
        <input v-model="remark" placeholder="请输入备注（选填）">
      </div>
    </div>

    <!-- 金额明细 -->
    <div class="checkout-section amount-section">
      <div class="amount-row">
        <span>商品总额</span>
        <span>¥{{ totalAmount.toFixed(2) }}</span>
      </div>
      <div class="amount-row">
        <span>优惠金额</span>
        <span class="discount">-¥{{ discountAmount.toFixed(2) }}</span>
      </div>
      <div class="amount-row total">
        <span>实付金额</span>
        <span class="price">{{ payAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 底部提交 -->
    <div class="checkout-footer">
      <div class="footer-amount">
        <span>合计：</span>
        <span class="price">{{ payAmount.toFixed(2) }}</span>
      </div>
      <button class="btn btn-primary submit-btn" @click="submitOrder" :disabled="submitting || !selectedAddress">
        {{ submitting ? '提交中...' : '提交订单' }}
      </button>
    </div>

    <!-- 地址选择弹窗 -->
    <div v-if="showAddressModal" class="modal-overlay" @click.self="showAddressModal = false">
      <div class="address-modal">
        <div class="modal-title">选择收货地址</div>
        <div class="address-list">
          <div
            v-for="addr in addresses"
            :key="addr.id"
            :class="['address-item', { active: selectedAddress?.id === addr.id }]"
            @click="selectAddress(addr)"
          >
            <div class="address-item-top">
              <span>{{ addr.name }}</span>
              <span>{{ addr.phone }}</span>
              <span v-if="addr.is_default" class="default-tag">默认</span>
            </div>
            <p>{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
          </div>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 12px" @click="$router.push('/addresses')">
          + 新建地址
        </button>
      </div>
    </div>

    <!-- 优惠券弹窗 -->
    <div v-if="showCouponModal" class="modal-overlay" @click.self="showCouponModal = false">
      <div class="coupon-modal">
        <div class="modal-title">选择优惠券</div>
        <div class="coupon-list">
          <div
            v-for="c in userCoupons"
            :key="c.id"
            :class="['coupon-item', { active: selectedCoupon?.id === c.id, disabled: totalAmount < c.min_amount }]"
            @click="selectCoupon(c)"
          >
            <div class="coupon-left">
              <span class="coupon-amount">{{ c.type === 'amount' ? `¥${c.value}` : `${Math.round(c.value*100)}折` }}</span>
            </div>
            <div class="coupon-right">
              <p>{{ c.name }}</p>
              <span>满{{ c.min_amount }}可用 | 有效期至{{ c.end_date }}</span>
            </div>
          </div>
          <div v-if="userCoupons.length === 0" class="empty-state">
            <span class="empty-icon">🎫</span>
            <span class="empty-text">暂无可用优惠券</span>
          </div>
        </div>
        <button class="btn btn-outline" style="width: 100%; margin-top: 12px" @click="selectedCoupon = null; showCouponModal = false">
          不使用优惠券
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAddresses, getUserCoupons, createOrder } from '@/api'

const route = useRoute()
const router = useRouter()

const items = ref(JSON.parse(route.query.items || '[]'))
const addresses = ref([])
const selectedAddress = ref(null)
const userCoupons = ref([])
const selectedCoupon = ref(null)
const remark = ref('')
const showAddressModal = ref(false)
const showCouponModal = ref(false)
const submitting = ref(false)

const totalAmount = computed(() =>
  items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const couponDiscount = computed(() => {
  if (!selectedCoupon.value) return 0
  if (selectedCoupon.value.type === 'amount') return selectedCoupon.value.value
  return totalAmount.value * (1 - selectedCoupon.value.value)
})

const discountAmount = computed(() => {
  if (!selectedCoupon.value) return 0
  if (totalAmount.value < (selectedCoupon.value.min_amount || 0)) return 0
  return couponDiscount.value
})

const payAmount = computed(() => Math.max(0, totalAmount.value - discountAmount.value))

async function loadData() {
  const [addrRes, couponRes] = await Promise.all([getAddresses(), getUserCoupons()])
  addresses.value = addrRes.data || []
  selectedAddress.value = addresses.value.find(a => a.is_default) || addresses.value[0]
  userCoupons.value = couponRes.data || []
}

function selectAddress(addr) {
  selectedAddress.value = addr
  showAddressModal.value = false
}

function selectCoupon(c) {
  if (totalAmount.value < c.min_amount) return
  selectedCoupon.value = c
  showCouponModal.value = false
}

async function submitOrder() {
  if (!selectedAddress.value) return
  submitting.value = true
  try {
    const res = await createOrder({
      items: items.value,
      address: selectedAddress.value,
      remark: remark.value,
      couponId: selectedCoupon.value?.coupon_id
    })
    router.push(`/order-detail/${res.data.orderId}`)
  } catch (e) {
    alert(e)
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.checkout-page {
  background: var(--bg);
  padding-bottom: 80px;
}

.checkout-header {
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

.checkout-section {
  background: var(--bg-card);
  margin: 8px 0;
  padding: 14px 16px;
}

.address-section {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  .address-info {
    flex: 1;

    .address-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .address-name {
        font-size: 15px;
        font-weight: 600;
      }

      .address-phone {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .address-default {
        padding: 1px 6px;
        background: rgba(212, 165, 116, 0.15);
        color: var(--primary-dark);
        font-size: 10px;
        border-radius: 4px;
      }
    }

    .address-detail {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
  }

  .address-empty {
    flex: 1;
    color: var(--primary-dark);
    font-size: 14px;
  }

  .address-arrow {
    color: var(--text-muted);
  }
}

.checkout-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }

  .item-img {
    width: 72px;
    height: 72px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }

  .item-detail {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .item-spec {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .item-price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .item-qty {
        font-size: 13px;
        color: var(--text-muted);
      }
    }
  }
}

.checkout-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  cursor: pointer;

  .row-value, .coupon-value {
    color: var(--text-muted);
    font-size: 13px;
  }

  .coupon-value {
    color: var(--accent);
  }
}

.remark-row {
  input {
    flex: 1;
    margin-left: 12px;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--text);
    text-align: right;
    background: transparent;

    &::placeholder {
      color: var(--text-muted);
    }
  }
}

.amount-section {
  .amount-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
    color: var(--text-secondary);

    .discount {
      color: var(--accent);
    }

    &.total {
      margin-top: 8px;
      padding-top: 10px;
      border-top: 1px solid var(--border);
      font-size: 15px;
      font-weight: 600;
      color: var(--text);

      .price {
        font-size: 20px;
      }
    }
  }
}

.checkout-footer {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  align-items: center;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  gap: 16px;
  z-index: 100;

  .footer-amount {
    flex: 1;
    text-align: right;

    .price {
      font-size: 20px;
      font-weight: 700;
    }
  }

  .submit-btn {
    padding: 12px 28px;
    font-size: 15px;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.address-modal, .coupon-modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 430px;
  animation: slideUp 0.3s ease;

  .modal-title {
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 16px;
  }
}

.address-list {
  max-height: 300px;
  overflow-y: auto;

  .address-item {
    padding: 12px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: 8px;
    cursor: pointer;

    &.active {
      border-color: var(--primary);
      background: rgba(212, 165, 116, 0.05);
    }

    .address-item-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 14px;
      font-weight: 500;

      .default-tag {
        padding: 1px 6px;
        background: rgba(212, 165, 116, 0.15);
        color: var(--primary-dark);
        font-size: 10px;
        border-radius: 4px;
      }
    }

    p {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

.coupon-list {
  max-height: 350px;
  overflow-y: auto;

  .coupon-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    margin-bottom: 8px;
    cursor: pointer;

    &.active {
      border-color: var(--primary);
      background: rgba(212, 165, 116, 0.05);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .coupon-left {
      width: 60px;
      text-align: center;

      .coupon-amount {
        font-size: 20px;
        font-weight: 700;
        color: var(--accent);
      }
    }

    .coupon-right {
      flex: 1;

      p {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 2px;
      }

      span {
        font-size: 11px;
        color: var(--text-muted);
      }
    }
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
