import request from './request'

// 认证
export const register = data => request.post('/auth/register', data)
export const login = data => request.post('/auth/login', data)
export const getProfile = () => request.get('/auth/me')

// 首页
export const getBanners = () => request.get('/banners')
export const getCategories = () => request.get('/categories')
export const getProducts = params => request.get('/products', { params })
export const getProductDetail = id => request.get(`/products/${id}`)

// 购物车
export const getCart = () => request.get('/cart')
export const addToCart = data => request.post('/cart', data)
export const updateCart = (id, data) => request.put(`/cart/${id}`, data)
export const removeFromCart = id => request.delete(`/cart/${id}`)
export const clearCart = () => request.delete('/cart')

// 订单
export const createOrder = data => request.post('/orders', data)
export const getOrders = params => request.get('/orders', { params })
export const getOrderDetail = id => request.get(`/orders/${id}`)
export const cancelOrder = id => request.put(`/orders/${id}/cancel`)

// 支付（微信JSAPI/H5）
export const createPayOrder = data => request.post('/pay/create', data)
export const queryPayOrder = orderId => request.get(`/pay/query/${orderId}`)
export const getWechatAuthUrl = redirect => request.post('/pay/wechat/auth-url', { redirect })

// 收藏
export const getFavorites = () => request.get('/favorites')
export const addFavorite = productId => request.post('/favorites', { productId })
export const removeFavorite = productId => request.delete(`/favorites/${productId}`)

// 优惠券
export const getCoupons = () => request.get('/coupons')
export const getUserCoupons = () => request.get('/user-coupons')

// 地址
export const getAddresses = () => request.get('/addresses')
export const addAddress = data => request.post('/addresses', data)
export const updateAddress = (id, data) => request.put(`/addresses/${id}`, data)
export const deleteAddress = id => request.delete(`/addresses/${id}`)
export const setDefaultAddress = id => request.put(`/addresses/${id}/default`)
