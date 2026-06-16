/**
 * POST /api/request-code
 * Chamado pelo app V2 Game Optimizer (tela de ativação).
 * Body: { email }
 * Sempre responde 200 genérico (não revela se o e-mail tem licença ativa).
 */
const { query } = require('../lib/db')
const { generateCode } = require('../lib/codes')
const { sendLoginCodeEmail } = require('../lib/mailer')

const RATE_LIMIT_SECONDS = 60

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email } = req.body || {}
  if (!email) {
    return res.status(400).json({ ok: false, error: 'email é obrigatório' })
  }

  try {
    const licenseResult = await query(
      `SELECT id FROM email_licenses WHERE email = $1 AND is_active = TRUE AND expires_at > NOW()`,
      [email]
    )

    if (licenseResult.rows.length === 0) {
      // Não revela se o e-mail existe ou não — resposta genérica.
      return res.status(200).json({ ok: true })
    }

    const existing = await query('SELECT created_at FROM login_codes WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      const elapsedMs = Date.now() - new Date(existing.rows[0].created_at).getTime()
      if (elapsedMs < RATE_LIMIT_SECONDS * 1000) {
        const waitSeconds = Math.ceil((RATE_LIMIT_SECONDS * 1000 - elapsedMs) / 1000)
        return res.status(429).json({ ok: false, error: `Aguarde ${waitSeconds}s antes de pedir um novo código` })
      }
    }

    const code = generateCode()
    await query(
      `INSERT INTO login_codes (email, code, expires_at, consumed, attempts, created_at)
       VALUES ($1, $2, NOW() + INTERVAL '10 minutes', FALSE, 0, NOW())
       ON CONFLICT (email) DO UPDATE SET
         code = EXCLUDED.code,
         expires_at = EXCLUDED.expires_at,
         consumed = FALSE,
         attempts = 0,
         created_at = NOW()`,
      [email, code]
    )

    await sendLoginCodeEmail({ to: email, code }).catch((err) => {
      console.error('[request-code] sendLoginCodeEmail falhou:', err)
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('request-code error:', err)
    return res.status(500).json({ ok: false, error: 'Erro interno do servidor' })
  }
}
