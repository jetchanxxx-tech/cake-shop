<template>
  <div class="page-container home-page">
    <!-- 顶部搜索栏 -->
    <header class="home-header">
      <div class="header-brand">
        <span class="brand-name font-serif">Mio Bakery</span>
        <span class="brand-tag">手工蛋糕定制</span>
      </div>
      <div class="header-search" @click="$router.push('/category')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <span>搜索蛋糕...</span>
      </div>
    </header>

    <!-- Banner 轮播 -->
    <section class="banner-section">
      <div class="banner-wrapper" ref="bannerRef">
        <div
          class="banner-track"
          :style="{ transform: `translateX(-${currentBanner * 100}%)` }"
        >
          <div
            v-for="banner in banners"
            :key="banner.id"
            class="banner-item"
            @click="$router.push(banner.link || '/category')"
          >
            <img :src="banner.image" :alt="banner.title" loading="lazy">
            <div class="banner-content">
              <h3 class="font-serif">{{ banner.title }}</h3>
            </div>
          </div>
        </div>
        <div class="banner-dots">
          <span
            v-for="(_, i) in banners"
            :key="i"
            :class="{ active: i === currentBanner }"
            @click="currentBanner = i"
          />
        </div>
      </div>
    </section>

    <!-- 分类入口 -->
    <section class="category-section">
      <div class="category-grid">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          @click="$router.push(`/category?categoryId=${cat.id}`)"
        >
          <div class="category-icon">{{ catIcons[cat.name] || '🍰' }}</div>
          <span>{{ cat.name }}</span>
        </div>
      </div>
    </section>

    <!-- 热销推荐 -->
    <section class="section hot-section">
      <div class="section-header">
        <h2 class="font-serif">当季热销</h2>
        <span class="section-more" @click="$router.push('/category?tag=hot')">全部 ></span>
      </div>
      <div class="hot-scroll">
        <div
          v-for="product in hotProducts"
          :key="product.id"
          class="hot-card"
          @click="$router.push(`/product/${product.id}`)"
        >
          <div class="hot-image">
            <img :src="product.image" :alt="product.name" loading="lazy">
          </div>
          <div class="hot-info">
            <h4 class="ellipsis">{{ product.name }}</h4>
            <p class="hot-subtitle ellipsis">{{ product.subtitle }}</p>
            <div class="hot-price">
              <span class="price">{{ product.price }}</span>
              <span class="price-original" v-if="product.original_price">{{ product.original_price }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 瀑布流商品 -->
    <section class="section waterfall-section">
      <div class="section-header">
        <h2 class="font-serif">精选蛋糕</h2>
        <div class="filter-tabs">
          <span
            v-for="tab in filterTabs"
            :key="tab.value"
            :class="{ active: currentFilter === tab.value }"
            @click="currentFilter = tab.value"
          >{{ tab.label }}</span>
        </div>
      </div>
      <div class="waterfall">
        <div class="waterfall-col" ref="col1Ref">
          <div
            v-for="product in col1Products"
            :key="product.id"
            class="product-card"
            @click="$router.push(`/product/${product.id}`)"
          >
            <div class="product-image">
              <img :src="product.image" :alt="product.name" loading="lazy">
              <div class="product-tags">
                <span v-for="tag in product.tags.slice(0, 2)" :key="tag" class="tag" :class="tag === '热销' ? 'tag-hot' : 'tag-new'">{{ tag }}</span>
              </div>
            </div>
            <div class="product-info">
              <h4 class="product-name ellipsis-2">{{ product.name }}</h4>
              <p class="product-subtitle ellipsis">{{ product.subtitle }}</p>
              <div class="product-footer">
                <span class="price">{{ product.price }}</span>
                <span class="product-sales">已售 {{ product.sales }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="waterfall-col" ref="col2Ref">
          <div
            v-for="product in col2Products"
            :key="product.id"
            class="product-card"
            @click="$router.push(`/product/${product.id}`)"
          >
            <div class="product-image">
              <img :src="product.image" :alt="product.name" loading="lazy">
              <div class="product-tags">
                <span v-for="tag in product.tags.slice(0, 2)" :key="tag" class="tag" :class="tag === '热销' ? 'tag-hot' : 'tag-new'">{{ tag }}</span>
              </div>
            </div>
            <div class="product-info">
              <h4 class="product-name ellipsis-2">{{ product.name }}</h4>
              <p class="product-subtitle ellipsis">{{ product.subtitle }}</p>
              <div class="product-footer">
                <span class="price">{{ product.price }}</span>
                <span class="product-sales">已售 {{ product.sales }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loading" class="load-more">
        <span class="skeleton" style="width: 120px; height: 16px; display: inline-block;"></span>
      </div>
    </section>

    <div class="safe-bottom"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getBanners, getCategories, getProducts } from '@/api'

const banners = ref([])
const categories = ref([])
const products = ref([])
const hotProducts = ref([])
const loading = ref(false)
const currentBanner = ref(0)
const currentFilter = ref('all')
const bannerTimer = ref(null)

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '热销', value: 'hot' },
  { label: '新品', value: 'new' }
]

const catIcons = {
  '生日蛋糕': '🎂',
  '杯子蛋糕': '🧁',
  '慕斯蛋糕': '🍮',
  '千层蛋糕': '🥞',
  '芝士蛋糕': '🧀',
  '季节限定': '🌸'
}

const col1Products = computed(() => products.value.filter((_, i) => i % 2 === 0))
const col2Products = computed(() => products.value.filter((_, i) => i % 2 === 1))

async function loadData() {
  try {
    const [bRes, cRes, pRes, hRes] = await Promise.all([
      getBanners(),
      getCategories(),
      getProducts({ sort: 'new' }),
      getProducts({ tag: 'hot', limit: 6 })
    ])
    banners.value = bRes.data || []
    categories.value = cRes.data || []
    products.value = pRes.data || []
    hotProducts.value = hRes.data?.slice(0, 6) || []
  } catch (e) {
    console.error('加载首页数据失败', e)
  }
}

async function loadByFilter() {
  loading.value = true
  try {
    const params = { sort: currentFilter.value === 'all' ? 'new' : 'sales' }
    if (currentFilter.value !== 'all') params.tag = currentFilter.value
    const res = await getProducts(params)
    products.value = res.data || []
  } finally {
    loading.value = false
  }
}

watch(currentFilter, loadByFilter)

function startBanner() {
  bannerTimer.value = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % banners.value.length
  }, 4000)
}

onMounted(() => {
  loadData()
  startBanner()
})

onUnmounted(() => {
  clearInterval(bannerTimer.value)
})
</script>

<style lang="scss" scoped>
.home-page {
  background: var(--bg);
}

.home-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);

  .header-brand {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-dark);
      letter-spacing: 0.5px;
    }

    .brand-tag {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: -2px;
    }
  }

  .header-search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--bg);
    border-radius: 100px;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    border: 1px solid var(--border);
  }
}

.banner-section {
  padding: 12px 16px;

  .banner-wrapper {
    border-radius: var(--radius-lg);
    overflow: hidden;
    position: relative;
  }

  .banner-track {
    display: flex;
    transition: transform 0.5s ease;
  }

  .banner-item {
    min-width: 100%;
    position: relative;
    aspect-ratio: 16 / 9;
    cursor: pointer;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .banner-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 40px 20px 16px;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.4));

      h3 {
        color: white;
        font-size: 18px;
        font-weight: 600;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    }
  }

  .banner-dots {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 6px;

    span {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.4);
      transition: all 0.3s ease;
      cursor: pointer;

      &.active {
        width: 18px;
        background: white;
      }
    }
  }
}

.category-section {
  padding: 8px 16px 16px;
  background: var(--bg-card);

  .category-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
  }

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    .category-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: var(--bg-warm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      transition: transform 0.2s ease;
    }

    span {
      font-size: 11px;
      color: var(--text-secondary);
    }

    &:active .category-icon {
      transform: scale(0.92);
    }
  }
}

.section {
  padding: 20px 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text);
    }

    .section-more {
      font-size: 13px;
      color: var(--text-muted);
      cursor: pointer;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;

      span {
        padding: 4px 12px;
        border-radius: 100px;
        font-size: 12px;
        color: var(--text-secondary);
        background: var(--bg-warm);
        cursor: pointer;
        transition: all 0.2s ease;

        &.active {
          background: var(--primary);
          color: white;
        }
      }
    }
  }
}

.hot-section {
  background: var(--bg-card);
  margin-top: 8px;

  .hot-scroll {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
    scroll-snap-type: x mandatory;
  }

  .hot-card {
    flex-shrink: 0;
    width: 140px;
    scroll-snap-align: start;
    cursor: pointer;

    .hot-image {
      width: 140px;
      height: 140px;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 8px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
    }

    &:active .hot-image img {
      transform: scale(1.05);
    }

    h4 {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .hot-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .hot-price {
      display: flex;
      align-items: center;
      gap: 6px;

      .price {
        font-size: 15px;
      }
    }
  }
}

.waterfall-section {
  background: var(--bg-card);
  margin-top: 8px;
  padding-bottom: 30px;

  .waterfall {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .waterfall-col {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &:nth-child(2) {
      margin-top: 20px;
    }
  }
}

.product-card {
  background: var(--bg);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:active {
    transform: scale(0.97);
  }

  .product-image {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
  }

  &:hover .product-image img {
    transform: scale(1.05);
  }

  .product-tags {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    gap: 4px;
  }

  .product-info {
    padding: 10px;

    .product-name {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      margin-bottom: 2px;
    }

    .product-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .product-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .price {
        font-size: 15px;
      }

      .product-sales {
        font-size: 11px;
        color: var(--text-muted);
      }
    }
  }
}
</style>
