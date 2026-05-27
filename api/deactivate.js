const { query } = require('../lib/db')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { license_key, machine_id } = req.body || {}

  if (!license_key || !machine_id) {
    return res.status(400).json({ ok: false, error: 'license_key e machine_id são obrigatórios' })
  }

  await query(
    'DELETE FROM activations WHERE license_key = $1 AND machine_id = $2',
    [license_key, machine_id]
  )

  return res.status(200).json({ ok: true })
}
