import { Router } from 'express'
import { getDb } from '../config/database.js'
import { success } from '../utils/response.js'

const router = Router()

router.get('/', async (req, res) => {
  const db = getDb()
  const categories = await db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
  success(res, categories)
})

export default router
