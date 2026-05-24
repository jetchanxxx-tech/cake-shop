import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mio-bakery-secret-key-2026'

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}
