import crypto from 'crypto'
import { WECHAT_PAY_CONFIG } from '../config/wechat.js'

const BASE_URL = 'https://api.mch.weixin.qq.com'

function getTimestamp() {
  return Math.floor(Date.now() / 1000).toString()
}

function getNonceStr(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length)
}

function sign(method, urlPath, timestamp, nonceStr, body) {
  const bodyStr = body ? JSON.stringify(body) : ''
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message)
  return sign.sign(WECHAT_PAY_CONFIG.privateKey, 'base64')
}

function buildAuthHeader(method, urlPath, body) {
  const timestamp = getTimestamp()
  const nonceStr = getNonceStr()
  const signature = sign(method, urlPath, timestamp, nonceStr, body)
  return `WECHATPAY2-SHA256-RSA2048 mchid="${WECHAT_PAY_CONFIG.mchid}",serial_no="${WECHAT_PAY_CONFIG.serialNo}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`
}

export async function wechatRequest(method, urlPath, body = null) {
  const url = `${BASE_URL}${urlPath}`
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': buildAuthHeader(method, urlPath, body),
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = text }

  if (!res.ok) {
    const errMsg = data?.message || data || `HTTP ${res.status}`
    throw new Error(errMsg)
  }
  return data
}

// H5 统一下单
export function createH5Order(orderNo, description, amount, clientIp) {
  const body = {
    mchid: WECHAT_PAY_CONFIG.mchid,
    out_trade_no: orderNo,
    appid: WECHAT_PAY_CONFIG.appid,
    description,
    notify_url: WECHAT_PAY_CONFIG.notifyUrl,
    amount: {
      total: Math.round(amount * 100),
      currency: 'CNY',
    },
    scene_info: {
      payer_client_ip: clientIp,
      h5_info: {
        type: WECHAT_PAY_CONFIG.h5SceneType,
        wap_url: WECHAT_PAY_CONFIG.h5WapUrl,
        wap_name: WECHAT_PAY_CONFIG.h5WapName,
      },
    },
  }
  return wechatRequest('POST', '/v3/pay/transactions/h5', body)
}

// JSAPI 统一下单
export function createJsapiOrder(orderNo, description, amount, openid, clientIp) {
  const body = {
    mchid: WECHAT_PAY_CONFIG.mchid,
    out_trade_no: orderNo,
    appid: WECHAT_PAY_CONFIG.appid,
    description,
    notify_url: WECHAT_PAY_CONFIG.notifyUrl,
    amount: {
      total: Math.round(amount * 100),
      currency: 'CNY',
    },
    payer: {
      openid,
    },
    scene_info: {
      payer_client_ip: clientIp,
    },
  }
  return wechatRequest('POST', '/v3/pay/transactions/jsapi', body)
}

// 查询订单
export function queryOrder(orderNo) {
  const urlPath = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${WECHAT_PAY_CONFIG.mchid}`
  return wechatRequest('GET', urlPath)
}

// 构建JSAPI调起支付参数
export function buildJsapiPayParams(prepayId) {
  const timestamp = getTimestamp()
  const nonceStr = getNonceStr()
  const packageStr = `prepay_id=${prepayId}`
  const message = `${WECHAT_PAY_CONFIG.appid}\n${timestamp}\n${nonceStr}\n${packageStr}\n`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(message)
  const paySign = sign.sign(WECHAT_PAY_CONFIG.privateKey, 'base64')

  return {
    appId: WECHAT_PAY_CONFIG.appid,
    timeStamp: timestamp,
    nonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign,
  }
}

export function decryptNotifyResource(resource) {
  const apiKey = WECHAT_PAY_CONFIG.apiKey
  if (!apiKey || apiKey.length !== 32) throw new Error('APIv3密钥未配置或长度不正确')
  if (!resource?.ciphertext || !resource?.nonce) return null

  const key = Buffer.from(apiKey, 'utf8')
  const nonce = Buffer.from(resource.nonce, 'utf8')
  const associatedData = resource.associated_data ? Buffer.from(resource.associated_data, 'utf8') : null
  const cipherBuf = Buffer.from(resource.ciphertext, 'base64')
  if (cipherBuf.length <= 16) throw new Error('通知数据格式错误')

  const authTag = cipherBuf.subarray(cipherBuf.length - 16)
  const data = cipherBuf.subarray(0, cipherBuf.length - 16)

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce)
  if (associatedData) decipher.setAAD(associatedData)
  decipher.setAuthTag(authTag)
  const decoded = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  return JSON.parse(decoded)
}

// 简单验签（回调通知）- 需要微信平台证书公钥，此处简化处理
export function verifyNotify(headers, body) {
  // 生产环境应从微信支付平台下载证书并验签
  // 此处仅做格式校验，实际部署后建议接入完整验签逻辑
  return !!(headers['wechatpay-serial'] && headers['wechatpay-signature'])
}
