import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCart, addToCart, updateCart, removeFromCart } from '@/api'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  const selectedItems = computed(() => items.value.filter(item => item.selected))
  const selectedPrice = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const fetchCart = async () => {
    loading.value = true
    try {
      const res = await getCart()
      items.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  const addItem = async (productId, skuId, quantity = 1) => {
    await addToCart({ productId, skuId, quantity })
    await fetchCart()
  }

  const updateItem = async (cartId, quantity, selected) => {
    await updateCart(cartId, { quantity, selected })
    await fetchCart()
  }

  const removeItem = async cartId => {
    await removeFromCart(cartId)
    await fetchCart()
  }

  return { items, loading, totalCount, totalPrice, selectedItems, selectedPrice, fetchCart, addItem, updateItem, removeItem }
})
