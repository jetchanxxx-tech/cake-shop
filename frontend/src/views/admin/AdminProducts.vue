<template>
  <div class="admin-products">
    <div class="page-header">
      <h2 class="page-title">商品管理</h2>
      <button class="btn-primary" @click="openEdit()">+ 新增商品</button>
    </div>

    <div class="filter-bar">
      <input v-model="filter.keyword" placeholder="搜索商品名称" @keyup.enter="fetchProducts" />
      <select v-model="filter.categoryId" @change="fetchProducts">
        <option value="">全部分类</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <button class="btn-search" @click="fetchProducts">搜索</button>
    </div>

    <div class="panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>商品</th>
            <th>分类</th>
            <th>价格</th>
            <th>库存</th>
            <th>销量</th>
            <th>标签</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.id }}</td>
            <td>
              <div class="product-cell">
                <img :src="p.image" class="thumb" />
                <div>
                  <div class="name">{{ p.name }}</div>
                  <div class="sub">{{ p.subtitle }}</div>
                </div>
              </div>
            </td>
            <td>{{ categoryName(p.category_id) }}</td>
            <td>¥{{ p.price }}</td>
            <td>{{ p.stock }}</td>
            <td>{{ p.sales }}</td>
            <td>
              <span v-for="tag in p.tags" :key="tag" class="tag">{{ tag }}</span>
            </td>
            <td>
              <button class="btn-text" @click="openEdit(p)">编辑</button>
              <button class="btn-text danger" @click="handleDelete(p.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button :disabled="page <= 1" @click="page--; fetchProducts()">上一页</button>
        <span>第 {{ page }} 页</span>
        <button :disabled="products.length < pageSize" @click="page++; fetchProducts()">下一页</button>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editing.id ? '编辑商品' : '新增商品' }}</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>商品名称 *</label>
            <input v-model="editing.name" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="editing.category_id">
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格 *</label>
            <input v-model.number="editing.price" type="number" />
          </div>
          <div class="form-group">
            <label>原价</label>
            <input v-model.number="editing.original_price" type="number" />
          </div>
          <div class="form-group full">
            <label>副标题</label>
            <input v-model="editing.subtitle" />
          </div>
          <div class="form-group full">
            <label>描述</label>
            <textarea v-model="editing.description" rows="3" />
          </div>
          <div class="form-group full">
            <label>封面图片URL</label>
            <input v-model="editing.image" />
          </div>
          <div class="form-group">
            <label>库存</label>
            <input v-model.number="editing.stock" type="number" />
          </div>
          <div class="form-group check-group">
            <label><input v-model="editing.is_hot" type="checkbox" /> 热销</label>
            <label><input v-model="editing.is_new" type="checkbox" /> 新品</label>
          </div>
          <div class="form-group full">
            <label>规格 JSON</label>
            <textarea v-model="specsText" rows="3" placeholder='[{"name":"6寸","price":168}]' />
          </div>
          <div class="form-group full">
            <label>标签 JSON</label>
            <input v-model="tagsText" placeholder='["热销","新品"]' />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" :disabled="saving" @click="handleSave">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'

const adminStore = useAdminStore()
const products = ref([])
const categories = ref([])
const page = ref(1)
const pageSize = 10
const filter = reactive({ keyword: '', categoryId: '' })
const showModal = ref(false)
const saving = ref(false)

const editing = reactive({
  id: null, name: '', subtitle: '', description: '', price: 0, original_price: 0,
  image: '', category_id: null, stock: 999, is_hot: false, is_new: false,
  specs: [], tags: []
})

const specsText = computed({
  get: () => JSON.stringify(editing.specs || []),
  set: v => { try { editing.specs = JSON.parse(v) } catch {} }
})
const tagsText = computed({
  get: () => JSON.stringify(editing.tags || []),
  set: v => { try { editing.tags = JSON.parse(v) } catch {} }
})

const categoryName = cid => categories.value.find(c => c.id === cid)?.name || '-'

const fetchProducts = async () => {
  const res = await adminStore.getProducts({
    keyword: filter.keyword,
    categoryId: filter.categoryId,
    page: page.value,
    pageSize
  })
  products.value = res.data.list
}

const fetchCategories = async () => {
  const res = await adminStore.getCategories()
  categories.value = res.data
}

const openEdit = (product = null) => {
  if (product) {
    Object.assign(editing, {
      ...product,
      specs: product.specs || [],
      tags: product.tags || []
    })
  } else {
    Object.assign(editing, {
      id: null, name: '', subtitle: '', description: '', price: 0, original_price: 0,
      image: '', category_id: categories.value[0]?.id || null, stock: 999, is_hot: false, is_new: false,
      specs: [], tags: []
    })
  }
  showModal.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    const payload = { ...editing }
    if (editing.id) {
      await adminStore.updateProduct(editing.id, payload)
    } else {
      await adminStore.createProduct(payload)
    }
    showModal.value = false
    fetchProducts()
  } catch (err) {
    alert(err.message)
  } finally {
    saving.value = false
  }
}

const handleDelete = async id => {
  if (!confirm('确定删除该商品？')) return
  try {
    await adminStore.deleteProduct(id)
    fetchProducts()
  } catch (err) {
    alert(err.message)
  }
}

onMounted(() => {
  fetchCategories().then(fetchProducts)
})
</script>

<style lang="scss" scoped>
.admin-products {
  max-width: 1200px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
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
  input { width: 220px; }
}
.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #d4a574;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #c49768; }
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
.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  .thumb {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
  }
  .name { font-size: 13px; font-weight: 500; color: #333; }
  .sub { font-size: 11px; color: #999; margin-top: 2px; }
}
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background: #fdf3e7;
  color: #d4a574;
  font-size: 11px;
  margin-right: 4px;
}
.btn-text {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: #d4a574;
  font-size: 12px;
  cursor: pointer;
  &.danger { color: #e74c3c; }
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
  width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #333;
  }
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.form-group {
  display: flex;
  flex-direction: column;
  &.full { grid-column: span 2; }
  label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }
  input, select, textarea {
    padding: 8px 10px;
    border: 1px solid #e8e0d8;
    border-radius: 8px;
    font-size: 13px;
    background: #fdfbf9;
    &:focus { outline: none; border-color: #d4a574; }
  }
}
.check-group {
  flex-direction: row;
  gap: 20px;
  align-items: center;
  label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 13px;
  }
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.btn-secondary {
  padding: 10px 20px;
  border: 1px solid #e8e0d8;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}
</style>
