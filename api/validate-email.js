/**
 * POST /api/validate-email
 * Body: { email, machine_id }
 * Revalidação periódica feita pelo app (mesmo papel do /api/validate, mas por e-mail).
 */
const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, machine_id } = req.body || {}

  if (!email || !machine_id) {
    return res.status(400).json({ valid: false, error: 'email e machine_id são obrigatórios' })
  }

  try {
    const result = await query('SELECT * FROM email_licenses WHERE email = $1', [email])
    const license = result.rows[0]

    if (!license || !license.is_active) {
      return res.status(403).json({ valid: false, error: 'Licença inválida ou desativada' })
    }

    if (new Date() > new Date(license.expires_at)) {
      return res.status(403).json({ valid: false, error: 'Licença expirada', expires_at: license.expires_at })
    }

    const activation = await query(
      'SELECT id FROM activations WHERE email_license_id = $1 AND machine_id = $2',
      [license.id, machine_id]
    )

    if (activation.rows.length === 0) {
      return res.status(403).json({ valid: false, error: 'Máquina não ativada com este e-mail' })
    }

    await query(
      'UPDATE activations SET last_validated_at = NOW() WHERE email_license_id = $1 AND machine_id = $2',
      [license.id, machine_id]
    )

    return res.status(200).json({ valid: true, expires_at: license.expires_at })
  } catch (err) {
    console.error('validate-email error:', err)
    return res.status(500).json({ valid: false, error: 'Erro interno do servidor' })
  }
}
