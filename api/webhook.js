const { generateLicenseKey, getMaxActivations, verifyWebhookSignature } = require('../lib/license')
const { query } = require('../lib/db')
const { sendLicenseEmail } = require('../lib/mailer')

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const signature = req.headers['x-signature']

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event
  try {
    event = JSON.parse(rawBody.toString())
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  if (event.meta?.event_name !== 'order_created') {
    return res.status(200).json({ received: true })
  }

  const order = event.data?.attributes
  const orderId = String(event.data?.id)
  const email = order?.user_email
  const variantId = String(order?.first_order_item?.variant_id)

  if (!email || !orderId || !variantId) {
    return res.status(400).json({ error: 'Missing order data' })
  }

  // Idempotency — ignore duplicates
  const existing = await query('SELECT id FROM licenses WHERE order_id = $1', [orderId])
  if (existing.rows.length > 0) {
    return res.status(200).json({ received: true })
  }

  const licenseKey = generateLicenseKey()
  const maxActivations = getMaxActivations(variantId)
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  await query(
    `INSERT INTO licenses (order_id, email, license_key, variant_id, max_activations, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orderId, email, licenseKey, variantId, maxActivations, expiresAt]
  )

  await sendLicenseEmail({ to: email, licenseKey, maxActivations, expiresAt })

  return res.status(200).json({ received: true })
}
