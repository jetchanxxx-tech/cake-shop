import { Router } from 'express'
import crypto from 'crypto'
import { getDb } from '../config/database.js'
import { authMiddleware } from '../middleware/auth.js'
import { success, error } from '../utils/response.js'
import { isWechatPayReady, isWechatOauthReady, WECHAT_PAY_CONFIG } from '../config/wechat.js'
import { createH5Order, createJsapiOrder, queryOrder, buildJsapiPayParams, verifyNotify, decryptNotifyResource } from '../utils/wechatPay.js'

const router = Router()

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection.remoteAddress
    || '127.0.0.1'
}

// 获取微信 OAuth 授权链接（用于 JSAPI 获取 openid）
router.post('/wechat/auth-url', authMiddleware, (req, res) => {
  try {
    if (!isWechatOauthReady()) {
      return error(res, '微信 OAuth 未配置，请联系管理员', 500, 500)
    }

    const { redirect } = req.body
    if (!redirect) return error(res, '缺少 redirect 参数', 400, 400)

    const db = getDb()
    const state = crypto.randomBytes(16).toString('hex')
    db.prepare('INSERT INTO wechat_oauth_states (state, user_id, redirect) VALUES (?, ?, ?)')
      .run(state, req.userId, redirect)

    const callbackUrl = `${WECHAT_PAY_CONFIG.h5WapUrl}/api/pay/wechat/callback`
    const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_PAY_CONFIG.appid}`
      + `&redirect_uri=${encodeURIComponent(callbackUrl)}`
      + `&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`

    success(res, { url }, '获取成功')
  } catch (err) {
    error(res, err.message)
  }
})

// 微信 OAuth 回调：用 code 换 openid，并绑定到当前登录用户
router.get('/wechat/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || !state) {
      res.status(400).send('Missing code/state')
      return
    }

    const db = getDb()
    const row = db.prepare('SELECT * FROM wechat_oauth_states WHERE state = ?').get(state)
    if (!row) {
      res.status(400).send('Invalid state')
      return
    }

    const tokenRes = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_PAY_CONFIG.appid}&secret=${WECHAT_PAY_CONFIG.appSecret}&code=${code}&grant_type=authorization_code`)
    const tokenJson = await tokenRes.json()
    const openid = tokenJson?.openid
    if (!openid) {
      res.status(500).send('Failed to get openid')
      return
    }

    db.prepare('UPDATE users SET openid = ? WHERE id = ?').run(openid, row.user_id)
    db.prepare('DELETE FROM wechat_oauth_states WHERE state = ?').run(state)

    const redirectUrl = new URL(row.redirect)
    redirectUrl.searchParams.set('wx_oauth', '1')
    res.redirect(redirectUrl.toString())
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// 创建支付订单
router.post('/create', authMiddleware, async (req, res) => {
  try {
    if (!isWechatPayReady()) {
      return error(res, '微信支付未配置，请联系管理员', 500, 500)
    }

    const db = getDb()
    const { orderId, payType } = req.body
    if (!orderId || !payType) {
      return error(res, '订单ID和支付方式不能为空', 400, 400)
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.userId)
    if (!order) return error(res, '订单不存在', 404, 404)
    if (order.status !== 'pending') return error(res, '订单状态不允许支付', 400, 400)

    const clientIp = getClientIp(req)
    let wechatResult = null
    let prepayId = null

    if (payType === 'wechat_h5') {
      wechatResult = await createH5Order(
        order.order_no,
        `Mio Bakery - 订单${order.order_no}`,
        order.pay_amount,
        clientIp
      )
      prepayId = wechatResult?.h5_url ? 'h5' : null
    } else if (payType === 'wechat_jsapi') {
      // openid 优先从订单/用户信息获取
      let openid = order.openid
      if (!openid) {
        const u = db.prepare('SELECT openid FROM users WHERE id = ?').get(req.userId)
        openid = u?.openid
      }
      if (!openid) return error(res, '未获取到openid，请在微信内打开并完成授权', 400, 400)

      wechatResult = await createJsapiOrder(
        order.order_no,
        `Mio Bakery - 订单${order.order_no}`,
        order.pay_amount,
        openid,
        clientIp
      )
      prepayId = wechatResult?.prepay_id

      db.prepare('UPDATE orders SET openid = ? WHERE id = ?').run(openid, orderId)
    } else {
      return error(res, '不支持的支付方式', 400, 400)
    }

    // 更新订单支付信息
    db.prepare('UPDATE orders SET pay_type = ?, prepay_id = ? WHERE id = ?')
      .run(payType, prepayId || null, orderId)

    // 构建返回参数
    const result = { payType, orderId }
    if (payType === 'wechat_h5') {
      result.h5Url = wechatResult.h5_url
    } else if (payType === 'wechat_jsapi' && prepayId) {
      result.jsapiParams = buildJsapiPayParams(prepayId)
    }

    success(res, result, '支付订单创建成功')
  } catch (err) {
    console.error('Pay create error:', err)
    error(res, err.message || '支付创建失败')
  }
})

// 查询订单支付状态
router.get('/query/:orderId', authMiddleware, async (req, res) => {
  try {
    const db = getDb()
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.orderId, req.userId)
    if (!order) return error(res, '订单不存在', 404, 404)

    let wechatStatus = null
    if (isWechatPayReady() && order.pay_type?.startsWith('wechat')) {
      try {
        const wxOrder = await queryOrder(order.order_no)
        wechatStatus = wxOrder?.trade_state
        const transactionId = wxOrder?.transaction_id

        if (order.status === 'pending' && wechatStatus === 'SUCCESS') {
          db.prepare('UPDATE orders SET status = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?')
            .run('paid', transactionId || null, order.id, 'pending')
        }
      } catch {
        // ignore
      }
    }

    const refreshed = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.orderId, req.userId)
    success(res, {
      orderId: refreshed.id,
      orderNo: refreshed.order_no,
      status: refreshed.status,
      payType: refreshed.pay_type,
      transactionId: refreshed.transaction_id,
      wechatStatus,
    })
  } catch (err) {
    error(res, err.message)
  }
})

// 微信支付回调通知
router.post('/notify', async (req, res) => {
  try {
    const { body, headers } = req
    console.log('Wechat notify:', JSON.stringify(body))

    // 简易验签（生产环境应完善）
    if (!verifyNotify(headers, body)) {
      return res.status(401).json({ code: 'FAIL', message: '验签失败' })
    }

    const notifyData = decryptNotifyResource(body?.resource)
    const outTradeNo = notifyData?.out_trade_no
    const transactionId = notifyData?.transaction_id
    const tradeState = notifyData?.trade_state

    if (outTradeNo && tradeState === 'SUCCESS') {
      const db = getDb()
      db.prepare('UPDATE orders SET status = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP WHERE order_no = ? AND status = ?')
        .run('paid', transactionId || null, outTradeNo, 'pending')
    }

    res.status(200).json({ code: 'SUCCESS', message: '成功' })
  } catch (err) {
    console.error('Notify error:', err)
    res.status(500).json({ code: 'FAIL', message: err.message })
  }
})

// 模拟支付（开发/测试用，未配置微信支付时可用）
router.post('/mock', authMiddleware, (req, res) => {
  try {
    const db = getDb()
    const { orderId } = req.body
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.userId)
    if (!order) return error(res, '订单不存在', 404, 404)
    if (order.status !== 'pending') return error(res, '订单状态不允许支付', 400, 400)

    db.prepare('UPDATE orders SET status = ?, pay_type = ?, transaction_id = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('paid', 'mock', `MOCK${Date.now()}`, orderId)

    success(res, { orderId, status: 'paid' }, '模拟支付成功')
  } catch (err) {
    error(res, err.message)
  }
})

export default router
