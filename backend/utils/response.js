export function success(res, data = null, message = 'success') {
  res.json({ code: 200, message, data })
}

export function error(res, message = 'error', code = 500, status = 500) {
  res.status(status).json({ code, message, data: null })
}
