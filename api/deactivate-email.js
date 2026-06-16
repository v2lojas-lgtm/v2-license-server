/**
 * POST /api/deactivate-email
 * Body: { email, machine_id }
 * Libera o slot de ativação desta máquina (usuário pediu pra trocar de PC).
 */
const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, machine_id } = req.body || {}

  if (!email || !machine_id) {
    return res.status(400).json({ ok: false, error: 'email e machine_id são obrigatórios' })
  }

  await query(
    `DELETE FROM activations
     WHERE machine_id = $2
       AND email_license_id = (SELECT id FROM email_licenses WHERE email = $1)`,
    [email, machine_id]
  )

  return res.status(200).json({ ok: true })
}
