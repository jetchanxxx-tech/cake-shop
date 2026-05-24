// 微信支付配置 - 请替换为真实商户信息
export const WECHAT_PAY_CONFIG = {
  // 商户号
  mchid: process.env.WECHAT_MCHID || '',
  // 公众号AppID（JSAPI支付需要 / OAuth也使用）
  appid: process.env.WECHAT_APPID || '',
  // 公众号AppSecret（用于 OAuth 换取 openid）
  appSecret: process.env.WECHAT_APPSECRET || '',
  // APIv3密钥
  apiKey: process.env.WECHAT_API_KEY || '',
  // 商户证书序列号
  serialNo: process.env.WECHAT_SERIAL_NO || '',
  // 商户证书私钥（PEM格式字符串）
  privateKey: process.env.WECHAT_PRIVATE_KEY || '',
  // 支付回调通知地址
  notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://47.120.20.10:3000/api/pay/notify',
  // H5支付场景类型
  h5SceneType: process.env.WECHAT_H5_SCENE || 'Wap',
  // H5支付WAP网站URL
  h5WapUrl: process.env.WECHAT_H5_WAP_URL || 'http://47.120.20.10:3000',
  // H5支付WAP网站名
  h5WapName: process.env.WECHAT_H5_WAP_NAME || 'Mio Bakery',
}

export function isWechatPayReady() {
  const c = WECHAT_PAY_CONFIG
  return !!(c.mchid && c.appid && c.apiKey && c.serialNo && c.privateKey)
}

export function isWechatOauthReady() {
  const c = WECHAT_PAY_CONFIG
  return !!(c.appid && c.appSecret)
}
