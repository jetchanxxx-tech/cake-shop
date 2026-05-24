<template>
  <div class="page-container favorites-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1>我的收藏</h1>
    </header>

    <div class="favorites-grid">
      <div
        v-for="product in favorites"
        :key="product.id"
        class="fav-item"
        @click="$router.push(`/product/${product.id}`)">
        <div class="fav-image">
          <img :src="product.image" :alt="product.name" loading="lazy">
          <button class="fav-remove" @click.stop="remove(product.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="fav-info">
          <h4 class="ellipsis">{{ product.name }}</h4>
          <p class="ellipsis">{{ product.subtitle }}</p>
          <span class="price">{{ product.price }}</span>
        </div>
      </div>
    </div>

    <div v-if="favorites.length === 0" class="empty-state">
      <span class="empty-icon">❤️</span>
      <span class="empty-text">暂无收藏</span>
      <button class="btn btn-primary" style="margin-top: 20px" @click="$router.push('/home')">去逛逛</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFavorites, removeFavorite } from '@/api'

const favorites = ref([])

async function loadData() {
  const res = await getFavorites()
  favorites.value = res.data || []
}

async function remove(id) {
  await removeFavorite(id)
  loadData()
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.favorites-page {
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

.favorites-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px;
}

.fav-item {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;

  .fav-image {
    position: relative;
    aspect-ratio: 1;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .fav-remove {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.4);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  }

  .fav-info {
    padding: 10px;

    h4 {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    p {
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .price {
      font-size: 15px;
      font-weight: 600;
    }
  }
}
</style>
