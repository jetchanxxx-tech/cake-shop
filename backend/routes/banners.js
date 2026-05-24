import { Router } from 'express'
import { getDb } from '../config/database.js'
import { success } from '../utils/response.js'

const router = Router()

router.get('/', async (req, res) => {
  const db = getDb()
  const banners = await db.prepare('SELECT * FROM banners ORDER BY sort_order').all()
  success(res, banners)
})

export default router
