import { Router } from 'express'
import { getDb } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'
import { success, error } from '../utils/response.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  const db = getDb()
  const addresses = await db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.userId)
  success(res, addresses)
})

router.post('/', async (req, res) => {
  const { name, phone, province, city, district, detail, isDefault } = req.body
  const db = getDb()
  if (isDefault) {
    await db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.userId)
  }
  const result = await db.prepare(
    'INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, phone, province || '', city || '', district || '', detail, isDefault ? 1 : 0)
  success(res, { id: result.lastInsertRowid }, '添加成功')
})

router.put('/:id', async (req, res) => {
  const { name, phone, province, city, district, detail, isDefault } = req.body
  const db = getDb()
  if (isDefault) {
    await db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.userId)
  }
  await db.prepare(
    'UPDATE addresses SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, is_default = ? WHERE id = ? AND user_id = ?'
  ).run(name, phone, province || '', city || '', district || '', detail, isDefault ? 1 : 0, req.params.id, req.userId)
  success(res, null, '更新成功')
})

router.delete('/:id', async (req, res) => {
  const db = getDb()
  await db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  success(res, null, '删除成功')
})

router.put('/:id/default', async (req, res) => {
  const db = getDb()
  await db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.userId)
  await db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId)
  success(res, null, '已设为默认')
})

export default router
