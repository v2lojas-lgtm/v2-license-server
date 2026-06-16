/**
 * POST /api/register-email
 * Chamado pela mk20-loja após confirmar pagamento (ou em cada renovação).
 * Cria ou atualiza o acesso por e-mail — sem chave de licença.
 */
const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secret = req.headers['x-secret']
  if (!secret || secret !== process.env.LICENSE_SERVER_SECRET) {
    return res.status(401).json({ error: 'Não autorizado' })
  }

  const { order_id, email, max_activations, expires_at } = req.body || {}

  if (!email || !expires_at) {
    return res.status(400).json({ error: 'email e expires_at são obrigatórios' })
  }

  await query(
    `INSERT INTO email_licenses (email, order_id, max_activations, expires_at, is_active, updated_at)
     VALUES ($1, $2, $3, $4, TRUE, NOW())
     ON CONFLICT (email) DO UPDATE SET
       order_id = EXCLUDED.order_id,
       max_activations = EXCLUDED.max_activations,
       expires_at = EXCLUDED.expires_at,
       is_active = TRUE,
       updated_at = NOW()`,
    [email, order_id ?? null, max_activations ?? 3, new Date(expires_at)]
  )

  return res.status(200).json({ ok: true })
}
