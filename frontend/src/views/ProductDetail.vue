<template>
  <div class="page-container detail-page">
    <div class="detail-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button class="share-btn" @click="showShare = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
    </div>

    <div v-if="product" class="detail-content">
      <div class="detail-image">
        <img :src="product.image" :alt="product.name">
      </div>

      <div class="detail-info">
        <div class="detail-tags">
          <span v-for="tag in product.tags" :key="tag" class="tag" :class="tag === '热销' ? 'tag-hot' : 'tag-new'">{{ tag }}</span>
        </div>
        <h1 class="detail-title font-serif">{{ product.name }}</h1>
        <p class="detail-subtitle">{{ product.subtitle }}</p>
        <div class="detail-price-row">
          <span class="price">{{ selectedPrice }}</span>
          <span class="price-original" v-if="product.original_price">{{ product.original_price }}</span>
          <span class="detail-sales">已售 {{ product.sales }}+</span>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">选择规格</h3>
        <div class="spec-list">
          <button
            v-for="spec in product.specs"
            :key="spec.name"
            :class="['spec-btn', { active: selectedSpec === spec.name }]"
            @click="selectedSpec = spec.name"
          >
            {{ spec.name }}
            <span class="spec-price">¥{{ spec.price }}</span>
          </button>
        </div>
      </div>

      <div class="detail-section">
        <h3 class="section-title">商品详情</h3>
        <p class="detail-desc">{{ product.description }}</p>
        <div class="detail-images">
          <img v-if="product.image" :src="product.image" alt="detail">
        </div>
      </div>
    </div>

    <div class="detail-footer">
      <div class="footer-actions">
        <button class="action-btn" @click="toggleFavorite">
          <svg :fill="isFav ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="22" height="22">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          <span>收藏</span>
        </button>
      </div>
      <div class="footer-btns">
        <button class="btn btn-secondary" @click="addCart">加入购物车</button>
        <button class="btn btn-primary" @click="buyNow">立即购买</button>
      </div>
    </div>

    <!-- 加入购物车弹窗 -->
    <div v-if="showCartModal" class="modal-overlay" @click.self="showCartModal = false">
      <div class="cart-modal">
        <div class="modal-header">
          <img :src="product.image" alt="">
          <div class="modal-info">
            <span class="price">{{ selectedPrice }}</span>
            <span>已选：{{ selectedSpec }}</span>
          </div>
          <button class="modal-close" @click="showCartModal = false">×</button>
        </div>
        <div class="modal-specs">
          <p>规格</p>
          <div class="spec-list">
            <button
              v-for="spec in product.specs"
              :key="spec.name"
              :class="['spec-btn', { active: selectedSpec === spec.name }]"
              @click="selectedSpec = spec.name"
            >{{ spec.name }}</button>
          </div>
        </div>
        <div class="modal-quantity">
          <span>数量</span>
          <div class="quantity-control">
            <button @click="quantity = Math.max(1, quantity - 1)">−</button>
            <span>{{ quantity }}</span>
            <button @click="quantity++">+</button>
          </div>
        </div>
        <button class="btn btn-primary modal-submit" @click="confirmAddCart">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail, addToCart, getFavorites, addFavorite, removeFavorite } from '@/api'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const product = ref(null)
const selectedSpec = ref('')
const quantity = ref(1)
const isFav = ref(false)
const showCartModal = ref(false)
const showShare = ref(false)

const selectedPrice = computed(() => {
  const spec = product.value?.specs?.find(s => s.name === selectedSpec.value)
  return spec ? spec.price : product.value?.price
})

async function loadData() {
  const res = await getProductDetail(route.params.id)
  product.value = res.data
  if (product.value.specs?.length) selectedSpec.value = product.value.specs[0].name

  if (userStore.isLoggedIn) {
    const favRes = await getFavorites()
    isFav.value = favRes.data?.some(f => f.id === product.value.id)
  }
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) return router.push('/login')
  if (isFav.value) {
    await removeFavorite(product.value.id)
    isFav.value = false
  } else {
    await addFavorite(product.value.id)
    isFav.value = true
  }
}

function addCart() {
  if (!userStore.isLoggedIn) return router.push('/login')
  showCartModal.value = true
}

async function confirmAddCart() {
  await addToCart({ productId: product.value.id, skuId: selectedSpec.value, quantity: quantity.value })
  cartStore.fetchCart()
  showCartModal.value = false
  quantity.value = 1
}

function buyNow() {
  if (!userStore.isLoggedIn) return router.push('/login')
  router.push({
    path: '/checkout',
    query: {
      items: JSON.stringify([{
        productId: product.value.id,
        productName: product.value.name,
        productImage: product.value.image,
        specName: selectedSpec.value,
        price: selectedPrice.value,
        quantity: 1
      }])
    }
  })
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.detail-page {
  background: var(--bg-card);
  padding-bottom: 80px;
}

.detail-header {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  z-index: 10;

  button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
}

.detail-image {
  width: 100%;
  aspect-ratio: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.detail-info {
  padding: 16px;

  .detail-tags {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }

  .detail-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .detail-subtitle {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 10px;
  }

  .detail-price-row {
    display: flex;
    align-items: baseline;
    gap: 10px;

    .price {
      font-size: 24px;
      font-weight: 700;
    }

    .detail-sales {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}

.detail-section {
  padding: 16px;
  border-top: 8px solid var(--bg);

  .section-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .detail-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.8;
  }

  .detail-images img {
    width: 100%;
    border-radius: var(--radius-md);
    margin-top: 12px;
  }
}

.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .spec-btn {
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-card);
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s ease;

    &.active {
      border-color: var(--primary);
      background: rgba(212, 165, 116, 0.1);
      color: var(--primary-dark);
      font-weight: 500;
    }

    .spec-price {
      margin-left: 4px;
      color: var(--accent);
      font-weight: 600;
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
  align-items: center;
  padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  gap: 12px;
  z-index: 100;

  .footer-actions {
    display: flex;
    gap: 16px;

    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 10px;
      cursor: pointer;

      svg {
        color: var(--accent);
      }
    }
  }

  .footer-btns {
    flex: 1;
    display: flex;
    gap: 8px;

    .btn {
      flex: 1;
      padding: 12px;
      font-size: 14px;
    }
  }
}

.cart-modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 16px;
  width: 100%;
  max-width: 430px;
  animation: slideUp 0.3s ease;

  .modal-header {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    img {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-sm);
      object-fit: cover;
    }

    .modal-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .price {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      span:last-child {
        font-size: 12px;
        color: var(--text-muted);
      }
    }

    .modal-close {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: var(--bg);
      font-size: 18px;
      color: var(--text-muted);
      cursor: pointer;
    }
  }

  .modal-quantity {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 0;

    .quantity-control {
      display: flex;
      align-items: center;
      gap: 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;

      button {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--bg);
        font-size: 16px;
        cursor: pointer;
      }

      span {
        min-width: 32px;
        text-align: center;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }

  .modal-submit {
    width: 100%;
    padding: 14px;
    font-size: 15px;
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
