import { Router } from 'express'
import { getDb } from '../config/database.js'
import { success } from '../utils/response.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const db = getDb()
    const { categoryId, keyword, tag, sort = 'new' } = req.query
    let sql = 'SELECT * FROM products WHERE 1=1'
    const params = []

    if (categoryId) {
      sql += ' AND category_id = ?'
      params.push(categoryId)
    }
    if (keyword) {
      sql += ' AND (name LIKE ? OR subtitle LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (tag === 'hot') sql += ' AND is_hot = 1'
    if (tag === 'new') sql += ' AND is_new = 1'

    if (sort === 'price_asc') sql += ' ORDER BY price ASC'
    else if (sort === 'price_desc') sql += ' ORDER BY price DESC'
    else if (sort === 'sales') sql += ' ORDER BY sales DESC'
    else sql += ' ORDER BY is_new DESC, created_at DESC'

    const products = await db.prepare(sql).all(...params)
    products.forEach(p => {
      try { p.tags = JSON.parse(p.tags || '[]') } catch { p.tags = [] }
      try { p.specs = JSON.parse(p.specs || '[]') } catch { p.specs = [] }
      try { p.images = JSON.parse(p.images || '[]') } catch { p.images = [] }
    })
    success(res, products)
  } catch (err) {
    console.error(err)
    success(res, [])
  }
})

router.get('/:id', async (req, res) => {
  try {
    const db = getDb()
    const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!product) return res.status(404).json({ code: 404, message: '商品不存在' })
    try { product.tags = JSON.parse(product.tags || '[]') } catch { product.tags = [] }
    try { product.specs = JSON.parse(product.specs || '[]') } catch { product.specs = [] }
    try { product.images = JSON.parse(product.images || '[]') } catch { product.images = [] }
    success(res, product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 500, message: err.message })
  }
})

export default router
