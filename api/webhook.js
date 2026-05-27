const { generateLicenseKey, verifyKiwifyToken } = require('../lib/license')
const { query } = require('../lib/db')
const { sendLicenseEmail } = require('../lib/mailer')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  let event
  try {
    event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  // Verify Kiwify token
  if (!verifyKiwifyToken(event.token)) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Only process approved orders
  if (event.event !== 'order.approved') {
    return res.status(200).json({ received: true })
  }

  const purchase = event.data?.purchase
  const email    = purchase?.customer?.email
  const orderId  = String(purchase?.id || '')
  const price    = purchase?.offer?.price ?? purchase?.product?.price ?? 0

  if (!email || !orderId) {
    return res.status(400).json({ error: 'Missing order data' })
  }

  // Idempotency — ignore duplicates
  const existing = await query('SELECT id FROM licenses WHERE order_id = $1', [orderId])
  if (existing.rows.length > 0) {
    return res.status(200).json({ received: true })
  }

  // 3 PCs if price >= R$89,90 (8990 centavos), else 1 PC
  const maxActivations = price >= 8990 ? 3 : 1

  const licenseKey = generateLicenseKey()
  const expiresAt  = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  await query(
    `INSERT INTO licenses (order_id, email, license_key, variant_id, max_activations, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orderId, email, licenseKey, String(price), maxActivations, expiresAt]
  )

  await sendLicenseEmail({ to: email, licenseKey, maxActivations, expiresAt })

  return res.status(200).json({ received: true })
}
