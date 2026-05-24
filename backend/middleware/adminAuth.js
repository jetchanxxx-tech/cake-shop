import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'mio-bakery-secret-key-2026'

export function adminAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录管理后台' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限访问' })
    }
    req.adminId = decoded.adminId
    req.adminUsername = decoded.username
    next()
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
}

export function generateAdminToken(adminId, username) {
  return jwt.sign({ adminId, username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' })
}
