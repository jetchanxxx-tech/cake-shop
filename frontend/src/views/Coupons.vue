<template>
  <div class="page-container coupons-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1>我的礼券</h1>
    </header>

    <div class="coupon-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: activeTab === tab.value }]"
        @click="activeTab = tab.value"
      >{{ tab.label }}</div>
    </div>

    <div class="coupons-list">
      <div v-for="c in displayCoupons" :key="c.id" class="coupon-card">
        <div class="coupon-left">
          <span class="coupon-amount">{{ c.type === 'amount' ? `¥${c.value}` : `${Math.round(c.value*100)}折` }}</span>
        </div>
        <div class="coupon-right">
          <p>{{ c.name }}</p>
          <span>满{{ c.min_amount }}可用 | 有效期至{{ c.end_date }}</span>
        </div>
      </div>

      <div v-if="displayCoupons.length === 0" class="empty-state">
        <span class="empty-icon">🎫</span>
        <span class="empty-text">暂无{{ activeTab === 'available' ? '可用' : '已使用' }}优惠券</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserCoupons, getCoupons } from '@/api'

const activeTab = ref('available')
const userCoupons = ref([])
const allCoupons = ref([])

const tabs = [
  { label: '可用', value: 'available' },
  { label: '已使用', value: 'used' }
]

const displayCoupons = computed(() => {
  if (activeTab.value === 'available') return userCoupons.value
  return []
})

async function loadData() {
  const [uRes, aRes] = await Promise.all([getUserCoupons(), getCoupons()])
  userCoupons.value = uRes.data || []
  allCoupons.value = aRes.data || []
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.coupons-page {
  background: var(--bg);
}

.page-header {
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

.coupon-tabs {
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
      }
    }
  }
}

.coupons-list {
  padding: 12px;
}

.coupon-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 10px;
  border: 1.5px solid var(--border);

  .coupon-left {
    width: 70px;
    text-align: center;
    border-right: 1px dashed var(--border);
    padding-right: 14px;

    .coupon-amount {
      font-size: 24px;
      font-weight: 700;
      color: var(--accent);
    }
  }

  .coupon-right {
    flex: 1;

    p {
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    span {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}
</style>
