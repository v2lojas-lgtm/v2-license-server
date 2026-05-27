const crypto = require('crypto')

function generateLicenseKey() {
  const segments = Array.from({ length: 4 }, () =>
    crypto.randomBytes(3).toString('hex').toUpperCase()
  )
  return `V2GO-${segments.join('-')}`
}

function verifyKiwifyToken(token) {
  if (!token) return false
  return token === process.env.KIWIFY_WEBHOOK_TOKEN
}

module.exports = { generateLicenseKey, verifyKiwifyToken }
