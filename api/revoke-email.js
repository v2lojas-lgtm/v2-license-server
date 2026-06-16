/**
 * POST /api/revoke-email
 * Chamado pela mk20-loja quando a assinatura é cancelada.
 */
const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = req.headers['x-secret']
  if (!secret || secret !== process.env.LICENSE_SERVER_SECRET) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const { email } = req.body || {}
  if (!email) {
    return res.status(400).json({ error: 'email é obrigatório' })
  }

  await query(
    `UPDATE email_licenses SET is_active = FALSE, updated_at = NOW() WHERE email = $1`,
    [email]
  )

  return res.status(200).json({ ok: true })
}
