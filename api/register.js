/**
 * POST /api/register
 * Chamado pela mk20-loja após confirmar pagamento.
 * Registra a chave no banco de ativação.
 */
const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Autenticação por secret compartilhado
  const secret = req.headers['x-secret']
  if (!secret || secret !== process.env.LICENSE_SERVER_SECRET) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const { order_id, email, license_key, max_activations, expires_at } = req.body || {}

  if (!order_id || !email || !license_key || !expires_at) {
    return res.status(400).json({ error: 'order_id, email, license_key e expires_at são obrigatórios' })
  }

  // Idempotência — ignora duplicatas
  const existing = await query('SELECT id FROM licenses WHERE license_key = $1', [license_key])
  if (existing.rows.length > 0) {
    return res.status(200).json({ ok: true, duplicate: true })
  }

  await query(
    `INSERT INTO licenses (order_id, email, license_key, variant_id, max_activations, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [order_id, email, license_key, 'mk20-loja', max_activations ?? 3, new Date(expires_at)]
  )

  return res.status(200).json({ ok: true })
}
