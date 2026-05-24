<template>
  <div class="page-container cart-page">
    <header class="cart-header">
      <h1 class="font-serif">购物车</h1>
      <span v-if="cartStore.items.length > 0" class="edit-btn" @click="isEdit = !isEdit">
        {{ isEdit ? '完成' : '管理' }}
      </span>
    </header>

    <div v-if="cartStore.items.length > 0" class="cart-list">
      <div
        v-for="item in cartStore.items"
        :key="item.id"
        class="cart-item"
      >
        <label class="item-check">
          <input
            type="checkbox"
            :checked="item.selected"
            @change="toggleSelect(item)"
          >
          <span class="check-circle" :class="{ checked: item.selected }">
            <svg v-if="item.selected" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="12" height="12">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        </label>
        <img :src="item.product_image" :alt="item.product_name" class="item-image" @click="$router.push(`/product/${item.product_id}`)">
        <div class="item-info" @click="$router.push(`/product/${item.product_id}`)">
          <h4 class="ellipsis">{{ item.product_name }}</h4>
          <p class="item-spec">{{ item.sku_id }}</p>
          <div class="item-bottom">
            <span class="price">{{ item.price }}</span>
            <div class="quantity-control">
              <button @click.stop="updateQty(item, -1)">−</button>
              <span>{{ item.quantity }}</span>
              <button @click.stop="updateQty(item, 1)">+</button>
            </div>
          </div>
        </div>
        <button v-if="isEdit" class="item-delete" @click="cartStore.removeItem(item.id)">删除</button>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">🛒</span>
      <span class="empty-text">购物车是空的</span>
      <button class="btn btn-primary" style="margin-top: 20px" @click="$router.push('/home')">去逛逛</button>
    </div>

    <div v-if="cartStore.items.length > 0" class="cart-footer">
      <label class="select-all">
        <input type="checkbox" :checked="allSelected" @change="toggleAll">
        <span class="check-circle" :class="{ checked: allSelected }">
          <svg v-if="allSelected" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" width="12" height="12">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        <span>全选</span>
      </label>
      <div class="cart-total">
        <span>合计：</span>
        <span class="price">{{ cartStore.selectedPrice }}</span>
      </div>
      <button class="btn btn-primary checkout-btn" @click="checkout" :disabled="cartStore.selectedItems.length === 0">
        结算({{ cartStore.selectedItems.length }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()
const isEdit = ref(false)

const allSelected = computed(() =>
  cartStore.items.length > 0 && cartStore.items.every(i => i.selected)
)

function toggleSelect(item) {
  cartStore.updateItem(item.id, item.quantity, !item.selected)
}

function toggleAll() {
  const newVal = !allSelected.value
  cartStore.items.forEach(item => {
    cartStore.updateItem(item.id, item.quantity, newVal)
  })
}

function updateQty(item, delta) {
  const newQty = Math.max(1, item.quantity + delta)
  cartStore.updateItem(item.id, newQty, item.selected)
}

function checkout() {
  const items = cartStore.selectedItems.map(item => ({
    productId: item.product_id,
    productName: item.product_name,
    productImage: item.product_image,
    specName: item.sku_id,
    price: item.price,
    quantity: item.quantity
  }))
  router.push({
    path: '/checkout',
    query: { items: JSON.stringify(items) }
  })
}

onMounted(() => cartStore.fetchCart())
</script>

<style lang="scss" scoped>
.cart-page {
  background: var(--bg);
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-card);

  h1 {
    font-size: 20px;
    font-weight: 600;
  }

  .edit-btn {
    font-size: 14px;
    color: var(--text-secondary);
    cursor: pointer;
  }
}

.cart-list {
  padding: 12px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  margin-bottom: 10px;

  .item-check {
    position: relative;
    cursor: pointer;

    input {
      position: absolute;
      opacity: 0;
    }

    .check-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &.checked {
        background: var(--primary);
        border-color: var(--primary);
      }
    }
  }

  .item-image {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }

  .item-info {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .item-spec {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .item-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .price {
        font-size: 16px;
      }

      .quantity-control {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        overflow: hidden;

        button {
          width: 28px;
          height: 28px;
          border: none;
          background: var(--bg);
          font-size: 14px;
          cursor: pointer;
        }

        span {
          min-width: 28px;
          text-align: center;
          font-size: 13px;
        }
      }
    }
  }

  .item-delete {
    padding: 6px 12px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
  }
}

.cart-footer {
  position: fixed;
  bottom: calc(60px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  gap: 12px;
  z-index: 100;

  .select-all {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary);
    position: relative;

    input {
      position: absolute;
      opacity: 0;
    }

    .check-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &.checked {
        background: var(--primary);
        border-color: var(--primary);
      }
    }
  }

  .cart-total {
    flex: 1;
    text-align: right;
    font-size: 14px;

    .price {
      font-size: 18px;
      font-weight: 700;
    }
  }

  .checkout-btn {
    padding: 10px 24px;
    font-size: 14px;
    white-space: nowrap;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
