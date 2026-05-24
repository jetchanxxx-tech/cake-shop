<template>
  <div class="page-container category-page">
    <div class="search-bar">
      <div class="search-input" @click="searching = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input v-if="searching" v-model="keyword" placeholder="搜索蛋糕..." @blur="searching = false" ref="searchRef">
        <span v-else>{{ keyword || '搜索蛋糕...' }}</span>
      </div>
    </div>

    <div class="category-layout">
      <aside class="category-sidebar">
        <div
          v-for="cat in categories"
          :key="cat.id"
          :class="['sidebar-item', { active: currentCategory === cat.id }]"
          @click="currentCategory = cat.id"
        >
          {{ cat.name }}
        </div>
      </aside>

      <main class="category-main">
        <div class="sort-bar">
          <span
            v-for="s in sortOptions"
            :key="s.value"
            :class="{ active: sort === s.value }"
            @click="sort = s.value"
          >{{ s.label }}</span>
        </div>

        <div class="product-grid">
          <div
            v-for="product in products"
            :key="product.id"
            class="grid-item"
            @click="$router.push(`/product/${product.id}`)"
          >
            <div class="grid-image">
              <img :src="product.image" :alt="product.name" loading="lazy">
            </div>
            <div class="grid-info">
              <h4 class="ellipsis">{{ product.name }}</h4>
              <p class="ellipsis">{{ product.subtitle }}</p>
              <div class="grid-price">
                <span class="price">{{ product.price }}</span>
                <span class="price-original" v-if="product.original_price">{{ product.original_price }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="products.length === 0" class="empty-state">
          <span class="empty-icon">🍰</span>
          <span class="empty-text">暂无商品</span>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getCategories, getProducts } from '@/api'

const route = useRoute()
const categories = ref([{ id: 0, name: '全部' }])
const products = ref([])
const currentCategory = ref(0)
const keyword = ref('')
const searching = ref(false)
const sort = ref('new')
const searchRef = ref(null)
const sortOptions = [
  { label: '综合', value: 'new' },
  { label: '销量', value: 'sales' },
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' }
]

async function loadCategories() {
  const res = await getCategories()
  categories.value = [{ id: 0, name: '全部' }, ...(res.data || [])]
}

async function loadProducts() {
  const params = { sort: sort.value }
  if (currentCategory.value > 0) params.categoryId = currentCategory.value
  if (keyword.value) params.keyword = keyword.value
  const res = await getProducts(params)
  products.value = res.data || []
}

watch(searching, v => {
  if (v) nextTick(() => searchRef.value?.focus())
})
watch([currentCategory, sort, keyword], loadProducts, { immediate: false })
watch(() => route.query, () => {
  if (route.query.categoryId) currentCategory.value = parseInt(route.query.categoryId)
  if (route.query.tag) {
    // handle tag filter
  }
}, { immediate: true })

loadCategories().then(loadProducts)
</script>

<style lang="scss" scoped>
.category-page {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
}

.search-bar {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);

  .search-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--bg);
    border-radius: 100px;
    color: var(--text-muted);
    font-size: 14px;

    input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      color: var(--text);
    }
  }
}

.category-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.category-sidebar {
  width: 84px;
  flex-shrink: 0;
  background: var(--bg);
  overflow-y: auto;

  .sidebar-item {
    padding: 16px 8px;
    text-align: center;
    font-size: 13px;
    color: var(--text-secondary);
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;

    &.active {
      background: var(--bg-card);
      color: var(--primary-dark);
      font-weight: 600;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 16px;
        background: var(--primary);
        border-radius: 0 2px 2px 0;
      }
    }
  }
}

.category-main {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.sort-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;

  span {
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 2px 0;

    &.active {
      color: var(--primary-dark);
      font-weight: 600;
      border-bottom: 2px solid var(--primary);
    }
  }
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.grid-item {
  background: var(--bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;

  .grid-image {
    aspect-ratio: 1;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .grid-info {
    padding: 8px;

    h4 {
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    p {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .grid-price {
      display: flex;
      align-items: center;
      gap: 6px;

      .price {
        font-size: 14px;
      }
    }
  }
}
</style>
