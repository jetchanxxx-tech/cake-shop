import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../config/database.js'
import { adminAuthMiddleware, generateAdminToken } from '../middleware/adminAuth.js'
import { success, error } from '../utils/response.js'

const router = Router()

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return error(res, '用户名和密码不能为空', 400, 400)

    const db = getDb()
    const admin = await db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
    if (!admin) return error(res, '用户名或密码错误', 400, 400)

    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) return error(res, '用户名或密码错误', 400, 400)

    const token = generateAdminToken(admin.id, admin.username)
    success(res, {
      token,
      admin: { id: admin.id, username: admin.username, nickname: admin.nickname }
    }, '登录成功')
  } catch (err) {
    error(res, err.message)
  }
})

// Get dashboard stats
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)

    const totalUsers = (await db.prepare('SELECT COUNT(*) as count FROM users').get()).count
    const totalOrders = (await db.prepare('SELECT COUNT(*) as count FROM orders').get()).count
    const totalProducts = (await db.prepare('SELECT COUNT(*) as count FROM products').get()).count
    const totalSales = (await db.prepare("SELECT COALESCE(SUM(pay_amount), 0) as total FROM orders WHERE status != 'cancelled'").get()).total

    const todayOrders = (await db.prepare('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?').get(today)).count
    const todaySales = (await db.prepare("SELECT COALESCE(SUM(pay_amount), 0) as total FROM orders WHERE DATE(created_at) = ? AND status != 'cancelled'").get(today)).total

    const pendingOrders = (await db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get()).count
    const paidOrders = (await db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'paid'").get()).count

    // Recent 7 days sales
    const salesTrend = await db.prepare(`
      SELECT DATE(created_at) as date, COALESCE(SUM(pay_amount), 0) as total
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `).all()

    // Recent 10 orders
    const recentOrders = await db.prepare(`
      SELECT o.*, u.nickname as user_nickname
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all()

    for (const order of recentOrders) {
      try { order.address = JSON.parse(order.address) } catch { order.address = {} }
    }

    success(res, {
      totalUsers,
      totalOrders,
      totalProducts,
      totalSales,
      todayOrders,
      todaySales,
      pendingOrders,
      paidOrders,
      salesTrend,
      recentOrders
    })
  } catch (err) {
    error(res, err.message)
  }
})

// Get all orders (admin)
router.get('/orders', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const { status, keyword, page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize

    let countSql = 'SELECT COUNT(*) as count FROM orders WHERE 1=1'
    let sql = `
      SELECT o.*, u.nickname as user_nickname, u.phone as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      countSql += ' AND status = ?'
      sql += ' AND o.status = ?'
      params.push(status)
    }
    if (keyword) {
      countSql += ' AND (order_no LIKE ? OR address LIKE ?)'
      sql += ' AND (o.order_no LIKE ? OR o.address LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const { count } = await db.prepare(countSql).get(...params)
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?'

    const orders = await db.prepare(sql).all(...params, parseInt(pageSize), parseInt(offset))
    for (const order of orders) {
      order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
      try { order.address = JSON.parse(order.address) } catch { order.address = {} }
    }

    success(res, { list: orders, total: count, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (err) {
    error(res, err.message)
  }
})

// Get order detail (admin)
router.get('/orders/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const order = await db.prepare(`
      SELECT o.*, u.nickname as user_nickname, u.phone as user_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(req.params.id)

    if (!order) return error(res, '订单不存在', 404, 404)
    order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    try { order.address = JSON.parse(order.address) } catch { order.address = {} }
    success(res, order)
  } catch (err) {
    error(res, err.message)
  }
})

// Update order status (ship)
router.put('/orders/:id/status', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const { status } = req.body
    const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled']

    if (!validStatuses.includes(status)) {
      return error(res, '无效的状态', 400, 400)
    }

    await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id)
    success(res, null, '订单状态已更新')
  } catch (err) {
    error(res, err.message)
  }
})

// Get all products (admin)
router.get('/products', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const { keyword, categoryId, page = 1, pageSize = 20 } = req.query
    const offset = (page - 1) * pageSize

    let countSql = 'SELECT COUNT(*) as count FROM products WHERE 1=1'
    let sql = 'SELECT * FROM products WHERE 1=1'
    const params = []

    if (categoryId) {
      countSql += ' AND category_id = ?'
      sql += ' AND category_id = ?'
      params.push(categoryId)
    }
    if (keyword) {
      countSql += ' AND (name LIKE ? OR subtitle LIKE ?)'
      sql += ' AND (name LIKE ? OR subtitle LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const { count } = await db.prepare(countSql).get(...params)
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'

    const products = await db.prepare(sql).all(...params, parseInt(pageSize), parseInt(offset))
    products.forEach(p => {
      try { p.tags = JSON.parse(p.tags || '[]') } catch { p.tags = [] }
      try { p.specs = JSON.parse(p.specs || '[]') } catch { p.specs = [] }
      try { p.images = JSON.parse(p.images || '[]') } catch { p.images = [] }
    })

    success(res, { list: products, total: count, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (err) {
    error(res, err.message)
  }
})

// Get product detail (admin)
router.get('/products/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!product) return error(res, '商品不存在', 404, 404)
    try { product.tags = JSON.parse(product.tags || '[]') } catch { product.tags = [] }
    try { product.specs = JSON.parse(product.specs || '[]') } catch { product.specs = [] }
    try { product.images = JSON.parse(product.images || '[]') } catch { product.images = [] }
    success(res, product)
  } catch (err) {
    error(res, err.message)
  }
})

// Create product
router.post('/products', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const {
      name, subtitle, description, price, original_price,
      image, images, category_id, tags, specs, stock, is_hot, is_new
    } = req.body

    if (!name || !price) return error(res, '商品名称和价格不能为空', 400, 400)

    const result = await db.prepare(`
      INSERT INTO products (name, subtitle, description, price, original_price, image, images, category_id, tags, specs, stock, is_hot, is_new)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, subtitle || '', description || '', price, original_price || 0,
      image || '', JSON.stringify(images || []), category_id || null,
      JSON.stringify(tags || []), JSON.stringify(specs || []),
      stock || 999, is_hot ? 1 : 0, is_new ? 1 : 0
    )

    success(res, { id: result.lastInsertRowid }, '商品创建成功')
  } catch (err) {
    error(res, err.message)
  }
})

// Update product
router.put('/products/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const {
      name, subtitle, description, price, original_price,
      image, images, category_id, tags, specs, stock, is_hot, is_new
    } = req.body

    if (!name || !price) return error(res, '商品名称和价格不能为空', 400, 400)

    await db.prepare(`
      UPDATE products SET
        name = ?, subtitle = ?, description = ?, price = ?, original_price = ?,
        image = ?, images = ?, category_id = ?, tags = ?, specs = ?, stock = ?, is_hot = ?, is_new = ?
      WHERE id = ?
    `).run(
      name, subtitle || '', description || '', price, original_price || 0,
      image || '', JSON.stringify(images || []), category_id || null,
      JSON.stringify(tags || []), JSON.stringify(specs || []),
      stock || 999, is_hot ? 1 : 0, is_new ? 1 : 0, req.params.id
    )

    success(res, null, '商品更新成功')
  } catch (err) {
    error(res, err.message)
  }
})

// Delete product
router.delete('/products/:id', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    await db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
    success(res, null, '商品已删除')
  } catch (err) {
    error(res, err.message)
  }
})

// Get categories
router.get('/categories', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const categories = await db.prepare('SELECT * FROM categories ORDER BY sort_order').all()
    success(res, categories)
  } catch (err) {
    error(res, err.message)
  }
})

// Update admin password
router.put('/password', adminAuthMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return error(res, '旧密码和新密码不能为空', 400, 400)

    const admin = await db.prepare('SELECT * FROM admins WHERE id = ?').get(req.adminId)
    const valid = await bcrypt.compare(oldPassword, admin.password)
    if (!valid) return error(res, '旧密码错误', 400, 400)

    const hashed = await bcrypt.hash(newPassword, 10)
    await db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashed, req.adminId)
    success(res, null, '密码修改成功')
  } catch (err) {
    error(res, err.message)
  }
})

export default router
