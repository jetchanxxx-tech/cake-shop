import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../config/database.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'
import { success, error } from '../utils/response.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body
    if (!phone || !password) return error(res, '手机号和密码不能为空', 400, 400)

    const db = getDb()
    const exists = await db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
    if (exists) return error(res, '该手机号已注册', 400, 400)

    const hashed = await bcrypt.hash(password, 10)
    const result = await db.prepare('INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)').run(phone, hashed, nickname || `用户${phone.slice(-4)}`)

    const token = generateToken(result.lastInsertRowid)
    success(res, { token, user: { id: result.lastInsertRowid, phone, nickname: nickname || `用户${phone.slice(-4)}` } }, '注册成功')
  } catch (err) {
    error(res, err.message)
  }
})

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) return error(res, '手机号和密码不能为空', 400, 400)

    const db = getDb()
    const user = await db.prepare('SELECT * FROM users WHERE phone = ?').get(phone)
    if (!user) return error(res, '手机号或密码错误', 400, 400)

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return error(res, '手机号或密码错误', 400, 400)

    const token = generateToken(user.id)
    success(res, {
      token,
      user: { id: user.id, phone: user.phone, nickname: user.nickname, avatar: user.avatar, openid: user.openid }
    }, '登录成功')
  } catch (err) {
    error(res, err.message)
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const user = await db.prepare('SELECT id, phone, nickname, avatar, openid FROM users WHERE id = ?').get(req.userId)
    if (!user) return error(res, '用户不存在', 404, 404)
    success(res, user)
  } catch (err) {
    error(res, err.message)
  }
})

export default router
