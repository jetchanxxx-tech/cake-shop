import { Router } from 'express'
import { getDb } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'
import { success, error } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

function generateOrderNo() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `${date}${random}`
}

router.post('/', (req, res) => {
  const db = getDb()
  const { items, address, remark, couponId } = req.body
  if (!items || !items.length) return error(res, '订单商品不能为空', 400, 400)

  let totalAmount = 0
  for (const item of items) {
    totalAmount += item.price * item.quantity
  }

  let discountAmount = 0
  if (couponId) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(couponId)
    if (coupon && totalAmount >= (coupon.min_amount || 0)) {
      if (coupon.type === 'amount') discountAmount = coupon.value
      else if (coupon.type === 'percent') discountAmount = totalAmount * (1 - coupon.value)
    }
  }

  const payAmount = Math.max(0, totalAmount - discountAmount)
  const orderNo = generateOrderNo()

  const orderResult = db.prepare(
    'INSERT INTO orders (user_id, order_no, total_amount, discount_amount, pay_amount, remark, address, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    req.userId, orderNo, totalAmount, discountAmount, payAmount, remark || '',
    JSON.stringify(address), address.name, address.phone
  )

  const orderId = orderResult.lastInsertRowid
  const itemStmt = db.prepare(
    'INSERT INTO order_items (order_id, product_id, product_name, product_image, spec_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (const item of items) {
    itemStmt.run(orderId, item.productId, item.productName, item.productImage, item.specName, item.price, item.quantity)
  }

  if (couponId) {
    db.prepare('UPDATE user_coupons SET status = "used", used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND coupon_id = ?').run(req.userId, couponId)
  }

  db.prepare('DELETE FROM carts WHERE user_id = ? AND selected = 1').run(req.userId)

  success(res, { orderId, orderNo, payAmount }, '下单成功')
})

router.get('/', (req, res) => {
  const db = getDb()
  const { status } = req.query
  let sql = 'SELECT * FROM orders WHERE user_id = ?'
  const params = [req.userId]
  if (status) { sql += ' AND status = ?'; params.push(status) }
  sql += ' ORDER BY created_at DESC'
  const orders = db.prepare(sql).all(...params)

  for (const order of orders) {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    try { order.address = JSON.parse(order.address) } catch { order.address = {} }
  }
  success(res, orders)
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!order) return error(res, '订单不存在', 404, 404)
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
  try { order.address = JSON.parse(order.address) } catch { order.address = {} }
  success(res, order)
})

router.put('/:id/cancel', (req, res) => {
  const db = getDb()
  db.prepare('UPDATE orders SET status = "cancelled" WHERE id = ? AND user_id = ? AND status = "pending"').run(req.params.id, req.userId)
  success(res, null, '已取消订单')
})

export default router
