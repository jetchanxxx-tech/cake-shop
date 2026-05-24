import { Router } from 'express'
import { getDb } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'
import { success } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const db = getDb()
  const items = db.prepare(`
    SELECT p.*, f.created_at as fav_time FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.userId)
  items.forEach(p => {
    try { p.tags = JSON.parse(p.tags || '[]') } catch { p.tags = [] }
    try { p.specs = JSON.parse(p.specs || '[]') } catch { p.specs = [] }
  })
  success(res, items)
})

router.post('/', (req, res) => {
  const { productId } = req.body
  const db = getDb()
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.userId, productId)
  success(res, null, '已收藏')
})

router.delete('/:productId', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.userId, req.params.productId)
  success(res, null, '已取消收藏')
})

export default router
