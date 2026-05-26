const crypto = require('crypto')

function generateLicenseKey() {
  const segments = Array.from({ length: 4 }, () =>
    crypto.randomBytes(3).toString('hex').toUpperCase()
  )
  return `V2GO-${segments.join('-')}`
}

function getMaxActivations(variantId) {
  const id = String(variantId)
  if (id === process.env.LEMONSQUEEZY_VARIANT_3PCS) return 3
  return 1
}

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(rawBody)
  const digest = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

module.exports = { generateLicenseKey, getMaxActivations, verifyWebhookSignature }
