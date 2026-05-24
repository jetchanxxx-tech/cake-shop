import { Router } from 'express'
import { getDb } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'
import { success } from '../utils/response.js'

const router = Router()

router.get('/coupons', async (req, res) => {
  const db = getDb()
  const coupons = await db.prepare('SELECT * FROM coupons WHERE end_date >= CURDATE() ORDER BY created_at DESC').all()
  success(res, coupons)
})

router.get('/user-coupons', authMiddleware, async (req, res) => {
  const db = getDb()
  const items = await db.prepare(`
    SELECT uc.*, c.name, c.type, c.value, c.min_amount, c.end_date
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    WHERE uc.user_id = ? AND uc.status = 'unused' AND c.end_date >= CURDATE()
    ORDER BY c.value DESC
  `).all(req.userId)
  success(res, items)
})

router.post('/user-coupons/:couponId', authMiddleware, async (req, res) => {
  const db = getDb()
  const coupon = await db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.couponId)
  if (!coupon) return res.status(404).json({ code: 404, message: '优惠券不存在' })
  if (coupon.total > 0 && coupon.used >= coupon.total) return res.status(400).json({ code: 400, message: '优惠券已领完' })

  await db.prepare('INSERT IGNORE INTO user_coupons (user_id, coupon_id) VALUES (?, ?)').run(req.userId, req.params.couponId)
  await db.prepare('UPDATE coupons SET used = used + 1 WHERE id = ?').run(req.params.couponId)
  success(res, null, '领取成功')
})

export default router
