import { Router } from 'express'
import { getDb } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'
import { success, error } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  const db = getDb()
  const items = await db.prepare(`
    SELECT c.*, p.name as product_name, p.image as product_image, p.price as product_price, p.specs
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.userId)

  items.forEach(item => {
    item.price = item.product_price
    try {
      const specs = JSON.parse(item.specs || '[]')
      const spec = specs.find(s => String(s.name) === String(item.sku_id))
      if (spec) item.price = spec.price
    } catch {}
  })
  success(res, items)
})

router.post('/', async (req, res) => {
  const { productId, skuId, quantity } = req.body
  const db = getDb()
  const existing = await db.prepare(
    'SELECT id, quantity FROM carts WHERE user_id = ? AND product_id = ? AND sku_id = ?'
  ).get(req.userId, productId, skuId)
  if (existing) {
    await db.prepare('UPDATE carts SET quantity = ? WHERE id = ?').run(existing.quantity + quantity, existing.id)
  } else {
    await db.prepare(
      'INSERT INTO carts (user_id, product_id, sku_id, quantity) VALUES (?, ?, ?, ?)'
    ).run(req.userId, productId, skuId, quantity)
  }
  success(res, null, '已加入购物车')
})

router.put('/:id', async (req, res) => {
  const { quantity, selected } = req.body
  const db = getDb()
  const updates = []
  const params = []
  if (quantity !== undefined) { updates.push('quantity = ?'); params.push(quantity) }
  if (selected !== undefined) { updates.push('selected = ?'); params.push(selected ? 1 : 0) }
  params.push(req.params.id)
  params.push(req.userId)
  await db.prepare(`UPDATE carts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params)
  success(res, null, '更新成功')
})

router.delete('/:id', async (req, res) => {
  const db = getDb()
  await db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  success(res, null, '已删除')
})

export default router
