<template>
  <div class="page-container addresses-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1>收货地址</h1>
    </header>

    <div class="address-list">
      <div v-for="addr in addresses" :key="addr.id" class="address-card">
        <div class="address-main">
          <div class="address-top">
            <span class="name">{{ addr.name }}</span>
            <span class="phone">{{ addr.phone }}</span>
            <span v-if="addr.is_default" class="default-badge">默认</span>
          </div>
          <p class="address-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
        </div>
        <div class="address-actions">
          <button v-if="!addr.is_default" class="action-btn" @click="setDefault(addr.id)">设为默认</button>
          <button class="action-btn delete" @click="removeAddress(addr.id)">删除</button>
        </div>
      </div>

      <div v-if="addresses.length === 0" class="empty-state">
        <span class="empty-icon">📍</span>
        <span class="empty-text">暂无收货地址</span>
      </div>
    </div>

    <button class="btn btn-primary add-btn" @click="showForm = true">+ 新建地址</button>

    <!-- 添加地址弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="address-form-modal">
        <div class="form-title">新建地址</div>
        <div class="form-group">
          <label>收货人</label>
          <input v-model="form.name" placeholder="请输入收货人姓名">
        </div>
        <div class="form-group">
          <label>手机号</label>
          <input v-model="form.phone" placeholder="请输入手机号" maxlength="11">
        </div>
        <div class="form-group">
          <label>详细地址</label>
          <input v-model="form.detail" placeholder="请输入详细地址">
        </div>
        <div class="form-group checkbox-group">
          <input id="default" v-model="form.isDefault" type="checkbox">
          <label for="default">设为默认地址</label>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 10px" @click="submitAddress">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '@/api'

const addresses = ref([])
const showForm = ref(false)
const form = reactive({ name: '', phone: '', detail: '', isDefault: false })

async function loadData() {
  const res = await getAddresses()
  addresses.value = res.data || []
}

async function submitAddress() {
  if (!form.name || !form.phone || !form.detail) {
    alert('请填写完整信息')
    return
  }
  await addAddress({
    name: form.name,
    phone: form.phone,
    detail: form.detail,
    isDefault: form.isDefault
  })
  form.name = ''
  form.phone = ''
  form.detail = ''
  form.isDefault = false
  showForm.value = false
  loadData()
}

async function setDefault(id) {
  await setDefaultAddress(id)
  loadData()
}

async function removeAddress(id) {
  if (!confirm('确定删除该地址？')) return
  await deleteAddress(id)
  loadData()
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.addresses-page {
  background: var(--bg);
  padding-bottom: 80px;
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

.address-list {
  padding: 12px;
}

.address-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 10px;

  .address-main {
    margin-bottom: 10px;

    .address-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .name {
        font-size: 15px;
        font-weight: 600;
      }

      .phone {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .default-badge {
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

  .address-actions {
    display: flex;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);

    .action-btn {
      padding: 6px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg);
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;

      &.delete {
        color: var(--accent);
        border-color: rgba(232, 106, 106, 0.3);
      }
    }
  }
}

.add-btn {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 398px;
  padding: 14px;
  font-size: 15px;
}

.address-form-modal {
  background: var(--bg-card);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  width: 100%;
  max-width: 430px;
  animation: slideUp 0.3s ease;

  .form-title {
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 16px;
  }

  .form-group {
    margin-bottom: 14px;

    label {
      display: block;
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 14px;
      background: var(--bg);
      color: var(--text);
      outline: none;

      &:focus {
        border-color: var(--primary);
      }
    }

    &.checkbox-group {
      display: flex;
      align-items: center;
      gap: 8px;

      input {
        width: auto;
      }

      label {
        margin-bottom: 0;
      }
    }
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
